const express = require('express');
const validate = require('../../middlewares/validate');
const { requireAuthSession } = require('../../middlewares/auth-session');
const requireTrustedOrigin = require('../../middlewares/require-trusted-origin');
const limitVerificationResendsByIp = require('../../middlewares/resend-rate-limit');
const controller = require('./auth.controller');
const {
  loginSchema,
  acceptInvitationSchema,
  registerSchema,
  resendVerificationSchema,
  sessionIdSchema,
  verifyEmailSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} = require('./auth.schemas');

const router = express.Router();

router.post('/accept-invitation', requireTrustedOrigin, validate({ body: acceptInvitationSchema }), controller.acceptInvitation);
router.post('/forgot-password', requireTrustedOrigin, validate({ body: forgotPasswordSchema }), controller.forgotPassword);
router.post('/reset-password', requireTrustedOrigin, validate({ body: resetPasswordSchema }), controller.resetPassword);
router.post('/register', requireTrustedOrigin, validate({ body: registerSchema }), controller.register);
router.post('/verify-email', requireTrustedOrigin, validate({ body: verifyEmailSchema }), controller.verifyEmail);
router.post(
  '/verify-email/resend',
  requireTrustedOrigin,
  validate({ body: resendVerificationSchema }),
  limitVerificationResendsByIp,
  controller.resendVerification,
);
router.post('/login', requireTrustedOrigin, validate({ body: loginSchema }), controller.login);
router.post('/logout', requireTrustedOrigin, controller.logout);
router.get('/me', requireAuthSession, controller.me);
router.patch('/password', requireTrustedOrigin, requireAuthSession, validate({ body: changePasswordSchema }), controller.changePassword);
router.get('/sessions', requireAuthSession, controller.listSessions);
router.post('/sessions/logout-others', requireTrustedOrigin, requireAuthSession, controller.logoutOthers);
router.post('/sessions/logout-all', requireTrustedOrigin, requireAuthSession, controller.logoutAll);
router.delete('/sessions/:sessionId', requireTrustedOrigin, validate({ params: sessionIdSchema }), requireAuthSession, controller.revokeSession);

module.exports = router;
