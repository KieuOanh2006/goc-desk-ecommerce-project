import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
require('../js/setup-3d-presets.js');
const studio = require('../js/setup-3d-state.js');

test('normalizes the stored color, quarter-turns, and known product positions', () => {
  const normalized = studio.normalizeLayout({
    deskColor: 'walnut',
    furniture: { desk: { x: 99, z: 0, rotation: 1.6 } },
    products: {
      'mouse:black': { x: 0.2, z: -0.1, surface: 'floor' },
      'unknown:color': { x: 0, z: 0, surface: 'desk' },
      broken: { x: 'NaN', z: 0 },
    },
  }, ['mouse:black']);

  assert.equal(normalized.deskColor, 'walnut');
  assert.equal(normalized.furniture.desk.x, 3.8 - (0.86 / 2));
  assert.equal(normalized.furniture.desk.rotation, Math.PI / 2);
  assert.equal(studio.normalizeRotation(-Math.PI / 2), Math.PI * 1.5);
  assert.equal(studio.normalizeRotation(Math.PI * 4 + Math.PI / 2), Math.PI / 2);
  assert.deepEqual(normalized.products, {
    'mouse:black': { x: 0.2, z: -0.1, surface: 'floor' },
  });
});

test('migrates the earlier product-position shape without inventing furniture values', () => {
  const normalized = studio.normalizeLayout({
    'mouse:black': { x: 0.4, z: 0.1, surface: 'desk' },
  }, ['mouse:black']);

  assert.equal(normalized.products['mouse:black'].x, 0.4);
  assert.deepEqual(normalized.furniture, studio.DEFAULT_LAYOUT.furniture);
});

test('uses rotated footprints when checking bounds and collisions', () => {
  const longItem = { key: 'keyboard', x: 1.08, z: 0, size: { width: 0.43, depth: 0.145 }, rotation: Math.PI / 2 };
  assert.equal(studio.canPlaceProduct(longItem, { surface: 'desk', obstacles: [] }), true);
  assert.equal(studio.canPlaceProduct(Object.assign({}, longItem, { rotation: 0 }), { surface: 'desk', obstacles: [] }), false);
  assert.equal(studio.canPlaceProduct(
    Object.assign({}, longItem, { x: 0.5, z: 0.25 }),
    {
      surface: 'desk',
      obstacles: [{ key: 'other', surface: 'desk', x: 0.5, z: 0.37, size: { width: 0.2, depth: 0.1 } }],
    },
  ), false);
});

test('allows a mouse or keyboard to sit fully on a mouse pad', () => {
  const pad = { key: 'pad', category: 'pad', surface: 'desk', x: 0, z: 0, size: { width: 0.52, depth: 0.31 } };
  const mouse = { key: 'mouse', category: 'mouse', surface: 'desk', x: 0.15, z: 0, size: { width: 0.096, depth: 0.136 } };

  assert.equal(studio.canPlaceProduct(mouse, { surface: 'desk', obstacles: [pad] }), true);
  assert.equal(studio.canPlaceProduct(
    Object.assign({}, mouse, { x: 0.24 }),
    { surface: 'desk', obstacles: [pad] },
  ), false);
});

test('finds the nearest unoccupied spot and refuses a completely blocked surface', () => {
  const candidate = { key: 'new', category: 'mouse', x: 0, z: 0, size: { width: 0.2, depth: 0.2 } };
  const blocker = { key: 'block', surface: 'desk', x: 0, z: 0, size: { width: 0.8, depth: 0.8 } };
  const result = studio.nearestProductPosition(candidate, { surface: 'desk', obstacles: [blocker], step: 0.1 });

  assert.ok(result);
  assert.equal(studio.canPlaceProduct(Object.assign({}, candidate, result), { surface: 'desk', obstacles: [blocker] }), true);
  assert.equal(studio.nearestProductPosition(candidate, {
    surface: 'desk',
    obstacles: [{ key: 'wall', surface: 'desk', x: 0, z: 0, size: { width: 8, depth: 8 } }],
  }), null);
});

test('prevents furniture from leaving the room or covering floor products', () => {
  const furniture = {
    desk: { x: 0.35, z: 0.06, rotation: 0 },
    cabinet: { x: -2.12, z: -0.35, rotation: 0 },
  };
  assert.equal(studio.canPlaceFurniture('desk', { x: 3.5, z: 0, rotation: 0 }, { furniture, floorItems: [] }), false);
  assert.equal(studio.canPlaceFurniture('desk', { x: 0.35, z: 0.06, rotation: 0 }, {
    furniture: Object.assign({}, furniture, { cabinet: { x: -2.12, z: -0.35, rotation: 0 } }),
    floorItems: [{ x: 0.35, z: 0.06, size: { width: 0.3, depth: 0.3 } }],
  }), false);
});

test('creates independent scene layouts with bed and furniture defaults', () => {
  const workspace = studio.normalizeWorkspace(null, ['keyboard:black']);

  assert.equal(workspace.activeSceneId, 'bedroom');
  assert.deepEqual(Object.keys(workspace.scenes).sort(), ['balcony', 'bedroom', 'window']);
  assert.ok(workspace.scenes.bedroom.present.includes('bed'));
  assert.notEqual(workspace.scenes.bedroom, workspace.scenes.window);
  assert.notEqual(workspace.scenes.bedroom.furniture, workspace.scenes.window.furniture);
});

test('repairs partial v2 scenes and clamps out-of-range furniture positions', () => {
  const workspace = studio.normalizeWorkspace({
    version: 2,
    activeSceneId: 'unknown',
    scenes: {
      bedroom: {
        deskColor: 'neon',
        cabinetColor: 'walnut',
        present: ['desk', 'unknown-furniture'],
        furniture: { desk: { x: 99, z: -99, rotation: Math.PI / 4 } },
        products: {
          'keyboard:black': { x: 0.2, z: -0.1, surface: 'floor', rotation: Math.PI / 2 },
          'mouse:black': { x: 9, z: 0, surface: 'desk' },
          broken: null,
        },
      },
      window: null,
    },
  }, ['keyboard:black', 'mouse:black']);

  assert.equal(workspace.activeSceneId, 'bedroom');
  assert.equal(workspace.scenes.bedroom.deskColor, 'oak');
  assert.equal(workspace.scenes.bedroom.cabinetColor, 'walnut');
  assert.deepEqual(workspace.scenes.bedroom.present, ['desk']);
  assert.deepEqual(workspace.scenes.bedroom.furniture.desk, {
    x: studio.ROOM.maxX - 0.86 / 2,
    z: studio.ROOM.minZ + 2.35 / 2,
    rotation: Math.PI / 2,
  });
  assert.deepEqual(workspace.scenes.bedroom.products, {
    'keyboard:black': { x: 0.2, z: -0.1, surface: 'floor', rotation: Math.PI / 2 },
  });
  assert.deepEqual(workspace.scenes.window.present, studio.defaultSceneLayout('window').present);
  assert.deepEqual(workspace.scenes.balcony.products, {});
});

test('migrates an older layout into the closed room and leaves other rooms independent', () => {
  const workspace = studio.normalizeWorkspace({
    version: 1,
    deskColor: 'walnut',
    furniture: { desk: { x: 0.4, z: 0.1, rotation: 0 } },
    products: { 'keyboard:black': { x: 0.2, z: -0.1, surface: 'desk' } },
  }, ['keyboard:black']);

  assert.equal(workspace.scenes.bedroom.deskColor, 'walnut');
  assert.equal(workspace.scenes.bedroom.furniture.desk.x, 0.4);
  assert.equal(workspace.scenes.bedroom.products['keyboard:black'].x, 0.2);
  assert.equal(workspace.scenes.window.deskColor, 'oak');
  assert.deepEqual(workspace.scenes.window.products, {});
});

test('keeps floor placement clear of furniture and the balcony doorway', () => {
  const balcony = studio.defaultSceneLayout('balcony');
  const options = {
    surface: 'floor',
    furniture: balcony.furniture,
    present: balcony.present,
    sceneId: 'balcony',
    balcony: true,
    obstacles: [],
  };
  const product = { key: 'lamp', x: 1.35, z: -1.9, size: { width: 0.36, depth: 0.21 } };

  assert.equal(studio.canPlaceProduct(product, options), false);
  assert.equal(studio.canPlaceProduct(Object.assign({}, product, { x: 0, z: 1.8 }), options), true);
});

test('ships collision-free sample furniture layouts in all three rooms', () => {
  for (const sceneId of ['bedroom', 'window', 'balcony']) {
    const layout = studio.defaultSceneLayout(sceneId);
    for (const key of layout.present) {
      assert.equal(studio.canPlaceFurniture(key, layout.furniture[key], {
        furniture: layout.furniture,
        present: layout.present,
        sceneId,
      }), true, sceneId + ' preset overlaps at ' + key);
    }
  }
});
