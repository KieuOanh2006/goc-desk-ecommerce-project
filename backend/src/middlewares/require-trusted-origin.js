const { createApiError } = require('./error-handler');
const { isTrustedRequest } = require('../config/cors');

function requireTrustedOrigin(req, res, next) {
  if (!isTrustedRequest(req)) {
    return next(createApiError(403, 'UNTRUSTED_ORIGIN', 'Nguồn yêu cầu không được phép.'));
  }
  return next();
}

module.exports = requireTrustedOrigin;
