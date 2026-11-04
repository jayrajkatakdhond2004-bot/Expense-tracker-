const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    month: { type: String, required: true, match: /^\d{4}-(0[1-9]|1[0-2])$/ },
    // null => overall budget for the month
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
    limit: { type: Number, required: true, min: 1 },
  },
  { timestamps: true, versionKey: false },
);

budgetSchema.index({ user: 1, month: 1, category: 1 }, { unique: true });

module.exports = mongoose.model('Budget', budgetSchema);
