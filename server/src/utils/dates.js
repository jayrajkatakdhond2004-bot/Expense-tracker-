/**
 * All dates are handled in UTC so that an expense dated "2026-11-04"
 * always falls into November regardless of the server's timezone.
 */

const clock = require('./clock');

const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

function currentMonth(now = clock.now()) {
  return toMonthKey(now);
}

function toMonthKey(date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

/** Returns { start, end } where end is exclusive. */
function monthRange(monthKey) {
  const [year, month] = monthKey.split('-').map(Number);
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));
  return { start, end };
}

function shiftMonth(monthKey, delta) {
  const [year, month] = monthKey.split('-').map(Number);
  return toMonthKey(new Date(Date.UTC(year, month - 1 + delta, 1)));
}

function daysInMonth(monthKey) {
  const [year, month] = monthKey.split('-').map(Number);
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function addDays(date, days) {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

module.exports = {
  MONTH_RE,
  currentMonth,
  toMonthKey,
  monthRange,
  shiftMonth,
  daysInMonth,
  addDays,
};
