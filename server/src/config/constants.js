// Colors are the validated categorical palette, assigned in a fixed order so a
// category keeps the same color in every chart (the client maps each to a dark-mode step).
const DEFAULT_CATEGORIES = [
  { name: 'Food', color: '#2a78d6', icon: 'utensils' },
  { name: 'Travel', color: '#eb6834', icon: 'plane' },
  { name: 'Rent', color: '#1baf7a', icon: 'home' },
  { name: 'Shopping', color: '#eda100', icon: 'shopping-bag' },
  { name: 'Bills', color: '#e87ba4', icon: 'receipt' },
  { name: 'Health', color: '#008300', icon: 'heart-pulse' },
  { name: 'Other', color: '#6250d6', icon: 'tag' },
];

const PAYMENT_METHODS = ['cash', 'card', 'upi', 'bank_transfer', 'wallet', 'other'];

const BUDGET_THRESHOLDS = { WARNING: 80, EXCEEDED: 100 };

const AUTH_COOKIE = 'token';

module.exports = { DEFAULT_CATEGORIES, PAYMENT_METHODS, BUDGET_THRESHOLDS, AUTH_COOKIE };
