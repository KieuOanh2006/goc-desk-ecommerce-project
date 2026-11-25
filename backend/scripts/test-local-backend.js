const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '../.env'), quiet: true });
const fs = require('node:fs');
const http = require('node:http');
const vm = require('node:vm');
const assert = require('node:assert/strict');

async function runLocalBackendTest() {
  if (process.env.NODE_ENV !== 'development' || !['localhost', '127.0.0.1'].includes(process.env.DB_HOST)) {
    throw new Error('Only run against a local development database.');
  }
  const pool = require('../src/config/database');
  const app = require('../src/app');
  const { TEST_ACCOUNTS, bootstrapTestAccounts } = require('../src/modules/dev/bootstrap-test-accounts');
  const report = { startedAt: new Date().toISOString(), checks: [], knownIssues: [], cleanup: false };
  const owned = { categories: [], brands: [], use_cases: [], article_categories: [], articles: [], website_contents: [], room_templates: [], furniture_assets: [], product_3d_models: [], products: [] };
  const suffix = `local-check-${Date.now()}`;
  const origin = process.env.CLIENT_ORIGIN.split(',')[0].trim();
  const sessions = {};
  const server = http.createServer(app);
  let base;

  async function check(name, operation) {
    try {
      await operation();
      report.checks.push({ name, passed: true });
      console.log(`PASS ${name}`);
    } catch (error) {
      report.checks.push({ name, passed: false, detail: error.code || (error instanceof assert.AssertionError ? 'Assertion failed' : 'Check failed') });
      console.log(`FAIL ${name}`);
      throw error;
    }
  }

  async function request(method, endpoint, { actor, body, expected = 200, trusted = true } = {}) {
    const headers = {};
    if (trusted) headers.origin = origin;
    else headers.origin = 'https://untrusted.example';
    if (body !== undefined) headers['content-type'] = 'application/json';
    if (actor && sessions[actor]) headers.cookie = sessions[actor];
    const response = await fetch(`${base}/api${endpoint}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(15000) });
    const data = await response.json();
    if (endpoint === '/auth/login' && actor && response.ok) {
      sessions[actor] = response.headers.getSetCookie().map(value => value.split(';')[0]).join('; ');
    }
    assert.equal(response.status, expected, `${method} ${endpoint}: expected ${expected}, received ${response.status}; code=${data.error?.code || 'none'}`);
    return data;
  }

  async function create(resource, endpoint, body, actor = 'admin') {
    const response = await request('POST', endpoint, { actor, body, expected: 201 });
    owned[resource].push(response.data.id);
    return response.data;
  }

  try {
    const [existing] = await pool.execute('SELECT email FROM users WHERE email IN (?, ?, ?)', TEST_ACCOUNTS.map(account => account.email));
    if (existing.length === 0) await bootstrapTestAccounts({ pool });
    else if (existing.length !== TEST_ACCOUNTS.length) throw Object.assign(new Error(), { code: 'PARTIAL_TEST_ACCOUNT_SETUP' });
    await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
    base = `http://127.0.0.1:${server.address().port}`;

    await check('MySQL health returns 200', async () => {
      const result = await request('GET', '/health/db'); assert.equal(result.data.status, 'ok');
    });
    for (const account of TEST_ACCOUNTS) {
      const actor = account.role === 'admin' ? 'admin' : account.role === 'product_content_staff' ? 'content' : 'order';
      await check(`Login and real session: ${actor}`, async () => {
        const login = await request('POST', '/auth/login', { actor, body: { identity: account.email, password: process.env[account.passwordEnv] } });
        assert.ok(sessions[actor]);
        const me = await request('GET', '/auth/me', { actor });
        assert.equal(me.data.user.id, login.data.user.id);
      });
    }
    await check('Guest cannot administer catalog (401)', () => request('GET', '/admin/categories', { expected: 401 }));
    await check('Order staff cannot administer catalog (403)', () => request('GET', '/admin/categories', { actor: 'order', expected: 403 }));
    await check('Content staff cannot administer Studio (403)', () => request('GET', '/admin/studio/rooms', { actor: 'content', expected: 403 }));
    await check('Untrusted origin cannot write (403)', () => request('POST', '/admin/categories', { actor: 'admin', trusted: false, body: { name: 'Test', slug: suffix }, expected: 403 }));
    await check('Invalid category input rejected (422)', () => request('POST', '/admin/categories', { actor: 'admin', body: { slug: suffix }, expected: 422 }));

    let category;
    await check('Content staff creates category in MySQL', async () => {
      category = await create('categories', '/admin/categories', { name: 'Local API check', slug: suffix }, 'content');
      assert.equal(typeof category.id, 'string');
    });
    await check('Public category is readable', async () => { const r = await request('GET', `/categories/${category.id}`); assert.equal(r.data.slug, suffix); });
    await check('Duplicate category slug returns 409', () => request('POST', '/admin/categories', { actor: 'admin', body: { name: 'Duplicate', slug: suffix }, expected: 409 }));
    await check('Category edit persists', async () => {
      await request('PATCH', `/admin/categories/${category.id}`, { actor: 'content', body: { name: 'Edited local check' } });
      const r = await request('GET', `/categories/${category.id}`); assert.equal(r.data.name, 'Edited local check');
    });
    await check('Hidden category is private but visible to admin', async () => {
      await request('PATCH', `/admin/categories/${category.id}`, { actor: 'admin', body: { status: 'hidden' } });
      await request('GET', `/categories/${category.id}`, { expected: 404 });
      await request('GET', `/admin/categories/${category.id}`, { actor: 'admin' });
    });
    for (const [resource, endpoint] of [['brands', 'brands'], ['use_cases', 'use-cases']]) {
      await check(`${endpoint}: create, edit, read and delete`, async () => {
        const record = await create(resource, `/admin/${endpoint}`, { name: 'Local check', slug: suffix });
        await request('PATCH', `/admin/${endpoint}/${record.id}`, { actor: 'content', body: { name: 'Edited' } });
        const r = await request('GET', `/${endpoint}/${record.id}`); assert.equal(r.data.name, 'Edited');
        await request('DELETE', `/admin/${endpoint}/${record.id}`, { actor: 'admin' });
      });
    }

    let topic, article, website;
    await check('Create article topic and draft with content staff', async () => {
      topic = await create('article_categories', '/admin/article-categories', { name: 'Local check', slug: suffix }, 'content');
      article = await create('articles', '/admin/articles', { title: 'Local API check', slug: suffix, categoryId: topic.id, contentType: 'article', body: 'Test text stored in MySQL.' }, 'content');
      await request('GET', `/articles/${suffix}`, { expected: 404 });
    });
    await check('Publishing empty article is rejected (422)', () => request('PATCH', `/admin/articles/${article.id}`, { actor: 'content', body: { status: 'published', body: '' }, expected: 422 }));
    await check('Failed publication preserves the original draft', async () => {
      const r = await request('GET', `/admin/articles/${article.id}`, { actor: 'content' });
      assert.equal(r.data.status, 'draft'); assert.equal(r.data.body, 'Test text stored in MySQL.');
    });
    await check('Publish article and omit staff ID from public response', async () => {
      await request('PATCH', `/admin/articles/${article.id}`, { actor: 'content', body: { status: 'published' } });
      const r = await request('GET', `/articles/${suffix}`); assert.equal(r.data.status, 'published'); assert.ok(!('authorUserId' in r.data));
    });
    await check('Referenced article topic cannot be deleted (409)', () => request('DELETE', `/admin/article-categories/${topic.id}`, { actor: 'admin', expected: 409 }));
    await check('Hide article removes public visibility', async () => {
      await request('PATCH', `/admin/articles/${article.id}`, { actor: 'content', body: { status: 'hidden' } });
      await request('GET', `/articles/${suffix}`, { expected: 404 });
    });
    await check('Create, publish and hide FAQ', async () => {
      website = await create('website_contents', '/admin/contents', { contentKey: suffix, contentType: 'faq', title: 'Local check', body: 'Test plain text.', status: 'draft' }, 'content');
      await request('GET', `/contents/${suffix}`, { expected: 404 });
      await request('PATCH', `/admin/contents/${website.id}`, { actor: 'content', body: { status: 'published' } });
      const r = await request('GET', `/contents/${suffix}`); assert.ok(!('updatedByUserId' in r.data));
      await request('PATCH', `/admin/contents/${website.id}`, { actor: 'content', body: { status: 'hidden' } });
      await request('GET', `/contents/${suffix}`, { expected: 404 });
    });
    await check('Unsafe media URL is rejected (422)', () => request('POST', '/admin/contents', { actor: 'admin', body: { contentKey: `${suffix}-unsafe`, contentType: 'banner', mediaUrl: 'javascript:alert(1)' }, expected: 422 }));

    const context = vm.createContext({});
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../../js/setup-3d-presets.js'), 'utf8'), context);
    const presets = JSON.parse(JSON.stringify(context.GocDeskStudioPresets));
    const scene = presets.scenes[0];
    const config = { room: presets.ROOM, backWindow: scene.backWindow, balcony: scene.balcony, cameraPresets: scene.cameraPresets };
    const { label, ...dimensions } = presets.FURNITURE.desk;
    let room, asset, product, comparisonProduct, model;
    await check('Create real room and furniture metadata from existing presets', async () => {
      room = await create('room_templates', '/admin/studio/rooms', { name: 'Local API check', slug: suffix, roomConfig: config });
      asset = await create('furniture_assets', '/admin/studio/furniture-assets', { name: 'Local API check desk', assetCode: suffix, furnitureType: 'desk', rendererType: 'procedural', rendererKey: 'desk', dimensions });
    });
    const placement = () => [{ furnitureAssetId: asset.id, positionX: 0, positionZ: 0, rotation: 0, isPresent: true }];
    await check('Room placement transaction persists', async () => {
      await request('PUT', `/admin/studio/rooms/${room.id}/furniture`, { actor: 'admin', body: placement() });
      const r = await request('GET', `/studio/rooms/${room.id}`); assert.equal(r.data.furniture[0].furnitureAssetId, asset.id);
    });
    await check('Out-of-bounds replacement rejected; previous layout survives', async () => {
      await request('PUT', `/admin/studio/rooms/${room.id}/furniture`, { actor: 'admin', body: [{ ...placement()[0], positionX: 49 }], expected: 422 });
      const r = await request('GET', `/studio/rooms/${room.id}`); assert.equal(r.data.furniture[0].positionX, 0);
    });
    await check('Duplicate furniture IDs rejected (422)', () => request('PUT', `/admin/studio/rooms/${room.id}/furniture`, { actor: 'admin', body: [...placement(), ...placement()], expected: 422 }));
    await check('Missing furniture rejected; previous layout survives', async () => {
      await request('PUT', `/admin/studio/rooms/${room.id}/furniture`, { actor: 'admin', body: [{ ...placement()[0], furnitureAssetId: '18446744073709551615' }], expected: 404 });
      const r = await request('GET', `/studio/rooms/${room.id}`); assert.equal(r.data.furniture.length, 1);
    });
    await check('Room cannot shrink around existing furniture (409)', () => request('PATCH', `/admin/studio/rooms/${room.id}`, { actor: 'admin', body: { roomConfig: { ...config, room: { minX: -0.1, maxX: 0.1, minZ: -0.1, maxZ: 0.1 } } }, expected: 409 }));
    await check('Referenced furniture dimension/status changes rejected (409)', async () => {
      await request('PATCH', `/admin/studio/furniture-assets/${asset.id}`, { actor: 'admin', body: { isActive: false }, expected: 409 });
      await request('PATCH', `/admin/studio/furniture-assets/${asset.id}`, { actor: 'admin', body: { dimensions }, expected: 409 });
    });
    await check('Hidden room is not public', async () => {
      await request('PATCH', `/admin/studio/rooms/${room.id}`, { actor: 'admin', body: { isActive: false } });
      await request('GET', `/studio/rooms/${room.id}`, { expected: 404 });
    });

    let keyboardCategory;
    const [categories] = await pool.execute('SELECT CAST(id AS CHAR) AS id FROM categories WHERE slug = ?', ['keyboard']);
    if (categories.length) keyboardCategory = categories[0];
    else keyboardCategory = await create('categories', '/admin/categories', { name: 'Local keyboard test fixture', slug: 'keyboard' });
    await check('Create temporary product and variants through existing product API', async () => {
      product = await create('products', '/admin/products', { name: 'Local API fixture (not catalog merchandise)', slug: suffix, categorySlug: 'keyboard', variants: [{ sku: suffix, colorName: 'Black', colorHex: '#222222', price: 680000, stockQuantity: 3 }] });
      comparisonProduct = await create('products', '/admin/products', { name: 'Local API fixture comparison (not catalog merchandise)', slug: `${suffix}-comparison`, categorySlug: 'keyboard', variants: [{ sku: `${suffix}-comparison`, colorName: 'Black', price: 600000, stockQuantity: 3 }] });
      await pool.execute(
        'UPDATE product_variants SET sale_price = ?, sale_starts_at = CURRENT_TIMESTAMP - INTERVAL 1 DAY, sale_ends_at = CURRENT_TIMESTAMP + INTERVAL 1 DAY WHERE product_id = ?',
        [550000, product.id],
      );
    });
    await check('Public product listing filters on active sale price', async () => {
      const r = await request('GET', `/products?search=Local%20API%20fixture&maxPrice=600000`);
      const listed = r.data.find((item) => item.slug === suffix);
      assert.ok(listed, 'currently discounted product should match maxPrice=600000');
      assert.equal(Number(listed.priceFrom), 550000);
      const sorted = await request('GET', '/products?search=Local%20API%20fixture&sort=price_asc');
      assert.deepEqual(sorted.data.slice(0, 2).map(item => item.slug), [`${suffix}`, `${suffix}-comparison`]);
    });
    await check('Future and expired sales use base price; null dates allow an active sale', async () => {
      const [variants] = await pool.execute('SELECT id FROM product_variants WHERE product_id = ?', [product.id]);
      const variantId = variants[0].id;
      await pool.execute('UPDATE product_variants SET sale_starts_at = CURRENT_TIMESTAMP + INTERVAL 1 DAY WHERE id = ?', [variantId]);
      let r = await request('GET', `/products?search=Local%20API%20fixture&maxPrice=600000`);
      assert.ok(!r.data.some(item => item.slug === suffix));
      await pool.execute('UPDATE product_variants SET sale_starts_at = CURRENT_TIMESTAMP - INTERVAL 2 DAY, sale_ends_at = CURRENT_TIMESTAMP - INTERVAL 1 DAY WHERE id = ?', [variantId]);
      r = await request('GET', `/products?search=Local%20API%20fixture&maxPrice=600000`);
      assert.ok(!r.data.some(item => item.slug === suffix));
      await pool.execute('UPDATE product_variants SET sale_starts_at = NULL, sale_ends_at = NULL WHERE id = ?', [variantId]);
      r = await request('GET', `/products?search=Local%20API%20fixture&maxPrice=600000`);
      assert.ok(r.data.some(item => item.slug === suffix));
    });
    await check('Product detail exposes base and effective sale prices', async () => {
      const r = await request('GET', `/products/${suffix}`);
      assert.equal(Number(r.data.variants[0].price), 680000);
      assert.equal(Number(r.data.variants[0].salePrice), 550000);
      assert.equal(Number(r.data.variants[0].effectivePrice), 550000);
      await pool.execute('UPDATE product_variants SET sale_price = NULL, sale_starts_at = NULL, sale_ends_at = NULL WHERE product_id = ?', [product.id]);
    });
    await check('Attach procedural product model and read live variant price/stock', async () => {
      model = await create('product_3d_models', '/admin/studio/product-models', { productId: product.id, rendererType: 'procedural', rendererKey: 'keyboard', width: 0.43, depth: 0.145, height: 0.05 });
      const r = await request('GET', `/studio/product-models/${model.id}`);
      assert.equal(r.data.productId, product.id); assert.equal(Number(r.data.variants[0].effectivePrice), 680000); assert.equal(r.data.variants[0].available, true);
    });
    await check('Studio lists and every supported sort execute against MySQL', async () => {
      for (const [endpoint, sorts] of [
        ['rooms', ['name:asc', 'name:desc', 'createdAt:asc', 'createdAt:desc']],
        ['furniture-assets', ['name:asc', 'name:desc', 'id:asc', 'id:desc']],
        ['product-models', ['productName:asc', 'productName:desc', 'id:asc', 'id:desc']],
      ]) {
        for (const sort of sorts) {
          await request('GET', `/studio/${endpoint}?sort=${sort}`);
          await request('GET', `/admin/studio/${endpoint}?sort=${sort}`, { actor: 'admin' });
        }
      }
    });
    await check('Variant sold-out and price edits propagate to Studio API', async () => {
      const before = await request('GET', `/studio/product-models/${model.id}`);
      await request('PATCH', `/admin/products/${product.id}/variants/${before.data.variants[0].id}`, { actor: 'admin', body: { price: 700000, stockQuantity: 0 } });
      const after = await request('GET', `/studio/product-models/${model.id}`);
      assert.equal(Number(after.data.variants[0].effectivePrice), 700000); assert.equal(after.data.variants[0].available, false);
    });
    await check('Product model partial update round-trips', async () => {
      await request('PATCH', `/admin/studio/product-models/${model.id}`, { actor: 'admin', body: { height: 0.06 } });
      const r = await request('GET', `/studio/product-models/${model.id}`); assert.equal(r.data.height, 0.06);
    });
    await check('Hide model removes it from public detail', async () => {
      await request('PATCH', `/admin/studio/product-models/${model.id}`, { actor: 'admin', body: { isActive: false } });
      await request('GET', `/studio/product-models/${model.id}`, { expected: 404 });
    });
    await check('Hidden product and inactive variant remain editable through admin detail', async () => {
      const publicDetail = await request('GET', `/products/${suffix}`);
      const variantId = publicDetail.data.variants[0].id;
      await pool.execute('UPDATE product_variants SET status = ? WHERE id = ?', ['inactive', variantId]);
      await request('PATCH', `/admin/products/${product.id}/status`, { actor: 'admin', body: { status: 'hidden' } });
      await request('GET', `/products/${suffix}`, { expected: 404 });
      const detail = await request('GET', `/admin/products/${product.id}`, { actor: 'content' });
      assert.equal(detail.data.status, 'hidden');
      assert.equal(detail.data.variants[0].id, variantId);
      assert.equal(detail.data.variants[0].status, 'inactive');
      assert.equal(Number(detail.data.variants[0].price), 700000);
      await request('PATCH', `/admin/products/${product.id}/variants/${variantId}`, { actor: 'content', body: { price: 690000, stockQuantity: 2 } });
      const updated = await request('GET', `/admin/products/${product.id}`, { actor: 'content' });
      assert.equal(Number(updated.data.variants[0].price), 690000);
      assert.equal(Number(updated.data.variants[0].stockQuantity), 2);
      await request('GET', '/admin/products/0', { actor: 'content', expected: 422 });
      await request('GET', '/admin/products/18446744073709551616', { actor: 'content', expected: 422 });
      await request('GET', '/admin/products/999999999999', { actor: 'content', expected: 404 });
      await request('GET', `/admin/products/${product.id}`, { actor: 'order', expected: 403 });
    });
    await check('Referenced product category cannot be deleted (409)', () => request('DELETE', `/admin/categories/${keyboardCategory.id}`, { actor: 'admin', expected: 409 }));

    const { createLoyaltyModel } = require('../src/modules/loyalty/loyalty.model');
    try {
      await createLoyaltyModel().listTiers();
    } catch (error) {
      if (error.code !== 'ER_BAD_FIELD_ERROR') throw error;
      report.knownIssues.push('Loyalty listTiers: ER_BAD_FIELD_ERROR; membership_tiers.description is absent from schema. Existing owner handoff.');
    }
  } catch (error) {
    report.failureCode = error.code || 'LIVE_CHECK_FAILED';
    process.exitCode = 1;
  } finally {
    try {
      for (const actor of Object.keys(sessions)) await request('POST', '/auth/logout', { actor });
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
        for (const table of ['product_3d_models', 'room_templates', 'furniture_assets', 'website_contents', 'articles', 'article_categories', 'products', 'categories', 'brands', 'use_cases']) {
          for (const id of owned[table]) {
            if (table === 'products') await connection.execute('DELETE FROM product_variants WHERE product_id = ?', [id]);
            await connection.execute(`DELETE FROM ${table} WHERE id = ?`, [id]);
          }
        }
        await connection.commit();
        report.cleanup = true;
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally { connection.release(); }
    } catch (error) {
      report.cleanup = false;
      report.cleanupErrorCode = error.code || 'CLEANUP_FAILED';
      process.exitCode = 1;
    }
    if (server.listening) await new Promise(resolve => server.close(resolve));
    await pool.end();
    report.finishedAt = new Date().toISOString();
    report.passed = report.checks.filter(row => row.passed).length;
    report.failed = report.checks.filter(row => !row.passed).length;
    const reportDirectory = path.join(__dirname, '../../plans/261125-0228-backend-catalog-content-3d/reports');
    fs.mkdirSync(reportDirectory, { recursive: true });
    fs.writeFileSync(path.join(reportDirectory, 'local-backend-live-results.json'), JSON.stringify(report, null, 2));
    const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
    const rows = report.checks.map(row => `<tr><td>${row.passed ? 'PASS' : 'FAIL'}</td><td>${escape(row.name)}</td></tr>`).join('');
    fs.writeFileSync(path.join(reportDirectory, 'local-backend-live-results.html'), `<!doctype html><html lang="vi"><meta charset="utf-8"><title>Kết quả test Backend Góc Desk</title><style>body{font:16px system-ui;max-width:1050px;margin:40px auto;padding:0 24px;background:#faf8f3;color:#282828}h1{font-size:28px}table{border-collapse:collapse;width:100%;background:white}td,th{text-align:left;border-bottom:1px solid #ddd;padding:12px}td:first-child{font-weight:bold}p{line-height:1.6}.note{background:#fff0cd;padding:16px;border-radius:8px}</style><h1>Kiểm thử Backend trên máy local</h1><p>API Express + MySQL thật, đăng nhập bằng cookie thật. Không dùng mock.</p><p><b>${report.passed} đạt · ${report.failed} lỗi</b> · Dọn dữ liệu test: ${report.cleanup ? 'thành công' : 'chưa hoàn tất'}<br>Chạy lúc: ${escape(report.finishedAt)}</p><table><thead><tr><th>Kết quả</th><th>Kiểm tra</th></tr></thead><tbody>${rows}</tbody></table><p class="note">${escape(report.knownIssues.join(' ') || 'Không ghi nhận lỗi Loyalty trong lượt kiểm tra này.')}<br>Báo cáo chỉ xác nhận các tình huống đã chạy. Chưa xác minh frontend tích hợp, tải GLB hoặc đủ 8–10 sản phẩm 3D. Fixture sản phẩm là dữ liệu kiểm thử tạm, đã dọn khi thành công.</p></html>`);
    console.log(JSON.stringify({ passed: report.passed, failed: report.failed, cleanup: report.cleanup, knownIssues: report.knownIssues, failureCode: report.failureCode }));
    return report;
  }
}

module.exports = { runLocalBackendTest };
if (require.main === module) runLocalBackendTest().catch(() => { console.error('Local backend check could not start. Check development configuration.'); process.exitCode = 1; });
