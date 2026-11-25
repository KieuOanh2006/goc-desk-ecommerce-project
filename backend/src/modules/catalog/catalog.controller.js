const { createCatalogService } = require('./catalog.service');

const RESOURCE_NAMES = Object.freeze({
  categories: 'danh mục',
  brands: 'thương hiệu',
  useCases: 'nhu cầu sử dụng',
});

function createCatalogController(service = createCatalogService()) {
  function handle(operation) {
    return async (req, res, next) => {
      try {
        return await operation(req, res);
      } catch (error) {
        return next(error);
      }
    };
  }

  function list(resource, publicOnly) {
    return handle(async (req, res) => {
      const result = await service.list(resource, req.validated.query, { publicOnly });
      return res.json({
        success: true,
        message: `Lấy danh sách ${RESOURCE_NAMES[resource]} thành công.`,
        data: result.items,
        meta: result.meta,
      });
    });
  }

  function get(resource, publicOnly) {
    return handle(async (req, res) => {
      const data = await service.get(resource, req.validated.params.id, { publicOnly });
      return res.json({ success: true, message: `Lấy ${RESOURCE_NAMES[resource]} thành công.`, data });
    });
  }

  function create(resource) {
    return handle(async (req, res) => {
      const data = await service.create(resource, req.validated.body);
      const output = resource === 'categories'
        ? { id: data.id, name: data.name, slug: data.slug }
        : data;
      return res.status(201).json({ success: true, message: `Tạo ${RESOURCE_NAMES[resource]} thành công.`, data: output });
    });
  }

  function update(resource) {
    return handle(async (req, res) => {
      const data = await service.update(resource, req.validated.params.id, req.validated.body);
      return res.json({ success: true, message: `Cập nhật ${RESOURCE_NAMES[resource]} thành công.`, data });
    });
  }

  function remove(resource) {
    return handle(async (req, res) => {
      const data = await service.remove(resource, req.validated.params.id);
      return res.json({ success: true, message: `Xóa ${RESOURCE_NAMES[resource]} thành công.`, data });
    });
  }

  return { create, get, list, remove, update };
}

module.exports = { createCatalogController };
