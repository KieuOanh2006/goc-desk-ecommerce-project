const { z } = require('zod');
const { normalizeVietnamMobilePhone } = require('./phone');

const emailSchema = z.string().trim().email().max(254).transform((value) => value.toLowerCase());
const phoneSchema = z.string().transform((value, context) => {
  const normalized = normalizeVietnamMobilePhone(value.trim());
  if (normalized) return normalized;
  context.addIssue({ code: 'custom', message: 'Số điện thoại di động Việt Nam không hợp lệ.' });
  return z.NEVER;
});
const passwordSchema = z.string()
  .min(8)
  .max(128)
  .refine((value) => Buffer.byteLength(value, 'utf8') <= 128, 'Mật khẩu không được vượt quá 128 byte.');
const identitySchema = z.union([emailSchema, phoneSchema]);

const registerSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: emailSchema,
  phone: phoneSchema,
  password: passwordSchema,
}).strict();

const loginSchema = z.object({
  identity: identitySchema,
  password: z.string().min(1).max(128),
  rememberMe: z.boolean().default(false),
}).strict();

const verifyEmailSchema = z.object({
  token: z.string().regex(/^[a-f0-9]{64}$/i),
}).strict();

const resendVerificationSchema = z.object({ email: emailSchema }).strict();

const sessionIdSchema = z.object({
  sessionId: z.string().regex(/^[1-9][0-9]{0,19}$/),
});

module.exports = {
  loginSchema,
  registerSchema,
  resendVerificationSchema,
  sessionIdSchema,
  verifyEmailSchema,
};
