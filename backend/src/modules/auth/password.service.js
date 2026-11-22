const argon2 = require('argon2');
const { createApiError } = require('../../middlewares/error-handler');
const authModel = require('./auth.model');
const emailService = require('./email.service');
const { createOpaqueToken, hashToken } = require('./auth.security');

const RESET_LIFETIME_MINUTES = 60;
const MAX_RESET_REQUESTS_PER_HOUR = 3;
const ACCEPTED_MESSAGE = 'Nếu email thuộc tài khoản hợp lệ, hướng dẫn đặt lại mật khẩu sẽ được gửi.';

function createPasswordService({ model = authModel, mailer = emailService, passwordHasher = argon2, logger = console } = {}) {
  async function changePassword(userId, { currentPassword, newPassword }) {
    const credential = await model.getPasswordCredentialByUserId(userId);
    let matches = false;
    if (credential?.password_hash) {
      try { matches = await passwordHasher.verify(credential.password_hash, currentPassword); } catch { matches = false; }
    }
    if (!matches) throw createApiError(401, 'CURRENT_PASSWORD_INVALID', 'Mật khẩu hiện tại không chính xác.');
    const passwordHash = await passwordHasher.hash(newPassword, { type: passwordHasher.argon2id });
    if (!await model.updatePasswordAndRevokeSessions({ userId, passwordHash })) {
      throw createApiError(404, 'USER_NOT_FOUND', 'Không tìm thấy tài khoản đang hoạt động.');
    }
    return { changed: true, sessionsRevoked: true };
  }

  async function requestReset(email) {
    mailer.assertConfigured();
    const user = await model.findUserByEmail(email);
    if (!user || user.account_status !== 'active' || !user.email_verified_at
      || !['member', 'admin', 'product_content_staff', 'order_support_staff'].includes(user.role)) {
      return { accepted: true, message: ACCEPTED_MESSAGE };
    }
    const token = createOpaqueToken();
    const created = await model.createPasswordResetToken({
      userId: user.id,
      tokenHash: hashToken(token),
      maxTokensPerHour: MAX_RESET_REQUESTS_PER_HOUR,
      lifetimeMinutes: RESET_LIFETIME_MINUTES,
    });
    if (!created) return { accepted: true, message: ACCEPTED_MESSAGE };
    try {
      await mailer.sendPasswordResetEmail({ email: user.email, fullName: user.full_name, token });
    } catch (error) {
      logger.error('[password-reset-email]', { code: error.code || 'DELIVERY_FAILED' });
      // A delivered-token failure is never exposed to the caller or logs.
      if (model.revokePasswordResetTokens) await model.revokePasswordResetTokens(user.id);
      throw createApiError(503, 'EMAIL_SERVICE_UNAVAILABLE', 'Chưa thể gửi email lúc này. Vui lòng thử lại sau.');
    }
    return { accepted: true, message: ACCEPTED_MESSAGE };
  }

  async function resetPassword({ token, newPassword }) {
    const passwordHash = await passwordHasher.hash(newPassword, { type: passwordHasher.argon2id });
    const user = await model.consumePasswordResetToken({ tokenHash: hashToken(token), passwordHash });
    if (!user) throw createApiError(400, 'PASSWORD_RESET_INVALID', 'Liên kết đặt lại mật khẩu không hợp lệ, đã dùng hoặc hết hạn.');
    return { user };
  }

  return { changePassword, requestReset, resetPassword };
}

module.exports = { ACCEPTED_MESSAGE, createPasswordService };
