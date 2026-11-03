(function (root, catalog) {
  'use strict';

  const canvas = document.getElementById('studio-canvas');
  const canvasWrap = document.getElementById('studio-canvas-wrap');
  const inventory = document.getElementById('studio-inventory-list');
  const status = document.getElementById('studio-status');
  const cartCount = document.getElementById('studio-cart-count');
  const canvasError = document.getElementById('studio-canvas-error');
  const layoutKey = 'goc-desk:studio-layout:v1';
  const deskTop = 0.82;
  const defaultFurniture = {
    desk: { x: 0.35, z: 0.06, rotation: 0 },
    cabinet: { x: -2.12, z: -0.35, rotation: 0 },
  };
  const furnitureBounds = { minX: -3.2, maxX: 3.2, minZ: -2, maxZ: 1.8 };
  const roomBounds = { minX: -3.8, maxX: 3.8, minZ: -2.35, maxZ: 2.35 };
  const cart = root.GocDeskCart;
  const THREE = root.THREE;
  const params = new URLSearchParams(root.location.search);
  const previewProduct = catalog.products.find((product) => product.id === params.get('product'));
  const previewColor = previewProduct
    ? previewProduct.colors.find((color) => color.id === params.get('color')) || previewProduct.colors[0]
    : null;

  let renderer;
  let scene;
  let camera;
  let raycaster;
  let placementPlane;
  let floorPlane;
  let deskGroup;
  let cabinetGroup;
  let inventoryItems = new Map();
  let sceneItems = new Map();
  let selectedItemKey = null;
  let selectedFurnitureKey = 'desk';
  let draggedItemKey = null;
  let draggedFurnitureKey = null;
  let dragOffset = null;
  let furnitureMoveMode = false;
  let pointerStart = null;
  let orbit = { theta: 0.68, phi: 1.08, radius: 8 };
  let target = null;
  let deskMaterial;
  let cartUnsubscribe = () => {};

  function setStatus(message, state) {
    status.textContent = message;
    status.dataset.state = state || 'info';
  }

  function safeLayout() {
    try {
      const saved = JSON.parse(root.localStorage.getItem(layoutKey) || '{}');
      if (!saved || typeof saved !== 'object' || Array.isArray(saved)) {
        return { products: {}, furniture: Object.assign({}, defaultFurniture) };
      }
      const positions = saved.products && typeof saved.products === 'object' ? saved.products : saved;
      const products = Object.fromEntries(Object.entries(positions).filter(([, position]) => position
        && Number.isFinite(position.x) && Number.isFinite(position.z)
        && Math.abs(position.x) <= 5 && Math.abs(position.z) <= 5).map(([key, position]) => [key, {
        x: position.x,
        z: position.z,
        surface: position.surface === 'floor' ? 'floor' : 'desk',
      }]));
      const furniture = {};
      for (const key of ['desk', 'cabinet']) {
        const transform = saved.furniture && saved.furniture[key];
        furniture[key] = transform && Number.isFinite(transform.x) && Number.isFinite(transform.z)
          ? {
            x: THREE.MathUtils.clamp(transform.x, furnitureBounds.minX, furnitureBounds.maxX),
            z: THREE.MathUtils.clamp(transform.z, furnitureBounds.minZ, furnitureBounds.maxZ),
            rotation: Number.isFinite(transform.rotation) ? transform.rotation : defaultFurniture[key].rotation,
          }
          : Object.assign({}, defaultFurniture[key]);
      }
      return { products, furniture };
    } catch (error) {
      setStatus('Không thể tải bố cục đã lưu: ' + error.message, 'error');
      return { products: {}, furniture: Object.assign({}, defaultFurniture) };
    }
  }

  function saveLayout() {
    const saved = {
      furniture: {
        desk: { x: deskGroup.position.x, z: deskGroup.position.z, rotation: deskGroup.rotation.y },
        cabinet: { x: cabinetGroup.position.x, z: cabinetGroup.position.z, rotation: cabinetGroup.rotation.y },
      },
      products: {},
    };
    for (const [key, item] of sceneItems) {
      if (item.placed) saved.products[key] = {
        x: item.localPosition.x,
        z: item.localPosition.z,
        surface: item.surface,
      };
    }
    try {
      root.localStorage.setItem(layoutKey, JSON.stringify(saved));
    } catch (_) {
      setStatus('Bố cục hiện vẫn dùng được, nhưng trình duyệt không cho phép lưu lâu dài.', 'error');
    }
  }

  function makeMaterial(color, options) {
    return new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.72, metalness: 0.04 }, options));
  }

  function addBox(parent, size, position, material, rotation) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(size[0], size[1], size[2]), material);
    mesh.position.set(position[0], position[1], position[2]);
    if (rotation) mesh.rotation.set(rotation[0], rotation[1], rotation[2]);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  function addCylinder(parent, radiusTop, radiusBottom, height, position, material, rotation) {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radiusTop, radiusBottom, height, 24), material);
    mesh.position.set(position[0], position[1], position[2]);
    if (rotation) mesh.rotation.set(rotation[0], rotation[1], rotation[2]);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  function addBeam(parent, from, to, radius, material) {
    const start = new THREE.Vector3(from[0], from[1], from[2]);
    const end = new THREE.Vector3(to[0], to[1], to[2]);
    const direction = new THREE.Vector3().subVectors(end, start);
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, direction.length(), 16), material);
    beam.position.copy(start).add(end).multiplyScalar(0.5);
    beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
    beam.castShadow = true;
    parent.add(beam);
    return beam;
  }

  function createFurniture() {
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(12, 5), makeMaterial('#e6dfd5'));
    wall.position.set(0, 2.5, -2.6);
    scene.add(wall);

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), makeMaterial('#d8d0c5'));
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.02;
    floor.receiveShadow = true;
    scene.add(floor);
    const sideWall = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 5), makeMaterial('#e0d8ce'));
    sideWall.position.set(-4.8, 2.5, 0);
    sideWall.rotation.y = Math.PI / 2;
    scene.add(sideWall);

    cabinetGroup = new THREE.Group();
    const wood = makeMaterial('#936f50');
    const shelf = makeMaterial('#b18b67');
    addBox(cabinetGroup, [0.06, 1.9, 0.52], [-0.56, 0.96, 0], wood);
    addBox(cabinetGroup, [0.06, 1.9, 0.52], [0.56, 0.96, 0], wood);
    addBox(cabinetGroup, [1.18, 0.06, 0.52], [0, 0.03, 0], wood);
    addBox(cabinetGroup, [1.18, 0.06, 0.52], [0, 1.89, 0], wood);
    addBox(cabinetGroup, [1.1, 1.82, 0.035], [0, 0.96, -0.235], makeMaterial('#d0b99d'));
    [0.58, 1.02, 1.46].forEach((height) => {
      addBox(cabinetGroup, [1.12, 0.045, 0.5], [0, height, 0.015], shelf);
    });
    cabinetGroup.traverse((object) => {
      if (object.isMesh) object.userData.furnitureKey = 'cabinet';
    });
    scene.add(cabinetGroup);

    deskGroup = new THREE.Group();
    deskMaterial = makeMaterial('#bc9167');
    addBox(deskGroup, [2.35, 0.07, 0.86], [0, 0.78, 0], deskMaterial);
    const legMaterial = makeMaterial('#493d33');
    [-1.01, 1.01].forEach((x) => [-0.31, 0.31].forEach((z) => {
      addBox(deskGroup, [0.07, 0.75, 0.07], [x, 0.39, z], legMaterial);
    }));
    addBox(deskGroup, [2.16, 0.045, 0.06], [0, 0.48, -0.28], legMaterial);
    deskGroup.traverse((object) => {
      if (object.isMesh) object.userData.furnitureKey = 'desk';
    });
    scene.add(deskGroup);
  }

  function createProductModel(product, color) {
    const group = new THREE.Group();
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
      const shell = new THREE.Mesh(new THREE.SphereGeometry(1, 28, 20), body);
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
    } else if (product.category === 'organize') {
      if (product.id === 'hs01') {
        addCylinder(group, 0.085, 0.085, 0.025, [0, 0.013, 0], body);
        addCylinder(group, 0.018, 0.018, 0.27, [0, 0.16, 0], metal);
        const headband = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.014, 10, 28, Math.PI), body);
        headband.position.set(0, 0.31, 0);
        headband.rotation.z = Math.PI;
        headband.castShadow = true;
        group.add(headband);
      } else if (product.id === 'cm02') {
        addBox(group, [0.38, 0.018, 0.13], [0, 0.018, 0], body);
        addBox(group, [0.38, 0.075, 0.012], [0, 0.055, -0.06], body);
        addBox(group, [0.012, 0.075, 0.13], [-0.184, 0.055, 0], body);
        addBox(group, [0.012, 0.075, 0.13], [0.184, 0.055, 0], body);
        [-0.1, 0, 0.1].forEach((x) => addBox(group, [0.055, 0.003, 0.012], [x, 0.029, 0.02], dark));
      } else {
        addBox(group, [0.66, 0.045, 0.25], [0, 0.34, 0], body);
        [-0.25, 0.25].forEach((x) => addBox(group, [0.035, 0.32, 0.23], [x, 0.17, 0], metal));
      }
    } else {
      addBox(group, [0.28, 0.12, 0.22], [0, 0.06, 0], body);
    }
    return group;
  }

  function disposeGroup(group) {
    group.traverse((object) => {
      if (!object.isMesh) return;
      object.geometry.dispose();
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach((material) => material.dispose());
    });
    if (group.parent) group.parent.remove(group);
  }

  function getProductEntry(item) {
    return {
      key: item.key || item.id + ':' + item.color.id,
      product: item.product,
      color: item.color,
      quantity: item.quantity || 1,
      preview: false,
    };
  }

  function currentEntries() {
    const entries = cart.getItems().map(getProductEntry);
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
    const column = index % 3;
    const row = Math.min(2, Math.floor(index / 3));
    return {
      x: -0.34 + column * 0.34,
      y: [0.61, 1.05, 1.49][row],
      z: 0.27,
    };
  }

  function deskPosition(index) {
    return {
      x: -0.48 + (index % 3) * 0.48,
      z: -0.14 + Math.floor(index / 3) * 0.27,
    };
  }

  function localToWorld(position) {
    const point = new THREE.Vector3(position.x, 0, position.z);
    point.applyAxisAngle(new THREE.Vector3(0, 1, 0), deskGroup.rotation.y);
    point.add(deskGroup.position);
    return point;
  }

  function worldToDeskLocal(position) {
    const point = new THREE.Vector3(position.x - deskGroup.position.x, 0, position.z - deskGroup.position.z);
    point.applyAxisAngle(new THREE.Vector3(0, 1, 0), -deskGroup.rotation.y);
    return point;
  }

  function updatePlacedProducts() {
    for (const item of sceneItems.values()) {
      if (!item.placed || item.surface !== 'desk') continue;
      const world = localToWorld(item.localPosition);
      item.group.position.set(world.x, deskTop, world.z);
      item.group.rotation.y = deskGroup.rotation.y;
    }
  }

  function furnitureGroup(key) {
    return key === 'cabinet' ? cabinetGroup : deskGroup;
  }

  function currentFurnitureTransform() {
    return furnitureGroup(selectedFurnitureKey);
  }

  function saveFurnitureLayout() {
    updatePlacedProducts();
    saveLayout();
  }

  function selectFurniture(key) {
    if (key !== 'desk' && key !== 'cabinet') return;
    selectedFurnitureKey = key;
    document.getElementById('studio-furniture-select').value = key;
    if (furnitureMoveMode) {
      document.getElementById('studio-canvas-hint').textContent = 'Đang kéo '
        + (selectedFurnitureKey === 'desk' ? 'bàn làm việc' : 'tủ đựng đồ')
        + ' · Nhấn “Xong di chuyển” để xoay góc nhìn';
    }
  }

  function moveFurniture(key, x, z) {
    const group = furnitureGroup(key);
    group.position.x = THREE.MathUtils.clamp(group.position.x + x, furnitureBounds.minX, furnitureBounds.maxX);
    group.position.z = THREE.MathUtils.clamp(group.position.z + z, furnitureBounds.minZ, furnitureBounds.maxZ);
    saveFurnitureLayout();
  }

  function rotateFurniture(direction) {
    const group = currentFurnitureTransform();
    group.rotation.y += direction * Math.PI / 2;
    saveFurnitureLayout();
    setStatus((selectedFurnitureKey === 'desk' ? 'Bàn làm việc' : 'Tủ đựng đồ') + ' đã xoay 90°.', 'success');
  }

  function placeOnDesk(key, position) {
    const item = sceneItems.get(key);
    if (!item) return;
    const point = position ? worldToDeskLocal(position) : deskPosition(Array.from(sceneItems.values()).filter((value) => value.placed).length);
    item.localPosition.set(
      THREE.MathUtils.clamp(point.x, -1.02, 1.02),
      0,
      THREE.MathUtils.clamp(point.z, -0.34, 0.34),
    );
    scene.attach(item.group);
    const world = localToWorld(item.localPosition);
    item.group.position.set(world.x, deskTop, world.z);
    item.group.rotation.y = deskGroup.rotation.y;
    item.group.scale.setScalar(1);
    item.placed = true;
    item.surface = 'desk';
    selectedItemKey = key;
    saveLayout();
    renderInventory();
    setStatus(item.entry.product.name + ' đã được đặt lên bàn. Kéo mô hình để đổi vị trí.', 'success');
  }

  function placeOnFloor(key, position) {
    const item = sceneItems.get(key);
    if (!item) return;
    item.placed = true;
    item.surface = 'floor';
    item.localPosition.set(
      THREE.MathUtils.clamp(position.x, roomBounds.minX, roomBounds.maxX),
      0,
      THREE.MathUtils.clamp(position.z, roomBounds.minZ, roomBounds.maxZ),
    );
    scene.attach(item.group);
    item.group.position.set(item.localPosition.x, 0.005, item.localPosition.z);
    item.group.rotation.y = 0;
    item.group.scale.setScalar(1);
    selectedItemKey = key;
    saveLayout();
    renderInventory();
    setStatus(item.entry.product.name + ' đã được đặt xuống sàn. Bạn có thể kéo vào góc phòng hoặc kéo lên bàn.', 'success');
  }

  function productDropPosition(event) {
    raycaster.setFromCamera(normalizedPointer(event), camera);
    const desktopPoint = new THREE.Vector3();
    const onDesktop = raycaster.ray.intersectPlane(placementPlane, desktopPoint);
    if (onDesktop) {
      const local = worldToDeskLocal(desktopPoint);
      if (Math.abs(local.x) <= 1.07 && Math.abs(local.z) <= 0.36) {
        return { surface: 'desk', position: desktopPoint };
      }
    }
    const floorPoint = floorPosition(event);
    if (!floorPoint) return null;
    return {
      surface: 'floor',
      position: new THREE.Vector3(
        THREE.MathUtils.clamp(floorPoint.x, roomBounds.minX, roomBounds.maxX),
        0,
        THREE.MathUtils.clamp(floorPoint.z, roomBounds.minZ, roomBounds.maxZ),
      ),
    };
  }

  function putAway(key) {
    const item = sceneItems.get(key);
    if (!item) return;
    item.placed = false;
    item.surface = 'cabinet';
    cabinetGroup.attach(item.group);
    item.group.position.copy(item.shelfPosition);
    item.group.rotation.set(0, 0, 0);
    item.group.scale.setScalar(0.72);
    selectedItemKey = null;
    saveLayout();
    renderInventory();
    setStatus(item.entry.product.name + ' đã được cất lại trong tủ.', 'info');
  }

  function clearProductModels() {
    for (const item of sceneItems.values()) disposeGroup(item.group);
    sceneItems.clear();
  }

  function syncScene() {
    let entries;
    try {
      entries = currentEntries();
    } catch (error) {
      setStatus('Không thể đọc giỏ hàng trên thiết bị này: ' + error.message, 'error');
      return;
    }
    const savedLayout = safeLayout();
    deskGroup.position.set(savedLayout.furniture.desk.x, 0, savedLayout.furniture.desk.z);
    deskGroup.rotation.y = savedLayout.furniture.desk.rotation;
    cabinetGroup.position.set(savedLayout.furniture.cabinet.x, 0, savedLayout.furniture.cabinet.z);
    cabinetGroup.rotation.y = savedLayout.furniture.cabinet.rotation;
    clearProductModels();
    inventoryItems = new Map(entries.map((entry) => [entry.key, entry]));

    entries.forEach((entry, index) => {
      const group = createProductModel(entry.product, entry.color);
      const saved = savedLayout.products[entry.key];
      const placed = Boolean(saved);
      const shelf = shelfPosition(index);
      const surface = saved && saved.surface === 'floor' ? 'floor' : 'desk';
      const localPosition = new THREE.Vector3(
        saved ? (surface === 'floor' ? THREE.MathUtils.clamp(saved.x, roomBounds.minX, roomBounds.maxX) : THREE.MathUtils.clamp(saved.x, -1.02, 1.02)) : 0,
        0,
        saved ? (surface === 'floor' ? THREE.MathUtils.clamp(saved.z, roomBounds.minZ, roomBounds.maxZ) : THREE.MathUtils.clamp(saved.z, -0.34, 0.34)) : 0,
      );
      group.position.set(saved ? 0 : shelf.x, saved ? deskTop : shelf.y, saved ? 0 : shelf.z);
      group.scale.setScalar(placed ? 1 : 0.72);
      group.traverse((object) => {
        if (object.isMesh) object.userData.productKey = entry.key;
      });
      if (placed && surface === 'desk') {
        const world = localToWorld(localPosition);
        group.position.set(world.x, deskTop, world.z);
        group.rotation.y = deskGroup.rotation.y;
        scene.add(group);
      } else if (placed) {
        group.position.set(localPosition.x, 0.005, localPosition.z);
        group.rotation.y = 0;
        scene.add(group);
      } else {
        cabinetGroup.add(group);
      }
      sceneItems.set(entry.key, { entry, group, placed, surface: placed ? surface : 'cabinet', localPosition, shelfPosition: new THREE.Vector3(shelf.x, shelf.y, shelf.z) });
    });

    const quantity = entries.reduce((total, entry) => total + (entry.preview ? 0 : entry.quantity), 0);
    cartCount.textContent = quantity + ' món';
    renderInventory();
    saveLayout();
  }

  function renderInventory() {
    const entries = Array.from(inventoryItems.values());
    if (!entries.length) {
      inventory.innerHTML = '<div class="studio-inventory-empty">Tủ đang trống. Hãy thêm sản phẩm vào giỏ hàng để chúng xuất hiện ở đây, hoặc mở một sản phẩm và chọn “Thử sản phẩm trong 3D”.</div>';
      return;
    }
    inventory.innerHTML = entries.map((entry) => {
      const item = sceneItems.get(entry.key);
      const placed = item && item.placed;
      const productName = catalog.escapeHtml(entry.product.name);
      const colorName = catalog.escapeHtml(entry.color.name);
      const image = catalog.escapeHtml(entry.color.image);
      const previewLabel = entry.preview ? ' · Đang thử, chưa trong giỏ' : ' · SL ' + entry.quantity;
      return `<article class="studio-item" draggable="true" data-item-key="${catalog.escapeHtml(entry.key)}" aria-label="${productName}, ${colorName}${entry.preview ? ', sản phẩm thử' : ', số lượng ' + entry.quantity}">
        <img src="${image}" alt="" width="60" height="60" loading="lazy">
        <div class="studio-item-copy"><strong>${productName}</strong><span>${colorName}${catalog.escapeHtml(previewLabel)}</span>
        <button type="button" data-action="${placed ? 'put-away' : 'place'}" data-item-key="${catalog.escapeHtml(entry.key)}">${placed ? 'Cất vào tủ' : 'Đặt lên bàn'}</button></div>
      </article>`;
    }).join('');
  }

  function updateCamera() {
    const sinPhi = Math.sin(orbit.phi);
    camera.position.set(
      target.x + orbit.radius * sinPhi * Math.sin(orbit.theta),
      target.y + orbit.radius * Math.cos(orbit.phi),
      target.z + orbit.radius * sinPhi * Math.cos(orbit.theta),
    );
    camera.lookAt(target);
  }

  function normalizedPointer(event) {
    const rect = canvas.getBoundingClientRect();
    return new THREE.Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1,
    );
  }

  function planePosition(event) {
    raycaster.setFromCamera(normalizedPointer(event), camera);
    const point = new THREE.Vector3();
    return raycaster.ray.intersectPlane(placementPlane, point);
  }

  function floorPosition(event) {
    raycaster.setFromCamera(normalizedPointer(event), camera);
    const point = new THREE.Vector3();
    return raycaster.ray.intersectPlane(floorPlane, point);
  }

  function objectAtPointer(event) {
    raycaster.setFromCamera(normalizedPointer(event), camera);
    const placedItems = Array.from(sceneItems.values()).filter((item) => item.placed).map((item) => item.group);
    const hits = raycaster.intersectObjects([deskGroup, cabinetGroup, ...placedItems], true);
    return hits.find((result) => result.object.userData.productKey)
      || hits.find((result) => result.object.userData.furnitureKey)
      || null;
  }

  function onPointerDown(event) {
    pointerStart = { x: event.clientX, y: event.clientY, theta: orbit.theta, phi: orbit.phi };
    if (furnitureMoveMode) {
      draggedFurnitureKey = selectedFurnitureKey;
      const point = floorPosition(event);
      const group = currentFurnitureTransform();
      if (point) dragOffset = { x: group.position.x - point.x, z: group.position.z - point.z };
      canvas.setPointerCapture(event.pointerId);
      return;
    }
    const hit = objectAtPointer(event);
    const key = hit && hit.object.userData.productKey;
    const item = key && sceneItems.get(key);
    if (item && item.placed) {
      draggedItemKey = key;
      return canvas.setPointerCapture(event.pointerId);
    }
    let furnitureKey = hit && hit.object.userData.furnitureKey;
    if (item && !item.placed) furnitureKey = 'cabinet';
    if (furnitureKey) {
      selectFurniture(furnitureKey);
      draggedFurnitureKey = furnitureKey;
      const point = floorPosition(event);
      const group = furnitureGroup(furnitureKey);
      if (point) dragOffset = { x: group.position.x - point.x, z: group.position.z - point.z };
      setStatus((furnitureKey === 'desk' ? 'Bàn làm việc' : 'Tủ đựng đồ') + ' được chọn. Kéo để di chuyển hoặc dùng các nút điều khiển.', 'info');
    }
    canvas.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event) {
    if (!pointerStart) return;
    const dx = event.clientX - pointerStart.x;
    const dy = event.clientY - pointerStart.y;
    if (draggedItemKey) {
      const drop = productDropPosition(event);
      if (drop) {
        const item = sceneItems.get(draggedItemKey);
        if (drop.surface === 'desk') {
          item.surface = 'desk';
          item.localPosition.copy(worldToDeskLocal(drop.position));
          scene.attach(item.group);
          updatePlacedProducts();
        } else {
          item.surface = 'floor';
          item.localPosition.set(drop.position.x, 0, drop.position.z);
          scene.attach(item.group);
          item.group.position.set(drop.position.x, 0.005, drop.position.z);
          item.group.rotation.y = 0;
        }
      }
      return;
    }
    if (draggedFurnitureKey) {
      const point = floorPosition(event);
      if (point && dragOffset) {
        const group = furnitureGroup(draggedFurnitureKey);
        group.position.x = THREE.MathUtils.clamp(point.x + dragOffset.x, furnitureBounds.minX, furnitureBounds.maxX);
        group.position.z = THREE.MathUtils.clamp(point.z + dragOffset.z, furnitureBounds.minZ, furnitureBounds.maxZ);
        if (draggedFurnitureKey === 'desk') updatePlacedProducts();
      }
      return;
    }
    orbit.theta = pointerStart.theta - dx * 0.008;
    orbit.phi = THREE.MathUtils.clamp(pointerStart.phi + dy * 0.006, 0.28, 1.48);
    updateCamera();
  }

  function onPointerUp() {
    if (draggedItemKey) {
      saveLayout();
      renderInventory();
      const item = sceneItems.get(draggedItemKey);
      setStatus(item.surface === 'floor'
        ? 'Đã đặt ' + item.entry.product.name + ' xuống sàn. Bạn có thể kéo vào góc phòng.'
        : 'Đã cập nhật vị trí ' + item.entry.product.name + ' trên bàn.', 'success');
    }
    if (draggedFurnitureKey) {
      saveFurnitureLayout();
      setStatus('Đã cập nhật vị trí ' + (draggedFurnitureKey === 'desk' ? 'bàn làm việc.' : 'tủ đựng đồ.'), 'success');
    }
    pointerStart = null;
    draggedItemKey = null;
    draggedFurnitureKey = null;
    dragOffset = null;
  }

  function initScene() {
    if (!THREE) {
      canvasError.hidden = false;
      setStatus('Đồ họa 3D chưa khả dụng trên trình duyệt này.', 'error');
      return false;
    }

    try {
      scene = new THREE.Scene();
      scene.background = new THREE.Color('#ece7df');
      scene.fog = new THREE.Fog('#ece7df', 9, 19);
      camera = new THREE.PerspectiveCamera(36, 1, 0.1, 60);
      target = new THREE.Vector3(-0.45, 0.95, 0);
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
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
      updateCamera();

      const resize = () => {
        const width = canvasWrap.clientWidth;
        const height = canvasWrap.clientHeight;
        if (!width || !height) return;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height, false);
      };
      new ResizeObserver(resize).observe(canvasWrap);
      resize();
      root.requestAnimationFrame(function render() {
        renderer.render(scene, camera);
        root.requestAnimationFrame(render);
      });

      canvas.addEventListener('pointerdown', onPointerDown);
      canvas.addEventListener('pointermove', onPointerMove);
      canvas.addEventListener('pointerup', onPointerUp);
      canvas.addEventListener('pointercancel', onPointerUp);
      canvas.addEventListener('wheel', (event) => {
        event.preventDefault();
        orbit.radius = THREE.MathUtils.clamp(orbit.radius + event.deltaY * 0.003, 4.4, 9.5);
        updateCamera();
      }, { passive: false });
      canvas.addEventListener('dragover', (event) => event.preventDefault());
      canvas.addEventListener('drop', (event) => {
        event.preventDefault();
        const key = event.dataTransfer.getData('application/x-goc-desk-product');
        const drop = productDropPosition(event);
        if (!key || !drop) return;
        if (drop.surface === 'desk') placeOnDesk(key, drop.position);
        else placeOnFloor(key, drop.position);
      });
      return true;
    } catch (error) {
      canvasError.hidden = false;
      setStatus('Không thể khởi tạo không gian 3D: ' + error.message, 'error');
      return false;
    }
  }

  inventory.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-action]');
    if (!button) return;
    if (button.dataset.action === 'place') placeOnDesk(button.dataset.itemKey);
    else putAway(button.dataset.itemKey);
  });
  inventory.addEventListener('dragstart', (event) => {
    const card = event.target.closest('[data-item-key]');
    if (!card || !event.dataTransfer) return;
    event.dataTransfer.setData('application/x-goc-desk-product', card.dataset.itemKey);
    event.dataTransfer.effectAllowed = 'move';
  });

  document.getElementById('studio-desk-color').addEventListener('change', (event) => {
    const colors = { oak: '#bc9167', walnut: '#68452f', white: '#e8e5de' };
    if (deskMaterial) deskMaterial.color.set(colors[event.target.value]);
  });
  document.getElementById('studio-reset-view').addEventListener('click', () => {
    orbit = { theta: 0.68, phi: 1.08, radius: 8 };
    updateCamera();
  });
  document.getElementById('studio-clear-layout').addEventListener('click', () => {
    for (const [key, item] of sceneItems) {
      item.placed = false;
      item.surface = 'cabinet';
      cabinetGroup.attach(item.group);
      item.group.position.copy(item.shelfPosition);
      item.group.rotation.set(0, 0, 0);
      item.group.scale.setScalar(0.72);
      if (key === selectedItemKey) selectedItemKey = null;
    }
    saveLayout();
    renderInventory();
    setStatus('Đã cất các sản phẩm về tủ.', 'info');
  });
  document.getElementById('studio-furniture-select').addEventListener('change', (event) => {
    selectFurniture(event.target.value);
    setStatus('Đã chọn ' + (selectedFurnitureKey === 'desk' ? 'bàn làm việc.' : 'tủ đựng đồ.'), 'info');
  });
  document.getElementById('studio-move-mode').addEventListener('click', (event) => {
    furnitureMoveMode = !furnitureMoveMode;
    event.currentTarget.setAttribute('aria-pressed', String(furnitureMoveMode));
    event.currentTarget.textContent = furnitureMoveMode ? 'Xong di chuyển' : 'Bật kéo vật thể đã chọn';
    canvasWrap.classList.toggle('studio-moving-furniture', furnitureMoveMode);
    document.getElementById('studio-canvas-hint').textContent = furnitureMoveMode
      ? 'Đang kéo ' + (selectedFurnitureKey === 'desk' ? 'bàn làm việc' : 'tủ đựng đồ') + ' · Nhấn “Xong di chuyển” để xoay góc nhìn'
      : 'Kéo nền để xoay góc nhìn · Kéo bàn hoặc tủ để di chuyển';
    setStatus(furnitureMoveMode
      ? 'Đang bật chế độ kéo ' + (selectedFurnitureKey === 'desk' ? 'bàn làm việc.' : 'tủ đựng đồ.')
      : 'Đã tắt chế độ di chuyển vật thể.', 'info');
  });
  document.querySelectorAll('.studio-move-pad [data-move]').forEach((button) => {
    button.addEventListener('click', () => {
      const step = 0.2;
      const directions = {
        forward: [0, -step],
        back: [0, step],
        left: [-step, 0],
        right: [step, 0],
      };
      const [x, z] = directions[button.dataset.move];
      moveFurniture(selectedFurnitureKey, x, z);
      setStatus('Đã di chuyển ' + (selectedFurnitureKey === 'desk' ? 'bàn làm việc.' : 'tủ đựng đồ.'), 'success');
    });
  });
  document.getElementById('studio-rotate-left').addEventListener('click', () => rotateFurniture(-1));
  document.getElementById('studio-rotate-right').addEventListener('click', () => rotateFurniture(1));
  document.getElementById('studio-reset-furniture').addEventListener('click', () => {
    for (const key of ['desk', 'cabinet']) {
      const group = furnitureGroup(key);
      group.position.set(defaultFurniture[key].x, 0, defaultFurniture[key].z);
      group.rotation.y = defaultFurniture[key].rotation;
    }
    saveFurnitureLayout();
    setStatus('Đã đặt lại bàn và tủ về vị trí ban đầu.', 'success');
  });

  if (!initScene()) return;
  setStatus(previewProduct ? 'Sản phẩm đang xem đã sẵn sàng để thử trong không gian 3D.' : 'Sản phẩm trong giỏ sẽ tự xuất hiện trong tủ.', 'info');
  syncScene();
  cartUnsubscribe = cart.subscribe(syncScene);
  root.addEventListener('pagehide', () => cartUnsubscribe(), { once: true });
})(globalThis, globalThis.GocDeskCatalog);
