import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import vm from 'node:vm';

const root = new URL('../', import.meta.url);
const read = (file) => readFile(new URL(file, root), 'utf8');
const scriptNames = ['product-data', 'catalog-utils', 'products', 'home-products', 'product-detail', 'setup-selection', 'product-detail-navigation'];

function element() {
  return { value: '', textContent: '', innerHTML: '', hidden: false, dataset: {}, attributes: {}, events: {},
    addEventListener(type, fn) { this.events[type] = fn; },
    setAttribute(name, value) { this.attributes[name] = value; },
    focus() { this.focused = true; }, scrollIntoView() { this.scrolled = true; },
  };
}

export async function run() {
  const passed = [];
  const sources = Object.fromEntries(await Promise.all(scriptNames.map(async (name) => [name, await read('js/' + name + '.js')])));
  for (const [name, source] of Object.entries(sources)) new vm.Script(source, { filename: name + '.js' });
  const context = vm.createContext({ Intl, URL, URLSearchParams });
  vm.runInContext(sources['product-data'], context);
  vm.runInContext(sources['catalog-utils'], context);
  const c = context.GocDeskCatalog;
  const ids = (items) => Array.from(items, (item) => item.id);
  const check = (name, fn) => { fn(); passed.push(name); };

  check('Eight unique products and six canonical categories', () => {
    assert.equal(c.products.length, 8); assert.equal(new Set(ids(c.products)).size, 8); assert.equal(c.categories.length, 6);
  });
  check('Vietnamese search works without accents', () => assert.deepEqual(ids(c.filterProducts({ q: 'ban phim' })), ['hyperone-gen-2']));
  check('Multiple categories use OR', () => assert.equal(c.filterProducts({ categories: ['keyboard', 'mouse'] }).length, 2));
  check('All five filter groups combine with AND', () => assert.deepEqual(ids(c.filterProducts({ categories: ['organize'], brands: ['HyperWork'], colors: ['cream'], uses: ['organize'], price: 'under300' })), ['cm02']));
  check('No match is an empty result', () => assert.equal(c.filterProducts({ categories: ['lamp'], colors: ['black'] }).length, 0));
  check('Unknown search does not inject markup', () => assert.equal(c.filterProducts({ q: '<script>' }).length, 0));
  check('Ascending and descending prices are correct', () => {
    assert.equal(c.filterProducts({ sort: 'price-asc' })[0].id, 'corepad');
    assert.equal(c.filterProducts({ sort: 'price-desc' })[0].id, 'ds02');
    assert.equal(c.products[0].id, 'hyperone-gen-2');
  });
  check('Price boundaries do not overlap', () => {
    const items = [299999, 300000, 700000, 700001].map((price, i) => ({ ...c.products[0], id: String(i), price }));
    assert.deepEqual(ids(c.filterProducts({ price: 'under300' }, items)), ['0']);
    assert.deepEqual(ids(c.filterProducts({ price: '300to700' }, items)), ['1', '2']);
    assert.deepEqual(ids(c.filterProducts({ price: 'over700' }, items)), ['3']);
  });
  check('Untrusted review text is escaped', () => assert.equal(c.escapeHtml('<img onerror="x">'), '&lt;img onerror=&quot;x&quot;&gt;'));
  const html = Object.fromEntries(await Promise.all(['index.html', 'products.html', 'product-detail.html', 'setup-3d.html'].map(async (file) => [file, await read(file)])));
  check('No duplicate IDs on the four affected pages', () => {
    for (const page of Object.values(html)) { const ids = Array.from(page.matchAll(/\bid="([^"]+)"/g), (m) => m[1]); assert.equal(ids.length, new Set(ids).size); }
  });
  for (const p of c.products) {
    assert.ok(p.colors.length >= 2 && p.colors.length <= 3);
    for (const color of p.colors) await access(new URL(color.image, root));
    assert.ok(html['index.html'].includes(c.productUrl(p)));
    assert.ok(html['products.html'].includes(c.productUrl(p)));
    assert.ok(html['product-detail.html'].includes('id="' + p.id + '"'));
    assert.ok(html['product-detail.html'].includes('id="specs-' + p.id + '"'));
    assert.ok(html['product-detail.html'].includes('id="reviews-' + p.id + '"'));
    const setup = new URL(c.setupUrl(p, p.colors[1].id), 'https://goc.test/');
    assert.equal(setup.searchParams.get('product'), p.id); assert.equal(setup.searchParams.get('color'), p.colors[1].id);
  }
  passed.push('Every product has two existing color photos, correct home/catalog/detail links and a 3D route');
  check('Old description removed; every 3D link is enabled', () => {
    assert.ok(!html['product-detail.html'].includes('Hiểu thêm về'));
    assert.equal((html['product-detail.html'].match(/data-setup-link/g) || []).length, 8);
    assert.ok(!/data-setup-link[^>]*disabled/.test(html['product-detail.html']));
  });

  // Exercise the real page event handlers with a small DOM adapter, without a browser.
  const articles = new Map(); const nodes = new Map(); const store = new Map(); const windowEvents = {};
  for (const p of c.products) {
    const article = element(); const fields = new Map();
    for (const name of ['data-gallery-image', 'data-gallery-label', 'data-color-name', 'data-spec-color', 'data-gallery-note', 'data-setup-link', 'data-review-list', 'data-review-summary', 'data-review-form', 'data-review-status']) fields.set('[' + name + ']', element());
    const form = fields.get('[data-review-form]'); form.reportValidity = () => true; form.reset = () => {}; form.values = {};
    const buttons = p.colors.flatMap((color) => [0, 1].map(() => ({ ...element(), dataset: { color: color.id } })));
    article.querySelector = (selector) => fields.get(selector);
    article.querySelectorAll = () => buttons;
    article.fields = fields; article.buttons = buttons; articles.set(p.id, article);
    for (const section of ['specs-', 'information-', 'reviews-']) nodes.set(section + p.id, element());
  }
  const win = { location: new URL('https://goc.test/product-detail.html?color=sage#nova-dl02'), history: {},
    matchMedia: () => ({ matches: true }), addEventListener: (type, fn) => { windowEvents[type] = fn; },
    localStorage: { getItem: (key) => store.get(key) || null, setItem: (key, value) => store.set(key, value) } };
  win.history.replaceState = (_state, _title, url) => { win.location = new URL(url); };
  const doc = { getElementById: (id) => articles.get(id) || nodes.get(id), title: '' };
  class Values { constructor(form) { this.values = form.values; } get(name) { return this.values[name] || ''; } }
  const detailContext = vm.createContext({ GocDeskCatalog: c, document: doc, window: win, URL, URLSearchParams, FormData: Values });
  vm.runInContext(sources['product-detail'], detailContext);
  check('Direct link restores the requested product and color', () => {
    assert.equal(doc.title, 'Nova DL02 | Góc Desk');
    assert.equal(articles.get('nova-dl02').fields.get('[data-gallery-image]').src, c.products[2].colors[1].image);
  });
  for (const p of c.products) for (const color of p.colors) {
    const article = articles.get(p.id);
    article.events.click({ target: { closest: (selector) => selector === 'button[data-color]' ? { dataset: { color: color.id } } : null } });
    assert.equal(article.fields.get('[data-gallery-image]').src, color.image);
    assert.equal(article.fields.get('[data-color-name]').textContent, color.name);
    assert.equal(article.fields.get('[data-setup-link]').href, c.setupUrl(p, color.id));
    assert.equal(article.buttons.filter((b) => b.attributes['aria-pressed'] === 'true').length, 2);
    assert.equal(win.location.hash, '#' + p.id);
  }
  passed.push('All sixteen color selections update gallery, swatches, text and 3D link');
  check('Section navigation preserves the selected product hash', () => {
    const p = c.products[7]; const before = win.location.hash;
    articles.get(p.id).events.click({ target: { closest: (selector) => selector === 'button[data-section]' ? { dataset: { section: 'reviews-' + p.id } } : null } });
    assert.equal(win.location.hash, before); assert.equal(nodes.get('reviews-' + p.id).scrolled, true);
  });
  check('Feedback validates input and stays isolated by product', () => {
    const article = articles.get(c.products[0].id); const form = article.fields.get('[data-review-form]');
    form.values = { name: 'Tester', rating: '5', comment: '   ' }; form.events.submit({ preventDefault() {} }); assert.equal(store.size, 0);
    form.values = { name: '<script>x</script>', rating: '4', comment: '<img src=x onerror=alert(1)> Thử nghiệm' }; form.events.submit({ preventDefault() {} });
    assert.equal(store.size, 1); assert.ok(article.fields.get('[data-review-list]').innerHTML.includes('&lt;img'));
    assert.ok(!article.fields.get('[data-review-list]').innerHTML.includes('<img'));
    assert.ok(articles.get(c.products[1].id).fields.get('[data-review-summary]').textContent.includes('Chưa có'));
  });
  return { passed: passed.length, checks: passed };
}
