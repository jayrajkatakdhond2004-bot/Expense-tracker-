import { AlertOctagon, AlertTriangle, CheckCircle2 } from 'lucide-react';
import ProgressBar from '../ui/ProgressBar';
import { STATUS, seriesColor } from '../../utils/colors';
import { formatCurrency } from '../../utils/format';
import { useTheme } from '../../context/ThemeContext';

const ICONS = { ok: CheckCircle2, warning: AlertTriangle, exceeded: AlertOctagon };

export function StatusBadge({ status }) {
  const Icon = ICONS[status];
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-stone-700 dark:text-stone-300">
      <Icon className="h-3.5 w-3.5" style={{ color: STATUS[status].color }} aria-hidden="true" />
      {STATUS[status].label}
    </span>
  );
}

export default function BudgetProgress({ budget, currency, action }) {
  const { isDark } = useTheme();
  const name = budget.category?.name ?? 'Overall budget';
  const over = budget.remaining < 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <span className="flex min-w-0 items-center gap-2 font-medium">
          {budget.category && (
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-sm"
              style={{ backgroundColor: seriesColor(budget.category.color, isDark) }}
            />
          )}
          <span className="truncate">{name}</span>
        </span>
        <span className="flex items-center gap-2">
          <StatusBadge status={budget.status} />
          {action}
        </span>
      </div>
      <ProgressBar
        percent={budget.percent}
        status={budget.status}
        label={`${name}: ${budget.percent}% used`}
      />
      <div className="flex justify-between text-xs text-stone-500 tabular-nums dark:text-stone-400">
        <span>
          {formatCurrency(budget.spent, currency)} of {formatCurrency(budget.limit, currency)} (
          {budget.percent}%)
        </span>
        <span className={over ? 'font-medium text-red-600 dark:text-red-400' : ''}>
          {over
            ? `${formatCurrency(-budget.remaining, currency)} over`
            : `${formatCurrency(budget.remaining, currency)} left`}
        </span>
      </div>
    </div>
  );
}
