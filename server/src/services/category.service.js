const { Category, Expense, Budget } = require('../models');
const { DEFAULT_CATEGORIES } = require('../config/constants');
const ApiError = require('../utils/ApiError');

/** Idempotently creates the built-in categories shared by all users. */
async function ensureDefaultCategories() {
  await Category.bulkWrite(
    DEFAULT_CATEGORIES.map((c) => ({
      updateOne: {
        filter: { user: null, name: c.name },
        update: { $setOnInsert: { ...c, user: null, isDefault: true } },
        upsert: true,
      },
    })),
  );
}

function visibleTo(userId) {
  return { $or: [{ user: null }, { user: userId }] };
}

async function list(userId) {
  return Category.find(visibleTo(userId)).sort({ isDefault: -1, name: 1 }).lean();
}

/** Throws unless the category exists and is a default or belongs to the user. */
async function assertUsable(userId, categoryId) {
  const exists = await Category.exists({ _id: categoryId, ...visibleTo(userId) });
  if (!exists) throw ApiError.badRequest('Category does not exist');
}

async function assertNameAvailable(userId, name, excludeId) {
  const clash = await Category.findOne({
    ...visibleTo(userId),
    name,
    ...(excludeId && { _id: { $ne: excludeId } }),
  }).collation({ locale: 'en', strength: 2 });
  if (clash) throw ApiError.conflict(`Category "${name}" already exists`);
}

async function create(userId, data) {
  await assertNameAvailable(userId, data.name);
  return Category.create({ ...data, user: userId, isDefault: false });
}

async function getOwned(userId, id) {
  const category = await Category.findById(id);
  if (!category) throw ApiError.notFound('Category not found');
  if (category.isDefault) throw ApiError.forbidden('Default categories cannot be modified');
  if (!category.user.equals(userId)) throw ApiError.notFound('Category not found');
  return category;
}

async function update(userId, id, data) {
  const category = await getOwned(userId, id);
  if (data.name) await assertNameAvailable(userId, data.name, id);
  Object.assign(category, data);
  return category.save();
}

async function remove(userId, id) {
  const category = await getOwned(userId, id);
  const inUse = await Expense.countDocuments({ user: userId, category: id });
  if (inUse > 0) {
    throw ApiError.conflict(
      `Category is used by ${inUse} expense(s). Reassign or delete them first.`,
    );
  }
  await Budget.deleteMany({ user: userId, category: id });
  await category.deleteOne();
}

module.exports = { ensureDefaultCategories, list, assertUsable, create, update, remove };
