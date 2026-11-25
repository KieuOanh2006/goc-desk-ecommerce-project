const { createContentService } = require('./content.service');

const RESOURCE_LABELS = Object.freeze({
  articleCategories: 'chủ đề bài viết',
  articles: 'nội dung bài viết',
  websiteContents: 'nội dung website',
});

function createContentController(service = createContentService()) {
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

  function get(resource, publicOnly, lookupOptions = {}) {
    return handle(async (req, res) => {
      const key = req.validated.params.id || req.validated.params.slug || req.validated.params.contentKey;
      const data = await service.get(resource, key, { publicOnly, ...lookupOptions });
      return res.json({ success: true, message: `Lấy ${RESOURCE_LABELS[resource]} thành công.`, data });
    });
  }

  function create(resource) {
    return handle(async (req, res) => {
      const data = await service.create(resource, req.validated.body, { actorUserId: req.auth.user.id });
      return res.status(201).json({ success: true, message: `Tạo ${RESOURCE_LABELS[resource]} thành công.`, data });
    });
  }

  function update(resource) {
    return handle(async (req, res) => {
      const data = await service.update(resource, req.validated.params.id, req.validated.body, { actorUserId: req.auth.user.id });
      return res.json({ success: true, message: `Cập nhật ${RESOURCE_LABELS[resource]} thành công.`, data });
    });
  }

  function remove(resource) {
    return handle(async (req, res) => {
      const data = await service.remove(resource, req.validated.params.id);
      return res.json({ success: true, message: `Xóa ${RESOURCE_LABELS[resource]} thành công.`, data });
    });
  }

  return { create, get, list, remove, update };
}

module.exports = { createContentController };
