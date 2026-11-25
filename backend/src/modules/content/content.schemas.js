const { z } = require('zod');

const idSchema = z.string()
  .regex(/^[1-9]\d{0,19}$/)
  .refine((value) => BigInt(value) <= 18446744073709551615n);
const idParamsSchema = z.object({ id: idSchema }).strict();

const commonListFields = {
  q: z.string().trim().max(120).default(''),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
};

const articleCategoryListQuerySchema = z.object({
  ...commonListFields,
  sort: z.enum(['name:asc', 'name:desc']).default('name:asc'),
}).strict();

const articleListFields = {
  ...commonListFields,
  categoryId: idSchema.optional(),
  contentType: z.enum(['article', 'video']).optional(),
  sort: z.enum(['publishedAt:asc', 'publishedAt:desc', 'title:asc', 'title:desc']).default('publishedAt:desc'),
};
const articleListQuerySchema = z.object(articleListFields).strict();
const adminArticleListQuerySchema = z.object({
  ...articleListFields,
  status: z.enum(['draft', 'published', 'hidden']).optional(),
}).strict();

const contentKeySchema = z.string().trim().min(1).max(100)
  .regex(/^[a-z0-9]+(?:[._-][a-z0-9]+)*$/, 'contentKey chỉ dùng chữ thường, số, dấu chấm, gạch ngang hoặc gạch dưới.');
const websiteContentListFields = {
  ...commonListFields,
  contentKey: contentKeySchema.optional(),
  contentType: z.enum(['banner', 'video', 'policy', 'faq']).optional(),
  sort: z.enum(['contentKey:asc', 'contentKey:desc', 'updatedAt:asc', 'updatedAt:desc']).default('contentKey:asc'),
};
const websiteContentListQuerySchema = z.object(websiteContentListFields).strict();
const adminWebsiteContentListQuerySchema = z.object({
  ...websiteContentListFields,
  status: z.enum(['draft', 'published', 'hidden']).optional(),
}).strict();

const slugSchema = z.string().trim().min(1).max(240)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug phải có dạng goc-ban-gon-gang.');
const titleSchema = z.string().trim().min(1).max(220);
const bodySchema = z.string().trim().max(50000).nullable().optional();
const statusSchema = z.enum(['draft', 'published', 'hidden']);

function isSafeMediaUrl(value) {
  if (/^https:\/\//i.test(value)) {
    try {
      const url = new URL(value);
      return url.protocol === 'https:' && !url.username && !url.password;
    } catch {
      return false;
    }
  }

  if (!/^(?:\/?(?:images|Videos)\/)[^?#\\\u0000-\u001f]+$/u.test(value)) return false;
  return !value.split('/').includes('..');
}

const mediaUrlSchema = z.string().trim().max(1000).refine(isSafeMediaUrl, 'Media URL phải là HTTPS hoặc đường dẫn asset images/Videos hợp lệ.').nullable().optional();

const createArticleCategorySchema = z.object({
  name: z.string().trim().min(1).max(100),
  slug: slugSchema.max(120),
  description: z.string().trim().max(500).nullable().optional(),
}).strict();
const updateArticleCategorySchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  slug: slugSchema.max(120).optional(),
  description: z.string().trim().max(500).nullable().optional(),
}).strict().refine((value) => Object.keys(value).length > 0, 'Cần ít nhất một trường để cập nhật.');

const createArticleSchema = z.object({
  categoryId: idSchema.nullable().optional(),
  title: titleSchema,
  slug: slugSchema,
  contentType: z.enum(['article', 'video']),
  body: bodySchema,
  mediaUrl: mediaUrlSchema,
  status: statusSchema.default('draft'),
}).strict();
const updateArticleSchema = z.object({
  categoryId: idSchema.nullable().optional(),
  title: titleSchema.optional(),
  slug: slugSchema.optional(),
  contentType: z.enum(['article', 'video']).optional(),
  body: bodySchema,
  mediaUrl: mediaUrlSchema,
  status: statusSchema.optional(),
}).strict().refine((value) => Object.keys(value).length > 0, 'Cần ít nhất một trường để cập nhật.');

const createWebsiteContentSchema = z.object({
  contentKey: contentKeySchema,
  contentType: z.enum(['banner', 'video', 'policy', 'faq']),
  title: z.string().trim().max(220).nullable().optional(),
  body: bodySchema,
  mediaUrl: mediaUrlSchema,
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
  status: statusSchema.default('draft'),
}).strict();
const updateWebsiteContentSchema = z.object({
  contentKey: contentKeySchema.optional(),
  contentType: z.enum(['banner', 'video', 'policy', 'faq']).optional(),
  title: z.string().trim().max(220).nullable().optional(),
  body: bodySchema,
  mediaUrl: mediaUrlSchema,
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
  status: statusSchema.optional(),
}).strict().refine((value) => Object.keys(value).length > 0, 'Cần ít nhất một trường để cập nhật.');

const contentKeyParamsSchema = z.object({ contentKey: contentKeySchema }).strict();
const articleSlugParamsSchema = z.object({
  slug: z.string().trim().min(1).max(240).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
}).strict();

module.exports = {
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
  mediaUrlSchema,
  updateArticleCategorySchema,
  updateArticleSchema,
  updateWebsiteContentSchema,
  websiteContentListQuerySchema,
};
