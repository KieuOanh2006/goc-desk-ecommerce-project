const express = require('express');
const validate = require('../../middlewares/validate');
const { requireAuthSession } = require('../../middlewares/auth-session');
const { authorizeRoles } = require('../../middlewares/authorization');
const requireTrustedOrigin = require('../../middlewares/require-trusted-origin');
const { createStudioAssetsController } = require('./studio-assets.controller');
const { createStudioAssetsService } = require('./studio-assets.service');
const {
  adminAssetListQuerySchema,
  adminProductModelListQuerySchema,
  adminRoomListQuerySchema,
  createFurnitureAssetSchema,
  createProductModelSchema,
  createRoomSchema,
  idParamsSchema,
  publicAssetListQuerySchema,
  publicProductModelListQuerySchema,
  publicRoomListQuerySchema,
  replaceRoomFurnitureSchema,
  updateFurnitureAssetSchema,
  updateProductModelSchema,
  updateRoomSchema,
} = require('./studio-assets.schemas');

function createStudioAssetsRouter({ service = createStudioAssetsService(), authenticate = requireAuthSession } = {}) {
  const router = express.Router();
  const admin = express.Router();
  const controller = createStudioAssetsController(service);
  admin.use(authenticate, authorizeRoles('admin'));

  router.get('/studio/rooms', validate({ query: publicRoomListQuerySchema }), controller.list('rooms', true));
  router.get('/studio/rooms/:id', validate({ params: idParamsSchema }), controller.get('rooms', true));
  router.get('/studio/furniture-assets', validate({ query: publicAssetListQuerySchema }), controller.list('furnitureAssets', true));
  router.get('/studio/product-models', validate({ query: publicProductModelListQuerySchema }), controller.list('productModels', true));
  router.get('/studio/product-models/:id', validate({ params: idParamsSchema }), controller.get('productModels', true));

  admin.get('/rooms', validate({ query: adminRoomListQuerySchema }), controller.list('rooms', false));
  admin.get('/rooms/:id', validate({ params: idParamsSchema }), controller.get('rooms', false));
  admin.post('/rooms', requireTrustedOrigin, validate({ body: createRoomSchema }), controller.create('rooms'));
  admin.patch('/rooms/:id', requireTrustedOrigin, validate({ params: idParamsSchema, body: updateRoomSchema }), controller.update('rooms'));
  admin.delete('/rooms/:id', requireTrustedOrigin, validate({ params: idParamsSchema }), controller.remove('rooms'));
  admin.put('/rooms/:id/furniture', requireTrustedOrigin, validate({ params: idParamsSchema, body: replaceRoomFurnitureSchema }), controller.replaceRoomFurniture());

  admin.get('/furniture-assets', validate({ query: adminAssetListQuerySchema }), controller.list('furnitureAssets', false));
  admin.get('/furniture-assets/:id', validate({ params: idParamsSchema }), controller.get('furnitureAssets', false));
  admin.post('/furniture-assets', requireTrustedOrigin, validate({ body: createFurnitureAssetSchema }), controller.create('furnitureAssets'));
  admin.patch('/furniture-assets/:id', requireTrustedOrigin, validate({ params: idParamsSchema, body: updateFurnitureAssetSchema }), controller.update('furnitureAssets'));
  admin.delete('/furniture-assets/:id', requireTrustedOrigin, validate({ params: idParamsSchema }), controller.remove('furnitureAssets'));

  admin.get('/product-models', validate({ query: adminProductModelListQuerySchema }), controller.list('productModels', false));
  admin.get('/product-models/:id', validate({ params: idParamsSchema }), controller.get('productModels', false));
  admin.post('/product-models', requireTrustedOrigin, validate({ body: createProductModelSchema }), controller.create('productModels'));
  admin.patch('/product-models/:id', requireTrustedOrigin, validate({ params: idParamsSchema, body: updateProductModelSchema }), controller.update('productModels'));
  admin.delete('/product-models/:id', requireTrustedOrigin, validate({ params: idParamsSchema }), controller.remove('productModels'));

  router.use('/admin/studio', admin);
  return router;
}

const router = createStudioAssetsRouter();
router.createStudioAssetsRouter = createStudioAssetsRouter;

module.exports = router;
