const { createApiError } = require('../../middlewares/error-handler');
const { createContentModel } = require('./content.model');

const RESOURCE_LABELS = Object.freeze({
  articleCategories: 'chủ đề bài viết',
  articles: 'bài viết',
  websiteContents: 'nội dung website',
});

function mapDatabaseError(error, resource) {
  if (error.code === 'ER_DUP_ENTRY') {
    const code = resource === 'articleCategories' ? 'ARTICLE_CATEGORY_SLUG_EXISTS'
      : resource === 'articles' ? 'ARTICLE_SLUG_EXISTS'
        : 'CONTENT_KEY_EXISTS';
    return createApiError(409, code, `${resource === 'websiteContents' ? 'contentKey' : 'Slug'} đã tồn tại.`);
  }
  if (['ER_ROW_IS_REFERENCED_2', 'ER_NO_REFERENCED_ROW_2'].includes(error.code)) {
    return createApiError(409, 'CONTENT_REFERENCE_CONFLICT', 'Không thể xóa hoặc cập nhật vì nội dung đang được tham chiếu.');
  }
  if (['ECONNREFUSED', 'ETIMEDOUT', 'PROTOCOL_CONNECTION_LOST', 'ER_ACCESS_DENIED_ERROR', 'ER_BAD_DB_ERROR'].includes(error.code)) {
    return createApiError(503, 'DATABASE_UNAVAILABLE', 'Cơ sở dữ liệu tạm thời không khả dụng.');
  }
  return error;
}

function assertPublishable(resource, record) {
  if (record.status !== 'published') return;
  if (resource === 'articles') {
    const hasBody = typeof record.body === 'string' && record.body.trim().length > 0;
    const hasMedia = typeof record.mediaUrl === 'string' && record.mediaUrl.length > 0;
    if (record.contentType === 'article' && !hasBody) {
      throw createApiError(422, 'CONTENT_NOT_PUBLISHABLE', 'Bài viết cần có nội dung trước khi xuất bản.');
    }
    if (record.contentType === 'video' && !hasMedia) {
      throw createApiError(422, 'CONTENT_NOT_PUBLISHABLE', 'Bài video cần có mediaUrl trước khi xuất bản.');
    }
  }
  if (resource === 'websiteContents') {
    const hasBody = typeof record.body === 'string' && record.body.trim().length > 0;
    const hasMedia = typeof record.mediaUrl === 'string' && record.mediaUrl.length > 0;
    if (['banner', 'video'].includes(record.contentType) && !hasMedia) {
      throw createApiError(422, 'CONTENT_NOT_PUBLISHABLE', 'Banner/video cần có mediaUrl trước khi xuất bản.');
    }
    if (['policy', 'faq'].includes(record.contentType) && !hasBody) {
      throw createApiError(422, 'CONTENT_NOT_PUBLISHABLE', 'Chính sách/FAQ cần có nội dung trước khi xuất bản.');
    }
  }
}

function createContentService({ model = createContentModel() } = {}) {
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

  async function get(resource, key, options) {
    const record = await run(resource, 'find', key, options);
    if (!record) {
      throw createApiError(404, 'RESOURCE_NOT_FOUND', `Không tìm thấy ${RESOURCE_LABELS[resource]}.`);
    }
    return record;
  }

  async function assertArticleCategoryExists(categoryId) {
    if (categoryId === undefined || categoryId === null) return;
    const category = await run('articleCategories', 'find', categoryId);
    if (!category) throw createApiError(404, 'ARTICLE_CATEGORY_NOT_FOUND', 'Không tìm thấy chủ đề bài viết.');
  }

  async function create(resource, input, { actorUserId } = {}) {
    const record = { ...input };
    const options = {};
    if (resource === 'articles') {
      await assertArticleCategoryExists(record.categoryId);
      record.categoryId ??= null;
      record.authorUserId = actorUserId;
      options.publishNow = record.status === 'published';
    } else if (resource === 'websiteContents') {
      record.updatedByUserId = actorUserId;
    }
    assertPublishable(resource, record);
    return run(resource, 'create', record, options);
  }

  async function update(resource, id, input, { actorUserId } = {}) {
    const changes = { ...input };
    if (resource === 'articles') {
      await assertArticleCategoryExists(changes.categoryId);
    } else if (resource === 'websiteContents') {
      changes.updatedByUserId = actorUserId;
    }
    const result = await run(resource, 'update', id, changes, {
      validate: ({ current, effective }) => {
        assertPublishable(resource, effective);
        return {
          publishNow: resource === 'articles' && effective.status === 'published' && current.status !== 'published',
          clearPublishAt: resource === 'articles' && effective.status === 'draft',
        };
      },
    });
    if (!result) throw createApiError(404, 'RESOURCE_NOT_FOUND', `Không tìm thấy ${RESOURCE_LABELS[resource]}.`);
    return result;
  }

  async function remove(resource, id) {
    const result = await run(resource, 'remove', id);
    if (!result.found) {
      throw createApiError(404, 'RESOURCE_NOT_FOUND', `Không tìm thấy ${RESOURCE_LABELS[resource]}.`);
    }
    if (!result.deleted) {
      throw createApiError(409, 'CONTENT_RESOURCE_IN_USE', `Không thể xóa ${RESOURCE_LABELS[resource]} đang được sử dụng.`);
    }
    return { id };
  }

  return { create, get, list, remove, update };
}

module.exports = { createContentService };
