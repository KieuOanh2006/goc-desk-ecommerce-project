const { z } = require('zod');
const loyaltyIdSchema = z.string().regex(/^[1-9][0-9]{0,19}$/);
const redeemSchema = z.object({ rewardId: loyaltyIdSchema }).strict();
module.exports = { loyaltyIdSchema, redeemSchema };
