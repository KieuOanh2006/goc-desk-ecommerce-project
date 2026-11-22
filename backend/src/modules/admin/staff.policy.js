const { createApiError } = require('../../middlewares/error-handler');

function sameId(left, right) {
  return String(left) === String(right);
}

function assertRoleChangePermitted({ actorId, targetId, targetRole, targetStatus, nextRole, activeAdminIds }) {
  if (targetStatus === 'pending' && nextRole === 'admin') {
    throw createApiError(409, 'PENDING_ADMIN_ROLE_FORBIDDEN', 'Không thể cấp quyền Admin cho tài khoản đang chờ xác nhận lời mời.');
  }
  if (sameId(actorId, targetId) && targetRole === 'admin' && nextRole !== 'admin') {
    throw createApiError(403, 'ADMIN_SELF_DEMOTION_FORBIDDEN', 'Admin không thể tự hạ quyền của mình.');
  }
  if (targetRole === 'admin' && targetStatus === 'active' && nextRole !== 'admin'
    && activeAdminIds.length <= 1) {
    throw createApiError(409, 'LAST_ACTIVE_ADMIN', 'Không thể hạ quyền Admin cuối cùng đang hoạt động.');
  }
}

function assertStatusChangePermitted({ actorId, targetId, targetRole, targetStatus, nextStatus, activeAdminIds, emailVerifiedAt }) {
  if (nextStatus === 'locked' && sameId(actorId, targetId)) {
    throw createApiError(403, 'ADMIN_SELF_LOCK_FORBIDDEN', 'Không thể tự khóa tài khoản đang đăng nhập.');
  }
  if (targetStatus === 'pending') {
    throw createApiError(409, 'PENDING_ACCOUNT_STATUS_CHANGE', 'Tài khoản đang chờ xác nhận không thể đổi trạng thái tại đây.');
  }
  if (nextStatus === 'active' && !emailVerifiedAt) {
    throw createApiError(409, 'ACCOUNT_NOT_VERIFIED', 'Chỉ có thể mở khóa tài khoản đã xác minh email.');
  }
  if (targetRole === 'admin' && targetStatus === 'active' && nextStatus === 'locked'
    && activeAdminIds.length <= 1) {
    throw createApiError(409, 'LAST_ACTIVE_ADMIN', 'Không thể khóa Admin cuối cùng đang hoạt động.');
  }
}

module.exports = { assertRoleChangePermitted, assertStatusChangePermitted };
