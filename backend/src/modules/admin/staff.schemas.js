const { z } = require('zod');

const staffRoles = ['product_content_staff', 'order_support_staff'];
const assignableRoles = ['member', ...staffRoles, 'admin'];
const email = z.string().trim().email().max(254).transform((value) => value.toLowerCase());
const userId = z.string().regex(/^[1-9][0-9]{0,19}$/);
const password = z.string()
  .min(8)
  .max(128)
  .refine((value) => Buffer.byteLength(value, 'utf8') <= 128, 'Mật khẩu không được vượt quá 128 byte.');

const createStaffSchema = z.object({
  fullName: z.string().trim().min(1).max(120),
  email,
  role: z.enum(staffRoles),
}).strict();

const userIdParamsSchema = z.object({ userId });
const changeRoleBodySchema = z.object({ role: z.enum(assignableRoles) }).strict();
const changeStatusBodySchema = z.object({ accountStatus: z.enum(['active', 'locked']) }).strict();
const acceptInvitationSchema = z.object({
  token: z.string().regex(/^[a-f0-9]{64}$/i),
  password,
}).strict();

module.exports = {
  acceptInvitationSchema,
  changeRoleBodySchema,
  changeStatusBodySchema,
  createStaffSchema,
  userIdParamsSchema,
};
