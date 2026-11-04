const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    // null => built-in default category shared by every user
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    name: { type: String, required: true, trim: true, maxlength: 30 },
    color: { type: String, default: '#64748b', match: /^#[0-9a-fA-F]{6}$/ },
    icon: { type: String, default: 'tag', maxlength: 30 },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false },
);

// Category names are unique per user, case-insensitively.
categorySchema.index(
  { user: 1, name: 1 },
  { unique: true, collation: { locale: 'en', strength: 2 } },
);

module.exports = mongoose.model('Category', categorySchema);
