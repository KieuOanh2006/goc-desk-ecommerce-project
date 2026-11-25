const { z } = require('zod');

const idSchema = z.string()
  .regex(/^[1-9]\d{0,19}$/, 'ID phải là số nguyên dương.')
  .refine((value) => BigInt(value) <= 18446744073709551615n, 'ID vượt giới hạn BIGINT UNSIGNED.');

const adminProductParamsSchema = z.object({ productId: idSchema }).strict();

module.exports = { adminProductParamsSchema };
