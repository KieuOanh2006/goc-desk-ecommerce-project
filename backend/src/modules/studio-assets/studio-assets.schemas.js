const { z } = require('zod');

const MAX_UNSIGNED_BIGINT = 18446744073709551615n;
const idSchema = z.string()
  .regex(/^[1-9]\d{0,19}$/, 'ID phải là số nguyên dương.')
  .refine((value) => BigInt(value) <= MAX_UNSIGNED_BIGINT, 'ID vượt giới hạn BIGINT UNSIGNED.');
const idParamsSchema = z.object({ id: idSchema }).strict();

const pageFields = {
  q: z.string().trim().max(120).default(''),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
};
const roomSortSchema = z.enum(['name:asc', 'name:desc', 'createdAt:asc', 'createdAt:desc']).default('name:asc');
const assetSortSchema = z.enum(['name:asc', 'name:desc', 'id:asc', 'id:desc']).default('name:asc');
const modelSortSchema = z.enum(['productName:asc', 'productName:desc', 'id:asc', 'id:desc']).default('productName:asc');

const publicRoomListQuerySchema = z.object({ ...pageFields, sort: roomSortSchema }).strict();
const adminRoomListQuerySchema = z.object({
  ...pageFields,
  sort: roomSortSchema,
  status: z.enum(['active', 'hidden']).optional(),
}).strict();
const publicAssetListQuerySchema = z.object({ ...pageFields, sort: assetSortSchema }).strict();
const adminAssetListQuerySchema = z.object({
  ...pageFields,
  sort: assetSortSchema,
  status: z.enum(['active', 'hidden']).optional(),
}).strict();
const publicProductModelListQuerySchema = z.object({ ...pageFields, sort: modelSortSchema }).strict();
const adminProductModelListQuerySchema = z.object({
  ...pageFields,
  sort: modelSortSchema,
  status: z.enum(['active', 'hidden']).optional(),
}).strict();

const nameSchema = z.string().trim().min(1).max(140);
const slugSchema = z.string().trim().min(1).max(160)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug chỉ dùng chữ thường, số và dấu gạch ngang.');
const assetCodeSchema = z.string().trim().min(1).max(60)
  .regex(/^[a-z0-9]+(?:[._-][a-z0-9]+)*$/, 'Mã asset chỉ dùng chữ thường, số, dấu chấm, gạch dưới hoặc gạch ngang.');
const descriptionSchema = z.string().trim().max(500).nullable().optional();
const hexColorSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Màu phải có dạng #RRGGBB.').nullable();
function decimalStorageSchema(decimalPlaces, min, max) {
  const factor = 10 ** decimalPlaces;
  return z.number().finite()
    .transform((value) => Math.round(value * factor) / factor)
    .refine((value) => value >= min && value <= max, `Giá trị sau khi làm tròn phải nằm trong khoảng ${min} đến ${max}.`);
}

const positiveDimensionSchema = decimalStorageSchema(3, 0.001, 20);
const dimensionsSchema = z.object({
  width: positiveDimensionSchema,
  depth: positiveDimensionSchema,
  height: positiveDimensionSchema,
}).strict();

const roomBoundsSchema = z.object({
  minX: z.number().finite().min(-50).max(50),
  maxX: z.number().finite().min(-50).max(50),
  minZ: z.number().finite().min(-50).max(50),
  maxZ: z.number().finite().min(-50).max(50),
}).strict().superRefine((bounds, context) => {
  if (bounds.minX >= bounds.maxX) context.addIssue({ code: 'custom', path: ['maxX'], message: 'maxX phải lớn hơn minX.' });
  if (bounds.minZ >= bounds.maxZ) context.addIssue({ code: 'custom', path: ['maxZ'], message: 'maxZ phải lớn hơn minZ.' });
});
const pointSchema = z.object({
  x: z.number().finite().min(-50).max(50),
  y: z.number().finite().min(-50).max(50),
  z: z.number().finite().min(-50).max(50),
}).strict();
const cameraPresetSchema = z.object({
  label: z.string().trim().min(1).max(40),
  theta: z.number().finite().min(0).max(Math.PI * 2),
  phi: z.number().finite().min(0).max(Math.PI),
  radius: z.number().finite().min(0.1).max(100),
  target: pointSchema,
}).strict();
const roomConfigSchema = z.object({
  room: roomBoundsSchema,
  backWindow: z.boolean(),
  balcony: z.boolean(),
  cameraPresets: z.object({
    room: cameraPresetSchema,
    desk: cameraPresetSchema,
    top: cameraPresetSchema,
  }).strict(),
}).strict();

function isSafeGlbUrl(value) {
  if (typeof value !== 'string') return false;
  if (/^https:\/\//i.test(value)) {
    try {
      const url = new URL(value);
      return url.protocol === 'https:' && !url.username && !url.password;
    } catch {
      return false;
    }
  }
  return /^\/?models\/[A-Za-z0-9._/-]+\.glb$/i.test(value)
    && !value.includes('..')
    && !value.includes('\\');
}

const glbUrlSchema = z.string().trim().max(1000)
  .refine(isSafeGlbUrl, 'GLB cần URL HTTPS hoặc đường dẫn /models/*.glb an toàn.')
  .nullable().optional();
const rendererTypeSchema = z.enum(['procedural', 'glb']);
const rendererKeySchema = z.string().trim().min(1).max(120)
  .regex(/^[a-z0-9]+(?:[._-][a-z0-9]+)*$/, 'rendererKey chỉ dùng chữ thường, số, dấu chấm, gạch dưới hoặc gạch ngang.');
const furnitureRendererKeys = ['desk', 'cabinet', 'bed', 'chair', 'rug', 'plant'];
const productRendererKeys = ['keyboard', 'mouse', 'lamp', 'stand', 'pad', 'organize'];

function rendererFields(allowedKeys) {
  return {
    rendererType: rendererTypeSchema,
    rendererKey: rendererKeySchema,
    modelUrl: glbUrlSchema,
  };
}

function validateRenderer(value, allowedKeys, context) {
  if (value.rendererType === 'procedural') {
    if (!allowedKeys.includes(value.rendererKey)) {
      context.addIssue({ code: 'custom', path: ['rendererKey'], message: `rendererKey procedural hợp lệ: ${allowedKeys.join(', ')}.` });
    }
    if (value.modelUrl) context.addIssue({ code: 'custom', path: ['modelUrl'], message: 'Renderer procedural không nhận modelUrl.' });
  } else if (!value.modelUrl) {
    context.addIssue({ code: 'custom', path: ['modelUrl'], message: 'Renderer GLB cần modelUrl.' });
  }
}

const roomFields = {
  name: nameSchema,
  slug: slugSchema,
  description: descriptionSchema,
  roomConfig: roomConfigSchema,
  isActive: z.boolean().default(true),
};
const createRoomSchema = z.object(roomFields).strict();
const updateRoomSchema = z.object({
  name: nameSchema.optional(),
  slug: slugSchema.optional(),
  description: descriptionSchema,
  roomConfig: roomConfigSchema.optional(),
  isActive: z.boolean().optional(),
}).strict().refine((value) => Object.keys(value).length > 0, 'Cần ít nhất một trường để cập nhật.');

const furnitureFields = {
  assetCode: assetCodeSchema,
  name: nameSchema,
  furnitureType: z.enum(furnitureRendererKeys),
  ...rendererFields(furnitureRendererKeys),
  dimensions: dimensionsSchema,
  defaultColor: hexColorSchema.optional(),
  isActive: z.boolean().default(true),
};
const createFurnitureAssetSchema = z.object(furnitureFields).strict()
  .superRefine((value, context) => validateRenderer(value, furnitureRendererKeys, context));
const updateFurnitureAssetSchema = z.object({
  assetCode: assetCodeSchema.optional(),
  name: nameSchema.optional(),
  furnitureType: z.enum(furnitureRendererKeys).optional(),
  ...Object.fromEntries(Object.entries(rendererFields(furnitureRendererKeys)).map(([key, schema]) => [key, schema.optional()])),
  dimensions: dimensionsSchema.optional(),
  defaultColor: hexColorSchema.optional(),
  isActive: z.boolean().optional(),
}).strict().refine((value) => Object.keys(value).length > 0, 'Cần ít nhất một trường để cập nhật.');

const roomFurniturePlacementSchema = z.object({
  furnitureAssetId: idSchema,
  positionX: decimalStorageSchema(3, -50, 50),
  positionZ: decimalStorageSchema(3, -50, 50),
  rotation: decimalStorageSchema(4, -6.2832, 6.2832),
  isPresent: z.boolean().default(true),
  colorHex: hexColorSchema.optional(),
}).strict();
const replaceRoomFurnitureSchema = z.array(roomFurniturePlacementSchema).max(30)
  .superRefine((placements, context) => {
    const seen = new Set();
    placements.forEach((placement, index) => {
      if (seen.has(placement.furnitureAssetId)) {
        context.addIssue({ code: 'custom', path: [index, 'furnitureAssetId'], message: 'Mỗi furnitureAssetId chỉ được xuất hiện một lần.' });
      }
      seen.add(placement.furnitureAssetId);
    });
  });

const productModelFields = {
  productId: idSchema,
  ...rendererFields(productRendererKeys),
  width: positiveDimensionSchema,
  depth: positiveDimensionSchema,
  height: positiveDimensionSchema,
  surfaceType: z.enum(['desk', 'floor']).default('desk'),
  isActive: z.boolean().default(true),
};
const createProductModelSchema = z.object(productModelFields).strict()
  .superRefine((value, context) => validateRenderer(value, productRendererKeys, context));
const updateProductModelSchema = z.object({
  productId: idSchema.optional(),
  ...Object.fromEntries(Object.entries(rendererFields(productRendererKeys)).map(([key, schema]) => [key, schema.optional()])),
  width: positiveDimensionSchema.optional(),
  depth: positiveDimensionSchema.optional(),
  height: positiveDimensionSchema.optional(),
  surfaceType: z.enum(['desk', 'floor']).optional(),
  isActive: z.boolean().optional(),
}).strict().refine((value) => Object.keys(value).length > 0, 'Cần ít nhất một trường để cập nhật.');

module.exports = {
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
  roomConfigSchema,
  updateFurnitureAssetSchema,
  updateProductModelSchema,
  updateRoomSchema,
};
