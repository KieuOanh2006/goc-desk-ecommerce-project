(function (root) {
  'use strict';

  const presets = root.GocDeskStudioPresets || {};
  const VERSION = 2;
  const ROOM = presets.ROOM || { minX: -3.8, maxX: 3.8, minZ: -2.35, maxZ: 2.35 };
  const DESK = { minX: -1.175, maxX: 1.175, minZ: -0.43, maxZ: 0.43 };
  const FURNITURE_SIZE = presets.FURNITURE || {
    desk: { width: 2.35, depth: 0.86, height: 0.82 },
    cabinet: { width: 1.18, depth: 0.52, height: 1.92 },
  };
  const SCENES = (presets.scenes || [{ id: 'bedroom', furniture: {} }]);
  const DEFAULT_LAYOUT = {
    version: 1,
    deskColor: 'oak',
    furniture: {
      desk: { x: 0.35, z: 0.06, rotation: 0 },
      cabinet: { x: -2.12, z: -0.35, rotation: 0 },
    },
    products: {},
  };
  const FURNITURE_KEYS = Object.keys(FURNITURE_SIZE);
  const COLOR_KEYS = ['oak', 'walnut', 'white'];

  function isRecord(value) {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function normalizeRotation(value) {
    const quarterTurn = Math.PI / 2;
    const turns = Math.round((Number.isFinite(value) ? value : 0) / quarterTurn) % 4;
    return ((turns + 4) % 4) * quarterTurn;
  }

  function rotatedSize(size, rotation) {
    const turns = Math.abs(Math.round((rotation || 0) / (Math.PI / 2))) % 2;
    return turns ? { width: size.depth, depth: size.width } : { width: size.width, depth: size.depth };
  }

  function footprintRect(center, size, rotation) {
    const dimensions = rotatedSize(size, rotation || 0);
    return {
      minX: center.x - dimensions.width / 2,
      maxX: center.x + dimensions.width / 2,
      minZ: center.z - dimensions.depth / 2,
      maxZ: center.z + dimensions.depth / 2,
      width: dimensions.width,
      depth: dimensions.depth,
    };
  }

  function isInside(rect, bounds, gap) {
    const margin = gap || 0;
    return rect.minX >= bounds.minX + margin && rect.maxX <= bounds.maxX - margin
      && rect.minZ >= bounds.minZ + margin && rect.maxZ <= bounds.maxZ - margin;
  }

  function overlaps(first, second, gap) {
    const spacing = gap === undefined ? 0.025 : gap;
    return first.minX < second.maxX + spacing && first.maxX > second.minX - spacing
      && first.minZ < second.maxZ + spacing && first.maxZ > second.minZ - spacing;
  }

  function furnitureRect(key, transform) {
    return footprintRect({ x: transform.x, z: transform.z }, FURNITURE_SIZE[key], transform.rotation);
  }

  function isSupportedByPad(candidate, pad) {
    if (!pad || pad.category !== 'pad' || !['keyboard', 'mouse'].includes(candidate.category)) return false;
    const support = footprintRect({ x: pad.x, z: pad.z }, pad.size, pad.rotation || 0);
    const placed = footprintRect({ x: candidate.x, z: candidate.z }, candidate.size, candidate.rotation || 0);
    return placed.minX >= support.minX + 0.01 && placed.maxX <= support.maxX - 0.01
      && placed.minZ >= support.minZ + 0.01 && placed.maxZ <= support.maxZ - 0.01;
  }

  function defaultsFor(scene) {
    const furniture = {};
    for (const key of FURNITURE_KEYS) furniture[key] = Object.assign({}, scene.furniture[key]);
    return {
      version: VERSION,
      deskColor: 'oak',
      cabinetColor: 'oak',
      present: FURNITURE_KEYS.slice(),
      furniture,
      products: {},
    };
  }

  function canPlaceFurniture(key, transform, options) {
    const optionsSafe = options || {};
    const rect = furnitureRect(key, transform);
    if (!isInside(rect, ROOM, 0.005)) return false;
    const scene = SCENES.find((candidate) => candidate.id === optionsSafe.sceneId);
    const doorway = scene && scene.balcony && { minX: 0.72, maxX: 2.0, minZ: ROOM.minZ, maxZ: -1.36 };
    if (doorway && key !== 'rug' && overlaps(rect, doorway, 0)) return false;
    if (key !== 'rug') {
      for (const otherKey of optionsSafe.present || []) {
        if (otherKey === key || otherKey === 'rug') continue;
        const other = optionsSafe.furniture && optionsSafe.furniture[otherKey];
        if (other && overlaps(rect, furnitureRect(otherKey, other))) return false;
      }
    }
    if (key !== 'rug') {
      for (const item of optionsSafe.floorItems || []) {
        if (overlaps(rect, footprintRect(item, item.size, item.rotation || 0))) return false;
      }
    }
    return true;
  }

  function nearestFurniturePosition(key, transform, options) {
    if (canPlaceFurniture(key, transform, options)) return { x: transform.x, z: transform.z };
    const size = rotatedSize(FURNITURE_SIZE[key], transform.rotation);
    const minX = ROOM.minX + size.width / 2;
    const maxX = ROOM.maxX - size.width / 2;
    const minZ = ROOM.minZ + size.depth / 2;
    const maxZ = ROOM.maxZ - size.depth / 2;
    const step = options && options.step || 0.1;
    const points = [];
    for (let x = minX; x <= maxX + 0.0001; x += step) {
      for (let z = minZ; z <= maxZ + 0.0001; z += step) {
        points.push({ x, z, distance: (x - transform.x) ** 2 + (z - transform.z) ** 2 });
      }
    }
    points.sort((a, b) => a.distance - b.distance);
    for (const point of points) {
      if (canPlaceFurniture(key, Object.assign({}, transform, point), options)) return { x: point.x, z: point.z };
    }
    return null;
  }

  function canPlaceProduct(candidate, options) {
    if (!options || !options.surface || (options.surface === 'desk' && options.deskPresent === false)) return false;
    const bounds = options.surface === 'desk' ? DESK : ROOM;
    const rect = footprintRect(candidate, candidate.size, candidate.rotation || 0);
    if (!isInside(rect, bounds, 0.005)) return false;
    for (const obstacle of options.obstacles || []) {
      if (obstacle.key === candidate.key || obstacle.surface !== options.surface) continue;
      if (!overlaps(rect, footprintRect(obstacle, obstacle.size, obstacle.rotation || 0))) continue;
      if (options.surface === 'desk' && (isSupportedByPad(candidate, obstacle) || isSupportedByPad(obstacle, candidate))) continue;
      return false;
    }
    if (options.surface === 'floor') {
      for (const key of options.present || FURNITURE_KEYS) {
        if (key === 'rug') continue;
        const transform = options.furniture && options.furniture[key];
        if (transform && overlaps(rect, furnitureRect(key, transform))) return false;
      }
      const doorway = options.balcony && { minX: 0.72, maxX: 2.0, minZ: ROOM.minZ, maxZ: -1.36 };
      if (doorway && overlaps(rect, doorway, 0)) return false;
    }
    return true;
  }

  function nearestProductPosition(candidate, options) {
    if (canPlaceProduct(candidate, options)) return { x: candidate.x, z: candidate.z };
    const bounds = options.surface === 'desk' ? DESK : ROOM;
    const size = rotatedSize(candidate.size, candidate.rotation || 0);
    const minX = bounds.minX + size.width / 2;
    const maxX = bounds.maxX - size.width / 2;
    const minZ = bounds.minZ + size.depth / 2;
    const maxZ = bounds.maxZ - size.depth / 2;
    if (minX > maxX || minZ > maxZ) return null;
    const step = options.step || 0.12;
    const points = [];
    for (let x = minX; x <= maxX + 0.0001; x += step) {
      for (let z = minZ; z <= maxZ + 0.0001; z += step) {
        points.push({ x, z, distance: (x - candidate.x) ** 2 + (z - candidate.z) ** 2 });
      }
    }
    points.sort((a, b) => a.distance - b.distance);
    for (const point of points) {
      if (canPlaceProduct(Object.assign({}, candidate, point), options)) return { x: point.x, z: point.z };
    }
    return null;
  }

  function defaultSceneLayout(sceneId) {
    const scene = SCENES.find((item) => item.id === sceneId) || SCENES[0];
    return defaultsFor(scene);
  }

  function normalizeSceneLayout(value, sceneId, knownProductKeys) {
    const scene = SCENES.find((item) => item.id === sceneId) || SCENES[0];
    const saved = isRecord(value) ? value : {};
    const defaults = defaultsFor(scene);
    const allowed = knownProductKeys ? new Set(knownProductKeys) : null;
    const present = Array.isArray(saved.present)
      ? Array.from(new Set(saved.present.filter((key) => FURNITURE_KEYS.includes(key))))
      : defaults.present.slice();
    const furniture = {};
    for (const key of FURNITURE_KEYS) {
      const source = saved.furniture && saved.furniture[key];
      const fallback = defaults.furniture[key];
      const rotation = normalizeRotation(source && source.rotation);
      const size = rotatedSize(FURNITURE_SIZE[key], rotation);
      const candidate = {
        x: clamp(source && Number.isFinite(source.x) ? source.x : fallback.x, ROOM.minX + size.width / 2, ROOM.maxX - size.width / 2),
        z: clamp(source && Number.isFinite(source.z) ? source.z : fallback.z, ROOM.minZ + size.depth / 2, ROOM.maxZ - size.depth / 2),
        rotation,
      };
      furniture[key] = candidate;
    }
    const products = {};
    const sourceProducts = isRecord(saved.products) ? saved.products : {};
    for (const [key, source] of Object.entries(sourceProducts)) {
      if ((allowed && !allowed.has(key)) || !isRecord(source) || !Number.isFinite(source.x) || !Number.isFinite(source.z)) continue;
      if (Math.abs(source.x) > 5 || Math.abs(source.z) > 5) continue;
      products[key] = {
        x: source.x,
        z: source.z,
        surface: source.surface === 'floor' ? 'floor' : 'desk',
        rotation: normalizeRotation(source.rotation),
      };
    }
    return {
      version: VERSION,
      deskColor: COLOR_KEYS.includes(saved.deskColor) ? saved.deskColor : 'oak',
      cabinetColor: COLOR_KEYS.includes(saved.cabinetColor) ? saved.cabinetColor : 'oak',
      present,
      furniture,
      products,
    };
  }

  function normalizeWorkspace(value, knownProductKeys) {
    const saved = isRecord(value) ? value : {};
    const scenes = {};
    if (saved.version === VERSION && isRecord(saved.scenes)) {
      for (const scene of SCENES) scenes[scene.id] = normalizeSceneLayout(saved.scenes[scene.id], scene.id, knownProductKeys);
    } else {
      const legacy = saved.version === 1 || isRecord(saved.furniture) ? saved : {};
      const bedroom = Object.assign({}, defaultSceneLayout('bedroom'), {
        deskColor: legacy.deskColor,
        furniture: Object.assign({}, defaultSceneLayout('bedroom').furniture, legacy.furniture || {}),
        products: legacy.products || (isRecord(legacy.furniture) ? {} : legacy),
      });
      scenes.bedroom = normalizeSceneLayout(bedroom, 'bedroom', knownProductKeys);
      for (const scene of SCENES) if (scene.id !== 'bedroom') scenes[scene.id] = defaultSceneLayout(scene.id);
    }
    const activeSceneId = scenes[saved.activeSceneId] ? saved.activeSceneId : SCENES[0].id;
    return { version: VERSION, activeSceneId, scenes };
  }

  // Compatibility helper used by the existing v1 unit tests and callers.
  function normalizeLayout(value, knownProductKeys) {
    const saved = isRecord(value) ? value : {};
    const allowed = knownProductKeys ? new Set(knownProductKeys) : null;
    const products = {};
    const sourceProducts = isRecord(saved.products) ? saved.products : (isRecord(saved.furniture) ? {} : saved);
    for (const [key, item] of Object.entries(sourceProducts)) {
      if (allowed && !allowed.has(key)) continue;
      if (!isRecord(item) || !Number.isFinite(item.x) || !Number.isFinite(item.z)) continue;
      if (Math.abs(item.x) > 5 || Math.abs(item.z) > 5) continue;
      products[key] = { x: item.x, z: item.z, surface: item.surface === 'floor' ? 'floor' : 'desk' };
    }
    const furniture = {};
    for (const key of ['desk', 'cabinet']) {
      const source = isRecord(saved.furniture) ? saved.furniture[key] : null;
      const fallback = DEFAULT_LAYOUT.furniture[key];
      const rotation = normalizeRotation(source && source.rotation);
      const size = rotatedSize(FURNITURE_SIZE[key], rotation);
      furniture[key] = {
        x: clamp(source && Number.isFinite(source.x) ? source.x : fallback.x, ROOM.minX + size.width / 2, ROOM.maxX - size.width / 2),
        z: clamp(source && Number.isFinite(source.z) ? source.z : fallback.z, ROOM.minZ + size.depth / 2, ROOM.maxZ - size.depth / 2),
        rotation,
      };
    }
    return {
      version: 1,
      deskColor: COLOR_KEYS.includes(saved.deskColor) ? saved.deskColor : 'oak',
      furniture,
      products,
    };
  }

  const api = {
    VERSION, DEFAULT_LAYOUT, ROOM, DESK, FURNITURE_SIZE, FURNITURE_KEYS,
    clamp, normalizeRotation, rotatedSize, footprintRect, isInside, overlaps, isSupportedByPad,
    furnitureRect, canPlaceFurniture, nearestFurniturePosition, canPlaceProduct, nearestProductPosition,
    defaultSceneLayout, normalizeSceneLayout, normalizeWorkspace, normalizeLayout,
  };
  root.GocDeskStudioStateV1 = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(globalThis);
