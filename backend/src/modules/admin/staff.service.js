const argon2 = require('argon2');
const { randomBytes } = require('node:crypto');
const { createApiError } = require('../../middlewares/error-handler');
const defaultModel = require('./staff.model').createStaffModel();
const defaultMailer = require('../auth/email.service');
const { createOpaqueToken, hashToken } = require('../auth/auth.security');

const MAX_INVITATIONS_PER_USER_PER_HOUR = 3;

function createService({ model = defaultModel, mailer = defaultMailer, logger = console, hashPassword = argon2.hash } = {}) {
  async function deliverInvitation(user, token) {
    try {
      await mailer.sendStaffInvitationEmail({ email: user.email, fullName: user.fullName || user.full_name, token });
    } catch (error) {
      logger.error('[staff-invitation-email]', { code: error.code || 'DELIVERY_FAILED' });
      throw createApiError(503, 'EMAIL_SERVICE_UNAVAILABLE', 'Chưa thể gửi lời mời qua email. Vui lòng thử lại sau.');
    }
  }

  async function createStaff(input) {
    mailer.assertConfigured();
    const token = createOpaqueToken();
    const unusableInitialPassword = randomBytes(32).toString('hex');
    let staff;
    try {
      staff = await model.createPendingStaff({
        fullName: input.fullName,
        email: input.email,
        role: input.role,
        passwordHash: await hashPassword(unusableInitialPassword, { type: argon2.argon2id }),
        tokenHash: hashToken(token),
      });
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw createApiError(409, 'ACCOUNT_ALREADY_EXISTS', 'Email này đã được sử dụng cho tài khoản khác.');
      }
      throw error;
    }

    try {
      await deliverInvitation(staff, token);
    } catch (error) {
      await model.revokePendingStaffInvitation(staff.id);
      throw error;
    }
    return staff;
  }

  async function resendInvitation(userId) {
    mailer.assertConfigured();
    const user = await model.getPendingInvitationTarget(userId);
    if (!user) throw createApiError(404, 'INVITATION_NOT_AVAILABLE', 'Không tìm thấy lời mời đang chờ xác nhận.');
    const token = createOpaqueToken();
    const created = await model.createResentStaffInvitation({
      userId,
      tokenHash: hashToken(token),
      maxTokensPerHour: MAX_INVITATIONS_PER_USER_PER_HOUR,
    });
    if (!created) {
      return { accepted: true, message: 'Lời mời chưa được gửi. Hãy kiểm tra trạng thái tài khoản hoặc thử lại sau.' };
    }
    try {
      await deliverInvitation(user, token);
    } catch (error) {
      await model.revokePendingStaffInvitation(user.id);
      throw error;
    }
    return { accepted: true, message: 'Đã gửi lại lời mời nhân viên.' };
  }

  async function acceptInvitation({ token, password }) {
    const passwordHash = await hashPassword(password, { type: argon2.argon2id });
    const user = await model.acceptStaffInvitation({ tokenHash: hashToken(token), passwordHash });
    if (!user) {
      throw createApiError(400, 'STAFF_INVITATION_INVALID', 'Lời mời không hợp lệ, đã hết hạn hoặc đã được sử dụng.');
    }
    return user;
  }

  async function changeRole(actorId, userId, role) {
    return model.updateUserRole({ actorId, userId, role });
  }

  async function changeStatus(actorId, userId, accountStatus) {
    return model.updateUserStatus({ actorId, userId, accountStatus });
  }

  return {
    acceptInvitation,
    changeRole,
    changeStatus,
    createStaff,
    listStaff: () => model.listStaff(),
    resendInvitation,
  };
}

module.exports = { createService };
