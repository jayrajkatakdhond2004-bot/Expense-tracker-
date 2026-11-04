const mongoose = require('mongoose');
const { Expense } = require('../models');
const clock = require('../utils/clock');
const {
  monthRange,
  shiftMonth,
  daysInMonth,
  currentMonth,
  toMonthKey,
  addDays,
} = require('../utils/dates');

const round2 = (n) => Math.round(n * 100) / 100;
const oid = (id) => new mongoose.Types.ObjectId(String(id));

/**
 * Monthly total plus a month-over-month comparison. While a month is still in
 * progress, comparing it with the whole previous month is misleading, so the
 * comparison uses the same number of days of the previous month instead.
 */
async function summary(userId, month) {
  const current = monthRange(month);
  const previousKey = shiftMonth(month, -1);
  const previous = monthRange(previousKey);

  const isCurrentMonth = month === currentMonth();
  const daysElapsed = isCurrentMonth ? clock.now().getUTCDate() : daysInMonth(month);
  const samePeriodEnd = addDays(previous.start, Math.min(daysElapsed, daysInMonth(previousKey)));

  const rows = await Expense.aggregate([
    { $match: { user: oid(userId), date: { $gte: previous.start, $lt: current.end } } },
    {
      $group: {
        _id: { $cond: [{ $gte: ['$date', current.start] }, 'current', 'previous'] },
        total: { $sum: '$amount' },
        samePeriodTotal: { $sum: { $cond: [{ $lt: ['$date', samePeriodEnd] }, '$amount', 0] } },
        count: { $sum: 1 },
        max: { $max: '$amount' },
      },
    },
  ]);

  const empty = { total: 0, samePeriodTotal: 0, count: 0, max: 0 };
  const cur = rows.find((r) => r._id === 'current') ?? empty;
  const prev = rows.find((r) => r._id === 'previous') ?? empty;

  const basis = isCurrentMonth ? 'same-period' : 'full-month';
  const baseline = isCurrentMonth ? prev.samePeriodTotal : prev.total;

  return {
    month,
    total: round2(cur.total),
    count: cur.count,
    largestExpense: round2(cur.max),
    dailyAverage: round2(cur.total / daysElapsed),
    daysElapsed,
    previous: {
      month: previousKey,
      total: round2(prev.total),
      samePeriodTotal: round2(prev.samePeriodTotal),
      count: prev.count,
    },
    change: {
      basis,
      baseline: round2(baseline),
      amount: round2(cur.total - baseline),
      // null when there is nothing to compare against
      percent: baseline > 0 ? round2(((cur.total - baseline) / baseline) * 100) : null,
    },
  };
}

/** Category breakdown for the pie chart, and the top 3 categories. */
async function byCategory(userId, month) {
  const { start, end } = monthRange(month);

  const rows = await Expense.aggregate([
    { $match: { user: oid(userId), date: { $gte: start, $lt: end } } },
    { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
    { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'category' } },
    { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 0,
        categoryId: '$_id',
        name: { $ifNull: ['$category.name', 'Unknown'] },
        color: { $ifNull: ['$category.color', '#64748b'] },
        total: { $round: ['$total', 2] },
        count: 1,
      },
    },
    { $sort: { total: -1 } },
  ]);

  const grandTotal = rows.reduce((acc, r) => acc + r.total, 0);
  const categories = rows.map((r) => ({
    ...r,
    percent: grandTotal ? round2((r.total / grandTotal) * 100) : 0,
  }));

  return { month, total: round2(grandTotal), categories, top: categories.slice(0, 3) };
}

/**
 * Spending trend. "daily" returns every day of the given month; "monthly"
 * returns the last N months ending at the given month. Gaps are zero-filled
 * so charts render a continuous line.
 */
async function trend(userId, { granularity, month, months }) {
  const daily = granularity === 'daily';
  const startKey = daily ? month : shiftMonth(month, -(months - 1));
  const start = monthRange(startKey).start;
  const end = monthRange(month).end;

  const rows = await Expense.aggregate([
    { $match: { user: oid(userId), date: { $gte: start, $lt: end } } },
    {
      $group: {
        _id: {
          $dateToString: { format: daily ? '%Y-%m-%d' : '%Y-%m', date: '$date', timezone: 'UTC' },
        },
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
  ]);
  const totals = new Map(rows.map((r) => [r._id, r]));

  const points = [];
  if (daily) {
    for (let d = start; d < end; d = addDays(d, 1)) {
      const key = d.toISOString().slice(0, 10);
      points.push({
        period: key,
        total: round2(totals.get(key)?.total ?? 0),
        count: totals.get(key)?.count ?? 0,
      });
    }
  } else {
    for (let i = 0; i < months; i += 1) {
      const key = shiftMonth(startKey, i);
      points.push({
        period: key,
        total: round2(totals.get(key)?.total ?? 0),
        count: totals.get(key)?.count ?? 0,
      });
    }
  }

  return { granularity, from: daily ? month : startKey, to: toMonthKey(addDays(end, -1)), points };
}

module.exports = { summary, byCategory, trend };
