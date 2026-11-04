/**
 * Validates req.body / req.query / req.params against zod schemas.
 * Parsed (coerced, defaulted) values are stored on req.validated because
 * req.query is read-only in Express 5.
 */
const validate =
  (schemas = {}) =>
  (req, _res, next) => {
    req.validated = req.validated || {};
    for (const key of ['params', 'query', 'body']) {
      if (schemas[key]) {
        // Throws ZodError on failure, handled by the error middleware.
        req.validated[key] = schemas[key].parse(req[key] ?? {});
      }
    }
    next();
  };

module.exports = validate;
