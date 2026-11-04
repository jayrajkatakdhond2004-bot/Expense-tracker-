const { z } = require('zod');
const { month } = require('./common');
const { currentMonth } = require('../utils/dates');

const monthQuery = z.object({ month: month.default(() => currentMonth()) });

const trend = z.object({
  granularity: z.enum(['daily', 'monthly']).default('daily'),
  month: month.default(() => currentMonth()),
  months: z.coerce.number().int().min(2).max(24).default(6),
});

module.exports = { monthQuery, trend };
