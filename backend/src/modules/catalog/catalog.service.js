const { createApiError } = require('../../middlewares/error-handler');
const { createCatalogModel } = require('./catalog.model');

const RESOURCE_LABELS = Object.freeze({
  categories: 'danh mục',
  brands: 'thương hiệu',
  useCases: 'nhu cầu sử dụng',
});

function mapDatabaseError(error, resource) {
  if (error.code === 'ER_DUP_ENTRY') {
    const code = resource === 'categories' ? 'CATEGORY_SLUG_EXISTS'
      : resource === 'brands' ? 'BRAND_SLUG_EXISTS'
        : 'USE_CASE_SLUG_EXISTS';
    return createApiError(409, code, `Slug ${RESOURCE_LABELS[resource]} đã tồn tại.`);
  }
  if (['ER_ROW_IS_REFERENCED_2', 'ER_NO_REFERENCED_ROW_2'].includes(error.code)) {
    return createApiError(409, 'CATALOG_REFERENCE_CONFLICT', 'Không thể xóa hoặc cập nhật vì dữ liệu đang được tham chiếu.');
  }
  if (['ECONNREFUSED', 'ETIMEDOUT', 'PROTOCOL_CONNECTION_LOST', 'ER_ACCESS_DENIED_ERROR', 'ER_BAD_DB_ERROR'].includes(error.code)) {
    return createApiError(503, 'DATABASE_UNAVAILABLE', 'Cơ sở dữ liệu tạm thời không khả dụng.');
  }
  return error;
}

function createCatalogService({ model = createCatalogModel() } = {}) {
  async function run(resource, method, ...args) {
    try {
      return await model[method](resource, ...args);
    } catch (error) {
      throw mapDatabaseError(error, resource);
    }
  }

  async function list(resource, query, options) {
    return run(resource, 'list', query, options);
  }

  async function get(resource, id, options) {
    const record = await run(resource, 'find', id, options);
    if (!record) {
      throw createApiError(404, 'RESOURCE_NOT_FOUND', `Không tìm thấy ${RESOURCE_LABELS[resource]}.`);
    }
    return record;
  }

  async function create(resource, input) {
    return run(resource, 'create', input);
  }

  async function update(resource, id, input) {
    const record = await run(resource, 'update', id, input);
    if (!record) {
      throw createApiError(404, 'RESOURCE_NOT_FOUND', `Không tìm thấy ${RESOURCE_LABELS[resource]}.`);
    }
    return record;
  }

  async function remove(resource, id) {
    const result = await run(resource, 'remove', id);
    if (!result.found) {
      throw createApiError(404, 'RESOURCE_NOT_FOUND', `Không tìm thấy ${RESOURCE_LABELS[resource]}.`);
    }
    if (!result.deleted) {
      throw createApiError(409, 'CATALOG_RESOURCE_IN_USE', `Không thể xóa ${RESOURCE_LABELS[resource]} đang được sử dụng.`);
    }
    return { id };
  }

  return { create, get, list, remove, update };
}

module.exports = { createCatalogService };
