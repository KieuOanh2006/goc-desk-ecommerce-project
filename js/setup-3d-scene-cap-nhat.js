(function (root, catalog, studioState) {
  'use strict';

  const canvas = document.getElementById('studio-canvas');
  const canvasWrap = document.getElementById('studio-canvas-wrap');
  const loading = document.getElementById('studio-canvas-loading');
  const fallback = document.getElementById('studio-canvas-fallback');
  const status = document.getElementById('studio-status');
  const inventory = document.getElementById('studio-inventory-list');
  const furnitureLibrary = document.getElementById('studio-furniture-library-list');
  const cartCount = document.getElementById('studio-cart-count');
  const storageKey = 'goc-desk:studio-layout:cap-nhat:v2';
  const previousStorageKey = 'goc-desk:studio-layout:cap-nhat:v1';
  const legacyStorageKey = 'goc-desk:studio-layout:v1';
  const deskTop = 0.82;
  const deskColors = { oak: '#bc9167', walnut: '#68452f', white: '#e8e5de' };
  const cabinetColors = { oak: '#b18b67', walnut: '#684a35', white: '#dfd9cf' };
  const presets = root.GocDeskStudioPresets;
  const cart = root.GocDeskCart;
  const productsById = new Map((catalog && catalog.products || []).map((product) => [product.id, product]));
  const knownProductKeys = [];
  for (const product of productsById.values()) {
    for (const color of product.colors || []) knownProductKeys.push(product.id + ':' + color.id);
  }

  const params = new URLSearchParams(root.location.search);
  const previewProduct = productsById.get(params.get('product')) || null;
  const previewColor = previewProduct
    ? previewProduct.colors.find((color) => color.id === params.get('color')) || previewProduct.colors[0]
    : null;

  let workspace = loadWorkspace();
  let currentSceneId = workspace.activeSceneId;
  let layout = workspace.scenes[currentSceneId];
  let renderer = null;
  let scene = null;
  let camera = null;
  let raycaster = null;
  let placementPlane = null;
  let floorPlane = null;
  let deskGroup = null;
  let cabinetGroup = null;
  let deskMaterial = null;
  let cabinetMaterials = [];
  const furnitureGroups = new Map();
  const wallGroups = new Map();
  let roomRoot = null;
  let geometryCache = new Map();
  let inventoryItems = new Map();
  let sceneItems = new Map();
  let cardNodes = new Map();
  let selectedItemKey = null;
  let selectedFurnitureKey = 'desk';
  let hoveredItemKey = null;
  let hoveredFurnitureKey = null;
  let selectionHelper = null;
  let hoverHelper = null;
  let furnitureLibrarySignature = '';
  let currentMode = 'view';
  let interactionEnabled = false;
  let ready = false;
  let scriptLoading = false;
  let scriptElement = null;
  let renderScheduled = false;
  let resizeObserver = null;
  let cartUnsubscribe = function () {};
  let storageWarning = '';
  let migratedLegacyLayout = false;
  let pendingConfirmAction = null;
  let pendingConfirmPayload = null;
  let confirmReturnFocus = null;
  const activePointers = new Map();
  let gesture = { kind: 'idle' };
  let orbit = { theta: 0.68, phi: 1.08, radius: 8 };
  let target = null;
  let cameraPreset = 'room';

  function loadWorkspace() {
    try {
      const current = root.localStorage.getItem(storageKey);
      if (current !== null) return studioState.normalizeWorkspace(JSON.parse(current), knownProductKeys);
      const previous = root.localStorage.getItem(previousStorageKey);
      if (previous !== null) {
        migratedLegacyLayout = true;
        return studioState.normalizeWorkspace(JSON.parse(previous), knownProductKeys);
      }
      const legacy = root.localStorage.getItem(legacyStorageKey);
      if (legacy !== null) {
        migratedLegacyLayout = true;
        return studioState.normalizeWorkspace(JSON.parse(legacy), knownProductKeys);
      }
    } catch (error) {
      storageWarning = 'Không đọc được bố cục đã lưu. Các thay đổi mới chỉ giữ trong phiên hiện tại.';
    }
    return studioState.normalizeWorkspace(null, knownProductKeys);
  }

  function saveWorkspace() {
    workspace.activeSceneId = currentSceneId;
    workspace.scenes[currentSceneId] = layout;
    try {
      root.localStorage.setItem(storageKey, JSON.stringify(workspace));
      if (storageWarning && storageWarning.indexOf('Không đọc được') === 0) storageWarning = '';
      return true;
    } catch (_) {
      storageWarning = 'Bố cục chỉ còn trong bộ nhớ phiên này vì trình duyệt không cho phép lưu.';
      setStatus(storageWarning, 'error');
      return false;
    }
  }

  function setStatus(message, state) {
    const fullMessage = storageWarning && state !== 'error' ? message + ' ' + storageWarning : message;
    status.textContent = fullMessage;
    status.dataset.state = state || 'info';
  }

  function setControlsReady(value) {
    ready = value;
    document.querySelectorAll('.studio-workspace button:not(#studio-retry), .studio-workspace select').forEach((control) => {
      control.disabled = !value;
    });
    const retry = document.getElementById('studio-retry');
    if (retry) retry.disabled = false;
    canvas.tabIndex = value ? 0 : -1;
    if (!value) {
      interactionEnabled = false;
      canvasWrap.classList.remove('studio-interactive');
      document.getElementById('studio-interaction-toggle').setAttribute('aria-pressed', 'false');
      document.getElementById('studio-interaction-toggle').textContent = 'Tương tác 3D: tắt';
    }
    renderInventory();
    updateModeUi();
  }

  function createGeometry(key, factory) {
    if (!geometryCache.has(key)) geometryCache.set(key, factory());
    return geometryCache.get(key);
  }

  function makeMaterial(color, options) {
    return new root.THREE.MeshStandardMaterial(Object.assign({
      color: color,
      roughness: 0.72,
      metalness: 0.04,
    }, options || {}));
  }

  function addBox(parent, size, position, material, rotation) {
    const key = 'box:' + size.join(':');
    const mesh = new root.THREE.Mesh(
      createGeometry(key, () => new root.THREE.BoxGeometry(size[0], size[1], size[2])),
      material,
    );
    mesh.position.set(position[0], position[1], position[2]);
    if (rotation) mesh.rotation.set(rotation[0], rotation[1], rotation[2]);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  function addCylinder(parent, radiusTop, radiusBottom, height, position, material, rotation) {
    const key = 'cylinder:' + [radiusTop, radiusBottom, height, 24].join(':');
    const mesh = new root.THREE.Mesh(
      createGeometry(key, () => new root.THREE.CylinderGeometry(radiusTop, radiusBottom, height, 24)),
      material,
    );
    mesh.position.set(position[0], position[1], position[2]);
    if (rotation) mesh.rotation.set(rotation[0], rotation[1], rotation[2]);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  function addBeam(parent, from, to, radius, material) {
    const start = new root.THREE.Vector3(from[0], from[1], from[2]);
    const end = new root.THREE.Vector3(to[0], to[1], to[2]);
    const direction = new root.THREE.Vector3().subVectors(end, start);
    const length = direction.length();
    const key = 'beam:' + radius + ':' + length.toFixed(4);
    const beam = new root.THREE.Mesh(
      createGeometry(key, () => new root.THREE.CylinderGeometry(radius, radius, length, 16)),
      material,
    );
    beam.position.copy(start).add(end).multiplyScalar(0.5);
    beam.quaternion.setFromUnitVectors(new root.THREE.Vector3(0, 1, 0), direction.normalize());
    beam.castShadow = true;
    parent.add(beam);
    return beam;
  }

  function addRoomWall(key, center, rotation, openings) {
    const dims = studioState.ROOM;
    const width = Math.abs(rotation) > 0.5 ? dims.maxZ - dims.minZ : dims.maxX - dims.minX;
    const height = 3.5;
    const depth = 0.09;
    const group = new root.THREE.Group();
    group.position.set(center.x, 0, center.z);
    group.rotation.y = rotation;
    const plaster = makeMaterial('#e9e2d9', { roughness: 0.92 });
    const holes = (Array.isArray(openings) ? openings : (openings ? [openings] : []))
      .filter((opening) => opening && opening.x - opening.width / 2 > -width / 2 && opening.x + opening.width / 2 < width / 2);
    if (!holes.length) {
      addBox(group, [width, height, depth], [0, height / 2, 0], plaster);
    } else {
      const edges = Array.from(new Set([-width / 2, width / 2].concat(holes.flatMap((opening) => [opening.x - opening.width / 2, opening.x + opening.width / 2])))).sort((a, b) => a - b);
      for (let index = 0; index < edges.length - 1; index += 1) {
        const start = edges[index];
        const end = edges[index + 1];
        const centerX = (start + end) / 2;
        const opening = holes.find((candidate) => centerX > candidate.x - candidate.width / 2 && centerX < candidate.x + candidate.width / 2);
        if (!opening) {
          addBox(group, [end - start, height, depth], [centerX, height / 2, 0], plaster);
          continue;
        }
        const bottomEdge = Math.max(0, opening.y - opening.height / 2);
        const topEdge = Math.min(height, opening.y + opening.height / 2);
        if (bottomEdge > 0.015) addBox(group, [end - start, bottomEdge, depth], [centerX, bottomEdge / 2, 0], plaster);
        if (topEdge < height) addBox(group, [end - start, height - topEdge, depth], [centerX, (height + topEdge) / 2, 0], plaster);
      }
      holes.forEach((opening) => {
        const leftEdge = opening.x - opening.width / 2;
        const rightEdge = opening.x + opening.width / 2;
        const bottomEdge = opening.y - opening.height / 2;
        const topEdge = opening.y + opening.height / 2;
      const frame = makeMaterial('#f5f0e8', { roughness: 0.55 });
      const glass = makeMaterial('#b8cfce', { color: '#b8cfce', roughness: 0.18, metalness: 0.08, transparent: true, opacity: 0.42, depthWrite: false });
      addBox(group, [opening.width - 0.08, opening.height - 0.08, 0.018], [opening.x, opening.y, 0.055], glass);
      const frameW = 0.055;
      addBox(group, [frameW, opening.height, 0.08], [leftEdge + frameW / 2, opening.y, 0], frame);
      addBox(group, [frameW, opening.height, 0.08], [rightEdge - frameW / 2, opening.y, 0], frame);
      addBox(group, [opening.width, frameW, 0.08], [opening.x, bottomEdge + frameW / 2, 0], frame);
      addBox(group, [opening.width, frameW, 0.08], [opening.x, topEdge - frameW / 2, 0], frame);
      if (opening.height < 1.7) {
        addBox(group, [0.035, opening.height - 0.1, 0.08], [opening.x, opening.y, 0], frame);
        addBox(group, [opening.width - 0.1, 0.035, 0.08], [opening.x, opening.y, 0], frame);
      }
      });
    }
    group.traverse((object) => { if (object.isMesh) object.userData.roomWall = true; });
    (roomRoot || scene).add(group);
    wallGroups.set(key, group);
    return group;
  }

  function createRoom() {
    if (roomRoot) {
      scene.remove(roomRoot);
      roomRoot.traverse((object) => {
        if (!object.isMesh) return;
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((material) => material.dispose());
      });
    }
    roomRoot = new root.THREE.Group();
    scene.add(roomRoot);
    wallGroups.clear();
    const floor = new root.THREE.Mesh(
      createGeometry('room-floor', () => new root.THREE.PlaneGeometry(7.6, 4.7)),
      makeMaterial('#cbbda9', { roughness: 0.95 }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.025;
    floor.receiveShadow = true;
    roomRoot.add(floor);

    const currentScene = presets.sceneById[currentSceneId];
    const windowOpening = currentScene.backWindow ? { x: -0.78, y: 2.02, width: 1.45, height: 1.28 } : null;
    const doorOpening = currentScene.balcony ? { x: 1.43, y: 1.08, width: 1.2, height: 2.16 } : null;
    const backOpenings = [];
    if (currentScene.backWindow) backOpenings.push(doorOpening ? { x: -0.65, y: 2.02, width: 1.4, height: 1.28 } : windowOpening);
    if (doorOpening) backOpenings.push(doorOpening);
    addRoomWall('back', { x: 0, z: -2.35 }, 0, backOpenings);
    addRoomWall('front', { x: 0, z: 2.35 }, 0, null);
    addRoomWall('left', { x: -3.8, z: 0 }, Math.PI / 2, null);
    addRoomWall('right', { x: 3.8, z: 0 }, Math.PI / 2, null);

    if (currentScene.balcony) {
      const balconyFloor = new root.THREE.Mesh(
        createGeometry('balcony-floor', () => new root.THREE.BoxGeometry(2.4, 0.08, 1.7)),
        makeMaterial('#bda98e'),
      );
      balconyFloor.position.set(1.43, -0.08, -3.16);
      balconyFloor.receiveShadow = true;
      roomRoot.add(balconyFloor);
      const railing = new root.THREE.Group();
      const metal = makeMaterial('#8f9690', { metalness: 0.42, roughness: 0.4 });
      addBox(railing, [2.4, 0.06, 0.06], [0, 0.72, 0], metal);
      [-1.12, -0.56, 0, 0.56, 1.12].forEach((x) => addBox(railing, [0.035, 0.72, 0.035], [x, 0.36, 0], metal));
      railing.position.set(1.43, 0, -3.88);
      roomRoot.add(railing);
      const planter = new root.THREE.Group();
      addBox(planter, [0.54, 0.32, 0.38], [0, 0.16, 0], makeMaterial('#8c7057'));
      [-0.12, 0.08, 0.18].forEach((x) => addCylinder(planter, 0.11, 0.15, 0.42, [x, 0.5 + Math.abs(x), 0], makeMaterial('#66805d')));
      planter.position.set(2.25, 0, -3.18);
      roomRoot.add(planter);
    }
  }

  function createFurnitureModel(key) {
    const group = new root.THREE.Group();
    const woodHex = cabinetColors[layout.cabinetColor];
    if (key === 'desk') {
      deskMaterial = makeMaterial(deskColors[layout.deskColor]);
      addBox(group, [2.35, 0.07, 0.86], [0, 0.78, 0], deskMaterial);
      const legs = makeMaterial('#493d33');
      [-1.01, 1.01].forEach((x) => [-0.31, 0.31].forEach((z) => addBox(group, [0.07, 0.75, 0.07], [x, 0.39, z], legs)));
      addBox(group, [2.16, 0.045, 0.06], [0, 0.48, -0.28], legs);
    } else if (key === 'cabinet') {
      const wood = makeMaterial(woodHex);
      const shelf = makeMaterial(cabinetColors[layout.cabinetColor]);
      cabinetMaterials = [wood, shelf];
      group.userData.colorMaterials = cabinetMaterials;
      addBox(group, [0.06, 1.9, 0.52], [-0.56, 0.96, 0], wood);
      addBox(group, [0.06, 1.9, 0.52], [0.56, 0.96, 0], wood);
      addBox(group, [1.18, 0.06, 0.52], [0, 0.03, 0], wood);
      addBox(group, [1.18, 0.06, 0.52], [0, 1.89, 0], wood);
      addBox(group, [1.1, 1.82, 0.035], [0, 0.96, -0.235], makeMaterial('#d0b99d'));
      [0.58, 1.02, 1.46].forEach((height) => addBox(group, [1.12, 0.045, 0.5], [0, height, 0.015], shelf));
    } else if (key === 'bed') {
      addBox(group, [1.58, 0.18, 1.95], [0, 0.17, 0], makeMaterial('#936f50'));
      addBox(group, [1.57, 0.24, 1.9], [0, 0.37, 0.02], makeMaterial('#eee8de', { roughness: 0.98 }));
      addBox(group, [1.59, 0.62, 0.08], [0, 0.4, -0.99], makeMaterial('#a98461'));
      [-0.43, 0.43].forEach((x) => addBox(group, [0.55, 0.1, 0.32], [x, 0.54, -0.67], makeMaterial('#faf7f1')));
      addBox(group, [1.56, 0.055, 0.74], [0, 0.52, 0.44], makeMaterial('#b8a389', { roughness: 0.94 }));
      [-0.62, 0.62].forEach((x) => [-0.8, 0.8].forEach((z) => addBox(group, [0.09, 0.16, 0.09], [x, 0.08, z], makeMaterial('#684b35'))));
    } else if (key === 'chair') {
      const wood = makeMaterial('#76583e');
      addBox(group, [0.56, 0.1, 0.53], [0, 0.46, 0.04], makeMaterial('#b3987d'));
      addBox(group, [0.56, 0.52, 0.08], [0, 0.77, -0.22], makeMaterial('#76583e'));
      [-0.22, 0.22].forEach((x) => [-0.18, 0.22].forEach((z) => addBox(group, [0.045, 0.44, 0.045], [x, 0.22, z], wood)));
    } else if (key === 'rug') {
      const rug = makeMaterial('#c8b8a2', { roughness: 1 });
      addBox(group, [2.5, 0.025, 1.8], [0, 0.01, 0], rug);
      addBox(group, [2.3, 0.004, 0.025], [0, 0.027, -0.72], makeMaterial('#a28b70'));
      addBox(group, [2.3, 0.004, 0.025], [0, 0.027, 0.72], makeMaterial('#a28b70'));
    } else if (key === 'plant') {
      addCylinder(group, 0.18, 0.23, 0.34, [0, 0.17, 0], makeMaterial('#b18768'));
      addCylinder(group, 0.13, 0.13, 0.04, [0, 0.35, 0], makeMaterial('#503c2e'));
      addCylinder(group, 0.035, 0.045, 0.48, [0, 0.6, 0], makeMaterial('#617650'));
      [-1, -0.4, 0.35, 0.9].forEach((angle, index) => {
        const leaf = new root.THREE.Mesh(createGeometry('plant-leaf', () => new root.THREE.SphereGeometry(0.17, 12, 9)), makeMaterial(index % 2 ? '#7c916d' : '#607c58'));
        leaf.scale.set(0.55, 0.28, 1.2);
        leaf.position.set(Math.sin(angle) * 0.17, 0.67 + index * 0.08, Math.cos(angle) * 0.16);
        leaf.rotation.y = angle;
        leaf.castShadow = true;
        group.add(leaf);
      });
    }
    group.traverse((object) => { if (object.isMesh) object.userData.furnitureKey = key; });
    return group;
  }

  function syncFurnitureScene() {
    const present = new Set(layout.present);
    for (const [key, group] of Array.from(furnitureGroups.entries())) {
      if (present.has(key)) continue;
      if (key === 'cabinet') {
        for (const item of sceneItems.values()) {
          if (item.group.parent === group) group.remove(item.group);
        }
      }
      disposeGroup(group);
      furnitureGroups.delete(key);
    }
    for (const key of studioState.FURNITURE_KEYS) {
      if (!present.has(key)) continue;
      let group = furnitureGroups.get(key);
      if (!group) {
        group = createFurnitureModel(key);
        furnitureGroups.set(key, group);
        scene.add(group);
      }
      const transform = layout.furniture[key];
      group.position.set(transform.x, 0, transform.z);
      group.rotation.y = transform.rotation;
    }
    deskGroup = furnitureGroups.get('desk') || null;
    cabinetGroup = furnitureGroups.get('cabinet') || null;
    if (deskGroup) {
      deskMaterial = deskGroup.children[0].material;
      deskMaterial.color.set(deskColors[layout.deskColor]);
    }
    if (cabinetGroup) {
      cabinetMaterials = cabinetGroup.userData.colorMaterials;
      cabinetMaterials.forEach((material) => material.color.set(cabinetColors[layout.cabinetColor]));
    }
  }

  function createFurniture() {
    createRoom();
    syncFurnitureScene();
  }

  function productSize(product) {
    const sizes = {
      keyboard: { width: 0.43, depth: 0.145, height: 0.05 },
      mouse: { width: 0.096, depth: 0.136, height: 0.06 },
      lamp: { width: 0.58, depth: 0.21, height: 0.45 },
      stand: { width: 0.22, depth: 0.22, height: 0.23 },
      pad: { width: 0.52, depth: 0.31, height: 0.014 },
    };
    if (product.category !== 'organize') return sizes[product.category] || { width: 0.28, depth: 0.22, height: 0.14 };
    if (product.id === 'hs01') return { width: 0.18, depth: 0.18, height: 0.34 };
    if (product.id === 'cm02') return { width: 0.38, depth: 0.13, height: 0.08 };
    return { width: 0.66, depth: 0.25, height: 0.39 };
  }

  function createProductModel(product, color) {
    const group = new root.THREE.Group();
    const bodyColor = color.hex || '#8a7865';
    const body = makeMaterial(bodyColor);
    const dark = makeMaterial('#383838', { roughness: 0.48 });
    const metal = makeMaterial('#a9a9a2', { metalness: 0.68, roughness: 0.32 });
    const soft = makeMaterial(bodyColor, { roughness: 0.94 });

    if (product.category === 'keyboard') {
      addBox(group, [0.43, 0.026, 0.145], [0, 0.016, 0], dark);
      const keyMaterial = makeMaterial(color.hex || '#dad5ca', { roughness: 0.5 });
      for (let row = 0; row < 5; row += 1) {
        const keyCount = row === 4 ? 8 : 15;
        for (let col = 0; col < keyCount; col += 1) {
          const x = keyCount === 8 ? (col - 3.5) * 0.047 : (col - 7) * 0.027;
          addBox(group, [keyCount === 8 ? 0.04 : 0.023, 0.008, 0.021], [x, 0.034, (row - 2) * 0.025], keyMaterial);
        }
      }
    } else if (product.category === 'mouse') {
      const shell = new root.THREE.Mesh(
        createGeometry('mouse-shell', () => new root.THREE.SphereGeometry(1, 28, 20)),
        body,
      );
      shell.scale.set(0.048, 0.027, 0.068);
      shell.position.y = 0.028;
      shell.castShadow = true;
      group.add(shell);
      addBox(group, [0.006, 0.014, 0.025], [0, 0.053, -0.018], dark);
      addBox(group, [0.002, 0.004, 0.014], [0, 0.056, -0.017], metal);
    } else if (product.category === 'lamp') {
      addCylinder(group, 0.083, 0.092, 0.025, [0, 0.013, 0], body);
      addCylinder(group, 0.025, 0.025, 0.045, [0, 0.045, 0], metal);
      addBeam(group, [0, 0.06, 0], [0.11, 0.3, 0], 0.012, metal);
      addBeam(group, [0.11, 0.3, 0], [0.23, 0.38, 0], 0.011, metal);
      addCylinder(group, 0.065, 0.105, 0.08, [0.23, 0.405, 0], body, [0, 0, -0.48]);
      addCylinder(group, 0.057, 0.057, 0.006, [0.264, 0.372, 0], makeMaterial('#f5e5bb', { emissive: '#d8b975', emissiveIntensity: 0.2 }));
    } else if (product.category === 'stand') {
      const side = makeMaterial(bodyColor, { metalness: 0.4, roughness: 0.38 });
      addBox(group, [0.2, 0.025, 0.2], [0, 0.013, 0], side);
      [-0.045, 0.045].forEach((x) => {
        addBox(group, [0.012, 0.2, 0.2], [x, 0.11, 0], side);
        addBox(group, [0.014, 0.015, 0.2], [x, 0.205, 0], metal);
      });
      addBox(group, [0.014, 0.018, 0.2], [0, 0.035, 0], metal);
    } else if (product.category === 'pad') {
      addBox(group, [0.52, 0.009, 0.31], [0, 0.005, 0], soft);
      addBox(group, [0.5, 0.002, 0.29], [0, 0.011, 0], makeMaterial(color.hex || '#867b70', { roughness: 1 }));
    } else if (product.category === 'organize' && product.id === 'hs01') {
      addCylinder(group, 0.085, 0.085, 0.025, [0, 0.013, 0], body);
      addCylinder(group, 0.018, 0.018, 0.27, [0, 0.16, 0], metal);
      const headband = new root.THREE.Mesh(
        createGeometry('headphone-headband', () => new root.THREE.TorusGeometry(0.075, 0.014, 10, 28, Math.PI)),
        body,
      );
      headband.position.set(0, 0.31, 0);
      headband.rotation.z = Math.PI;
      headband.castShadow = true;
      group.add(headband);
    } else if (product.category === 'organize' && product.id === 'cm02') {
      addBox(group, [0.38, 0.018, 0.13], [0, 0.018, 0], body);
      addBox(group, [0.38, 0.075, 0.012], [0, 0.055, -0.06], body);
      addBox(group, [0.012, 0.075, 0.13], [-0.184, 0.055, 0], body);
      addBox(group, [0.012, 0.075, 0.13], [0.184, 0.055, 0], body);
      [-0.1, 0, 0.1].forEach((x) => addBox(group, [0.055, 0.003, 0.012], [x, 0.029, 0.02], dark));
    } else if (product.category === 'organize') {
      addBox(group, [0.66, 0.045, 0.25], [0, 0.34, 0], body);
      [-0.25, 0.25].forEach((x) => addBox(group, [0.035, 0.32, 0.23], [x, 0.17, 0], metal));
    } else {
      addBox(group, [0.28, 0.12, 0.22], [0, 0.06, 0], body);
    }

    if (product.category === 'lamp') {
      group.children.forEach((object) => { object.position.x -= 0.05; });
    }

    const size = productSize(product);
    const proxy = new root.THREE.Mesh(
      createGeometry('pick:' + Math.max(size.width, 0.28) + ':' + Math.max(size.height, 0.24) + ':' + Math.max(size.depth, 0.26), () => new root.THREE.BoxGeometry(
        Math.max(size.width, 0.28), Math.max(size.height, 0.24), Math.max(size.depth, 0.26),
      )),
      new root.THREE.MeshBasicMaterial({ transparent: true, opacity: 0, colorWrite: false, depthWrite: false }),
    );
    proxy.position.y = Math.max(size.height, 0.24) / 2;
    proxy.userData.pickProxy = true;
    group.add(proxy);
    group.userData.footprint = { width: size.width, depth: size.depth };
    group.userData.productHeight = size.height;
    return group;
  }

  function disposeGroup(group) {
    const materials = new Set();
    group.traverse((object) => {
      if (!object.isMesh) return;
      const list = Array.isArray(object.material) ? object.material : [object.material];
      list.forEach((material) => materials.add(material));
    });
    if (group.parent) group.parent.remove(group);
    materials.forEach((material) => material.dispose());
  }

  function currentEntries() {
    const entries = cart ? cart.getItems().map((item) => ({
      key: item.key || item.id + ':' + item.color.id,
      product: item.product,
      color: item.color,
      quantity: item.quantity || 1,
      preview: false,
    })) : [];
    if (previewProduct && previewColor && !entries.some((entry) => entry.product.id === previewProduct.id && entry.color.id === previewColor.id)) {
      entries.unshift({
        key: previewProduct.id + ':' + previewColor.id,
        product: previewProduct,
        color: previewColor,
        quantity: 1,
        preview: true,
      });
    }
    return entries;
  }

  function shelfPosition(index) {
    const column = index % 2;
    const depthColumn = Math.floor(index / 2) % 2;
    const shelfIndex = Math.min(2, Math.floor(index / 4));
    const heights = [0.61, 1.05, 1.49];
    return {
      x: column === 0 ? -0.28 : 0.28,
      y: heights[shelfIndex],
      z: depthColumn === 0 ? 0.12 : -0.12,
    };
  }

  function localToWorld(position) {
    const point = new root.THREE.Vector3(position.x, 0, position.z);
    if (deskGroup) {
      point.applyAxisAngle(new root.THREE.Vector3(0, 1, 0), deskGroup.rotation.y);
      point.add(deskGroup.position);
    }
    return point;
  }

  function worldToDeskLocal(position) {
    if (!deskGroup) return new root.THREE.Vector3(position.x, 0, position.z);
    const point = new root.THREE.Vector3(position.x - deskGroup.position.x, 0, position.z - deskGroup.position.z);
    point.applyAxisAngle(new root.THREE.Vector3(0, 1, 0), -deskGroup.rotation.y);
    return point;
  }

  function getFurnitureTransforms() {
    const furniture = {};
    for (const key of layout.present) {
      const group = furnitureGroups.get(key);
      if (group) furniture[key] = { x: group.position.x, z: group.position.z, rotation: group.rotation.y };
    }
    return furniture;
  }

  function getPlacedObstacles(surface, exceptKey) {
    const obstacles = [];
    for (const [key, item] of sceneItems) {
      if (!item.placed || item.surface !== surface || key === exceptKey) continue;
      obstacles.push({
        key,
        category: item.entry.product.category,
        surface: item.surface,
        x: item.localPosition.x,
        z: item.localPosition.z,
        rotation: item.rotation || 0,
        size: item.size,
      });
    }
    return obstacles;
  }

  function getFloorItems(exceptKey) {
    return Array.from(sceneItems.entries()).filter(([key, item]) => key !== exceptKey && item.placed && item.surface === 'floor').map(([key, item]) => ({
      key,
      x: item.localPosition.x,
      z: item.localPosition.z,
      rotation: item.rotation || 0,
      size: item.size,
    }));
  }

  function getPlacementOptions(surface, exceptKey) {
    return {
      surface,
      obstacles: getPlacedObstacles(surface, exceptKey),
      furniture: getFurnitureTransforms(),
      present: layout.present,
      deskPresent: layout.present.includes('desk'),
      balcony: currentSceneId === 'balcony',
      sceneId: currentSceneId,
    };
  }

  function setProductParent(item, parent) {
    parent.add(item.group);
  }

  function syncProductTransform(item) {
    if (!item.placed) {
      if (cabinetGroup) {
        item.group.visible = true;
        setProductParent(item, cabinetGroup);
        item.group.position.set(item.shelfPosition.x, item.shelfPosition.y, item.shelfPosition.z);
      } else {
        setProductParent(item, scene);
        item.group.position.set(0, -2, 0);
        item.group.visible = false;
      }
      item.group.rotation.set(0, 0, 0);
      item.group.scale.setScalar(0.66);
      return;
    }
    item.group.scale.setScalar(1);
    item.group.visible = true;
    if (item.surface === 'desk') {
      if (!deskGroup) {
        item.placed = false;
        return syncProductTransform(item);
      }
      setProductParent(item, scene);
      const world = localToWorld(item.localPosition);
      item.group.position.set(world.x, deskTop + item.lift, world.z);
      item.group.rotation.y = deskGroup.rotation.y + (item.rotation || 0);
      return;
    }
    setProductParent(item, scene);
    item.group.position.set(item.localPosition.x, 0.012 + item.lift, item.localPosition.z);
    item.group.rotation.y = item.rotation || 0;
  }

  function updateProductSupports() {
    const pads = Array.from(sceneItems.values()).filter((item) => item.placed && item.surface === 'desk' && item.entry.product.category === 'pad');
    for (const item of sceneItems.values()) {
      item.lift = 0;
      if (!item.placed || item.surface !== 'desk' || !['keyboard', 'mouse'].includes(item.entry.product.category)) continue;
      for (const pad of pads) {
        const candidate = {
          key: item.entry.key,
          category: item.entry.product.category,
          x: item.localPosition.x,
          z: item.localPosition.z,
          rotation: item.rotation || 0,
          size: item.size,
        };
        const support = {
          key: pad.entry.key,
          category: 'pad',
          x: pad.localPosition.x,
          z: pad.localPosition.z,
          rotation: pad.rotation || 0,
          size: pad.size,
        };
        if (studioState.isSupportedByPad(candidate, support)) {
          item.lift = 0.018;
          break;
        }
      }
    }
    for (const item of sceneItems.values()) if (item.placed) syncProductTransform(item);
  }

  function setItemPlacement(item, surface, desired, options) {
    const candidate = {
      key: item.entry.key,
      category: item.entry.product.category,
      x: desired.x,
      z: desired.z,
      size: item.size,
      rotation: item.rotation || 0,
    };
    const position = studioState.nearestProductPosition(candidate, getPlacementOptions(surface, item.entry.key));
    if (!position) return false;
    item.placed = true;
    item.surface = surface;
    item.localPosition = { x: position.x, z: position.z };
    item.rotation = candidate.rotation;
    item.lift = 0;
    if (options && options.select !== false) selectProduct(item.entry.key);
    updateProductSupports();
    return true;
  }

  function saveLayout() {
    const savedProducts = {};
    for (const [key, item] of sceneItems) {
      if (item.placed) {
        savedProducts[key] = {
          x: item.localPosition.x,
          z: item.localPosition.z,
          surface: item.surface,
          rotation: item.rotation || 0,
        };
      }
    }
    const currentTransforms = getFurnitureTransforms();
    layout = {
      version: studioState.VERSION,
      present: layout.present.slice(),
      deskColor: layout.deskColor,
      cabinetColor: layout.cabinetColor,
      furniture: Object.assign({}, layout.furniture, currentTransforms),
      products: savedProducts,
    };
    workspace.scenes[currentSceneId] = layout;
    return saveWorkspace();
  }

  function announceChange(message, state) {
    const saved = saveLayout();
    if (saved) setStatus(message + ' Đã lưu trên thiết bị.', state || 'success');
  }

  function updateHighlights() {
    const clear = (helper) => {
      if (!helper) return;
      scene.remove(helper);
      helper.geometry.dispose();
      helper.material.dispose();
    };
    clear(selectionHelper);
    clear(hoverHelper);
    selectionHelper = null;
    hoverHelper = null;
    const selected = currentMode === 'products'
      ? (selectedItemKey && sceneItems.get(selectedItemKey)?.group)
      : (currentMode === 'furniture' && selectedFurnitureKey ? furnitureGroups.get(selectedFurnitureKey) : null);
    const hoveredProduct = hoveredItemKey && sceneItems.get(hoveredItemKey)?.group;
    const hovered = hoveredProduct || (hoveredFurnitureKey && furnitureGroups.get(hoveredFurnitureKey));
    if (selected && scene) {
      selectionHelper = new root.THREE.BoxHelper(selected, 0x54734d);
      selectionHelper.material.depthTest = true;
      selectionHelper.renderOrder = 5;
      scene.add(selectionHelper);
    }
    if (hovered && hovered !== selected && scene) {
      hoverHelper = new root.THREE.BoxHelper(hovered, 0xb38355);
      hoverHelper.material.depthTest = true;
      hoverHelper.renderOrder = 5;
      scene.add(hoverHelper);
    }
    if (selectionHelper) selectionHelper.update();
    if (hoverHelper) hoverHelper.update();
  }

  function selectProduct(key) {
    selectedItemKey = key && sceneItems.has(key) ? key : null;
    if (key) currentMode = 'products';
    updateModeUi();
    updateHighlights();
    renderInventory();
    requestRender();
  }

  function selectFurniture(key) {
    if (!layout.present.includes(key) || !furnitureGroups.has(key)) return;
    selectedFurnitureKey = key;
    currentMode = 'furniture';
    updateModeUi();
    updateHighlights();
    requestRender();
  }

  function updateModeUi() {
    const sceneConfig = presets.sceneById[currentSceneId];
    const title = document.getElementById('studio-scene-title');
    if (title && sceneConfig) title.textContent = sceneConfig.name;
    document.querySelectorAll('[data-mode]').forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.mode === currentMode));
    });
    document.querySelectorAll('[data-camera]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.camera === cameraPreset)));
    document.querySelectorAll('[data-scene]').forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.scene === currentSceneId));
      button.disabled = !ready;
    });
    document.querySelectorAll('[data-color]').forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.color === layout.deskColor));
      button.disabled = !ready || !deskGroup;
    });
    document.querySelectorAll('[data-cabinet-color]').forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.cabinetColor === layout.cabinetColor));
      button.disabled = !ready || !cabinetGroup;
    });
    document.querySelectorAll('[data-camera="desk"]').forEach((button) => { button.disabled = !ready || !deskGroup; });
    const deskCameraHint = document.getElementById('studio-camera-desk-hint');
    if (deskCameraHint) deskCameraHint.hidden = !ready || Boolean(deskGroup);
    canvasWrap.dataset.mode = currentMode;
    document.getElementById('studio-product-tools').hidden = currentMode !== 'products';
    document.getElementById('studio-furniture-tools').hidden = currentMode !== 'furniture';
    const selected = selectedItemKey ? sceneItems.get(selectedItemKey) : null;
    document.getElementById('studio-product-tools-title').textContent = selected
      ? selected.entry.product.name + ' · ' + selected.entry.color.name
      : 'Chọn một món trong khay';
    document.querySelectorAll('[data-place-surface], #studio-put-away').forEach((button) => {
      button.disabled = !ready || !selected || (button.dataset.placeSurface === 'desk' && !deskGroup);
    });
    document.querySelectorAll('[data-product-move], [data-product-rotate]').forEach((button) => { button.disabled = !ready || !selected || !selected.placed; });
    const chosenFurniture = furnitureGroups.get(selectedFurnitureKey);
    document.getElementById('studio-furniture-tools-title').textContent = chosenFurniture
      ? (presets.FURNITURE[selectedFurnitureKey]?.label || selectedFurnitureKey)
      : 'Chọn nội thất trong thư viện';
    document.querySelectorAll('[data-move], [data-rotate], #studio-remove-furniture').forEach((button) => { button.disabled = !ready || !chosenFurniture; });
    renderFurnitureLibrary();
  }

  function cameraPlaneStep(direction, step) {
    const forward = { x: -Math.sin(orbit.theta), z: -Math.cos(orbit.theta) };
    const right = { x: Math.cos(orbit.theta), z: -Math.sin(orbit.theta) };
    const axis = direction === 'forward' ? forward
      : direction === 'back' ? { x: -forward.x, z: -forward.z }
        : direction === 'left' ? { x: -right.x, z: -right.z } : right;
    return { x: axis.x * step, z: axis.z * step };
  }

  function nudgeSelectedProductDirection(direction) {
    const delta = cameraPlaneStep(direction, 0.02);
    const item = selectedItemKey ? sceneItems.get(selectedItemKey) : null;
    if (item && item.placed && item.surface === 'desk' && deskGroup) {
      const local = new root.THREE.Vector3(delta.x, 0, delta.z)
        .applyAxisAngle(new root.THREE.Vector3(0, 1, 0), -deskGroup.rotation.y);
      return nudgeSelectedProduct(local.x, local.z);
    }
    return nudgeSelectedProduct(delta.x, delta.z);
  }

  function moveSelectedFurnitureDirection(direction) {
    const delta = cameraPlaneStep(direction, 0.1);
    moveFurniture(delta.x, delta.z);
  }

  function renderFurnitureLibrary() {
    if (!furnitureLibrary) return;
    const signature = [ready, layout.present.slice().sort().join(','), selectedFurnitureKey || ''].join('|');
    if (signature === furnitureLibrarySignature) return;
    const focusedKey = furnitureLibrary.contains(document.activeElement)
      ? document.activeElement.dataset.furnitureKey
      : null;
    furnitureLibrarySignature = signature;
    furnitureLibrary.replaceChildren();
    const symbols = { desk: '▱', cabinet: '▥', bed: '▰', chair: '♧', rug: '▤', plant: '♣' };
    for (const key of studioState.FURNITURE_KEYS) {
      const present = layout.present.includes(key);
      const card = document.createElement('div');
      card.className = 'studio-furniture-card' + (present && selectedFurnitureKey === key ? ' is-selected' : '');
      const icon = document.createElement('span');
      icon.className = 'studio-furniture-icon';
      icon.setAttribute('aria-hidden', 'true');
      icon.textContent = symbols[key] || '◇';
      const copy = document.createElement('span');
      copy.className = 'studio-furniture-copy';
      const name = document.createElement('strong');
      name.textContent = presets.FURNITURE[key].label;
      const state = document.createElement('small');
      state.textContent = present ? (selectedFurnitureKey === key ? 'Đang chọn' : 'Đã có trong phòng') : 'Chưa thêm';
      copy.append(name, state);
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'studio-button';
      button.dataset.furnitureKey = key;
      button.dataset.action = present ? 'select-furniture' : 'add-furniture';
      button.textContent = present ? 'Chọn' : 'Thêm';
      button.disabled = !ready;
      button.setAttribute('aria-pressed', String(present && selectedFurnitureKey === key));
      card.append(icon, copy, button);
      furnitureLibrary.appendChild(card);
    }
    if (focusedKey) {
      const restoredFocus = furnitureLibrary.querySelector('[data-furniture-key="' + focusedKey + '"]');
      if (restoredFocus) restoredFocus.focus({ preventScroll: true });
    }
  }

  function renderInventory() {
    if (!inventory || !cartCount) return;
    let entries = [];
    if (ready) {
      try {
        entries = currentEntries();
      } catch (_) {
        entries = [];
      }
    }
    inventoryItems = new Map(entries.map((entry) => [entry.key, entry]));
    const keys = new Set(entries.map((entry) => entry.key));

    for (const [key, card] of cardNodes) {
      if (keys.has(key)) continue;
      card.remove();
      cardNodes.delete(key);
    }

    if (!entries.length) {
      if (!inventory.querySelector('.studio-inventory-empty')) {
        inventory.replaceChildren();
        const empty = document.createElement('p');
        empty.className = 'studio-inventory-empty';
        empty.textContent = ready
          ? 'Chưa có sản phẩm trong giỏ. Thêm sản phẩm hoặc mở một sản phẩm để thử trong 3D.'
          : 'Sản phẩm trong giỏ sẽ xuất hiện ở đây khi không gian 3D tải xong.';
        inventory.appendChild(empty);
      }
    } else {
      const empty = inventory.querySelector('.studio-inventory-empty');
      if (empty) empty.remove();
      for (const entry of entries) {
        let card = cardNodes.get(entry.key);
        if (!card) {
          card = createInventoryCard(entry);
          cardNodes.set(entry.key, card);
          inventory.appendChild(card);
        }
        updateInventoryCard(card, entry);
      }
    }

    const quantity = entries.reduce((total, entry) => total + (entry.preview ? 0 : entry.quantity), 0);
    cartCount.textContent = quantity + ' món';
    updateModeUi();
  }

  function createInventoryCard(entry) {
    const card = document.createElement('article');
    card.className = 'studio-item';
    card.dataset.itemKey = entry.key;
    const image = document.createElement('img');
    image.alt = '';
    image.width = 58;
    image.height = 58;
    image.loading = 'lazy';
    const copy = document.createElement('div');
    copy.className = 'studio-item-copy';
    const title = document.createElement('strong');
    const details = document.createElement('span');
    copy.append(title, details);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'studio-item-select';
    button.dataset.action = 'select';
    button.dataset.itemKey = entry.key;
    button.textContent = 'Chọn';
    card.append(image, copy, button);
    return card;
  }

  function updateInventoryCard(card, entry) {
    card.dataset.itemKey = entry.key;
    const item = sceneItems.get(entry.key);
    const details = item && item.placed
      ? (item.surface === 'floor' ? 'Đang ở sàn' : 'Đang ở bàn')
      : (cabinetGroup ? 'Chưa bố trí · Trong tủ' : 'Chưa bố trí');
    const preview = entry.preview ? ' · Đang thử' : ' · SL ' + entry.quantity;
    card.querySelector('img').src = entry.color.image;
    card.querySelector('strong').textContent = entry.product.name;
    card.querySelector('.studio-item-copy span').textContent = entry.color.name + ' · ' + details + preview;
    card.classList.toggle('is-selected', entry.key === selectedItemKey);
    const button = card.querySelector('.studio-item-select');
    button.dataset.itemKey = entry.key;
    button.disabled = !ready;
    button.setAttribute('aria-pressed', String(entry.key === selectedItemKey));
    button.setAttribute('aria-label', (entry.key === selectedItemKey ? 'Đang chọn ' : 'Chọn ')
      + entry.product.name + ', màu ' + entry.color.name);
  }

  function restoreProduct(item, saved) {
    if (!saved) return false;
    const candidate = {
      key: item.entry.key,
      category: item.entry.product.category,
      x: saved.x,
      z: saved.z,
      size: item.size,
      rotation: saved.rotation || 0,
    };
    const options = getPlacementOptions(saved.surface, item.entry.key);
    if (!studioState.canPlaceProduct(candidate, options)) return false;
    item.placed = true;
    item.surface = saved.surface;
    item.localPosition = { x: saved.x, z: saved.z };
    item.rotation = candidate.rotation;
    syncProductTransform(item);
    return true;
  }

  function syncScene() {
    if (!ready) return;
    let entries;
    try {
      entries = currentEntries();
    } catch (error) {
      setStatus('Không thể đọc giỏ hàng trên thiết bị này. Tải lại trang sau khi kiểm tra dữ liệu giỏ.', 'error');
      return;
    }
    const incoming = new Set(entries.map((entry) => entry.key));
    for (const savedScene of Object.values(workspace.scenes)) {
      for (const key of Object.keys(savedScene.products)) if (!incoming.has(key)) delete savedScene.products[key];
    }
    for (const [key, item] of sceneItems) {
      if (incoming.has(key)) continue;
      if (gesture.itemKey === key) cancelGesture('Sản phẩm đã rời khỏi giỏ; thao tác kéo được hủy.');
      disposeGroup(item.group);
      sceneItems.delete(key);
      if (selectedItemKey === key) selectedItemKey = null;
    }

    for (const entry of entries) {
      const current = sceneItems.get(entry.key);
      if (current) {
        current.entry = entry;
        current.placed = false;
        current.rotation = 0;
        if (!restoreProduct(current, layout.products[entry.key])) syncProductTransform(current);
        continue;
      }
      const group = createProductModel(entry.product, entry.color);
      const shelf = shelfPosition(sceneItems.size);
      const item = {
        entry,
        group,
        size: group.userData.footprint,
        placed: false,
        surface: 'cabinet',
        localPosition: { x: 0, z: 0 },
        rotation: 0,
        shelfPosition: shelf,
        lift: 0,
      };
      group.traverse((object) => {
        if (object.isMesh && !object.userData.pickProxy) object.userData.productKey = entry.key;
      });
      group.userData.productKey = entry.key;
      sceneItems.set(entry.key, item);
      syncProductTransform(item);
      restoreProduct(item, layout.products[entry.key]);
    }
    updateProductSupports();
    renderInventory();
    updateHighlights();
    saveWorkspace();
    requestRender();
  }

  function updateCamera() {
    if (!camera || !target) return;
    const sinPhi = Math.sin(orbit.phi);
    camera.position.set(
      target.x + orbit.radius * sinPhi * Math.sin(orbit.theta),
      target.y + orbit.radius * Math.cos(orbit.phi),
      target.z + orbit.radius * sinPhi * Math.cos(orbit.theta),
    );
    camera.lookAt(target);
    updateWallCutaway();
    requestRender();
  }

  function refreshHighlightBounds() {
    if (selectionHelper) selectionHelper.update();
    if (hoverHelper) hoverHelper.update();
  }

  function updateWallCutaway() {
    if (!wallGroups.size) return;
    const cameraX = Math.sin(orbit.theta);
    const cameraZ = Math.cos(orbit.theta);
    const topDown = orbit.phi < 0.34;
    const visibility = {
      front: !topDown && cameraZ < 0.15,
      back: !topDown && cameraZ > -0.15,
      right: !topDown && cameraX < 0.15,
      left: !topDown && cameraX > -0.15,
    };
    for (const [key, wall] of wallGroups) wall.visible = visibility[key] !== false;
  }

  function requestRender() {
    if (!ready || !renderer || root.document.hidden) return;
    refreshHighlightBounds();
    if (renderScheduled) return;
    renderScheduled = true;
    root.requestAnimationFrame(() => {
      renderScheduled = false;
      if (ready && renderer && !root.document.hidden) renderer.render(scene, camera);
    });
  }

  function normalizedPointer(event) {
    const rect = canvas.getBoundingClientRect();
    return new root.THREE.Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1,
    );
  }

  function pointOnPlane(event, plane) {
    raycaster.setFromCamera(normalizedPointer(event), camera);
    const point = new root.THREE.Vector3();
    return raycaster.ray.intersectPlane(plane, point) ? point : null;
  }

  function floorPosition(event) {
    return pointOnPlane(event, floorPlane);
  }

  function productDropPosition(event) {
    const deskPoint = pointOnPlane(event, placementPlane);
    if (deskPoint && deskGroup) {
      const local = worldToDeskLocal(deskPoint);
      if (Math.abs(local.x) <= 1.175 && Math.abs(local.z) <= 0.43) {
        return { surface: 'desk', position: deskPoint };
      }
    }
    const floorPoint = floorPosition(event);
    if (!floorPoint) return null;
    return { surface: 'floor', position: floorPoint };
  }

  function furnitureGroup(key) {
    return furnitureGroups.get(key) || null;
  }

  function raycastTarget(event) {
    raycaster.setFromCamera(normalizedPointer(event), camera);
    const roots = Array.from(furnitureGroups.values());
    for (const item of sceneItems.values()) if (item.group.visible) roots.push(item.group);
    for (const wall of wallGroups.values()) if (wall.visible) roots.push(wall);
    const hits = raycaster.intersectObjects(roots, true);
    for (const hit of hits) {
      let current = hit.object;
      while (current) {
        if (current.userData.roomWall) return { type: 'wall' };
        if (current.userData.productKey) return { type: 'product', key: current.userData.productKey };
        if (current.userData.furnitureKey) return { type: 'furniture', key: current.userData.furnitureKey };
        current = current.parent;
      }
    }
    return null;
  }

  function itemWorldPosition(item) {
    const point = new root.THREE.Vector3();
    item.group.getWorldPosition(point);
    return point;
  }

  function snapshotItem(item) {
    return {
      placed: item.placed,
      surface: item.surface,
      localPosition: { x: item.localPosition.x, z: item.localPosition.z },
      rotation: item.rotation || 0,
      lift: item.lift,
    };
  }

  function restoreItemSnapshot(key, saved) {
    const item = sceneItems.get(key);
    if (!item || !saved) return;
    item.placed = saved.placed;
    item.surface = saved.surface;
    item.localPosition = { x: saved.localPosition.x, z: saved.localPosition.z };
    item.rotation = saved.rotation || 0;
    item.lift = saved.lift;
    updateProductSupports();
    requestRender();
  }

  function snapshotFurniture(key) {
    const group = furnitureGroup(key);
    if (!group) return null;
    return { x: group.position.x, z: group.position.z, rotation: group.rotation.y };
  }

  function restoreFurnitureSnapshot(key, saved) {
    if (!saved) return;
    const group = furnitureGroup(key);
    if (!group) return;
    group.position.set(saved.x, 0, saved.z);
    group.rotation.y = saved.rotation;
    updateProductSupports();
    requestRender();
  }

  function cancelGesture(message) {
    if (gesture.itemKey) restoreItemSnapshot(gesture.itemKey, gesture.itemSnapshot);
    if (gesture.furnitureKey) restoreFurnitureSnapshot(gesture.furnitureKey, gesture.furnitureSnapshot);
    const wasMoving = gesture.kind === 'product-drag' || gesture.kind === 'furniture-drag';
    gesture = { kind: 'idle' };
    activePointers.clear();
    if (message && wasMoving) setStatus(message, 'info');
  }

  function pointerDistance(points) {
    const values = Array.from(points.values());
    if (values.length < 2) return 0;
    return Math.hypot(values[0].x - values[1].x, values[0].y - values[1].y);
  }

  function startPinch() {
    const distance = pointerDistance(activePointers);
    if (gesture.itemKey) restoreItemSnapshot(gesture.itemKey, gesture.itemSnapshot);
    if (gesture.furnitureKey) restoreFurnitureSnapshot(gesture.furnitureKey, gesture.furnitureSnapshot);
    gesture = { kind: 'pinch', startDistance: Math.max(distance, 1), startRadius: orbit.radius };
    setStatus('Đang phóng to bằng hai ngón. Nhấc cả hai ngón rồi bắt đầu thao tác mới.', 'info');
  }

  function startProductDrag(item, event) {
    const point = productDropPosition(event);
    const world = item.placed ? itemWorldPosition(item) : null;
    gesture = {
      kind: 'product-pending',
      itemKey: item.entry.key,
      itemSnapshot: snapshotItem(item),
      startX: event.clientX,
      startY: event.clientY,
      offset: world && point ? { x: world.x - point.position.x, z: world.z - point.position.z } : { x: 0, z: 0 },
      changed: false,
      attempted: false,
    };
  }

  function startFurnitureDrag(key, event) {
    const point = floorPosition(event);
    const group = furnitureGroup(key);
    gesture = {
      kind: 'furniture-pending',
      furnitureKey: key,
      furnitureSnapshot: snapshotFurniture(key),
      startX: event.clientX,
      startY: event.clientY,
      offset: point ? { x: group.position.x - point.x, z: group.position.z - point.z } : { x: 0, z: 0 },
      changed: false,
    };
  }

  function onPointerDown(event) {
    if (!ready || !interactionEnabled || (event.button !== undefined && event.button !== 0)) return;
    activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    try { canvas.setPointerCapture(event.pointerId); } catch (_) { /* Capture is optional on older browsers. */ }
    canvas.focus({ preventScroll: true });

    if (activePointers.size === 2) {
      startPinch();
      return;
    }
    if (activePointers.size > 2) {
      gesture = { kind: 'blocked' };
      return;
    }

    const hit = raycastTarget(event);
    if (currentMode === 'view') {
      return startOrbit(event);
    }
    if (currentMode === 'products' && hit && hit.type === 'product') {
      if (selectedItemKey !== hit.key) {
        selectProduct(hit.key);
        gesture = { kind: 'click' };
        return;
      }
      const item = sceneItems.get(hit.key);
      if (item) startProductDrag(item, event);
      return;
    }
    if (currentMode === 'furniture' && hit && hit.type === 'furniture') {
      if (selectedFurnitureKey !== hit.key) {
        selectFurniture(hit.key);
        gesture = { kind: 'click' };
        return;
      }
      startFurnitureDrag(hit.key, event);
      return;
    }
    startOrbit(event);
  }

  function startOrbit(event) {
    gesture = { kind: 'orbit', startX: event.clientX, startY: event.clientY, theta: orbit.theta, phi: orbit.phi };
  }

  function updateProductDrag(event) {
    const item = sceneItems.get(gesture.itemKey);
    if (!item) return;
    const drop = productDropPosition(event);
    if (!drop) return;
    const worldX = drop.position.x + gesture.offset.x;
    const worldZ = drop.position.z + gesture.offset.z;
    const local = drop.surface === 'desk'
      ? worldToDeskLocal({ x: worldX, z: worldZ })
      : { x: worldX, z: worldZ };
    const candidate = {
      key: item.entry.key,
      category: item.entry.product.category,
      x: local.x,
      z: local.z,
      size: item.size,
      rotation: item.rotation || 0,
    };
    const options = getPlacementOptions(drop.surface, item.entry.key);
    gesture.attempted = true;
    if (!studioState.canPlaceProduct(candidate, options)) return;
    item.placed = true;
    item.surface = drop.surface;
    item.localPosition = { x: local.x, z: local.z };
    gesture.changed = true;
    updateProductSupports();
    requestRender();
  }

  function updateFurnitureDrag(event) {
    const point = floorPosition(event);
    if (!point) return;
    const key = gesture.furnitureKey;
    const group = furnitureGroup(key);
    const transform = {
      x: point.x + gesture.offset.x,
      z: point.z + gesture.offset.z,
      rotation: group.rotation.y,
    };
    const furniture = getFurnitureTransforms();
    furniture[key] = transform;
    if (!studioState.canPlaceFurniture(key, transform, { furniture: furniture, present: layout.present, floorItems: getFloorItems(), sceneId: currentSceneId })) return;
    group.position.set(transform.x, 0, transform.z);
    if (key === 'desk') updateProductSupports();
    gesture.changed = true;
    requestRender();
  }

  function onPointerMove(event) {
    if (!ready) return;
    if (activePointers.has(event.pointerId)) activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (gesture.kind === 'pinch' && activePointers.size >= 2) {
      const distance = Math.max(pointerDistance(activePointers), 1);
      orbit.radius = studioState.clamp(gesture.startRadius * gesture.startDistance / distance, 2.8, 11.5);
      updateCamera();
      return;
    }
    if (gesture.kind === 'blocked') return;

    if (gesture.kind === 'product-pending') {
      const distance = Math.hypot(event.clientX - gesture.startX, event.clientY - gesture.startY);
      if (distance < 5) return;
      gesture.kind = 'product-drag';
    }
    if (gesture.kind === 'furniture-pending') {
      const distance = Math.hypot(event.clientX - gesture.startX, event.clientY - gesture.startY);
      if (distance < 5) return;
      gesture.kind = 'furniture-drag';
    }

    if (gesture.kind === 'orbit') {
      const dx = event.clientX - gesture.startX;
      const dy = event.clientY - gesture.startY;
      orbit.theta = gesture.theta - dx * 0.008;
      orbit.phi = studioState.clamp(gesture.phi + dy * 0.006, 0.28, 1.48);
      updateCamera();
      return;
    }
    if (gesture.kind === 'product-drag') {
      updateProductDrag(event);
      return;
    }
    if (gesture.kind === 'furniture-drag') {
      updateFurnitureDrag(event);
      return;
    }

    if (!interactionEnabled || activePointers.size) return;
    const hit = raycastTarget(event);
    const itemKey = hit && hit.type === 'product' ? hit.key : null;
    const furnitureKey = hit && hit.type === 'furniture' ? hit.key : null;
    if (itemKey !== hoveredItemKey || furnitureKey !== hoveredFurnitureKey) {
      hoveredItemKey = itemKey;
      hoveredFurnitureKey = furnitureKey;
      updateHighlights();
      requestRender();
    }
  }

  function onPointerUp(event) {
    if (!activePointers.has(event.pointerId)) return;
    activePointers.delete(event.pointerId);
    if (gesture.kind === 'pinch') {
      if (activePointers.size === 0) gesture = { kind: 'idle' };
      else gesture = { kind: 'blocked' };
      return;
    }
    if (gesture.kind === 'blocked') {
      if (activePointers.size === 0) gesture = { kind: 'idle' };
      return;
    }
    if (gesture.kind === 'product-drag') {
      if (gesture.changed) {
        const item = sceneItems.get(gesture.itemKey);
        const message = item.surface === 'floor'
          ? item.entry.product.name + ' đang ở sàn.'
          : item.entry.product.name + ' đã được bố trí trên bàn.';
        announceChange(message, 'success');
        renderInventory();
      } else if (gesture.attempted) {
        restoreItemSnapshot(gesture.itemKey, gesture.itemSnapshot);
        setStatus('Vị trí này bị chặn hoặc vượt khỏi vùng đặt. Món đồ vẫn ở vị trí hợp lệ gần nhất.', 'info');
      }
    }
    if (gesture.kind === 'furniture-drag' && gesture.changed) {
      if (gesture.furnitureKey === 'desk') updateProductSupports();
      announceChange('Đã cập nhật vị trí ' + (gesture.furnitureKey === 'desk' ? 'bàn làm việc.' : 'tủ đựng đồ.'), 'success');
    }
    gesture = { kind: 'idle' };
  }

  function onPointerCancel(event) {
    if (!activePointers.has(event.pointerId)) return;
    cancelGesture('Thao tác đã bị hủy; vị trí trước đó được khôi phục.');
  }

  function onLostPointerCapture(event) {
    if (activePointers.has(event.pointerId)) onPointerCancel(event);
  }

  function resetCamera() {
    setCameraPreset('room');
  }

  function setCameraPreset(name) {
    const currentScene = presets.sceneById[currentSceneId];
    if (name === 'desk' && !deskGroup) {
      setStatus('Thêm bàn vào phòng để dùng góc nhìn Góc bàn.', 'info');
      return;
    }
    const selected = name === 'desk' && selectedItemKey ? sceneItems.get(selectedItemKey) : null;
    const cameraConfig = currentScene.cameraPresets ? currentScene.cameraPresets[name] : presets.cameraPresets[name];
    const config = Object.assign({}, cameraConfig);
    if (name === 'desk' && selected) {
      const focus = itemWorldPosition(selected);
      config.target = { x: focus.x, y: focus.y + selected.group.userData.productHeight * 0.3, z: focus.z };
      config.radius = studioState.clamp(Math.max(selected.size.width, selected.size.depth) * 5.2, 3.2, 5.2);
    } else if (name === 'desk' && deskGroup) {
      config.target = { x: deskGroup.position.x, y: 0.78, z: deskGroup.position.z };
    }
    cameraPreset = name;
    orbit = { theta: config.theta, phi: config.phi, radius: config.radius };
    target.set(config.target.x, config.target.y, config.target.z);
    updateCamera();
    updateModeUi();
  }

  function focusCurrent() {
    let object = selectedItemKey ? sceneItems.get(selectedItemKey) : null;
    let position;
    let size;
    if (object) {
      position = itemWorldPosition(object);
      size = object.size;
      position.y += object.group.userData.productHeight * 0.35;
    } else if (currentMode === 'furniture' && selectedFurnitureKey) {
      const group = furnitureGroup(selectedFurnitureKey);
      if (!group) return setCameraPreset('room');
      position = group.position.clone();
      position.y = (presets.FURNITURE[selectedFurnitureKey]?.height || 0.8) * 0.7;
      size = studioState.FURNITURE_SIZE[selectedFurnitureKey];
    } else {
      const group = deskGroup;
      position = group ? group.position.clone() : new root.THREE.Vector3(0, 0, 0);
      position.y = group ? 0.9 : 1;
      size = group ? studioState.FURNITURE_SIZE.desk : { width: 2.8, depth: 2.4 };
    }
    target.copy(position);
    orbit.radius = studioState.clamp(Math.max(size.width, size.depth) * 3.8, 2.8, 6.4);
    updateCamera();
  }

  function zoomBy(direction) {
    orbit.radius = studioState.clamp(orbit.radius * (direction < 0 ? 0.82 : 1.22), 2.8, 11.5);
    updateCamera();
  }

  function setInteraction(value) {
    interactionEnabled = Boolean(value);
    const button = document.getElementById('studio-interaction-toggle');
    button.setAttribute('aria-pressed', String(interactionEnabled));
    button.textContent = 'Tương tác 3D: ' + (interactionEnabled ? 'bật' : 'tắt');
    document.getElementById('studio-interaction-note').textContent = interactionEnabled
      ? 'Kéo nền để xoay; chọn vật rồi kéo để di chuyển. Dùng hai ngón để thu phóng.'
      : 'Khi tắt, thao tác vuốt trên khung vẫn cuộn trang.';
    canvasWrap.classList.toggle('studio-interactive', interactionEnabled);
    if (!interactionEnabled) {
      cancelGesture();
      hoveredItemKey = null;
      hoveredFurnitureKey = null;
      updateHighlights();
      requestRender();
    }
    setStatus(interactionEnabled ? 'Đã bật thao tác trực tiếp trong không gian.' : 'Đã tắt thao tác trực tiếp; trang vẫn cuộn qua khung 3D.', 'info');
  }

  function setMode(mode) {
    if (!['view', 'products', 'furniture'].includes(mode)) return;
    cancelGesture();
    currentMode = mode;
    hoveredItemKey = null;
    hoveredFurnitureKey = null;
    updateModeUi();
    updateHighlights();
    requestRender();
  }

  function placeSelected(surface) {
    const item = selectedItemKey ? sceneItems.get(selectedItemKey) : null;
    if (!item || (surface === 'desk' && !deskGroup)) return;
    const desired = surface === 'desk'
      ? { x: 0, z: 0 }
      : { x: deskGroup ? deskGroup.position.x + 1.55 : 1.55, z: deskGroup ? deskGroup.position.z + 0.85 : 0.85 };
    if (!setItemPlacement(item, surface, desired)) {
      setStatus('Không tìm thấy vị trí trống. Cất bớt món hoặc chọn mặt đặt khác.', 'error');
      return;
    }
    const label = surface === 'desk' ? 'đã được đặt lên bàn.' : 'đã được đặt xuống sàn.';
    announceChange(item.entry.product.name + ' ' + label, 'success');
    renderInventory();
    requestRender();
  }

  function putAway(key) {
    const item = sceneItems.get(key);
    if (!item) return;
    item.placed = false;
    item.surface = 'inventory';
    item.lift = 0;
    delete layout.products[key];
    syncProductTransform(item);
    if (selectedItemKey === key) selectedItemKey = null;
    updateProductSupports();
    announceChange(item.entry.product.name + ' đã được cất vào kho.', 'success');
    renderInventory();
    updateHighlights();
  }

  function clearProducts() {
    for (const item of sceneItems.values()) {
      item.placed = false;
      item.surface = 'inventory';
      item.lift = 0;
      syncProductTransform(item);
    }
    selectedItemKey = null;
    layout.products = {};
    updateProductSupports();
    renderInventory();
    updateHighlights();
    announceChange('Đã cất tất cả sản phẩm khỏi phòng.', 'success');
  }

  function moveFurniture(dx, dz) {
    const key = selectedFurnitureKey;
    const group = furnitureGroup(key);
    if (!group) return setStatus('Chọn món nội thất đang có trong phòng.', 'info');
    const desired = { x: group.position.x + dx, z: group.position.z + dz, rotation: group.rotation.y };
    const furniture = getFurnitureTransforms();
    furniture[key] = desired;
    const valid = studioState.canPlaceFurniture(key, desired, {
      furniture, present: layout.present, floorItems: getFloorItems(), sceneId: currentSceneId,
    });
    if (!valid) return setStatus('Vị trí này chạm nội thất khác hoặc nằm ngoài phòng.', 'info');
    group.position.set(desired.x, 0, desired.z);
    if (key === 'desk') updateProductSupports();
    announceChange('Đã di chuyển ' + presets.FURNITURE[key].label + '.', 'success');
    requestRender();
  }

  function rotateFurniture(direction) {
    const key = selectedFurnitureKey;
    const group = furnitureGroup(key);
    if (!group) return;
    const desired = { x: group.position.x, z: group.position.z, rotation: studioState.normalizeRotation(group.rotation.y - direction * Math.PI / 2) };
    const furniture = getFurnitureTransforms();
    furniture[key] = desired;
    if (!studioState.canPlaceFurniture(key, desired, { furniture, present: layout.present, floorItems: getFloorItems(), sceneId: currentSceneId })) {
      return setStatus('Không thể xoay vì vật thể sẽ chạm nhau hoặc vượt khỏi phòng.', 'info');
    }
    group.rotation.y = desired.rotation;
    if (key === 'desk') updateProductSupports();
    announceChange(presets.FURNITURE[key].label + ' đã xoay 90 độ.', 'success');
    requestRender();
  }

  function setDeskColor(color) {
    if (!deskColors[color]) return;
    layout.deskColor = color;
    if (deskMaterial) deskMaterial.color.set(deskColors[color]);
    document.querySelectorAll('[data-color]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.color === color)));
    announceChange('Đã đổi màu mặt bàn sang ' + ({ oak: 'gỗ sáng', walnut: 'gỗ óc chó', white: 'trắng' }[color]) + '.', 'success');
    requestRender();
  }

  function setCabinetColor(color) {
    if (!cabinetColors[color]) return;
    layout.cabinetColor = color;
    cabinetMaterials.forEach((material) => material.color.set(cabinetColors[color]));
    document.querySelectorAll('[data-cabinet-color]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.cabinetColor === color)));
    announceChange('Đã đổi màu tủ sang ' + ({ oak: 'gỗ sáng', walnut: 'gỗ óc chó', white: 'trắng' }[color]) + '.', 'success');
    requestRender();
  }

  function nudgeSelectedProduct(dx, dz) {
    const item = selectedItemKey ? sceneItems.get(selectedItemKey) : null;
    if (!item || !item.placed) {
      setStatus('Chọn một sản phẩm đang ở trên bàn hoặc sàn trước khi di chuyển.', 'info');
      return;
    }
    const desired = { x: item.localPosition.x + dx, z: item.localPosition.z + dz };
    const candidate = {
      key: item.entry.key,
      category: item.entry.product.category,
      x: desired.x,
      z: desired.z,
      size: item.size,
      rotation: item.rotation || 0,
    };
    if (!studioState.canPlaceProduct(candidate, getPlacementOptions(item.surface, item.entry.key))) return setStatus('Vị trí này bị chặn hoặc vượt khỏi mặt đặt.', 'info');
    item.localPosition = desired;
    updateProductSupports();
    announceChange('Đã di chuyển ' + item.entry.product.name + '.', 'success');
    renderInventory();
    requestRender();
  }

  function rotateSelectedProduct(direction) {
    const item = selectedItemKey ? sceneItems.get(selectedItemKey) : null;
    if (!item || !item.placed) return setStatus('Đặt sản phẩm lên bàn hoặc sàn trước khi xoay.', 'info');
    const rotation = studioState.normalizeRotation((item.rotation || 0) - direction * Math.PI / 2);
    const candidate = Object.assign({}, item, {
      x: item.localPosition.x,
      z: item.localPosition.z,
      rotation,
    });
    if (!studioState.canPlaceProduct(candidate, getPlacementOptions(item.surface, item.entry.key))) return setStatus('Không thể xoay: sản phẩm sẽ chạm vật khác hoặc mép mặt đặt.', 'info');
    item.rotation = rotation;
    updateProductSupports();
    announceChange(item.entry.product.name + ' đã xoay 90 độ.', 'success');
    renderInventory();
    requestRender();
  }

  function addFurniture(key) {
    if (layout.present.includes(key)) return selectFurniture(key);
    const scenePreset = presets.sceneById[currentSceneId];
    const desired = Object.assign({}, scenePreset.furniture[key]);
    const furniture = getFurnitureTransforms();
    const position = studioState.nearestFurniturePosition(key, desired, {
      furniture, present: layout.present, floorItems: getFloorItems(), sceneId: currentSceneId,
    });
    if (!position) return setStatus('Không tìm thấy chỗ trống trong phòng. Hãy di chuyển nội thất khác trước.', 'error');
    layout.present.push(key);
    layout.furniture[key] = { x: position.x, z: position.z, rotation: desired.rotation };
    syncFurnitureScene();
    selectedFurnitureKey = key;
    setMode('furniture');
    for (const item of sceneItems.values()) if (!item.placed) syncProductTransform(item);
    updateHighlights();
    renderInventory();
    announceChange('Đã thêm ' + presets.FURNITURE[key].label + ' vào phòng.', 'success');
    requestRender();
  }

  function removeFurniture(key) {
    if (!layout.present.includes(key)) return;
    if (key === 'desk') {
      for (const item of sceneItems.values()) {
        if (item.placed && item.surface === 'desk') {
          item.placed = false;
          item.surface = 'inventory';
          item.rotation = 0;
          item.lift = 0;
          delete layout.products[item.entry.key];
        }
      }
    }
    layout.present = layout.present.filter((presentKey) => presentKey !== key);
    if (selectedFurnitureKey === key) selectedFurnitureKey = layout.present.includes('desk') ? 'desk' : (layout.present[0] || null);
    syncFurnitureScene();
    for (const item of sceneItems.values()) syncProductTransform(item);
    updateProductSupports();
    updateModeUi();
    updateHighlights();
    renderInventory();
    announceChange('Đã bỏ ' + presets.FURNITURE[key].label + ' khỏi phòng.', 'success');
    requestRender();
  }

  function switchScene(sceneId) {
    if (!presets.sceneById[sceneId] || sceneId === currentSceneId) return;
    cancelGesture();
    saveLayout();
    workspace.scenes[currentSceneId] = layout;
    currentSceneId = sceneId;
    layout = workspace.scenes[sceneId];
    workspace.activeSceneId = sceneId;
    selectedItemKey = null;
    hoveredItemKey = null;
    hoveredFurnitureKey = null;
    selectedFurnitureKey = layout.present.includes('desk') ? 'desk' : (layout.present[0] || null);
    syncFurnitureScene();
    for (const item of sceneItems.values()) {
      item.placed = false;
      item.rotation = 0;
      item.localPosition = { x: 0, z: 0 };
      item.surface = 'inventory';
      item.lift = 0;
      syncProductTransform(item);
    }
    createRoom();
    syncScene();
    cameraPreset = 'room';
    setCameraPreset('room');
    document.querySelectorAll('[data-scene]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.scene === sceneId)));
    updateModeUi();
    announceChange('Đã mở ' + presets.sceneById[sceneId].name + '. Bố cục của phòng này được lưu riêng.', 'success');
  }

  function resetLayout() {
    cancelGesture();
    layout = studioState.defaultSceneLayout(currentSceneId);
    workspace.scenes[currentSceneId] = layout;
    selectedItemKey = null;
    selectedFurnitureKey = 'desk';
    syncFurnitureScene();
    for (const item of sceneItems.values()) {
      item.placed = false;
      item.rotation = 0;
      item.surface = 'inventory';
      item.localPosition = { x: 0, z: 0 };
      item.lift = 0;
      syncProductTransform(item);
    }
    updateProductSupports();
    cameraPreset = 'room';
    setCameraPreset('room');
    updateHighlights();
    renderInventory();
    updateModeUi();
    announceChange('Đã đặt lại bố cục và màu của phòng này. Giỏ hàng và các phòng khác vẫn giữ nguyên.', 'success');
  }

  function openConfirm(action, trigger, payload) {
    const messages = {
      clear: ['Cất tất cả sản phẩm?', 'Các sản phẩm hiện trên bàn hoặc sàn sẽ được cất về tủ. Sản phẩm vẫn còn trong giỏ hàng.'],
      layout: ['Đặt lại bố cục?', 'Sản phẩm sẽ được cất về tủ, bàn và tủ về vị trí ban đầu, màu bàn đổi về gỗ sáng. Giỏ hàng không thay đổi.'],
    };
    if (action === 'clear' && !cabinetGroup) {
      messages.clear[1] = 'Sản phẩm đang trên bàn hoặc sàn sẽ được cất khỏi bố cục. Giỏ hàng vẫn giữ nguyên.';
    }
    if (action === 'remove-furniture') {
      const label = presets.FURNITURE[payload]?.label || 'nội thất';
      messages[action] = [
        'Bỏ ' + label.toLocaleLowerCase('vi-VN') + ' khỏi phòng?',
        payload === 'desk'
          ? 'Sản phẩm đang trên bàn sẽ được cất khỏi bố cục. Giỏ hàng vẫn giữ nguyên.'
          : 'Nội thất sẽ được bỏ khỏi phòng hiện tại. Giỏ hàng và các phòng khác vẫn giữ nguyên.',
      ];
    }
    pendingConfirmAction = action;
    pendingConfirmPayload = payload || null;
    confirmReturnFocus = trigger || document.activeElement;
    document.getElementById('studio-confirm-title').textContent = messages[action][0];
    document.getElementById('studio-confirm-copy').textContent = messages[action][1];
    const dialog = document.getElementById('studio-confirm-dialog');
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
    document.getElementById('studio-confirm-cancel').focus();
  }

  function closeConfirm() {
    const dialog = document.getElementById('studio-confirm-dialog');
    if (typeof dialog.close === 'function') dialog.close();
    else dialog.removeAttribute('open');
    pendingConfirmAction = null;
    pendingConfirmPayload = null;
    if (confirmReturnFocus && typeof confirmReturnFocus.focus === 'function') confirmReturnFocus.focus();
  }

  function applyConfirm() {
    const action = pendingConfirmAction;
    const payload = pendingConfirmPayload;
    closeConfirm();
    if (action === 'clear') clearProducts();
    if (action === 'layout') resetLayout();
    if (action === 'remove-furniture') removeFurniture(payload);
  }

  function resetGestureForModeChange() {
    cancelGesture();
    hoveredItemKey = null;
    hoveredFurnitureKey = null;
  }

  function bindEvents() {
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointercancel', onPointerCancel);
    canvas.addEventListener('lostpointercapture', onLostPointerCapture);
    canvas.addEventListener('dblclick', focusCurrent);
    canvas.addEventListener('keydown', (event) => {
      if (!ready) return;
      const step = 0.08;
      if (event.key === 'Escape') {
        cancelGesture();
        selectProduct(null);
        setStatus('Đã bỏ chọn sản phẩm.', 'info');
        return;
      }
      if (event.key === '+' || event.key === '=') {
        event.preventDefault();
        zoomBy(-1);
        return;
      }
      if (event.key === '-' || event.key === '_') {
        event.preventDefault();
        zoomBy(1);
        return;
      }
      if (event.key === '0') {
        event.preventDefault();
        resetCamera();
        return;
      }
      const moves = {
        ArrowUp: [0, -step],
        ArrowDown: [0, step],
        ArrowLeft: [-step, 0],
        ArrowRight: [step, 0],
      };
      const directions = {
        ArrowUp: 'forward',
        ArrowDown: 'back',
        ArrowLeft: 'left',
        ArrowRight: 'right',
      };
      if (!moves[event.key]) return;
      event.preventDefault();
      if (currentMode === 'products') nudgeSelectedProductDirection(directions[event.key]);
      else if (currentMode === 'furniture') moveSelectedFurnitureDirection(directions[event.key]);
      else {
        orbit.theta += moves[event.key][0] * 0.12;
        orbit.phi = studioState.clamp(orbit.phi + moves[event.key][1] * 0.12, 0.28, 1.48);
        updateCamera();
      }
    });
    canvas.addEventListener('wheel', (event) => {
      if (!interactionEnabled || document.activeElement !== canvas) return;
      event.preventDefault();
      orbit.radius = studioState.clamp(orbit.radius + event.deltaY * 0.003, 2.8, 11.5);
      updateCamera();
    }, { passive: false });

    inventory.addEventListener('click', (event) => {
      const button = event.target.closest('button[data-action="select"]');
      if (button && button.dataset.itemKey) {
        selectProduct(button.dataset.itemKey);
        setStatus('Đã chọn ' + sceneItems.get(button.dataset.itemKey).entry.product.name + '. Có thể dùng nút đặt vị trí hoặc bật tương tác để kéo.', 'info');
      }
    });

    document.getElementById('studio-interaction-toggle').addEventListener('click', () => setInteraction(!interactionEnabled));
    document.querySelectorAll('[data-mode]').forEach((button) => button.addEventListener('click', () => setMode(button.dataset.mode)));
    document.querySelectorAll('[data-color]').forEach((button) => button.addEventListener('click', () => setDeskColor(button.dataset.color)));
    document.querySelectorAll('[data-cabinet-color]').forEach((button) => button.addEventListener('click', () => setCabinetColor(button.dataset.cabinetColor)));
    document.querySelectorAll('[data-scene]').forEach((button) => button.addEventListener('click', () => switchScene(button.dataset.scene)));
    document.querySelectorAll('[data-camera]').forEach((button) => button.addEventListener('click', () => setCameraPreset(button.dataset.camera)));
    document.querySelectorAll('[data-zoom]').forEach((button) => button.addEventListener('click', () => zoomBy(button.dataset.zoom === 'in' ? -1 : 1)));
    document.getElementById('studio-focus').addEventListener('click', focusCurrent);
    document.getElementById('studio-reset-view').addEventListener('click', resetCamera);
    document.querySelectorAll('[data-place-surface]').forEach((button) => button.addEventListener('click', () => placeSelected(button.dataset.placeSurface)));
    document.getElementById('studio-put-away').addEventListener('click', () => {
      if (selectedItemKey) putAway(selectedItemKey);
    });
    furnitureLibrary.addEventListener('click', (event) => {
      const button = event.target.closest('button[data-furniture-key]');
      if (!button) return;
      if (button.dataset.action === 'add-furniture') addFurniture(button.dataset.furnitureKey);
      else selectFurniture(button.dataset.furnitureKey);
    });
    document.querySelectorAll('[data-product-move]').forEach((button) => button.addEventListener('click', () => {
      nudgeSelectedProductDirection(button.dataset.productMove);
    }));
    document.querySelectorAll('[data-product-rotate]').forEach((button) => button.addEventListener('click', () => rotateSelectedProduct(Number(button.dataset.productRotate))));
    document.querySelectorAll('[data-move]').forEach((button) => button.addEventListener('click', () => moveSelectedFurnitureDirection(button.dataset.move)));
    document.querySelectorAll('[data-rotate]').forEach((button) => button.addEventListener('click', () => rotateFurniture(Number(button.dataset.rotate))));
    document.getElementById('studio-clear-layout').addEventListener('click', (event) => openConfirm('clear', event.currentTarget));
    document.getElementById('studio-remove-furniture').addEventListener('click', (event) => openConfirm('remove-furniture', event.currentTarget, selectedFurnitureKey));
    document.getElementById('studio-reset-layout').addEventListener('click', (event) => openConfirm('layout', event.currentTarget));
    document.getElementById('studio-confirm-cancel').addEventListener('click', closeConfirm);
    document.getElementById('studio-confirm-accept').addEventListener('click', applyConfirm);
    document.getElementById('studio-confirm-dialog').addEventListener('cancel', (event) => {
      event.preventDefault();
      closeConfirm();
    });

    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) requestRender();
    });
    root.addEventListener('pagehide', (event) => {
      if (!event.persisted) cleanup();
    });
    root.addEventListener('pageshow', (event) => {
      if (!event.persisted) return;
      resizeScene();
      syncScene();
      requestRender();
    });
  }

  function resizeScene() {
    if (!renderer || !camera) return;
    const width = canvasWrap.clientWidth;
    const height = canvasWrap.clientHeight;
    if (!width || !height) return;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    requestRender();
  }

  function initializeScene() {
    const THREE = root.THREE;
    if (!THREE) {
      showFallback('Không tải được Three.js. Kiểm tra kết nối mạng rồi thử lại.');
      return false;
    }
    try {
      scene = new THREE.Scene();
      scene.background = new THREE.Color('#ece7df');
      scene.fog = new THREE.Fog('#ece7df', 9, 19);
      camera = new THREE.PerspectiveCamera(36, 1, 0.1, 60);
      target = new THREE.Vector3(0, 0.95, 0);
      renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: false });
      renderer.setPixelRatio(Math.min(root.devicePixelRatio || 1, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.1;
      scene.add(new THREE.HemisphereLight('#fff8eb', '#8e8172', 2.2));
      const keyLight = new THREE.DirectionalLight('#fff1d9', 3.2);
      keyLight.position.set(3.2, 6, 4);
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.set(1024, 1024);
      scene.add(keyLight);
      createFurniture();
      raycaster = new THREE.Raycaster();
      placementPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -deskTop);
      floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      setCameraPreset('room');
      setControlsReady(true);
      bindEvents();
      if (root.ResizeObserver) {
        resizeObserver = new root.ResizeObserver(resizeScene);
        resizeObserver.observe(canvasWrap);
      } else {
        root.addEventListener('resize', resizeScene);
      }
      loading.hidden = true;
      fallback.hidden = true;
      canvas.style.display = 'block';
      syncScene();
      cartUnsubscribe = cart && typeof cart.subscribe === 'function' ? cart.subscribe(syncScene) : function () {};
      const message = migratedLegacyLayout
        ? 'Đã đọc bố cục cũ. Các thay đổi mới sẽ được lưu riêng cho bản cập nhật.'
        : (previewProduct ? 'Sản phẩm đang xem đã sẵn sàng để thử trong không gian.' : 'Chọn sản phẩm trong khay để bắt đầu bố trí.');
      setStatus(message, 'info');
      requestRender();
      return true;
    } catch (error) {
      disposeScene();
      showFallback('Thiết bị chưa khởi tạo được WebGL. Bật WebGL trong trình duyệt hoặc thử lại.');
      return false;
    }
  }

  function disposeScene() {
    for (const helper of [selectionHelper, hoverHelper]) {
      if (!helper) continue;
      if (scene) scene.remove(helper);
      helper.geometry.dispose();
      helper.material.dispose();
    }
    selectionHelper = null;
    hoverHelper = null;
    if (scene) {
      const materials = new Set();
      scene.traverse((object) => {
        if (!object.isMesh) return;
        const list = Array.isArray(object.material) ? object.material : [object.material];
        list.forEach((material) => materials.add(material));
      });
      materials.forEach((material) => material.dispose());
    }
    for (const geometry of geometryCache.values()) geometry.dispose();
    if (renderer) {
      renderer.dispose();
      renderer = null;
    }
    scene = null;
    camera = null;
    raycaster = null;
    placementPlane = null;
    floorPlane = null;
    target = null;
    deskGroup = null;
    cabinetGroup = null;
    deskMaterial = null;
    cabinetMaterials = [];
    furnitureGroups.clear();
    wallGroups.clear();
    roomRoot = null;
    activePointers.clear();
    gesture = { kind: 'idle' };
    geometryCache = new Map();
    sceneItems = new Map();
  }

  function showFallback(message) {
    setControlsReady(false);
    loading.hidden = true;
    fallback.hidden = false;
    canvas.style.display = 'none';
    document.getElementById('studio-error-title').textContent = 'Không thể mở không gian 3D';
    document.getElementById('studio-error-message').textContent = message;
    setStatus(message, 'error');
  }

  function loadThree() {
    if (scriptLoading || ready) return;
    loading.hidden = false;
    fallback.hidden = true;
    canvas.style.display = 'block';
    if (root.THREE) {
      initializeScene();
      return;
    }
    scriptLoading = true;
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/three@0.158.0/build/three.min.js';
    script.integrity = 'sha384-5UGTcMIxVUKFeJH0zOS3lqMAZNBG+fCXJbi3UglUq6ABO4MQJu6rxNa+MPP+qtwq';
    script.crossOrigin = 'anonymous';
    script.referrerPolicy = 'no-referrer';
    script.async = true;
    script.onload = () => {
      scriptLoading = false;
      initializeScene();
    };
    script.onerror = () => {
      scriptLoading = false;
      scriptElement = script;
      showFallback('Không tải được thư viện đồ họa. Kiểm tra kết nối mạng rồi thử tải lại.');
    };
    scriptElement = script;
    document.head.appendChild(script);
  }

  function cleanup() {
    cartUnsubscribe();
    if (resizeObserver) resizeObserver.disconnect();
    disposeScene();
  }

  document.getElementById('studio-retry').addEventListener('click', () => {
    if (scriptElement && scriptElement.parentNode) scriptElement.parentNode.removeChild(scriptElement);
    scriptElement = null;
    scriptLoading = false;
    if (root.THREE) disposeScene();
    loadThree();
  });

  if (root.IntersectionObserver) {
    const observer = new root.IntersectionObserver((observations) => {
      if (!observations.some((observation) => observation.isIntersecting)) return;
      observer.disconnect();
      loadThree();
    }, { rootMargin: '180px 0px' });
    observer.observe(canvasWrap);
  } else {
    loadThree();
  }
})(globalThis, globalThis.GocDeskCatalog, globalThis.GocDeskStudioStateV1);
