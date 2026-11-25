const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const http = require('node:http');
const { createApiError, errorHandler, notFoundHandler } = require('../src/middlewares/error-handler');

process.env.CLIENT_ORIGIN ||= 'http://127.0.0.1:5500';

const { createContentRouter } = require('../src/modules/content/content.routes');
const { createContentModel } = require('../src/modules/content/content.model');
const { createContentService } = require('../src/modules/content/content.service');

function createTestAuthentication(req, res, next) {
  const role = req.get('x-test-role');
  if (!role) return next(createApiError(401, 'UNAUTHENTICATED', 'Vui lòng đăng nhập.'));
  req.auth = {
    user: {
      id: '7', role, accountStatus: 'active', emailVerifiedAt: '2026-11-24T00:00:00.000Z',
    },
  };
  return next();
}

async function withContentApi(t, service, callback) {
  const app = express();
  app.use(express.json());
  app.use('/api', createContentRouter({ service, authenticate: createTestAuthentication }));
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
    get: async (resource, key) => ({ id: key }),
    create: async (resource, input, options) => ({ id: '21', ...input, ...options }),
    update: async (resource, id, input) => ({ id, ...input }),
    remove: async (resource, id) => ({ id }),
    ...overrides,
  };
}

test('public article detail uses slug and the service enforces published visibility', async (t) => {
  let received;
  const service = createService({
    get: async (resource, key, options) => {
      received = { resource, key, options };
      throw createApiError(404, 'RESOURCE_NOT_FOUND', 'Không tìm thấy bài viết.');
    },
  });

  await withContentApi(t, service, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/articles/ban-lam-viec-hieu-qua`);
    assert.equal(response.status, 404);
    assert.equal((await response.json()).error.code, 'RESOURCE_NOT_FOUND');
    assert.deepEqual(received, {
      resource: 'articles',
      key: 'ban-lam-viec-hieu-qua',
      options: { publicOnly: true, bySlug: true },
    });
  });
});

test('content editor creates a draft article with session author and plain-text body', async (t) => {
  let received;
  const service = createService({
    create: async (resource, input, options) => {
      received = { resource, input, options };
      return { id: '21', ...input, authorUserId: options.actorUserId };
    },
  });

  await withContentApi(t, service, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/admin/articles`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        origin: process.env.CLIENT_ORIGIN,
        'x-test-role': 'product_content_staff',
      },
      body: JSON.stringify({
        title: 'Góc bàn gọn gàng',
        slug: 'goc-ban-gon-gang',
        contentType: 'article',
        body: 'Đoạn văn được lưu dưới dạng text.',
      }),
    });
    assert.equal(response.status, 201);
    const result = await response.json();
    assert.equal(result.data.authorUserId, '7');
    assert.deepEqual(received, {
      resource: 'articles',
      input: {
        title: 'Góc bàn gọn gàng',
        slug: 'goc-ban-gon-gang',
        contentType: 'article',
        body: 'Đoạn văn được lưu dưới dạng text.',
        status: 'draft',
      },
      options: { actorUserId: '7' },
    });
  });
});

test('content writes reject client-supplied author and unsafe media URLs', async (t) => {
  let createCalls = 0;
  const service = createService({ create: async () => { createCalls += 1; return { id: '1' }; } });

  await withContentApi(t, service, async (baseUrl) => {
    const authorInjection = await fetch(`${baseUrl}/api/admin/articles`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: process.env.CLIENT_ORIGIN, 'x-test-role': 'admin' },
      body: JSON.stringify({
        title: 'Bài', slug: 'bai', contentType: 'article', body: 'Nội dung', authorUserId: '1',
      }),
    });
    assert.equal(authorInjection.status, 422);

    const unsafeMedia = await fetch(`${baseUrl}/api/admin/contents`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: process.env.CLIENT_ORIGIN, 'x-test-role': 'admin' },
      body: JSON.stringify({ contentKey: 'home.hero', contentType: 'banner', mediaUrl: 'javascript:alert(1)' }),
    });
    assert.equal(unsafeMedia.status, 422);
    assert.equal(createCalls, 0);
  });
});

test('admin content endpoints enforce session role and trusted origin', async (t) => {
  let createCalls = 0;
  const service = createService({ create: async () => { createCalls += 1; return { id: '1' }; } });

  await withContentApi(t, service, async (baseUrl) => {
    const guest = await fetch(`${baseUrl}/api/admin/contents`);
    assert.equal(guest.status, 401);

    const wrongRole = await fetch(`${baseUrl}/api/admin/contents`, {
      headers: { 'x-test-role': 'order_support_staff' },
    });
    assert.equal(wrongRole.status, 403);

    const untrusted = await fetch(`${baseUrl}/api/admin/contents`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: 'https://untrusted.example', 'x-test-role': 'admin' },
      body: JSON.stringify({ contentKey: 'home.hero', contentType: 'banner', body: 'Banner' }),
    });
    assert.equal(untrusted.status, 403);
    assert.equal(createCalls, 0);
  });
});

test('content model filters public article queries and binds search values', async () => {
  const calls = [];
  const database = {
    execute: async (sql, values) => {
      calls.push({ sql, values });
      if (sql.startsWith('SELECT COUNT')) return [[{ totalItems: 1 }], []];
      return [[{ id: '21', title: 'Bài', slug: 'bai', status: 'published' }], []];
    },
  };
  const model = createContentModel(database);
  const result = await model.list('articles', {
    q: 'desk', page: 1, limit: 20, sort: 'publishedAt:desc',
  }, { publicOnly: true });

  assert.match(calls[0].sql, /status = 'published'/);
  assert.match(calls[0].sql, /published_at IS NOT NULL/);
  assert.deepEqual(calls[0].values, ['%desk%', '%desk%']);
  assert.doesNotMatch(calls[1].sql, /author_user_id/);
  assert.match(calls[1].sql, /ORDER BY published_at DESC/);
  assert.deepEqual(result.meta, { page: 1, limit: 20, totalItems: 1, totalPages: 1 });
});

test('public website content list and key lookup both filter out draft and hidden records', async () => {
  const calls = [];
  const database = {
    execute: async (sql, values) => {
      calls.push({ sql, values });
      if (sql.startsWith('SELECT COUNT')) return [[{ totalItems: 0 }], []];
      return [[], []];
    },
  };
  const model = createContentModel(database);
  await model.list('websiteContents', {
    q: '', contentKey: 'home.hero', contentType: 'banner', page: 1, limit: 20, sort: 'contentKey:asc',
  }, { publicOnly: true });
  await model.find('websiteContents', 'home.hero', { publicOnly: true, byKey: true });

  assert.match(calls[0].sql, /status = 'published'/);
  assert.match(calls[1].sql, /status = 'published'/);
  assert.doesNotMatch(calls[1].sql, /updated_by_user_id/);
  assert.doesNotMatch(calls[2].sql, /updated_by_user_id/);
  assert.deepEqual(calls[0].values, ['home.hero', 'banner']);
  assert.deepEqual(calls[2].values, ['home.hero']);
});

test('content service prevents publishing an empty article body and sets publish time on valid transition', async () => {
  let updateCall;
  const model = {
    find: async () => ({
      id: '21', title: 'Bài', slug: 'bai', contentType: 'article', body: 'Đủ nội dung',
      mediaUrl: null, status: 'draft', publishedAt: null,
    }),
    update: async (resource, id, input, options) => {
      const current = await model.find(resource, id);
      const effective = { ...current, ...input };
      const transition = await options.validate({ current, effective });
      updateCall = [resource, id, input, transition];
      return { id, ...input };
    },
  };
  const service = createContentService({ model });

  await assert.rejects(
    service.update('articles', '21', { status: 'published', body: '   ' }, { actorUserId: '7' }),
    (error) => error.statusCode === 422 && error.code === 'CONTENT_NOT_PUBLISHABLE',
  );
  assert.equal(updateCall, undefined);

  await service.update('articles', '21', { status: 'published' }, { actorUserId: '7' });
  assert.equal(updateCall[0], 'articles');
  assert.equal(updateCall[3].publishNow, true);
});

test('content model locks the current row and rolls back a failed publication update', async () => {
  const state = { began: false, rolledBack: false, committed: false, updated: false, released: false };
  const current = {
    id: '21', categoryId: null, authorUserId: '7', title: 'Bài', slug: 'bai', contentType: 'article',
    body: 'Nội dung hiện có', mediaUrl: null, status: 'published', publishedAt: '2026-11-25T00:00:00Z',
    createdAt: '2026-11-24T00:00:00Z', updatedAt: '2026-11-24T00:00:00Z',
  };
  const connection = {
    beginTransaction: async () => { state.began = true; },
    commit: async () => { state.committed = true; },
    rollback: async () => { state.rolledBack = true; },
    release: () => { state.released = true; },
    execute: async (sql) => {
      if (sql.includes('FROM articles WHERE id = ? FOR UPDATE')) return [[current], []];
      if (sql.startsWith('UPDATE articles')) state.updated = true;
      return [{ affectedRows: 1 }, []];
    },
  };
  const database = {
    getConnection: async () => connection,
    execute: async () => [[current], []],
  };
  const { createContentModel } = require('../src/modules/content/content.model');
  const model = createContentModel(database);
  const { createApiError } = require('../src/middlewares/error-handler');

  await assert.rejects(
    model.update('articles', '21', { body: null }, {
      validate: ({ current: locked, effective }) => {
        assert.equal(locked.status, 'published');
        assert.equal(effective.body, null);
        throw createApiError(422, 'CONTENT_NOT_PUBLISHABLE', 'Bài đăng cần nội dung.');
      },
    }),
    (error) => error.code === 'CONTENT_NOT_PUBLISHABLE',
  );
  assert.equal(state.began, true);
  assert.equal(state.rolledBack, true);
  assert.equal(state.committed, false);
  assert.equal(state.updated, false);
  assert.equal(state.released, true);
});

test('content publication update reads its response through the held transaction connection', async () => {
  const state = { committed: false, rolledBack: false, released: false, poolQueries: 0, updateSql: '' };
  const current = {
    id: '21', categoryId: null, authorUserId: '7', title: 'Bài', slug: 'bai', contentType: 'article',
    body: 'Nội dung hiện có', mediaUrl: null, status: 'draft', publishedAt: null,
    createdAt: '2026-11-24T00:00:00Z', updatedAt: '2026-11-24T00:00:00Z',
  };
  let row = { ...current };
  const connection = {
    beginTransaction: async () => {},
    commit: async () => { state.committed = true; },
    rollback: async () => { state.rolledBack = true; },
    release: () => { state.released = true; },
    execute: async (sql, values) => {
      if (sql.includes('FROM articles WHERE id = ? FOR UPDATE')) return [[row], []];
      if (sql.startsWith('UPDATE articles')) {
        state.updateSql = sql;
        row = { ...row, status: values[0] };
        return [{ affectedRows: 1 }, []];
      }
      if (sql.includes('FROM articles WHERE id = ?')) return [[row], []];
      return [[], []];
    },
  };
  const database = {
    getConnection: async () => connection,
    execute: async () => { state.poolQueries += 1; throw new Error('unexpected pool-level read'); },
  };
  const { createContentModel } = require('../src/modules/content/content.model');
  const model = createContentModel(database);
  const service = createContentService({ model });
  const result = await service.update('articles', '21', { status: 'published' }, { actorUserId: '7' });

  assert.equal(result.status, 'published');
  assert.match(state.updateSql, /published_at = CURRENT_TIMESTAMP/);
  assert.equal(state.committed, true);
  assert.equal(state.rolledBack, false);
  assert.equal(state.released, true);
  assert.equal(state.poolQueries, 0);
});

test('content service validates published FAQ and video requirements', async () => {
  const model = { create: async () => ({ id: '1' }) };
  const service = createContentService({ model });

  await assert.rejects(
    service.create('websiteContents', {
      contentKey: 'policy.return', contentType: 'faq', status: 'published', body: '  ',
    }, { actorUserId: '7' }),
    (error) => error.statusCode === 422 && error.code === 'CONTENT_NOT_PUBLISHABLE',
  );

  await assert.rejects(
    service.create('articles', {
      title: 'Video', slug: 'video', contentType: 'video', status: 'published', mediaUrl: null,
    }, { actorUserId: '7' }),
    (error) => error.statusCode === 422 && error.code === 'CONTENT_NOT_PUBLISHABLE',
  );
});
