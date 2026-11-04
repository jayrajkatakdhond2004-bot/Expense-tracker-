/**
 * Seeds a demo user with ~3 months of realistic expenses, a couple of custom
 * categories and budgets for the current month. Safe to re-run: it wipes and
 * recreates only the demo user's data.
 *
 *   npm run seed
 */
const { connectDB, disconnectDB } = require('../config/db');
const { User, Category, Expense, Budget } = require('../models');
const { ensureDefaultCategories } = require('../services/category.service');
const { currentMonth, toMonthKey, addDays } = require('../utils/dates');

const DEMO = { name: 'Demo User', email: 'demo@expense.app', password: 'Demo@1234' };

// Small deterministic PRNG (mulberry32) so every seed run produces the same data.
function createRng(seed) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = createRng(42);
const pick = (arr) => arr[Math.floor(rng() * arr.length)];
const between = (min, max) => Math.round(min + rng() * (max - min));

// Per-category: chance of an expense on a given day, amount range, notes, payment methods.
const DAILY_PATTERNS = {
  Food: {
    p: 0.75,
    min: 80,
    max: 650,
    notes: [
      'Lunch at canteen',
      'Swiggy order',
      'Groceries',
      'Coffee with friends',
      'Zomato dinner',
      'Breakfast',
      'Fruits and vegetables',
    ],
    pay: ['upi', 'upi', 'cash', 'card'],
  },
  Travel: {
    p: 0.35,
    min: 40,
    max: 900,
    notes: [
      'Metro card recharge',
      'Uber to college',
      'Auto rickshaw',
      'Rapido ride',
      'Bus pass',
      'Train ticket home',
    ],
    pay: ['upi', 'wallet', 'cash'],
  },
  Shopping: {
    p: 0.1,
    min: 300,
    max: 3500,
    notes: ['Amazon order', 'New t-shirt', 'Headphones', 'Myntra sale', 'Stationery', 'Shoes'],
    pay: ['card', 'upi'],
  },
  Health: {
    p: 0.05,
    min: 150,
    max: 1800,
    notes: ['Pharmacy', 'Doctor consultation', 'Gym supplement', 'Lab test'],
    pay: ['upi', 'card'],
  },
  Entertainment: {
    p: 0.1,
    min: 150,
    max: 1200,
    notes: ['Movie tickets', 'Concert pass', 'Bowling', 'Game purchase'],
    pay: ['card', 'upi'],
  },
  Education: {
    p: 0.05,
    min: 200,
    max: 2500,
    notes: ['Udemy course', 'Books', 'Exam fee', 'Printouts'],
    pay: ['card', 'upi'],
  },
  Other: {
    p: 0.04,
    min: 50,
    max: 800,
    notes: ['Gift for friend', 'Donation', 'Haircut', 'Laundry'],
    pay: ['cash', 'upi'],
  },
};

const MONTHLY = [
  {
    category: 'Rent',
    day: 1,
    amount: 12000,
    note: 'Monthly PG rent',
    paymentMethod: 'bank_transfer',
  },
  { category: 'Bills', day: 5, amount: 799, note: 'Mobile + WiFi recharge', paymentMethod: 'upi' },
  { category: 'Bills', day: 10, amount: 1450, note: 'Electricity bill', paymentMethod: 'upi' },
  { category: 'Bills', day: 15, amount: 199, note: 'Spotify + Netflix', paymentMethod: 'card' },
];

function buildExpenses(userId, categoryIds) {
  const today = new Date();
  const end = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  // Start of the month two months ago => current month plus two full months.
  const start = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() - 2, 1));
  const expenses = [];

  for (let d = start; d <= end; d = addDays(d, 1)) {
    for (const [name, pattern] of Object.entries(DAILY_PATTERNS)) {
      if (rng() < pattern.p) {
        expenses.push({
          user: userId,
          category: categoryIds[name],
          amount: between(pattern.min, pattern.max),
          date: d,
          note: pick(pattern.notes),
          paymentMethod: pick(pattern.pay),
        });
      }
    }
    for (const m of MONTHLY) {
      if (d.getUTCDate() === m.day) {
        expenses.push({ ...m, user: userId, date: d, category: categoryIds[m.category] });
      }
    }
  }
  return expenses;
}

async function seed() {
  await connectDB();
  await ensureDefaultCategories();

  const existing = await User.findOne({ email: DEMO.email });
  if (existing) {
    await Promise.all([
      Expense.deleteMany({ user: existing._id }),
      Budget.deleteMany({ user: existing._id }),
      Category.deleteMany({ user: existing._id }),
    ]);
    await existing.deleteOne();
  }

  const user = await User.create(DEMO);
  await Category.insertMany([
    { user: user._id, name: 'Entertainment', color: '#e34948', icon: 'film' },
    { user: user._id, name: 'Education', color: '#7a7974', icon: 'book' },
  ]);

  const categories = await Category.find({ $or: [{ user: null }, { user: user._id }] }).lean();
  const ids = Object.fromEntries(categories.map((c) => [c.name, c._id]));

  const expenses = buildExpenses(user._id, ids);
  await Expense.insertMany(expenses);

  // Budgets are sized from this month's actual spending so the demo always shows
  // one budget in the warning zone (>= 80%) and one exceeded (>= 100%).
  const month = currentMonth();
  const spent = (name) =>
    expenses
      .filter((e) => String(e.category) === String(ids[name]) && toMonthKey(e.date) === month)
      .reduce((sum, e) => sum + e.amount, 0);
  const roundUp = (n, step = 100) => Math.max(step, Math.ceil(n / step) * step);

  await Budget.insertMany([
    { user: user._id, month, category: null, limit: 35000 },
    { user: user._id, month, category: ids.Food, limit: roundUp(spent('Food') / 0.85) },
    {
      user: user._id,
      month,
      category: ids.Travel,
      limit: Math.max(100, Math.floor(spent('Travel') / 1.1 / 100) * 100),
    },
    { user: user._id, month, category: ids.Shopping, limit: 5000 },
  ]);

  console.log(`Seeded ${expenses.length} expenses for ${DEMO.email} (password: ${DEMO.password})`);
}

seed()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exitCode = 1;
  })
  .finally(disconnectDB);
