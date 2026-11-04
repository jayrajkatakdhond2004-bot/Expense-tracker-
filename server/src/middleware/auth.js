const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { AUTH_COOKIE } = require('../config/constants');
const { User } = require('../models');
const ApiError = require('../utils/ApiError');

function extractToken(req) {
  if (req.cookies?.[AUTH_COOKIE]) return req.cookies[AUTH_COOKIE];
  // Bearer tokens are accepted too, which is handy for API clients like Postman.
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) return header.slice(7);
  return null;
}

async function requireAuth(req, _res, next) {
  const token = extractToken(req);
  if (!token) throw ApiError.unauthorized();

  let payload;
  try {
    payload = jwt.verify(token, env.JWT_SECRET);
  } catch {
    throw ApiError.unauthorized('Invalid or expired session');
  }

  const user = await User.findById(payload.sub);
  if (!user) throw ApiError.unauthorized('User no longer exists');

  req.user = user;
  next();
}

module.exports = { requireAuth };
