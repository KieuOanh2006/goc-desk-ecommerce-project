const { createApiError } = require('../../middlewares/error-handler');
const { createStudioAssetsModel } = require('./studio-assets.model');

const RESOURCE_LABELS = Object.freeze({
  rooms: 'phòng mẫu',
  furnitureAssets: 'nội thất',
  productModels: 'mô hình sản phẩm 3D',
});
const FURNITURE_RENDERER_KEYS = new Set(['desk', 'cabinet', 'bed', 'chair', 'rug', 'plant']);
const PRODUCT_RENDERER_KEYS = new Set(['keyboard', 'mouse', 'lamp', 'stand', 'pad', 'organize']);

function validateFurnitureWithinRoom(room, placements, { statusCode = 422, code = 'FURNITURE_OUT_OF_BOUNDS' } = {}) {
  const bounds = room.roomConfig?.room;
  if (!bounds) throw createApiError(409, 'ROOM_CONFIG_INVALID', 'Phòng mẫu chưa có giới hạn không gian hợp lệ.');
  for (const placement of placements) {
    const asset = placement.asset || placement;
    const size = asset.dimensions;
    if (!size || !Number.isFinite(Number(size.width)) || !Number.isFinite(Number(size.depth))) {
      throw createApiError(409, 'FURNITURE_DIMENSIONS_INVALID', 'Nội thất cần có kích thước hợp lệ trước khi đặt vào phòng.');
    }
    const cosine = Math.abs(Math.cos(Number(placement.rotation)));
    const sine = Math.abs(Math.sin(Number(placement.rotation)));
    const halfWidth = (cosine * Number(size.width) + sine * Number(size.depth)) / 2;
    const halfDepth = (sine * Number(size.width) + cosine * Number(size.depth)) / 2;
    if (Number(placement.positionX) - halfWidth < bounds.minX || Number(placement.positionX) + halfWidth > bounds.maxX
      || Number(placement.positionZ) - halfDepth < bounds.minZ || Number(placement.positionZ) + halfDepth > bounds.maxZ) {
      throw createApiError(statusCode, code, `${asset.name || 'Nội thất'} vượt ngoài giới hạn phòng mẫu.`);
    }
  }
}

function mapDatabaseError(error, resource) {
  if (error.code === 'ER_DUP_ENTRY') {
    const code = resource === 'rooms' ? 'ROOM_SLUG_EXISTS'
      : resource === 'furnitureAssets' ? 'FURNITURE_ASSET_CODE_EXISTS'
        : 'PRODUCT_3D_MODEL_EXISTS';
    return createApiError(409, code, 'Một bản ghi có cùng mã định danh đã tồn tại.');
  }
  if (error.code === 'ER_ROW_IS_REFERENCED_2') {
    return createApiError(409, 'STUDIO_RESOURCE_IN_USE', 'Không thể xóa dữ liệu đang được một phòng hoặc bản thiết kế tham chiếu.');
  }
  if (error.code === 'ER_NO_REFERENCED_ROW_2') {
    return createApiError(409, 'STUDIO_REFERENCE_NOT_FOUND', 'Một bản ghi được liên kết không còn tồn tại.');
  }
  if (['ECONNREFUSED', 'ETIMEDOUT', 'PROTOCOL_CONNECTION_LOST', 'ER_ACCESS_DENIED_ERROR', 'ER_BAD_DB_ERROR'].includes(error.code)) {
    return createApiError(503, 'DATABASE_UNAVAILABLE', 'Cơ sở dữ liệu tạm thời không khả dụng.');
  }
  return error;
}

function createStudioAssetsService({ model = createStudioAssetsModel() } = {}) {
  async function run(resource, method, ...args) {
    try {
      return await model[method](...args);
    } catch (error) {
      throw mapDatabaseError(error, resource);
    }
  }

  async function list(resource, query, options = {}) {
    const methods = { rooms: 'listRooms', furnitureAssets: 'listFurnitureAssets', productModels: 'listProductModels' };
    if (!methods[resource]) throw new TypeError(`Unsupported studio resource: ${resource}`);
    return run(resource, methods[resource], query, options);
  }

  async function get(resource, id, options = {}) {
    const methods = { rooms: 'findRoom', furnitureAssets: 'findFurnitureAsset', productModels: 'findProductModel' };
    if (!methods[resource]) throw new TypeError(`Unsupported studio resource: ${resource}`);
    const result = await run(resource, methods[resource], id, options);
    if (!result) throw createApiError(404, 'STUDIO_RESOURCE_NOT_FOUND', `Không tìm thấy ${RESOURCE_LABELS[resource]}.`);
    return result;
  }

  async function create(resource, input) {
    const methods = { rooms: 'createRoom', furnitureAssets: 'createFurnitureAsset' };
    if (resource === 'productModels') return createProductModel(input);
    if (!methods[resource]) throw new TypeError(`Unsupported studio resource: ${resource}`);
    if (resource === 'furnitureAssets') assertFurnitureRenderer(input);
    const result = await run(resource, methods[resource], input);
    if (!result) throw createApiError(404, 'STUDIO_RESOURCE_NOT_FOUND', `Không tìm thấy ${RESOURCE_LABELS[resource]}.`);
    return result;
  }

  async function update(resource, id, input) {
    if (resource === 'productModels') return updateProductModel(id, input);
    const methods = { rooms: 'updateRoom', furnitureAssets: 'updateFurnitureAsset' };
    if (!methods[resource]) throw new TypeError(`Unsupported studio resource: ${resource}`);
    const validateRoom = ({ room, placements }) => {
      if (input.roomConfig) {
        validateFurnitureWithinRoom({ ...room, roomConfig: input.roomConfig }, placements, {
          statusCode: 409,
          code: 'ROOM_LAYOUT_OUT_OF_BOUNDS',
        });
      }
    };
    const validateAsset = assertFurnitureRenderer;
    const result = resource === 'rooms'
      ? await run(resource, methods[resource], id, input, validateRoom)
      : await run(resource, methods[resource], id, input, validateAsset);
    if (!result) throw createApiError(404, 'STUDIO_RESOURCE_NOT_FOUND', `Không tìm thấy ${RESOURCE_LABELS[resource]}.`);
    if (result.inUse) {
      throw createApiError(409, 'FURNITURE_ASSET_IN_USE', 'Gỡ nội thất khỏi phòng/bộ thiết kế trước khi đổi kích thước, renderer hoặc trạng thái.');
    }
    return result;
  }

  async function remove(resource, id) {
    const methods = { rooms: 'removeRoom', furnitureAssets: 'removeFurnitureAsset', productModels: 'removeProductModel' };
    if (!methods[resource]) throw new TypeError(`Unsupported studio resource: ${resource}`);
    const result = await run(resource, methods[resource], id);
    if (!result.found) throw createApiError(404, 'STUDIO_RESOURCE_NOT_FOUND', `Không tìm thấy ${RESOURCE_LABELS[resource]}.`);
    if (!result.deleted) throw createApiError(409, 'STUDIO_RESOURCE_IN_USE', 'Không thể xóa dữ liệu đang được một phòng hoặc bản thiết kế tham chiếu.');
    return { id };
  }

  function assertRenderer(record, allowedKeys, subject) {
    if (record.rendererType === 'procedural') {
      if (!allowedKeys.has(record.rendererKey)) {
        throw createApiError(422, 'UNSUPPORTED_STUDIO_RENDERER', `${subject} chưa có renderer procedural tương ứng.`);
      }
      if (record.modelUrl) throw createApiError(422, 'INVALID_STUDIO_MODEL_URL', 'Renderer procedural không nhận modelUrl.');
    } else if (record.rendererType === 'glb' && !record.modelUrl) {
      throw createApiError(422, 'INVALID_STUDIO_MODEL_URL', 'Renderer GLB cần modelUrl HTTPS hoặc /models/*.glb.');
    }
  }

  function assertFurnitureRenderer(record) {
    assertRenderer(record, FURNITURE_RENDERER_KEYS, 'Nội thất');
    if (record.rendererType === 'procedural' && record.furnitureType !== record.rendererKey) {
      throw createApiError(422, 'FURNITURE_RENDERER_MISMATCH', 'furnitureType phải trùng rendererKey với renderer procedural.');
    }
  }

  async function findEligibleProduct(productId) {
    const product = await run('productModels', 'findProductForModel', productId);
    if (!product) throw createApiError(404, 'PRODUCT_NOT_FOUND', 'Không tìm thấy sản phẩm để gắn mô hình 3D.');
    if (product.status !== 'active' || product.categoryStatus !== 'active') {
      throw createApiError(409, 'PRODUCT_NOT_AVAILABLE', 'Sản phẩm hoặc danh mục đang bị ẩn.');
    }
    return product;
  }

  function assertProductRenderer(record, product) {
    assertRenderer(record, PRODUCT_RENDERER_KEYS, 'Sản phẩm');
    if (record.rendererType === 'procedural' && record.rendererKey !== product.categoryKey) {
      throw createApiError(422, 'PRODUCT_RENDERER_MISMATCH', 'rendererKey procedural phải khớp slug danh mục sản phẩm.');
    }
  }

  async function createProductModel(input) {
    const product = await findEligibleProduct(input.productId);
    assertProductRenderer(input, product);
    const result = await run('productModels', 'createProductModel', input, (lockedProduct) => assertProductRenderer(input, lockedProduct));
    if (!result.model) {
      if (!result.productFound) throw createApiError(404, 'PRODUCT_NOT_FOUND', 'Không tìm thấy sản phẩm để gắn mô hình 3D.');
      if (result.productActive === false) throw createApiError(409, 'PRODUCT_NOT_AVAILABLE', 'Sản phẩm hoặc danh mục đang bị ẩn.');
    }
    return result.model;
  }

  async function updateProductModel(id, input) {
    const result = await run('productModels', 'updateProductModel', id, input, ({ model: current, product }) => {
      assertProductRenderer({ ...current, ...input }, product);
    });
    if (!result) throw createApiError(404, 'STUDIO_RESOURCE_NOT_FOUND', `Không tìm thấy ${RESOURCE_LABELS.productModels}.`);
    if (!result.model) {
      if (!result.productFound) throw createApiError(404, 'PRODUCT_NOT_FOUND', 'Không tìm thấy sản phẩm để gắn mô hình 3D.');
      if (result.productActive === false) throw createApiError(409, 'PRODUCT_NOT_AVAILABLE', 'Sản phẩm hoặc danh mục đang bị ẩn.');
    }
    return result.model;
  }

  async function replaceRoomFurniture(id, placements) {
    for (const placement of placements) {
      if (placement.colorHex === undefined) placement.colorHex = null;
    }
    const validatePlacement = ({ room, assets }) => {
      const assetsById = new Map(assets.map((asset) => [asset.id, asset]));
      const placementsWithAssets = placements.map((placement) => ({ ...placement, asset: assetsById.get(placement.furnitureAssetId) }));
      validateFurnitureWithinRoom(room, placementsWithAssets);
    };

    const result = await run('rooms', 'replaceRoomFurniture', id, placements, validatePlacement);
    if (!result.found) throw createApiError(404, 'STUDIO_RESOURCE_NOT_FOUND', 'Không tìm thấy phòng mẫu.');
    if (result.missingAssetIds?.length) {
      throw createApiError(404, 'FURNITURE_ASSET_NOT_FOUND', 'Không tìm thấy một hoặc nhiều nội thất được chọn.', { ids: result.missingAssetIds });
    }
    if (result.inactiveAssetIds?.length) {
      throw createApiError(409, 'FURNITURE_ASSET_INACTIVE', 'Không thể dùng nội thất đang bị ẩn.', { ids: result.inactiveAssetIds });
    }
    return result.room;
  }

  return { create, get, list, remove, replaceRoomFurniture, update };
}

module.exports = { createStudioAssetsService, mapDatabaseError };
