const { z } = require('zod');
const { objectId, month } = require('./common');
const { currentMonth } = require('../utils/dates');

const upsert = z.object({
  month,
  category: objectId.nullable().optional().default(null),
  limit: z.coerce.number().positive('Limit must be greater than 0').max(100_000_000),
});

const list = z.object({ month: month.default(() => currentMonth()) });

module.exports = { upsert, list };
