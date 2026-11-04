const currencyFormatters = new Map();

export function formatCurrency(amount, currency = 'INR', { compact = false } = {}) {
  const key = `${currency}-${compact}`;
  if (!currencyFormatters.has(key)) {
    currencyFormatters.set(
      key,
      new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency,
        maximumFractionDigits: compact ? 1 : 2,
        minimumFractionDigits: 0,
        notation: compact ? 'compact' : 'standard',
      }),
    );
  }
  return currencyFormatters.get(key).format(amount ?? 0);
}

/** Dates from the API are UTC midnight, so format them in UTC to keep the calendar day. */
export function formatDate(value, options = { day: 'numeric', month: 'short', year: 'numeric' }) {
  return new Date(value).toLocaleDateString('en-IN', { timeZone: 'UTC', ...options });
}

export function formatMonth(monthKey, style = 'long') {
  const [y, m] = monthKey.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString('en-IN', {
    timeZone: 'UTC',
    month: style,
    year: 'numeric',
  });
}

export function formatPercent(value, { signed = false } = {}) {
  if (value === null || value === undefined) return '—';
  const sign = signed && value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

export const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
  { value: 'upi', label: 'UPI' },
  { value: 'bank_transfer', label: 'Bank transfer' },
  { value: 'wallet', label: 'Wallet' },
  { value: 'other', label: 'Other' },
];

export const paymentLabel = (value) =>
  PAYMENT_METHODS.find((p) => p.value === value)?.label ?? value;
