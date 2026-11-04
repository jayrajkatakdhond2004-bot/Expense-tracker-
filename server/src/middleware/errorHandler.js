const { ZodError } = require('zod');
const mongoose = require('mongoose');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');

function notFound(req, _res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

function normalize(err) {
  if (err instanceof ApiError) return err;

  if (err instanceof ZodError) {
    const details = err.issues.map((i) => ({ field: i.path.join('.'), message: i.message }));
    return ApiError.badRequest(details[0]?.message || 'Validation failed', details);
  }

  if (err instanceof mongoose.Error.ValidationError) {
    const details = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
    return ApiError.badRequest('Validation failed', details);
  }

  if (err instanceof mongoose.Error.CastError) {
    return ApiError.badRequest(`Invalid value for ${err.path}`);
  }

  if (err?.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return ApiError.conflict(`A record with this ${field} already exists`);
  }

  if (err?.type === 'entity.parse.failed') {
    return ApiError.badRequest('Malformed JSON body');
  }

  return null;
}

function errorHandler(err, _req, res, _next) {
  const apiError = normalize(err);

  if (!apiError) {
    if (!env.isTest) console.error(err);
    return res.status(500).json({
      success: false,
      error: { message: env.isProduction ? 'Internal server error' : err.message },
    });
  }

  const body = { success: false, error: { message: apiError.message } };
  if (apiError.details) body.error.details = apiError.details;
  return res.status(apiError.statusCode).json(body);
}

module.exports = { notFound, errorHandler };
