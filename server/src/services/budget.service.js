const mongoose = require('mongoose');
const { Budget, Expense } = require('../models');
const ApiError = require('../utils/ApiError');
const { monthRange } = require('../utils/dates');
const { BUDGET_THRESHOLDS } = require('../config/constants');
const categoryService = require('./category.service');

function statusFor(percent) {
  if (percent >= BUDGET_THRESHOLDS.EXCEEDED) return 'exceeded';
  if (percent >= BUDGET_THRESHOLDS.WARNING) return 'warning';
  return 'ok';
}

/** Spending for a month, grouped by category, in one aggregation. */
async function spendingByCategory(userId, month) {
  const { start, end } = monthRange(month);
  const rows = await Expense.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(String(userId)),
        date: { $gte: start, $lt: end },
      },
    },
    { $group: { _id: '$category', total: { $sum: '$amount' } } },
  ]);
  const byCategory = new Map(rows.map((r) => [String(r._id), r.total]));
  const overall = rows.reduce((acc, r) => acc + r.total, 0);
  return { byCategory, overall };
}

async function list(userId, month) {
  const [budgets, spending] = await Promise.all([
    Budget.find({ user: userId, month }).populate('category', 'name color icon').lean(),
    spendingByCategory(userId, month),
  ]);

  return budgets
    .map((b) => {
      const spent = b.category
        ? (spending.byCategory.get(String(b.category._id)) ?? 0)
        : spending.overall;
      const percent = Math.round((spent / b.limit) * 1000) / 10;
      return {
        ...b,
        spent: Math.round(spent * 100) / 100,
        remaining: Math.round((b.limit - spent) * 100) / 100,
        percent,
        status: statusFor(percent),
      };
    })
    .sort((a, b) => (a.category ? 1 : 0) - (b.category ? 1 : 0) || b.percent - a.percent);
}

async function upsert(userId, { month, category, limit }) {
  if (category) await categoryService.assertUsable(userId, category);
  return Budget.findOneAndUpdate(
    { user: userId, month, category: category ?? null },
    { $set: { limit } },
    { upsert: true, returnDocument: 'after', runValidators: true, setDefaultsOnInsert: true },
  ).populate('category', 'name color icon');
}

async function remove(userId, id) {
  const result = await Budget.deleteOne({ _id: id, user: userId });
  if (result.deletedCount === 0) throw ApiError.notFound('Budget not found');
}

module.exports = { list, upsert, remove, statusFor };
