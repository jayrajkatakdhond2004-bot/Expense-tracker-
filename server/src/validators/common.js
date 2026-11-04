const { z } = require('zod');
const { MONTH_RE } = require('../utils/dates');

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');
const idParams = z.object({ id: objectId });
const month = z.string().regex(MONTH_RE, 'Month must be in YYYY-MM format');
// Accepts "YYYY-MM-DD" or a full ISO string.
const dateInput = z.coerce.date({ error: 'Invalid date' });

module.exports = { objectId, idParams, month, dateInput };
