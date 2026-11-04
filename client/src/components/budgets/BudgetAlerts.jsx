import { AlertOctagon, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

/** Banner listing budgets at or above the 80% / 100% thresholds. */
export default function BudgetAlerts({ budgets }) {
  const alerts = (budgets ?? []).filter((b) => b.status !== 'ok');
  if (alerts.length === 0) return null;

  return (
    <div className="space-y-2" role="status">
      {alerts.map((b) => {
        const exceeded = b.status === 'exceeded';
        const Icon = exceeded ? AlertOctagon : AlertTriangle;
        const name = b.category?.name ?? 'overall';
        return (
          <div
            key={b._id}
            className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${
              exceeded
                ? 'border-red-200 bg-red-50 text-red-900 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200'
                : 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200'
            }`}
          >
            <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <p className="flex-1">
              <strong>{exceeded ? 'Budget exceeded' : 'Heads up'}:</strong> you&apos;ve used{' '}
              <strong>{b.percent}%</strong> of your {name} budget this month.
            </p>
            <Link to="/budgets" className="shrink-0 font-medium underline underline-offset-2">
              Review
            </Link>
          </div>
        );
      })}
    </div>
  );
}
