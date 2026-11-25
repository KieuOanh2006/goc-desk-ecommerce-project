const express = require('express');
const validate = require('../../middlewares/validate');
const { requireAuthSession } = require('../../middlewares/auth-session');
const { authorizeRoles } = require('../../middlewares/authorization');
const requireTrustedOrigin = require('../../middlewares/require-trusted-origin');
const { createContentController } = require('./content.controller');
const { createContentService } = require('./content.service');
const {
  adminArticleListQuerySchema,
  adminWebsiteContentListQuerySchema,
  articleSlugParamsSchema,
  articleCategoryListQuerySchema,
  articleListQuerySchema,
  contentKeyParamsSchema,
  createArticleCategorySchema,
  createArticleSchema,
  createWebsiteContentSchema,
  idParamsSchema,
  updateArticleCategorySchema,
  updateArticleSchema,
  updateWebsiteContentSchema,
  websiteContentListQuerySchema,
} = require('./content.schemas');

function createContentRouter({ service = createContentService(), authenticate = requireAuthSession } = {}) {
  const router = express.Router();
  const admin = express.Router();
  const controller = createContentController(service);
  admin.use(authenticate, authorizeRoles('admin', 'product_content_staff'));

  router.get('/article-categories', validate({ query: articleCategoryListQuerySchema }), controller.list('articleCategories', true));
  router.get('/article-categories/:id', validate({ params: idParamsSchema }), controller.get('articleCategories', true));
  router.get('/articles', validate({ query: articleListQuerySchema }), controller.list('articles', true));
  router.get('/articles/:slug', validate({ params: articleSlugParamsSchema }), controller.get('articles', true, { bySlug: true }));
  router.get('/contents', validate({ query: websiteContentListQuerySchema }), controller.list('websiteContents', true));
  router.get('/contents/:contentKey', validate({ params: contentKeyParamsSchema }), controller.get('websiteContents', true, { byKey: true }));

  admin.get('/article-categories', validate({ query: articleCategoryListQuerySchema }), controller.list('articleCategories', false));
  admin.get('/article-categories/:id', validate({ params: idParamsSchema }), controller.get('articleCategories', false));
  admin.post('/article-categories', requireTrustedOrigin, validate({ body: createArticleCategorySchema }), controller.create('articleCategories'));
  admin.patch('/article-categories/:id', requireTrustedOrigin, validate({ params: idParamsSchema, body: updateArticleCategorySchema }), controller.update('articleCategories'));
  admin.delete('/article-categories/:id', requireTrustedOrigin, validate({ params: idParamsSchema }), controller.remove('articleCategories'));

  admin.get('/articles', validate({ query: adminArticleListQuerySchema }), controller.list('articles', false));
  admin.get('/articles/:id', validate({ params: idParamsSchema }), controller.get('articles', false));
  admin.post('/articles', requireTrustedOrigin, validate({ body: createArticleSchema }), controller.create('articles'));
  admin.patch('/articles/:id', requireTrustedOrigin, validate({ params: idParamsSchema, body: updateArticleSchema }), controller.update('articles'));
  admin.delete('/articles/:id', requireTrustedOrigin, validate({ params: idParamsSchema }), controller.remove('articles'));

  admin.get('/contents', validate({ query: adminWebsiteContentListQuerySchema }), controller.list('websiteContents', false));
  admin.get('/contents/:id', validate({ params: idParamsSchema }), controller.get('websiteContents', false));
  admin.post('/contents', requireTrustedOrigin, validate({ body: createWebsiteContentSchema }), controller.create('websiteContents'));
  admin.patch('/contents/:id', requireTrustedOrigin, validate({ params: idParamsSchema, body: updateWebsiteContentSchema }), controller.update('websiteContents'));
  admin.delete('/contents/:id', requireTrustedOrigin, validate({ params: idParamsSchema }), controller.remove('websiteContents'));

  router.use('/admin', admin);
  return router;
}

const router = createContentRouter();
router.createContentRouter = createContentRouter;

module.exports = router;
