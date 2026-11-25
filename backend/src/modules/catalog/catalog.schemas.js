const { z } = require('zod');

const idSchema = z.string()
  .regex(/^[1-9]\d{0,19}$/, 'ID phải là số nguyên dương.')
  .refine((value) => BigInt(value) <= 18446744073709551615n, 'ID vượt giới hạn BIGINT UNSIGNED.');

const idParamsSchema = z.object({ id: idSchema }).strict();

const paginationFields = {
  q: z.string().trim().max(120).default(''),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(['name:asc', 'name:desc', 'createdAt:asc', 'createdAt:desc']).default('name:asc'),
};

const publicListQuerySchema = z.object(paginationFields).strict();
const adminListQuerySchema = z.object({
  ...paginationFields,
  status: z.enum(['active', 'hidden']).optional(),
}).strict();
const publicUseCaseListQuerySchema = z.object({
  ...paginationFields,
  sort: z.enum(['name:asc', 'name:desc']).default('name:asc'),
}).strict();
const adminUseCaseListQuerySchema = z.object({
  ...paginationFields,
  sort: z.enum(['name:asc', 'name:desc']).default('name:asc'),
}).strict();

function isSafeAssetLocation(value) {
  if (/^https:\/\//i.test(value)) {
    try { return new URL(value).protocol === 'https:'; } catch { return false; }
  }
  return /^(?:\/?(?:images|Videos)\/)[A-Za-z0-9._/-]+$/.test(value)
    && !value.split('/').includes('..')
    && !value.includes('\\');
}

const nameSchema = z.string().trim().min(1).max(100);
const slugSchema = z.string().trim().min(1).max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug phải có dạng den-ban.');
const descriptionSchema = z.string().trim().max(5000).nullable();

const createCategorySchema = z.object({ name: nameSchema, slug: slugSchema }).strict();
const updateCategorySchema = z.object({
  name: nameSchema.optional(),
  slug: slugSchema.optional(),
  description: descriptionSchema.optional(),
  imageUrl: z.string().trim().max(1000).refine(isSafeAssetLocation).nullable().optional(),
  sortOrder: z.number().int().min(0).max(65535).optional(),
  status: z.enum(['active', 'hidden']).optional(),
}).strict().refine((value) => Object.keys(value).length > 0, 'Cần ít nhất một trường để cập nhật.');

const createBrandSchema = z.object({ name: nameSchema, slug: slugSchema }).strict();
const updateBrandSchema = z.object({
  name: nameSchema.optional(),
  slug: slugSchema.optional(),
  status: z.enum(['active', 'hidden']).optional(),
}).strict().refine((value) => Object.keys(value).length > 0, 'Cần ít nhất một trường để cập nhật.');

const createUseCaseSchema = z.object({
  name: nameSchema,
  slug: slugSchema,
  description: z.string().trim().max(500).nullable().optional(),
}).strict();
const updateUseCaseSchema = z.object({
  name: nameSchema.optional(),
  slug: slugSchema.optional(),
  description: z.string().trim().max(500).nullable().optional(),
}).strict().refine((value) => Object.keys(value).length > 0, 'Cần ít nhất một trường để cập nhật.');

module.exports = {
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
};
