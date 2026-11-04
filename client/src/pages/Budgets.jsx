import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PiggyBank, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { budgetApi } from '../api';
import { useApi } from '../hooks/useApi';
import { useCategories } from '../hooks/useCategories';
import { useAuth } from '../context/AuthContext';
import { PageHeader } from '../components/layout/AppLayout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import MonthPicker from '../components/ui/MonthPicker';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { Input, Select } from '../components/ui/Field';
import { EmptyState, ErrorState, Skeleton } from '../components/ui/States';
import BudgetAlerts from '../components/budgets/BudgetAlerts';
import BudgetProgress from '../components/budgets/BudgetProgress';
import { currentMonthKey } from '../utils/dates';
import { formatMonth } from '../utils/format';
import { applyServerErrors, budgetSchema } from '../utils/validation';

export default function Budgets() {
  const { user } = useAuth();
  const currency = user?.currency ?? 'INR';
  const [month, setMonth] = useState(currentMonthKey());
  const { categories } = useCategories();
  const { data: budgets, loading, error, reload } = useApi(() => budgetApi.list(month), [month]);
  const [deleting, setDeleting] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(budgetSchema), defaultValues: { category: '', limit: '' } });

  const onSubmit = async ({ category, limit }) => {
    try {
      await budgetApi.upsert({ month, category: category || null, limit });
      toast.success('Budget saved');
      reset({ category: '', limit: '' });
      reload();
    } catch (err) {
      if (!applyServerErrors(err, setError, ['category', 'limit'])) toast.error(err.message);
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await budgetApi.remove(deleting._id);
      toast.success('Budget removed');
      setDeleting(null);
      reload();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  const edit = (b) => reset({ category: b.category?._id ?? '', limit: b.limit });

  return (
    <>
      <PageHeader
        title="Budgets"
        description="Set monthly limits overall or per category. You'll be alerted at 80% and 100%."
        actions={<MonthPicker value={month} onChange={setMonth} />}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card
          title="Set a budget"
          subtitle={`For ${formatMonth(month)}. Saving an existing one updates it.`}
          className="h-fit"
        >
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            <Select label="Applies to" error={errors.category?.message} {...register('category')}>
              <option value="">Overall (all categories)</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </Select>
            <Input
              label="Monthly limit (₹)"
              type="number"
              min="1"
              step="1"
              inputMode="decimal"
              error={errors.limit?.message}
              {...register('limit')}
            />
            <Button type="submit" className="w-full justify-center" loading={isSubmitting}>
              Save budget
            </Button>
          </form>
        </Card>

        <div className="space-y-4 lg:col-span-2">
          {budgets && <BudgetAlerts budgets={budgets} />}
          <Card title="Progress" subtitle={formatMonth(month)}>
            {error ? (
              <ErrorState error={error} onRetry={reload} />
            ) : loading && !budgets ? (
              <div className="space-y-6">
                {Array.from({ length: 3 }, (_, i) => (
                  <Skeleton key={i} className="h-12" />
                ))}
              </div>
            ) : budgets?.length ? (
              <ul className="space-y-6">
                {budgets.map((b) => (
                  <li key={b._id}>
                    <BudgetProgress
                      budget={b}
                      currency={currency}
                      action={
                        <span className="flex">
                          <button
                            type="button"
                            onClick={() => edit(b)}
                            className="rounded-md px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-500/10"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleting(b)}
                            className="rounded-md p-1 text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800"
                            aria-label={`Delete ${b.category?.name ?? 'overall'} budget`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </span>
                      }
                    />
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                icon={PiggyBank}
                title="No budgets for this month"
                description="Use the form to set your first limit."
              />
            )}
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={deleting !== null}
        title="Remove budget?"
        message={`Remove the ${deleting?.category?.name ?? 'overall'} budget for ${formatMonth(month)}? Your expenses are not affected.`}
        confirmLabel="Remove"
        loading={deleteLoading}
        onConfirm={handleDelete}
        onClose={() => setDeleting(null)}
      />
    </>
  );
}
