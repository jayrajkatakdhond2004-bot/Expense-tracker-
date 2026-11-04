import { Pencil, Trash2 } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { seriesColor } from '../../utils/colors';
import { formatCurrency, formatDate, paymentLabel } from '../../utils/format';

function CategoryPill({ category, isDark }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-700 dark:bg-stone-800 dark:text-stone-300">
      <span
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: seriesColor(category?.color, isDark) }}
      />
      {category?.name ?? 'Unknown'}
    </span>
  );
}

function RowActions({ expense, onEdit, onDelete }) {
  const btn =
    'rounded-md p-1.5 text-stone-500 hover:bg-stone-100 hover:text-stone-900 dark:hover:bg-stone-800 dark:hover:text-stone-100';
  return (
    <div className="flex justify-end gap-1">
      <button
        type="button"
        className={btn}
        onClick={() => onEdit(expense)}
        aria-label={`Edit ${expense.note || 'expense'}`}
      >
        <Pencil className="h-4 w-4" />
      </button>
      <button
        type="button"
        className={btn}
        onClick={() => onDelete(expense)}
        aria-label={`Delete ${expense.note || 'expense'}`}
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

export default function ExpenseList({ expenses, currency, onEdit, onDelete }) {
  const { isDark } = useTheme();

  return (
    <>
      {/* Mobile: stacked cards */}
      <ul className="divide-y divide-stone-100 md:hidden dark:divide-stone-800">
        {expenses.map((e) => (
          <li key={e._id} className="flex items-center gap-3 py-3">
            <div className="min-w-0 flex-1 space-y-1">
              <p className="truncate font-medium">
                {e.note || <span className="text-stone-400">No note</span>}
              </p>
              <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500">
                <CategoryPill category={e.category} isDark={isDark} />
                <span>{formatDate(e.date)}</span>
                <span>· {paymentLabel(e.paymentMethod)}</span>
              </div>
            </div>
            <div className="text-right">
              <p className="font-semibold tabular-nums">{formatCurrency(e.amount, currency)}</p>
              <RowActions expense={e} onEdit={onEdit} onDelete={onDelete} />
            </div>
          </li>
        ))}
      </ul>

      {/* Desktop: table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone-200 text-left text-xs font-medium tracking-wide text-stone-500 uppercase dark:border-stone-800">
              <th className="py-2 pr-4 font-medium">Date</th>
              <th className="py-2 pr-4 font-medium">Note</th>
              <th className="py-2 pr-4 font-medium">Category</th>
              <th className="py-2 pr-4 font-medium">Payment</th>
              <th className="py-2 pr-4 text-right font-medium">Amount</th>
              <th className="py-2">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
            {expenses.map((e) => (
              <tr key={e._id} className="hover:bg-stone-50 dark:hover:bg-stone-800/40">
                <td className="py-2.5 pr-4 whitespace-nowrap text-stone-600 dark:text-stone-400">
                  {formatDate(e.date)}
                </td>
                <td className="max-w-xs truncate py-2.5 pr-4">
                  {e.note || <span className="text-stone-400">—</span>}
                </td>
                <td className="py-2.5 pr-4">
                  <CategoryPill category={e.category} isDark={isDark} />
                </td>
                <td className="py-2.5 pr-4 text-stone-600 dark:text-stone-400">
                  {paymentLabel(e.paymentMethod)}
                </td>
                <td className="py-2.5 pr-4 text-right font-medium tabular-nums">
                  {formatCurrency(e.amount, currency)}
                </td>
                <td className="py-2.5">
                  <RowActions expense={e} onEdit={onEdit} onDelete={onDelete} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
