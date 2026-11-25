const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const http = require('node:http');
const TRUSTED_ORIGIN = 'http://127.0.0.1:5500';
process.env.CLIENT_ORIGIN = TRUSTED_ORIGIN;
const { createApiError, errorHandler, notFoundHandler } = require('../src/middlewares/error-handler');
const { createStudioAssetsRouter } = require('../src/modules/studio-assets/studio-assets.routes');
const { createStudioAssetsModel } = require('../src/modules/studio-assets/studio-assets.model');
const { createStudioAssetsService } = require('../src/modules/studio-assets/studio-assets.service');

function createTestAuthentication(req, res, next) {
  const role = req.get('x-test-role');
  if (!role) return next(createApiError(401, 'UNAUTHENTICATED', 'Vui lòng đăng nhập.'));
  req.auth = { user: { id: '7', role, accountStatus: 'active', emailVerifiedAt: '2026-11-24T00:00:00.000Z' } };
  return next();
}

async function withApi(t, service, callback) {
  const app = express();
  app.use(express.json());
  app.use('/api', createStudioAssetsRouter({ service, authenticate: createTestAuthentication }));
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
    list: async (resource, query, options) => ({ items: [], meta: { page: query.page, limit: query.limit, totalItems: 0, totalPages: 0 }, options }),
    get: async (resource, id) => ({ id }),
    create: async (resource, input) => ({ id: '21', ...input }),
    update: async (resource, id, input) => ({ id, ...input }),
    remove: async (resource, id) => ({ id }),
    replaceRoomFurniture: async (id, furniture) => ({ id, furniture }),
    ...overrides,
  };
}

function roomConfig() {
  const camera = { label: 'Toàn phòng', theta: 0.68, phi: 1.08, radius: 7.4, target: { x: 0, y: 1, z: 0 } };
  return {
    room: { minX: -3.8, maxX: 3.8, minZ: -2.35, maxZ: 2.35 },
    backWindow: false,
    balcony: false,
    cameraPresets: { room: camera, desk: camera, top: { ...camera, phi: 0.16 } },
  };
}

test('public 3D product models include active saleable variants and use string identifiers', async (t) => {
  let received;
  const service = createService({
    list: async (resource, query, options) => {
      received = { resource, query, options };
      return { items: [{ productId: '9007199254740993', variants: [{ id: '8', stockQuantity: '0', available: false }] }, { productId: '2', variants: [{ id: '9', stockQuantity: '4', available: true }] }], meta: { totalItems: 2 } };
    },
  });

  await withApi(t, service, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/studio/product-models?q=keyboard&page=2`);
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.data[0].productId, '9007199254740993');
    assert.equal(body.data[0].variants[0].available, false);
    assert.deepEqual(received.options, { publicOnly: true });
    assert.equal(received.query.q, 'keyboard');
    assert.equal(received.query.page, 2);
  });
});

test('studio admin writes require admin role and a trusted origin', async (t) => {
  let createCalls = 0;
  const service = createService({ create: async () => { createCalls += 1; return { id: '1' }; } });

  await withApi(t, service, async (baseUrl) => {
    const guest = await fetch(`${baseUrl}/api/admin/studio/rooms`);
    assert.equal(guest.status, 401);

    const contentStaff = await fetch(`${baseUrl}/api/admin/studio/rooms`, { headers: { 'x-test-role': 'product_content_staff' } });
    assert.equal(contentStaff.status, 403);

    const untrusted = await fetch(`${baseUrl}/api/admin/studio/rooms`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: 'https://untrusted.example', 'x-test-role': 'admin' },
      body: JSON.stringify({ name: 'Phòng mẫu', slug: 'phong-mau', roomConfig: roomConfig() }),
    });
    assert.equal(untrusted.status, 403);
    assert.equal(createCalls, 0);
  });
});

test('studio writes reject unsupported procedural keys, missing GLB urls, and invalid room bounds', async (t) => {
  let createCalls = 0;
  const service = createService({ create: async () => { createCalls += 1; return { id: '1' }; } });
  const adminHeaders = { 'content-type': 'application/json', origin: TRUSTED_ORIGIN, 'x-test-role': 'admin' };

  await withApi(t, service, async (baseUrl) => {
    const unsupportedRenderer = await fetch(`${baseUrl}/api/admin/studio/furniture-assets`, {
      method: 'POST', headers: adminHeaders,
      body: JSON.stringify({ assetCode: 'desk-v2', name: 'Bàn', furnitureType: 'desk', rendererType: 'procedural', rendererKey: 'custom-desk', dimensions: { width: 1.2, depth: 0.6, height: 0.8 } }),
    });
    assert.equal(unsupportedRenderer.status, 422);

    const noGlbUrl = await fetch(`${baseUrl}/api/admin/studio/product-models`, {
      method: 'POST', headers: adminHeaders,
      body: JSON.stringify({ productId: '1', rendererType: 'glb', rendererKey: 'model-v1', width: 0.2, depth: 0.2, height: 0.2 }),
    });
    assert.equal(noGlbUrl.status, 422);

    const invalidBounds = roomConfig();
    invalidBounds.room.maxX = invalidBounds.room.minX;
    const invalidRoom = await fetch(`${baseUrl}/api/admin/studio/rooms`, {
      method: 'POST', headers: adminHeaders,
      body: JSON.stringify({ name: 'Phòng', slug: 'phong', roomConfig: invalidBounds }),
    });
    assert.equal(invalidRoom.status, 422);
    assert.equal(createCalls, 0);
  });
});

test('room furniture replacement rejects duplicate ids before touching the service', async (t) => {
  let replaceCalls = 0;
  const service = createService({ replaceRoomFurniture: async () => { replaceCalls += 1; return {}; } });

  await withApi(t, service, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/admin/studio/rooms/12/furniture`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json', origin: TRUSTED_ORIGIN, 'x-test-role': 'admin' },
      body: JSON.stringify([
        { furnitureAssetId: '5', positionX: 0, positionZ: 0, rotation: 0 },
        { furnitureAssetId: '5', positionX: 1, positionZ: 0, rotation: 0 },
      ]),
    });
    assert.equal(response.status, 422);
    assert.equal(replaceCalls, 0);
  });
});

test('room furniture rotations and positions are rounded to the database decimal precision', async (t) => {
  let received;
  const service = createService({
    replaceRoomFurniture: async (id, furniture) => {
      received = furniture;
      return { id, furniture };
    },
  });

  await withApi(t, service, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/admin/studio/rooms/12/furniture`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json', origin: TRUSTED_ORIGIN, 'x-test-role': 'admin' },
      body: JSON.stringify([{ furnitureAssetId: '5', positionX: 0.12345, positionZ: -0.98765, rotation: Math.PI / 2 }]),
    });
    assert.equal(response.status, 200);
    assert.equal(received[0].positionX, 0.123);
    assert.equal(received[0].positionZ, -0.988);
    assert.equal(received[0].rotation, 1.5708);
  });
});

test('service rejects furniture placements outside the locked room bounds', async () => {
  let replaceCalled = false;
  const model = {
    replaceRoomFurniture: async (id, placements, validate) => {
      replaceCalled = true;
      validate({
        room: { roomConfig: roomConfig() },
        assets: [{ id: '3', name: 'Bàn', dimensions: { width: 2, depth: 1, height: 0.8 }, isActive: true }],
      });
      return { found: true, room: { id, furniture: placements } };
    },
  };
  const service = createStudioAssetsService({ model });
  await assert.rejects(
    service.replaceRoomFurniture('8', [{ furnitureAssetId: '3', positionX: 3.5, positionZ: 0, rotation: 0, isPresent: true }]),
    (error) => error.code === 'FURNITURE_OUT_OF_BOUNDS' && error.statusCode === 422,
  );
  assert.equal(replaceCalled, true);
});

test('service distinguishes missing and inactive furniture assets', async () => {
  const missing = createStudioAssetsService({ model: {
    replaceRoomFurniture: async () => ({ found: true, missingAssetIds: ['44'], inactiveAssetIds: [] }),
  } });
  await assert.rejects(missing.replaceRoomFurniture('8', []), (error) => error.code === 'FURNITURE_ASSET_NOT_FOUND' && error.statusCode === 404);

  const inactive = createStudioAssetsService({ model: {
    replaceRoomFurniture: async () => ({ found: true, missingAssetIds: [], inactiveAssetIds: ['45'] }),
  } });
  await assert.rejects(inactive.replaceRoomFurniture('8', []), (error) => error.code === 'FURNITURE_ASSET_INACTIVE' && error.statusCode === 409);
});

test('room configuration changes roll back if they would strand existing furniture', async () => {
  const state = { rolledBack: false, committed: false, updated: false, released: false, poolQueries: 0 };
  const connection = {
    beginTransaction: async () => {},
    commit: async () => { state.committed = true; },
    rollback: async () => { state.rolledBack = true; },
    release: () => { state.released = true; },
    execute: async (sql) => {
      if (sql.includes('FROM room_templates WHERE')) return [[{
        id: '9', name: 'Phòng mẫu', slug: 'phong-mau', roomConfig: roomConfig(), isActive: 1,
      }], []];
      if (sql.includes('FROM room_template_furniture rtf')) return [[{
        name: 'Bàn', dimensions: { width: 1, depth: 0.5, height: 0.8 }, positionX: '3.500', positionZ: '0.000', rotation: '0.0000',
      }], []];
      if (sql.startsWith('UPDATE room_templates')) state.updated = true;
      return [{ affectedRows: 1 }, []];
    },
  };
  const database = {
    getConnection: async () => connection,
    execute: async () => { state.poolQueries += 1; throw new Error('unexpected pool-level read'); },
  };
  const service = createStudioAssetsService({ model: createStudioAssetsModel(database) });
  const smallerRoom = roomConfig();
  smallerRoom.room.maxX = 3;

  await assert.rejects(
    service.update('rooms', '9', { roomConfig: smallerRoom }),
    (error) => error.code === 'ROOM_LAYOUT_OUT_OF_BOUNDS' && error.statusCode === 409,
  );
  assert.equal(state.rolledBack, true);
  assert.equal(state.committed, false);
  assert.equal(state.updated, false);
  assert.equal(state.released, true);
  assert.equal(state.poolQueries, 0);
});

test('renderer-affecting furniture changes are blocked while a template references the asset', async () => {
  const state = { rolledBack: false, committed: false, released: false, poolQueries: 0 };
  const connection = {
    beginTransaction: async () => {},
    commit: async () => { state.committed = true; },
    rollback: async () => { state.rolledBack = true; },
    release: () => { state.released = true; },
    execute: async (sql) => {
      if (sql.includes('FROM furniture_assets WHERE id = ? FOR UPDATE')) return [[{
        id: '3', assetCode: 'desk', name: 'Bàn', furnitureType: 'desk', rendererType: 'procedural',
        rendererKey: 'desk', dimensions: { width: 1, depth: 0.5, height: 0.8 }, isActive: 1,
      }], []];
      if (sql.includes('FROM room_template_furniture WHERE furniture_asset_id')) return [[{ found: 1 }], []];
      return [[], []];
    },
  };
  const database = {
    getConnection: async () => connection,
    execute: async () => { state.poolQueries += 1; throw new Error('unexpected pool-level read'); },
  };
  const service = createStudioAssetsService({ model: createStudioAssetsModel(database) });

  await assert.rejects(
    service.update('furnitureAssets', '3', { dimensions: { width: 1.2, depth: 0.5, height: 0.8 } }),
    (error) => error.code === 'FURNITURE_ASSET_IN_USE' && error.statusCode === 409,
  );
  assert.equal(state.rolledBack, true);
  assert.equal(state.committed, false);
  assert.equal(state.released, true);
  assert.equal(state.poolQueries, 0);
});

test('product-model partial updates validate the model row held by the write transaction', async () => {
  const state = { committed: false, rolledBack: false, released: false, poolQueries: 0 };
  let currentModel = {
    id: '55', productId: '8', rendererType: 'glb', rendererKey: 'external-model-v1', modelUrl: 'https://cdn.example/old.glb',
    width: '0.430', depth: '0.145', height: '0.050', surfaceType: 'desk', isActive: 1,
    productName: 'Bàn phím', productSlug: 'ban-phim', categoryKey: 'keyboard', imageUrl: null,
  };
  const connection = {
    beginTransaction: async () => {},
    commit: async () => { state.committed = true; },
    rollback: async () => { state.rolledBack = true; },
    release: () => { state.released = true; },
    execute: async (sql, values) => {
      if (sql.includes('FROM product_3d_models WHERE id = ? FOR UPDATE')) return [[currentModel], []];
      if (sql.includes('FROM products p JOIN categories c')) return [[{
        id: '8', status: 'active', categoryKey: 'keyboard', categoryStatus: 'active',
      }], []];
      if (sql.startsWith('UPDATE product_3d_models')) {
        currentModel = { ...currentModel, modelUrl: values[0] };
        return [{ affectedRows: 1 }, []];
      }
      if (sql.includes('FROM product_3d_models m')) return [[currentModel], []];
      return [[], []];
    },
  };
  const database = {
    getConnection: async () => connection,
    execute: async () => { state.poolQueries += 1; throw new Error('unexpected pool-level read'); },
  };
  const service = createStudioAssetsService({ model: createStudioAssetsModel(database) });
  const nextUrl = 'https://cdn.example/new.glb';
  const result = await service.update('productModels', '55', { modelUrl: nextUrl });

  assert.equal(result.modelUrl, nextUrl);
  assert.equal(state.committed, true);
  assert.equal(state.rolledBack, false);
  assert.equal(state.released, true);
  assert.equal(state.poolQueries, 0);
});

test('public 3D product model SQL filters hidden records and binds searches', async () => {
  const calls = [];
  const database = {
    execute: async (sql, values) => {
      calls.push({ sql, values });
      if (sql.startsWith('SELECT COUNT')) return [[{ totalItems: 1 }], []];
      if (sql.includes('FROM product_3d_models')) return [[{
        id: '17', productId: '22', productName: 'Bàn phím', productSlug: 'ban-phim', categoryKey: 'keyboard',
        rendererType: 'procedural', rendererKey: 'keyboard', width: '0.430', depth: '0.145', height: '0.050',
        surfaceType: 'desk', isActive: 1,
      }], []];
      return [[{
        productId: '22', id: '30', sku: 'KB-01', colorName: 'Đen', colorHex: '#222222',
        price: '680000.00', salePrice: null, effectivePrice: '680000.00', stockQuantity: 2, imageUrl: '/images/keyboard.jpg',
      }], []];
    },
  };
  const model = createStudioAssetsModel(database);
  const result = await model.listProductModels({ q: 'desk', page: 1, limit: 20, sort: 'productName:asc' }, { publicOnly: true });

  assert.match(calls[0].sql, /m\.is_active = TRUE/);
  assert.match(calls[0].sql, /p\.status = 'active'/);
  assert.match(calls[0].sql, /c\.status = 'active'/);
  assert.match(calls[0].sql, /active_variant\.status = 'active'/);
  assert.deepEqual(calls[0].values, ['%desk%', '%desk%', '%desk%']);
  assert.equal(result.items[0].id, '17');
  assert.equal(result.items[0].productId, '22');
  assert.equal(result.items[0].variants[0].id, '30');
  assert.equal(result.items[0].variants[0].effectivePrice, '680000.00');
  assert.equal(result.items[0].variants[0].available, true);
});

test('room furniture transaction rolls back the full replacement when an insert fails', async () => {
  const state = { begun: false, committed: false, rolledBack: false, releaseCount: 0, inserts: 0 };
  const connection = {
    beginTransaction: async () => { state.begun = true; },
    commit: async () => { state.committed = true; },
    rollback: async () => { state.rolledBack = true; },
    release: () => { state.releaseCount += 1; },
    execute: async (sql) => {
      if (sql.includes('FROM room_templates WHERE')) return [[{ id: '9', name: 'Phòng mẫu', slug: 'phong-mau', roomConfig: roomConfig(), isActive: 1 }], []];
      if (sql.includes('FROM furniture_assets WHERE id IN')) return [[
        { id: '4', assetCode: 'desk', name: 'Bàn', dimensions: { width: 1, depth: 0.5, height: 0.8 }, isActive: 1 },
        { id: '5', assetCode: 'chair', name: 'Ghế', dimensions: { width: 0.5, depth: 0.5, height: 0.8 }, isActive: 1 },
      ], []];
      if (sql.startsWith('INSERT INTO room_template_furniture')) {
        state.inserts += 1;
        if (state.inserts === 2) throw new Error('simulated second insert failure');
      }
      return [{ affectedRows: 1 }, []];
    },
  };
  const model = createStudioAssetsModel({ getConnection: async () => connection });

  await assert.rejects(model.replaceRoomFurniture('9', [
    { furnitureAssetId: '4', positionX: 0, positionZ: 0, rotation: 0, isPresent: true, colorHex: null },
    { furnitureAssetId: '5', positionX: 1, positionZ: 0, rotation: 0, isPresent: true, colorHex: null },
  ]), /simulated second insert failure/);
  assert.equal(state.begun, true);
  assert.equal(state.rolledBack, true);
  assert.equal(state.committed, false);
  assert.equal(state.releaseCount, 1);
});

test('room furniture transaction returns the saved replacement after commit', async () => {
  const state = { committed: false, rolledBack: false, releaseCount: 0 };
  const connection = {
    beginTransaction: async () => {},
    commit: async () => { state.committed = true; },
    rollback: async () => { state.rolledBack = true; },
    release: () => { state.releaseCount += 1; },
    execute: async (sql) => {
      if (sql.includes('FROM room_templates WHERE')) return [[{ id: '9', name: 'Phòng mẫu', slug: 'phong-mau', roomConfig: roomConfig(), isActive: 1 }], []];
      if (sql.includes('FROM furniture_assets WHERE id IN')) return [[{
        id: '4', assetCode: 'desk', name: 'Bàn', dimensions: { width: 1, depth: 0.5, height: 0.8 }, isActive: 1,
      }], []];
      if (sql.includes('FROM room_template_furniture rtf JOIN furniture_assets')) return [[{
        furnitureAssetId: '4', assetCode: 'desk', name: 'Bàn', furnitureType: 'desk', rendererType: 'procedural',
        rendererKey: 'desk', dimensions: { width: 1, depth: 0.5, height: 0.8 }, positionX: '0.250',
        positionZ: '-1.100', rotation: '0.0000', isPresent: 1, colorHex: '#ffffff',
      }], []];
      return [{ affectedRows: 1 }, []];
    },
  };
  const model = createStudioAssetsModel({ getConnection: async () => connection });
  const result = await model.replaceRoomFurniture('9', [
    { furnitureAssetId: '4', positionX: 0.25, positionZ: -1.1, rotation: 0, isPresent: true, colorHex: '#ffffff' },
  ]);

  assert.equal(state.committed, true);
  assert.equal(state.rolledBack, false);
  assert.equal(state.releaseCount, 1);
  assert.equal(result.room.id, '9');
  assert.equal(result.room.furniture[0].furnitureAssetId, '4');
  assert.equal(result.room.furniture[0].positionZ, -1.1);
});
