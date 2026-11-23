const STATUS_CODES = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHENTICATED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  422: 'VALIDATION_ERROR',
  503: 'SERVICE_UNAVAILABLE',
};

function createApiError(statusCode, code, message, details) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  error.details = details;
  error.isOperational = true;
  return error;
}

function notFoundHandler(req, res, next) {
  next(createApiError(404, 'ROUTE_NOT_FOUND', 'Không tìm thấy endpoint.'));
}

function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);

  const isMalformedJson = error.type === 'entity.parse.failed';
  const statusCode = error.isOperational
    ? error.statusCode
    : isMalformedJson
      ? 400
      : 500;
  const code = error.isOperational
    ? error.code
    : isMalformedJson
      ? 'INVALID_JSON'
      : STATUS_CODES[statusCode] || 'INTERNAL_SERVER_ERROR';
  const message = statusCode === 500
    ? 'Đã xảy ra lỗi máy chủ.'
    : statusCode >= 500
      ? (error.isOperational ? error.message : 'Dịch vụ tạm thời không khả dụng.')
    : error.isOperational
      ? error.message
      : 'Dữ liệu yêu cầu không hợp lệ.';

  // Log only safe identifiers; never log error messages, SQL, or request bodies.
  console.error('[api-error]', { statusCode, code });

  const payload = { success: false, message, error: { code } };
  if (error.isOperational && error.details !== undefined) {
    payload.error.details = error.details;
  }

  return res.status(statusCode).json(payload);
}

module.exports = { createApiError, notFoundHandler, errorHandler };
