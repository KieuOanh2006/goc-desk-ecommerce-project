const { z } = require('zod');
const { normalizeVietnamMobilePhone } = require('../auth/phone');

const phoneSchema = z.string().trim().transform((value, context) => {
  const normalized = normalizeVietnamMobilePhone(value);
  if (normalized) return normalized;
  context.addIssue({ code: 'custom', message: 'Số điện thoại di động Việt Nam không hợp lệ.' });
  return z.NEVER;
});
const userIdSchema = z.string().regex(/^[1-9][0-9]{0,19}$/);

const profilePatchSchema = z.object({
  fullName: z.string().trim().min(1).max(120).optional(),
  phone: phoneSchema.optional(),
}).strict().refine((value) => Object.keys(value).length > 0, 'Cần gửi ít nhất một trường để cập nhật.');

const addressSchema = z.object({
  recipientName: z.string().trim().min(1).max(120),
  phone: phoneSchema,
  addressLine: z.string().trim().min(1).max(300),
  ward: z.string().trim().max(100).nullable().optional(),
  district: z.string().trim().min(1).max(100),
  province: z.string().trim().min(1).max(100),
  isDefault: z.boolean().default(false),
}).strict();

module.exports = { addressSchema, profilePatchSchema, userIdSchema };
