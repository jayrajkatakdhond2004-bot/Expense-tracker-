const analyticsService = require('../services/analytics.service');

async function summary(req, res) {
  const data = await analyticsService.summary(req.user._id, req.validated.query.month);
  res.json({ success: true, data });
}

async function byCategory(req, res) {
  const data = await analyticsService.byCategory(req.user._id, req.validated.query.month);
  res.json({ success: true, data });
}

async function trend(req, res) {
  const data = await analyticsService.trend(req.user._id, req.validated.query);
  res.json({ success: true, data });
}

module.exports = { summary, byCategory, trend };
