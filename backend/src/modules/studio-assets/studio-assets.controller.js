const { createStudioAssetsService } = require('./studio-assets.service');

const RESOURCE_LABELS = Object.freeze({ rooms: 'phòng mẫu', furnitureAssets: 'nội thất', productModels: 'mô hình sản phẩm 3D' });

function createStudioAssetsController(service = createStudioAssetsService()) {
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
        message: `Lấy danh sách ${RESOURCE_LABELS[resource]} thành công.`,
        data: result.items,
        meta: result.meta,
      });
    });
  }

  function get(resource, publicOnly) {
    return handle(async (req, res) => {
      const data = await service.get(resource, req.validated.params.id, { publicOnly });
      return res.json({ success: true, message: `Lấy ${RESOURCE_LABELS[resource]} thành công.`, data });
    });
  }

  function create(resource) {
    return handle(async (req, res) => {
      const data = await service.create(resource, req.validated.body);
      return res.status(201).json({ success: true, message: `Tạo ${RESOURCE_LABELS[resource]} thành công.`, data });
    });
  }

  function update(resource) {
    return handle(async (req, res) => {
      const data = await service.update(resource, req.validated.params.id, req.validated.body);
      return res.json({ success: true, message: `Cập nhật ${RESOURCE_LABELS[resource]} thành công.`, data });
    });
  }

  function remove(resource) {
    return handle(async (req, res) => {
      const data = await service.remove(resource, req.validated.params.id);
      return res.json({ success: true, message: `Xóa ${RESOURCE_LABELS[resource]} thành công.`, data });
    });
  }

  function replaceRoomFurniture() {
    return handle(async (req, res) => {
      const data = await service.replaceRoomFurniture(req.validated.params.id, req.validated.body);
      return res.json({ success: true, message: 'Cập nhật bố trí nội thất phòng mẫu thành công.', data });
    });
  }

  return { create, get, list, remove, replaceRoomFurniture, update };
}

module.exports = { createStudioAssetsController };
