import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const currentKey = 'goc-desk:studio-layout:cap-nhat:v2';
const previousKey = 'goc-desk:studio-layout:cap-nhat:v1';
const legacyKey = 'goc-desk:studio-layout:v1';
const sources = ['presets', 'state', 'scene'].map((name) => ({
  filename: `setup-3d-${name}.js`,
  source: readFileSync(new URL(`../js/setup-3d-${name}.js`, import.meta.url), 'utf8'),
}));
const plain = (value) => JSON.parse(JSON.stringify(value));

function startStudio(entries = [], { blockedStorage = false } = {}) {
  const storage = new Map(entries);
  const reads = [];
  const mutations = [];
  const listeners = new Map();
  const observations = [];
  const normalizations = [];
  const elements = new Map([
    'studio-canvas', 'studio-canvas-wrap', 'studio-canvas-loading',
    'studio-canvas-fallback', 'studio-status', 'studio-inventory-list',
    'studio-furniture-library-list', 'studio-cart-count', 'studio-retry',
  ].map((id) => [id, {
    id,
    addEventListener(type, callback) {
      listeners.set(`${id}:${type}`, callback);
    },
  }]));
  const context = vm.createContext({
    URLSearchParams,
    location: { search: '' },
    GocDeskCatalog: { products: [{ id: 'keyboard', colors: [{ id: 'black' }] }] },
    document: {
      getElementById(id) {
        assert.ok(elements.has(id), `Unexpected startup element: ${id}`);
        return elements.get(id);
      },
    },
    localStorage: {
      getItem(key) {
        reads.push(key);
        if (blockedStorage) throw new Error('Storage access denied');
        return storage.get(key) ?? null;
      },
      setItem(key, value) {
        mutations.push(['setItem', key, value]);
        storage.set(key, value);
      },
      removeItem(key) {
        mutations.push(['removeItem', key]);
        storage.delete(key);
      },
      clear() {
        mutations.push(['clear']);
        storage.clear();
      },
    },
    IntersectionObserver: class {
      constructor(callback, options) {
        this.callback = callback;
        this.options = options;
      }

      observe(element) {
        // Keep the canvas outside the viewport: startup must finish before WebGL loads.
        observations.push({ element, observer: this });
      }
    },
  });

  for (const script of sources.slice(0, 2)) vm.runInContext(script.source, context, { filename: script.filename });
  const state = context.GocDeskStudioStateV1;
  const normalizeWorkspace = state.normalizeWorkspace;
  state.normalizeWorkspace = (saved, knownProductKeys) => {
    const workspace = normalizeWorkspace(saved, knownProductKeys);
    normalizations.push({ saved: plain(saved), knownProductKeys: plain(knownProductKeys), workspace: plain(workspace) });
    return workspace;
  };

  const script = sources[2];
  assert.doesNotThrow(() => vm.runInContext(script.source, context, { filename: script.filename }));
  assert.equal(typeof listeners.get('studio-retry:click'), 'function', 'Retry must be wired after loading saved state');
  assert.equal(observations.length, 1, 'Startup must reach lazy renderer initialization');
  assert.equal(observations[0].element, elements.get('studio-canvas-wrap'));
  assert.equal(observations[0].observer.options.rootMargin, '180px 0px');
  assert.equal(normalizations.length, 1);
  assert.deepEqual(normalizations[0].knownProductKeys, ['keyboard:black']);
  assert.deepEqual(mutations, [], 'Reading saved layouts must not modify browser storage');
  assert.deepEqual([...storage], entries, 'Existing saved layouts must remain intact');
  return { reads, ...normalizations[0] };
}

test('starts a fresh 3D workspace and wires lazy loading and retry', () => {
  const result = startStudio();

  assert.deepEqual(result.reads, [currentKey, previousKey, legacyKey]);
  assert.equal(result.saved, null);
  assert.equal(result.workspace.activeSceneId, 'bedroom');
  assert.ok(result.workspace.scenes.bedroom.present.includes('bed'));
});

test('starts from the current workspace before considering older saved layouts', () => {
  const saved = {
    version: 2,
    activeSceneId: 'window',
    scenes: { window: { deskColor: 'walnut', products: { 'keyboard:black': { x: 0.2, z: 0, surface: 'desk' } } } },
  };
  const result = startStudio([
    [currentKey, JSON.stringify(saved)],
    [previousKey, '{invalid previous layout'],
    [legacyKey, '{invalid legacy layout'],
  ]);

  assert.deepEqual(result.reads, [currentKey]);
  assert.deepEqual(result.saved, saved);
  assert.equal(result.workspace.activeSceneId, 'window');
  assert.equal(result.workspace.scenes.window.deskColor, 'walnut');
  assert.equal(result.workspace.scenes.window.products['keyboard:black'].x, 0.2);
});

test('starts after reading the previous updated layout and preserves its migration input', () => {
  const saved = {
    version: 1,
    deskColor: 'white',
    furniture: { desk: { x: 0.4, z: 0.1, rotation: 0 } },
    products: { 'keyboard:black': { x: 0.3, z: -0.1, surface: 'desk' } },
  };
  const result = startStudio([[previousKey, JSON.stringify(saved)], [legacyKey, '{invalid legacy layout']]);

  assert.deepEqual(result.reads, [currentKey, previousKey]);
  assert.deepEqual(result.saved, saved);
  assert.equal(result.workspace.scenes.bedroom.deskColor, 'white');
  assert.equal(result.workspace.scenes.bedroom.products['keyboard:black'].x, 0.3);
});

test('starts after passing the original product-position layout to migration', () => {
  const saved = { 'keyboard:black': { x: 0.4, z: 0.1, surface: 'desk' } };
  const result = startStudio([[legacyKey, JSON.stringify(saved)]]);

  assert.deepEqual(result.reads, [currentKey, previousKey, legacyKey]);
  assert.deepEqual(result.saved, saved);
  assert.equal(result.workspace.activeSceneId, 'bedroom');
  assert.deepEqual(result.workspace.scenes.window.products, {});
});

test('starts with defaults when current storage contains corrupt JSON without deleting any layouts', () => {
  const result = startStudio([
    [currentKey, '{invalid current layout'],
    [previousKey, JSON.stringify({ deskColor: 'walnut' })],
    [legacyKey, JSON.stringify({ deskColor: 'white' })],
  ]);

  assert.deepEqual(result.reads, [currentKey]);
  assert.equal(result.saved, null);
  assert.equal(result.workspace.activeSceneId, 'bedroom');
  assert.equal(result.workspace.scenes.bedroom.deskColor, 'oak');
});

test('starts with defaults when the browser blocks storage reads', () => {
  const result = startStudio([[currentKey, 'saved data must survive']], { blockedStorage: true });

  assert.deepEqual(result.reads, [currentKey]);
  assert.equal(result.saved, null);
  assert.equal(result.workspace.activeSceneId, 'bedroom');
  assert.ok(result.workspace.scenes.bedroom.present.includes('desk'));
});
