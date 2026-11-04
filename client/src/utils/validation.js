import { z } from 'zod';

// Mirrors the server-side zod schemas so users get instant feedback.

export const loginSchema = z.object({
  email: z.string().trim().min(1, 'Email is required').pipe(z.email('Enter a valid email')),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(60),
    email: z.string().trim().min(1, 'Email is required').pipe(z.email('Enter a valid email')),
    password: z
      .string()
      .min(8, 'At least 8 characters')
      .max(72, 'At most 72 characters')
      .regex(/[A-Za-z]/, 'Include at least one letter')
      .regex(/\d/, 'Include at least one number'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const expenseSchema = z.object({
  amount: z.coerce
    .number({ error: 'Enter an amount' })
    .positive('Amount must be greater than 0')
    .max(10_000_000, 'Amount is too large'),
  category: z.string().min(1, 'Pick a category'),
  date: z.string().min(1, 'Pick a date'),
  paymentMethod: z.string().min(1),
  note: z.string().trim().max(200, 'Keep the note under 200 characters'),
});

export const categorySchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(30, 'At most 30 characters'),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
});

export const budgetSchema = z.object({
  category: z.string(), // '' => overall budget
  limit: z.coerce.number({ error: 'Enter a limit' }).positive('Limit must be greater than 0'),
});

/** Copies server-side field errors onto react-hook-form fields. Returns true if any matched. */
export function applyServerErrors(error, setError, fields) {
  let matched = false;
  for (const { field, message } of error.details ?? []) {
    if (fields.includes(field)) {
      setError(field, { type: 'server', message });
      matched = true;
    }
  }
  return matched;
}
