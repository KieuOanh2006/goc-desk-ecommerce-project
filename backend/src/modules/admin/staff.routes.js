const express = require('express');
const validate = require('../../middlewares/validate');
const { requireAuthSession } = require('../../middlewares/auth-session');
const { authorizeRoles } = require('../../middlewares/authorization');
const requireTrustedOrigin = require('../../middlewares/require-trusted-origin');
const controller = require('./staff.controller');
const {
  changeRoleBodySchema,
  changeStatusBodySchema,
  createStaffSchema,
  userIdParamsSchema,
} = require('./staff.schemas');

const router = express.Router();
router.use(requireAuthSession, authorizeRoles('admin'));

router.get('/staff', controller.listStaff);
router.post('/staff', requireTrustedOrigin, validate({ body: createStaffSchema }), controller.createStaff);
router.post(
  '/staff/:userId/invitation/resend',
  requireTrustedOrigin,
  validate({ params: userIdParamsSchema }),
  controller.resendInvitation,
);
router.patch(
  '/users/:userId/role',
  requireTrustedOrigin,
  validate({ params: userIdParamsSchema, body: changeRoleBodySchema }),
  controller.changeRole,
);
router.patch(
  '/users/:userId/status',
  requireTrustedOrigin,
  validate({ params: userIdParamsSchema, body: changeStatusBodySchema }),
  controller.changeStatus,
);

module.exports = router;
