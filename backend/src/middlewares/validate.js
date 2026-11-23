const { createApiError } = require('./error-handler');

const VALID_SOURCES = new Set(['body', 'params', 'query']);

function validate(schemas) {
  return (req, res, next) => {
    const validated = { ...(req.validated || {}) };
    const details = [];

    for (const [source, schema] of Object.entries(schemas)) {
      if (!VALID_SOURCES.has(source)) {
        return next(new TypeError(`Unsupported validation source: ${source}`));
      }

      const result = schema.safeParse(req[source]);
      if (!result.success) {
        details.push(...result.error.issues.map((issue) => ({
          path: [source, ...issue.path].join('.'),
          code: issue.code,
          message: issue.message,
        })));
        continue;
      }

      validated[source] = result.data;
    }

    if (details.length > 0) {
      return next(createApiError(
        422,
        'VALIDATION_ERROR',
        'Dữ liệu đầu vào không hợp lệ.',
        details,
      ));
    }

    req.validated = validated;
    return next();
  };
}

module.exports = validate;
