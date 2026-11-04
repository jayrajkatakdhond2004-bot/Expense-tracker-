import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatMonth } from '../../utils/format';
import { currentMonthKey, shiftMonthKey } from '../../utils/dates';

export default function MonthPicker({ value, onChange }) {
  const isCurrent = value >= currentMonthKey();
  const btn =
    'rounded-md p-1.5 text-stone-600 hover:bg-stone-100 disabled:opacity-40 dark:text-stone-300 dark:hover:bg-stone-800';
  return (
    <div className="inline-flex items-center gap-1 rounded-lg border border-stone-300 bg-white px-1 py-1 dark:border-stone-700 dark:bg-stone-900">
      <button
        type="button"
        className={btn}
        onClick={() => onChange(shiftMonthKey(value, -1))}
        aria-label="Previous month"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span className="min-w-32 text-center text-sm font-medium" aria-live="polite">
        {formatMonth(value)}
      </span>
      <button
        type="button"
        className={btn}
        onClick={() => onChange(shiftMonthKey(value, 1))}
        disabled={isCurrent}
        aria-label="Next month"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
