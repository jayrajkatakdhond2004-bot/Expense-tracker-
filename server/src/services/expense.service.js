const mongoose = require('mongoose');
const { Expense } = require('../models');
const ApiError = require('../utils/ApiError');
const escapeRegex = require('../utils/escapeRegex');
const { addDays } = require('../utils/dates');
const { toCsv } = require('../utils/csv');
const categoryService = require('./category.service');

const EXPORT_LIMIT = 10_000;
const SORTS = {
  date: { date: 1, _id: 1 },
  '-date': { date: -1, _id: -1 },
  amount: { amount: 1, _id: 1 },
  '-amount': { amount: -1, _id: -1 },
};

/** Translates validated query filters into a MongoDB filter. */
function buildFilter(userId, f = {}) {
  const filter = { user: new mongoose.Types.ObjectId(String(userId)) };

  if (f.from || f.to) {
    filter.date = {};
    if (f.from) filter.date.$gte = f.from;
    // "to" is inclusive of the whole day.
    if (f.to) filter.date.$lt = addDays(f.to, 1);
  }
  if (f.category) filter.category = new mongoose.Types.ObjectId(f.category);
  if (f.paymentMethod) filter.paymentMethod = f.paymentMethod;
  if (f.minAmount !== undefined || f.maxAmount !== undefined) {
    filter.amount = {};
    if (f.minAmount !== undefined) filter.amount.$gte = f.minAmount;
    if (f.maxAmount !== undefined) filter.amount.$lte = f.maxAmount;
  }
  if (f.q) filter.note = { $regex: escapeRegex(f.q), $options: 'i' };

  return filter;
}

async function list(userId, query) {
  const { page, limit, sort, ...filters } = query;
  const filter = buildFilter(userId, filters);

  const [items, total, [sum]] = await Promise.all([
    Expense.find(filter)
      .sort(SORTS[sort])
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('category', 'name color icon')
      .lean(),
    Expense.countDocuments(filter),
    Expense.aggregate([{ $match: filter }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
  ]);

  return {
    items,
    totalAmount: sum?.total ?? 0,
    pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
  };
}

async function getById(userId, id) {
  const expense = await Expense.findOne({ _id: id, user: userId }).populate(
    'category',
    'name color icon',
  );
  if (!expense) throw ApiError.notFound('Expense not found');
  return expense;
}

async function create(userId, data) {
  await categoryService.assertUsable(userId, data.category);
  const expense = await Expense.create({ ...data, user: userId });
  return expense.populate('category', 'name color icon');
}

async function update(userId, id, data) {
  if (data.category) await categoryService.assertUsable(userId, data.category);
  const expense = await Expense.findOneAndUpdate({ _id: id, user: userId }, data, {
    returnDocument: 'after',
    runValidators: true,
  }).populate('category', 'name color icon');
  if (!expense) throw ApiError.notFound('Expense not found');
  return expense;
}

async function remove(userId, id) {
  const result = await Expense.deleteOne({ _id: id, user: userId });
  if (result.deletedCount === 0) throw ApiError.notFound('Expense not found');
}

async function exportCsv(userId, filters) {
  const expenses = await Expense.find(buildFilter(userId, filters))
    .sort(SORTS['-date'])
    .limit(EXPORT_LIMIT)
    .populate('category', 'name')
    .lean();

  return toCsv(
    ['Date', 'Category', 'Amount', 'Payment Method', 'Note'],
    expenses.map((e) => [
      e.date.toISOString().slice(0, 10),
      e.category?.name ?? 'Unknown',
      e.amount.toFixed(2),
      e.paymentMethod,
      e.note,
    ]),
  );
}

module.exports = { buildFilter, list, getById, create, update, remove, exportCsv };
