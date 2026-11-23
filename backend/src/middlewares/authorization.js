const { createApiError } = require('./error-handler');

const SYSTEM_ROLES = new Set([
  'member',
  'admin',
  'product_content_staff',
  'order_support_staff',
]);

function authorizeRoles(...roles) {
  const allowedRoles = new Set(roles.flat());
  if (allowedRoles.size === 0 || [...allowedRoles].some((role) => !SYSTEM_ROLES.has(role))) {
    throw new TypeError('authorizeRoles requires one or more supported roles.');
  }

  return (req, res, next) => {
    if (!req.auth?.user
      || req.auth.user.accountStatus !== 'active'
      || !req.auth.user.emailVerifiedAt) {
      return next(createApiError(401, 'UNAUTHENTICATED', 'Vui lòng đăng nhập.'));
    }
    if (!allowedRoles.has(req.auth.user.role)) {
      return next(createApiError(403, 'FORBIDDEN', 'Bạn không có quyền thực hiện thao tác này.'));
    }
    return next();
  };
}

module.exports = { SYSTEM_ROLES, authorizeRoles };
