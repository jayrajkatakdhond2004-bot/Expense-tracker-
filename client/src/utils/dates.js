const pad = (n) => String(n).padStart(2, '0');

export function currentMonthKey(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

export function todayISO(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function shiftMonthKey(monthKey, delta) {
  const [y, m] = monthKey.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return currentMonthKey(d);
}

/** "2026-11-04T00:00:00.000Z" -> "2026-11-04" for <input type="date"> */
export const toDateInput = (iso) => (iso ? iso.slice(0, 10) : '');
