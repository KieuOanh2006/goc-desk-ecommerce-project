const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const http = require('node:http');
const { createApiError, errorHandler, notFoundHandler } = require('../src/middlewares/error-handler');
const { createCatalogModel } = require('../src/modules/catalog/catalog.model');
const { createCatalogService } = require('../src/modules/catalog/catalog.service');

process.env.CLIENT_ORIGIN ||= 'http://127.0.0.1:5500';

const { createCatalogRouter } = require('../src/modules/catalog/catalog.routes');

function createTestAuthentication(req, res, next) {
  const role = req.get('x-test-role');
  if (!role) return next(createApiError(401, 'UNAUTHENTICATED', 'Vui lòng đăng nhập.'));

  req.auth = {
    user: {
      id: '7',
      role,
      accountStatus: 'active',
      emailVerifiedAt: '2026-11-24T00:00:00.000Z',
    },
  };
  return next();
}

async function withCatalogApi(t, service, callback) {
  const app = express();
  app.use(express.json());
  app.use('/api', createCatalogRouter({ service, authenticate: createTestAuthentication }));
  app.use(notFoundHandler);
  app.use(errorHandler);

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(async () => new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  }));

  return callback(`http://127.0.0.1:${server.address().port}`);
}

function createService(overrides = {}) {
  return {
    list: async (resource, query, options) => ({
      items: [],
      meta: { page: query.page, limit: query.limit, totalItems: 0, totalPages: 0 },
      options,
    }),
    get: async (resource, id) => ({ id, name: 'Bàn', slug: 'ban' }),
    create: async (resource, input) => ({ id: '12', status: 'active', ...input }),
    update: async (resource, id, input) => ({ id, ...input }),
    remove: async (resource, id) => ({ id }),
    ...overrides,
  };
}

test('public category list validates paging and returns the standard response envelope', async (t) => {
  let received;
  const service = createService({
    list: async (resource, query, options) => {
      received = { resource, query, options };
      return {
        items: [{ id: '12', name: 'Bàn', slug: 'ban' }],
        meta: { page: query.page, limit: query.limit, totalItems: 1, totalPages: 1 },
      };
    },
  });

  await withCatalogApi(t, service, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/categories?q=desk&limit=25&sort=name%3Adesc`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      success: true,
      message: 'Lấy danh sách danh mục thành công.',
      data: [{ id: '12', name: 'Bàn', slug: 'ban' }],
      meta: { page: 1, limit: 25, totalItems: 1, totalPages: 1 },
    });
    assert.deepEqual(received, {
      resource: 'categories',
      query: { q: 'desk', page: 1, limit: 25, sort: 'name:desc' },
      options: { publicOnly: true },
    });
  });
});

test('legacy category create URL and payload remain supported for content staff', async (t) => {
  let received;
  const service = createService({
    create: async (resource, input) => {
      received = input;
      return { id: '12', name: input.name, slug: input.slug };
    },
  });

  await withCatalogApi(t, service, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/admin/categories`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        origin: process.env.CLIENT_ORIGIN,
        'x-test-role': 'product_content_staff',
      },
      body: JSON.stringify({ name: 'Bàn làm việc', slug: 'ban-lam-viec' }),
    });
    assert.equal(response.status, 201);
    assert.deepEqual(await response.json(), {
      success: true,
      message: 'Tạo danh mục thành công.',
      data: { id: '12', name: 'Bàn làm việc', slug: 'ban-lam-viec' },
    });
    assert.deepEqual(received, { name: 'Bàn làm việc', slug: 'ban-lam-viec' });
  });
});

test('invalid category IDs and invalid pagination return 422', async (t) => {
  await withCatalogApi(t, createService(), async (baseUrl) => {
    const badId = await fetch(`${baseUrl}/api/categories/01`);
    assert.equal(badId.status, 422);
    assert.equal((await badId.json()).error.code, 'VALIDATION_ERROR');

    const badPage = await fetch(`${baseUrl}/api/categories?page=0`);
    assert.equal(badPage.status, 422);
    assert.equal((await badPage.json()).error.code, 'VALIDATION_ERROR');
  });
});

test('catalog administration requires an allowed role, active verified session, and trusted origin', async (t) => {
  let deleteCalls = 0;
  const service = createService({
    remove: async () => {
      deleteCalls += 1;
      return { id: '12', deleted: true };
    },
  });

  await withCatalogApi(t, service, async (baseUrl) => {
    const guest = await fetch(`${baseUrl}/api/admin/categories`, { method: 'GET' });
    assert.equal(guest.status, 401);

    const orderStaff = await fetch(`${baseUrl}/api/admin/categories/12`, {
      method: 'DELETE',
      headers: { 'x-test-role': 'order_support_staff', origin: process.env.CLIENT_ORIGIN },
    });
    assert.equal(orderStaff.status, 403);

    const badOrigin = await fetch(`${baseUrl}/api/admin/categories/12`, {
      method: 'DELETE',
      headers: { 'x-test-role': 'admin', origin: 'https://untrusted.example' },
    });
    assert.equal(badOrigin.status, 403);
    assert.equal(deleteCalls, 0);

    const contentStaff = await fetch(`${baseUrl}/api/admin/categories/12`, {
      method: 'DELETE',
      headers: { 'x-test-role': 'product_content_staff', origin: process.env.CLIENT_ORIGIN },
    });
    assert.equal(contentStaff.status, 200);
    assert.equal(deleteCalls, 1);
  });
});

test('catalog SQL binds search and pagination values and filters hidden categories from public lists', async () => {
  const calls = [];
  const database = {
    execute: async (sql, values) => {
      calls.push({ sql, values });
      if (sql.startsWith('SELECT COUNT')) return [[{ totalItems: 26 }], []];
      return [[{ id: '12', name: 'Bàn', slug: 'ban' }], []];
    },
  };
  const model = createCatalogModel(database);

  const result = await model.list('categories', {
    q: 'desk', page: 2, limit: 25, sort: 'name:desc',
  }, { publicOnly: true });

  assert.equal(calls.length, 2);
  assert.match(calls[0].sql, /status = 'active'/);
  assert.deepEqual(calls[0].values, ['%desk%', '%desk%']);
  assert.match(calls[1].sql, /ORDER BY name DESC, id ASC LIMIT \? OFFSET \?/);
  assert.deepEqual(calls[1].values, ['%desk%', '%desk%', 25, 25]);
  assert.deepEqual(result.meta, { page: 2, limit: 25, totalItems: 26, totalPages: 2 });
});

test('catalog deletion rolls back and reports a conflict when a product references the category', async () => {
  const statements = [];
  const connection = {
    beginTransaction: async () => statements.push('BEGIN'),
    execute: async (sql, values) => {
      statements.push({ sql, values });
      if (sql.startsWith('SELECT id FROM categories')) return [[{ id: '12' }], []];
      if (sql.startsWith('SELECT 1 AS found FROM products')) return [[{ found: 1 }], []];
      throw new Error(`Unexpected query: ${sql}`);
    },
    rollback: async () => statements.push('ROLLBACK'),
    commit: async () => statements.push('COMMIT'),
    release: () => statements.push('RELEASE'),
  };
  const model = createCatalogModel({ getConnection: async () => connection });
  const result = await model.remove('categories', '12');

  assert.deepEqual(result, { found: true, deleted: false, referenced: true });
  assert.equal(statements.includes('ROLLBACK'), true);
  assert.equal(statements.includes('COMMIT'), false);
  assert.equal(statements.includes('RELEASE'), true);
  assert.equal(statements.some((entry) => typeof entry === 'object' && entry.sql.startsWith('DELETE')), false);
});

test('catalog service maps duplicate slugs to a stable 409 response', async () => {
  const model = {
    create: async () => {
      const error = new Error('private database detail');
      error.code = 'ER_DUP_ENTRY';
      throw error;
    },
  };
  const service = createCatalogService({ model });

  await assert.rejects(
    service.create('categories', { name: 'Bàn', slug: 'ban' }),
    (error) => error.statusCode === 409
      && error.code === 'CATEGORY_SLUG_EXISTS'
      && !error.message.includes('private database detail'),
  );
});
