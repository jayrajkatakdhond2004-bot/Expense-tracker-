import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDownRight, ArrowUpRight, Plus } from 'lucide-react';
import { analyticsApi, budgetApi } from '../api';
import { useApi } from '../hooks/useApi';
import { useCategories } from '../hooks/useCategories';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { PageHeader } from '../components/layout/AppLayout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import MonthPicker from '../components/ui/MonthPicker';
import { EmptyState, ErrorState, Skeleton } from '../components/ui/States';
import CategoryDonut from '../components/charts/CategoryDonut';
import TrendChart from '../components/charts/TrendChart';
import BudgetAlerts from '../components/budgets/BudgetAlerts';
import BudgetProgress from '../components/budgets/BudgetProgress';
import ExpenseForm from '../components/expenses/ExpenseForm';
import { currentMonthKey, todayISO } from '../utils/dates';
import { formatCurrency, formatMonth, formatPercent } from '../utils/format';
import { seriesColor } from '../utils/colors';

/** Wraps a card body with consistent loading / error handling. */
function Async({ state, skeleton, children }) {
  if (state.error) return <ErrorState error={state.error} onRetry={state.reload} compact />;
  if (state.loading && !state.data) return skeleton;
  return children(state.data);
}

function StatTile({ label, value, children }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm dark:border-stone-800 dark:bg-stone-900">
      <p className="text-sm text-stone-500 dark:text-stone-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
      {children && <div className="mt-1 text-xs">{children}</div>}
    </div>
  );
}

/** "Oct 1–4" when comparing a partial month, otherwise "Oct 2026". */
function baselineLabel(summary) {
  const month = formatMonth(summary.previous.month, 'short');
  if (summary.change.basis !== 'same-period') return month;
  const name = month.split(' ')[0];
  return summary.daysElapsed === 1 ? `${name} 1` : `${name} 1–${summary.daysElapsed}`;
}

function ChangeIndicator({ summary }) {
  const { change } = summary;
  if (change.percent === null) {
    return (
      <span className="text-stone-500">Nothing to compare with in {baselineLabel(summary)}</span>
    );
  }
  const up = change.amount > 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span className="inline-flex items-center gap-1 text-stone-600 dark:text-stone-400">
      <Icon
        className={`h-3.5 w-3.5 ${up ? 'text-red-600 dark:text-red-400' : 'text-green-700 dark:text-green-400'}`}
        aria-hidden="true"
      />
      <span className="font-medium text-stone-900 dark:text-stone-100">
        {formatPercent(change.percent, { signed: true })}
      </span>
      vs {baselineLabel(summary)}
    </span>
  );
}

function MonthComparison({ summary, currency }) {
  const partial = summary.change.basis === 'same-period';
  const currentLabel = partial
    ? baselineLabel(summary).replace(/^\S+/, formatMonth(summary.month, 'short').split(' ')[0])
    : formatMonth(summary.month, 'short');
  const rows = [
    { label: baselineLabel(summary), total: summary.change.baseline, color: 'var(--chart-axis)' },
    { label: currentLabel, total: summary.total, color: 'var(--series-1)' },
  ];
  const max = Math.max(...rows.map((r) => r.total), 1);
  const up = summary.change.amount > 0;

  return (
    <div className="space-y-4">
      {rows.map((r) => (
        <div key={r.label} className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-stone-600 dark:text-stone-400">{r.label}</span>
            <span className="font-medium tabular-nums">{formatCurrency(r.total, currency)}</span>
          </div>
          <div className="h-3 rounded-r bg-stone-100 dark:bg-stone-800">
            <div
              className="h-3 rounded-r"
              style={{ width: `${(r.total / max) * 100}%`, backgroundColor: r.color }}
            />
          </div>
        </div>
      ))}
      <p className="text-sm text-stone-600 dark:text-stone-400">
        {summary.change.percent === null ? (
          'Nothing recorded in the previous month to compare against.'
        ) : (
          <>
            You spent{' '}
            <strong className="text-stone-900 dark:text-stone-100">
              {formatCurrency(Math.abs(summary.change.amount), currency)}
            </strong>{' '}
            {up ? 'more' : 'less'} than in {baselineLabel(summary)} (
            {formatPercent(summary.change.percent, { signed: true })}).
          </>
        )}
        {partial && (
          <span className="mt-1 block text-xs text-stone-500">
            Compared day-for-day because {formatMonth(summary.month, 'short')} is still in progress.{' '}
            {formatMonth(summary.previous.month, 'short')} total:{' '}
            {formatCurrency(summary.previous.total, currency)}.
          </span>
        )}
      </p>
    </div>
  );
}

function TopCategories({ top, currency }) {
  const { isDark } = useTheme();
  return (
    <ol className="space-y-3">
      {top.map((c, i) => (
        <li key={c.categoryId} className="flex items-center gap-3">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-stone-100 text-sm font-semibold dark:bg-stone-800">
            {i + 1}
          </span>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2 truncate font-medium">
              <span
                className="h-2.5 w-2.5 rounded-sm"
                style={{ backgroundColor: seriesColor(c.color, isDark) }}
              />
              {c.name}
            </p>
            <p className="text-xs text-stone-500">
              {c.count} transaction{c.count === 1 ? '' : 's'} · {formatPercent(c.percent)} of
              spending
            </p>
          </div>
          <span className="font-semibold tabular-nums">{formatCurrency(c.total, currency)}</span>
        </li>
      ))}
    </ol>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const currency = user?.currency ?? 'INR';
  const [month, setMonth] = useState(currentMonthKey());
  const [granularity, setGranularity] = useState('daily');
  const [formOpen, setFormOpen] = useState(false);
  const { categories } = useCategories();

  const summary = useApi(() => analyticsApi.summary(month), [month]);
  const byCategory = useApi(() => analyticsApi.byCategory(month), [month]);
  const trend = useApi(
    () => analyticsApi.trend({ granularity, month, months: 6 }),
    [granularity, month],
  );
  const budgets = useApi(() => budgetApi.list(month), [month]);

  const reloadAll = () => [summary, byCategory, trend, budgets].forEach((s) => s.reload());

  // Don't plot future days of the current month as zero spending.
  const today = todayISO();
  const trendPoints = (trend.data?.points ?? []).filter(
    (p) => granularity === 'monthly' || p.period <= today,
  );
  const overallBudget = budgets.data?.find((b) => !b.category);

  return (
    <>
      <PageHeader
        title={`Hi, ${user?.name?.split(' ')[0] ?? 'there'}`}
        description="Here's how your spending is shaping up."
        actions={
          <>
            <MonthPicker value={month} onChange={setMonth} />
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4" /> Add expense
            </Button>
          </>
        }
      />

      <div className="space-y-6">
        {budgets.data && <BudgetAlerts budgets={budgets.data} />}

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Async
            state={summary}
            skeleton={Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          >
            {(s) => (
              <>
                <StatTile
                  label={`Spent in ${formatMonth(month, 'short')}`}
                  value={formatCurrency(s.total, currency)}
                >
                  <ChangeIndicator summary={s} />
                </StatTile>
                <StatTile label="Daily average" value={formatCurrency(s.dailyAverage, currency)} />
                <StatTile label="Transactions" value={s.count} />
                <StatTile
                  label="Largest expense"
                  value={formatCurrency(s.largestExpense, currency)}
                />
              </>
            )}
          </Async>
        </div>

        <div className="grid gap-6 lg:grid-cols-5">
          <Card
            title="Spending by category"
            subtitle={formatMonth(month)}
            className="lg:col-span-3"
          >
            <Async state={byCategory} skeleton={<Skeleton className="h-56" />}>
              {(d) =>
                d.categories.length ? (
                  <CategoryDonut categories={d.categories} total={d.total} currency={currency} />
                ) : (
                  <EmptyState
                    title="No expenses this month"
                    description="Add an expense to see the breakdown."
                  />
                )
              }
            </Async>
          </Card>
          <Card
            title="Top categories"
            subtitle="Where most of your money went"
            className="lg:col-span-2"
          >
            <Async state={byCategory} skeleton={<Skeleton className="h-40" />}>
              {(d) =>
                d.top.length ? (
                  <TopCategories top={d.top} currency={currency} />
                ) : (
                  <EmptyState title="Nothing yet" />
                )
              }
            </Async>
          </Card>
        </div>

        <Card
          title="Spending trend"
          subtitle={
            granularity === 'daily'
              ? `Daily spending in ${formatMonth(month)}`
              : 'Monthly spending, last 6 months'
          }
          action={
            <div
              className="inline-flex rounded-lg border border-stone-300 p-0.5 text-sm dark:border-stone-700"
              role="group"
              aria-label="Trend granularity"
            >
              {['daily', 'monthly'].map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGranularity(g)}
                  aria-pressed={granularity === g}
                  className={`rounded-md px-3 py-1 capitalize ${
                    granularity === g
                      ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900'
                      : 'text-stone-600 dark:text-stone-400'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          }
        >
          <Async state={trend} skeleton={<Skeleton className="h-64" />}>
            {() => (
              <TrendChart points={trendPoints} granularity={granularity} currency={currency} />
            )}
          </Async>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card title="Month over month" subtitle="Spending compared with the previous month">
            <Async state={summary} skeleton={<Skeleton className="h-32" />}>
              {(s) => <MonthComparison summary={s} currency={currency} />}
            </Async>
          </Card>
          <Card
            title="Budget"
            subtitle={formatMonth(month)}
            action={
              <Link
                to="/budgets"
                className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
              >
                Manage
              </Link>
            }
          >
            <Async state={budgets} skeleton={<Skeleton className="h-32" />}>
              {(list) =>
                list.length ? (
                  <div className="space-y-5">
                    {(overallBudget
                      ? [overallBudget, ...list.filter((b) => b !== overallBudget).slice(0, 2)]
                      : list.slice(0, 3)
                    ).map((b) => (
                      <BudgetProgress key={b._id} budget={b} currency={currency} />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    title="No budget set"
                    description="Set a monthly limit to get alerts at 80% and 100%."
                    action={
                      <Link
                        to="/budgets"
                        className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                      >
                        Set a budget
                      </Link>
                    }
                  />
                )
              }
            </Async>
          </Card>
        </div>
      </div>

      <ExpenseForm
        open={formOpen}
        categories={categories}
        onClose={() => setFormOpen(false)}
        onSaved={reloadAll}
      />
    </>
  );
}
