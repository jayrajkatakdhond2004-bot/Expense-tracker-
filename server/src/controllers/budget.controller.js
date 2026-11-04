const budgetService = require('../services/budget.service');

async function list(req, res) {
  const budgets = await budgetService.list(req.user._id, req.validated.query.month);
  res.json({ success: true, data: budgets });
}

async function upsert(req, res) {
  const budget = await budgetService.upsert(req.user._id, req.validated.body);
  res.json({ success: true, data: budget });
}

async function remove(req, res) {
  await budgetService.remove(req.user._id, req.validated.params.id);
  res.status(204).end();
}

module.exports = { list, upsert, remove };
