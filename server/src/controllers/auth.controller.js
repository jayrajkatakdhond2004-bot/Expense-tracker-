const env = require('../config/env');
const { AUTH_COOKIE } = require('../config/constants');
const authService = require('../services/auth.service');

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

const cookieOptions = {
  httpOnly: true, // not readable from JavaScript, which mitigates token theft via XSS
  secure: env.cookieSecure,
  sameSite: 'strict', // not sent on cross-site requests, which mitigates CSRF
  path: '/',
};

function sendAuth(res, status, { user, token }) {
  res.cookie(AUTH_COOKIE, token, { ...cookieOptions, maxAge: SEVEN_DAYS_MS });
  res.status(status).json({ success: true, data: { user } });
}

async function register(req, res) {
  sendAuth(res, 201, await authService.register(req.validated.body));
}

async function login(req, res) {
  sendAuth(res, 200, await authService.login(req.validated.body));
}

function logout(_req, res) {
  res.clearCookie(AUTH_COOKIE, cookieOptions);
  res.json({ success: true, data: { message: 'Logged out' } });
}

function me(req, res) {
  res.json({ success: true, data: { user: req.user } });
}

module.exports = { register, login, logout, me };
