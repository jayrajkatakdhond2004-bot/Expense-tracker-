const { z } = require('zod');

const color = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Color must be a hex value like #22c55e');

const create = z.object({
  name: z.string().trim().min(1, 'Name is required').max(30, 'Name must be at most 30 characters'),
  color: color.optional(),
  icon: z.string().trim().max(30).optional(),
});

const update = create
  .partial()
  .refine((data) => Object.keys(data).length > 0, 'At least one field is required');

module.exports = { create, update };
