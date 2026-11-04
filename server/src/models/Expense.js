const mongoose = require('mongoose');
const { PAYMENT_METHODS } = require('../config/constants');

const expenseSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true, min: 0.01 },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    date: { type: Date, required: true },
    note: { type: String, trim: true, maxlength: 200, default: '' },
    paymentMethod: { type: String, enum: PAYMENT_METHODS, default: 'cash' },
  },
  { timestamps: true, versionKey: false },
);

// Most queries are "this user's expenses in a date range", newest first.
expenseSchema.index({ user: 1, date: -1 });
// Supports category filters and per-category budget/analytics aggregations.
expenseSchema.index({ user: 1, category: 1, date: -1 });

module.exports = mongoose.model('Expense', expenseSchema);
