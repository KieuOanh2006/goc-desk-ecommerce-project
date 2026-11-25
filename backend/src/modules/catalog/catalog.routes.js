const express = require('express');
const validate = require('../../middlewares/validate');
const { requireAuthSession } = require('../../middlewares/auth-session');
const { authorizeRoles } = require('../../middlewares/authorization');
const requireTrustedOrigin = require('../../middlewares/require-trusted-origin');
const { createCatalogController } = require('./catalog.controller');
const { createCatalogService } = require('./catalog.service');
const {
  adminListQuerySchema,
  adminUseCaseListQuerySchema,
  createBrandSchema,
  createCategorySchema,
  createUseCaseSchema,
  idParamsSchema,
  publicListQuerySchema,
  publicUseCaseListQuerySchema,
  updateBrandSchema,
  updateCategorySchema,
  updateUseCaseSchema,
} = require('./catalog.schemas');

const RESOURCES = [
  { path: 'categories', key: 'categories', create: createCategorySchema, update: updateCategorySchema },
  { path: 'brands', key: 'brands', create: createBrandSchema, update: updateBrandSchema },
  { path: 'use-cases', key: 'useCases', create: createUseCaseSchema, update: updateUseCaseSchema },
];

function createCatalogRouter({ service = createCatalogService(), authenticate = requireAuthSession } = {}) {
  const router = express.Router();
  const admin = express.Router();
  const controller = createCatalogController(service);
  admin.use(authenticate, authorizeRoles('admin', 'product_content_staff'));

  for (const resource of RESOURCES) {
    const publicList = controller.list(resource.key, true);
    const publicGet = controller.get(resource.key, true);
    const adminList = controller.list(resource.key, false);
    const adminGet = controller.get(resource.key, false);
    const create = controller.create(resource.key);
    const update = controller.update(resource.key);
    const remove = controller.remove(resource.key);

    const publicQuery = resource.key === 'useCases' ? publicUseCaseListQuerySchema : publicListQuerySchema;
    const adminQuery = resource.key === 'useCases' ? adminUseCaseListQuerySchema : adminListQuerySchema;
    router.get(`/${resource.path}`, validate({ query: publicQuery }), publicList);
    router.get(`/${resource.path}/:id`, validate({ params: idParamsSchema }), publicGet);

    admin.get(`/${resource.path}`, validate({ query: adminQuery }), adminList);
    admin.get(`/${resource.path}/:id`, validate({ params: idParamsSchema }), adminGet);
    admin.post(`/${resource.path}`, requireTrustedOrigin, validate({ body: resource.create }), create);
    admin.patch(`/${resource.path}/:id`, requireTrustedOrigin, validate({ params: idParamsSchema, body: resource.update }), update);
    admin.delete(`/${resource.path}/:id`, requireTrustedOrigin, validate({ params: idParamsSchema }), remove);
  }

  router.use('/admin', admin);
  return router;
}

const router = createCatalogRouter();
router.createCatalogRouter = createCatalogRouter;

module.exports = router;
