const express = require('express');
const { z } = require('zod');
const validate = require('../../middlewares/validate');
const { requireAuthSession } = require('../../middlewares/auth-session');
const { authorizeRoles } = require('../../middlewares/authorization');
const requireTrustedOrigin = require('../../middlewares/require-trusted-origin');
const controller = require('./user.controller');
const { addressSchema, profilePatchSchema, userIdSchema } = require('./user.schemas');

const router = express.Router();
const addressParamsSchema = z.object({ addressId: userIdSchema });
router.use(requireAuthSession, authorizeRoles('member'));

router.get('/me', controller.getProfile);
router.patch('/me', requireTrustedOrigin, validate({ body: profilePatchSchema }), controller.updateProfile);
router.get('/me/addresses', controller.listAddresses);
router.post('/me/addresses', requireTrustedOrigin, validate({ body: addressSchema }), controller.createAddress);
router.patch('/me/addresses/:addressId', requireTrustedOrigin, validate({ params: addressParamsSchema, body: addressSchema }), controller.updateAddress);
router.delete('/me/addresses/:addressId', requireTrustedOrigin, validate({ params: addressParamsSchema }), controller.deleteAddress);

module.exports = router;
