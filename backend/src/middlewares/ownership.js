const { createApiError } = require('./error-handler');

function isOwner(resourceOwnerId, authenticatedUserId) {
  return resourceOwnerId !== null
    && resourceOwnerId !== undefined
    && authenticatedUserId !== null
    && authenticatedUserId !== undefined
    && String(resourceOwnerId) === String(authenticatedUserId);
}

function requireOwnership(getResourceOwnerId, { allowAdmin = false } = {}) {
  if (typeof getResourceOwnerId !== 'function') {
    throw new TypeError('requireOwnership requires an owner ID resolver.');
  }

  return async (req, res, next) => {
    if (!req.auth?.user
      || req.auth.user.accountStatus !== 'active'
      || !req.auth.user.emailVerifiedAt) {
      return next(createApiError(401, 'UNAUTHENTICATED', 'Vui lòng đăng nhập.'));
    }
    if (allowAdmin && req.auth.user.role === 'admin') return next();

    let ownerId;
    try {
      ownerId = await getResourceOwnerId(req);
    } catch {
      return next(createApiError(403, 'FORBIDDEN', 'Không thể xác nhận quyền sở hữu tài nguyên.'));
    }
    if (!isOwner(ownerId, req.auth.user.id)) {
      return next(createApiError(403, 'FORBIDDEN', 'Bạn không có quyền truy cập tài nguyên này.'));
    }
    return next();
  };
}

module.exports = { isOwner, requireOwnership };
