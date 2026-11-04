const { z } = require('zod');
const { PAYMENT_METHODS } = require('../config/constants');
const { objectId, dateInput } = require('./common');

const amount = z.coerce
  .number({ error: 'Amount must be a number' })
  .positive('Amount must be greater than 0')
  .max(10_000_000, 'Amount is too large')
  .transform((v) => Math.round(v * 100) / 100);

const create = z.object({
  amount,
  category: objectId,
  date: dateInput,
  note: z.string().trim().max(200, 'Note must be at most 200 characters').optional().default(''),
  paymentMethod: z.enum(PAYMENT_METHODS).optional().default('cash'),
});

const update = z
  .object({
    amount,
    category: objectId,
    date: dateInput,
    note: z.string().trim().max(200),
    paymentMethod: z.enum(PAYMENT_METHODS),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, 'At least one field is required');

const filters = z
  .object({
    from: dateInput.optional(),
    to: dateInput.optional(),
    category: objectId.optional(),
    paymentMethod: z.enum(PAYMENT_METHODS).optional(),
    minAmount: z.coerce.number().min(0).optional(),
    maxAmount: z.coerce.number().min(0).optional(),
    q: z.string().trim().max(100).optional(),
  })
  .refine((d) => !(d.from && d.to) || d.from <= d.to, {
    message: '"from" must be before "to"',
    path: ['from'],
  })
  .refine(
    (d) => d.minAmount === undefined || d.maxAmount === undefined || d.minAmount <= d.maxAmount,
    { message: 'minAmount must be less than or equal to maxAmount', path: ['minAmount'] },
  );

const list = filters.and(
  z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    sort: z.enum(['date', '-date', 'amount', '-amount']).default('-date'),
  }),
);

module.exports = { create, update, filters, list };
