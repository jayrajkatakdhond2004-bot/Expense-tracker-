const rateLimit = require('express-rate-limit');
const env = require('../config/env');

const common = {
  windowMs: 15 * 60 * 1000,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skip: () => env.isTest,
};

const apiLimiter = rateLimit({
  ...common,
  limit: env.RATE_LIMIT_MAX,
  message: { success: false, error: { message: 'Too many requests, please try again later' } },
});

// Stricter limit on credential endpoints to slow down brute-force attempts.
const authLimiter = rateLimit({
  ...common,
  limit: env.AUTH_RATE_LIMIT_MAX,
  message: {
    success: false,
    error: { message: 'Too many login attempts, please try again in 15 minutes' },
  },
});

module.exports = { apiLimiter, authLimiter };
