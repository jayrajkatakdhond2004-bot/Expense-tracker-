import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { expenseApi } from '../../api';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import { Input, Select } from '../ui/Field';
import { PAYMENT_METHODS } from '../../utils/format';
import { toDateInput, todayISO } from '../../utils/dates';
import { applyServerErrors, expenseSchema } from '../../utils/validation';
import { notifyBudgetAlerts } from '../../utils/budgetAlerts';

const FIELDS = ['amount', 'category', 'date', 'paymentMethod', 'note'];

function defaultsFor(expense) {
  return expense
    ? {
        amount: expense.amount,
        category: expense.category?._id ?? '',
        date: toDateInput(expense.date),
        paymentMethod: expense.paymentMethod,
        note: expense.note ?? '',
      }
    : { amount: '', category: '', date: todayISO(), paymentMethod: 'upi', note: '' };
}

function ExpenseFormBody({ expense, categories, onClose, onSaved }) {
  const isEdit = Boolean(expense);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(expenseSchema), defaultValues: defaultsFor(expense) });

  const onSubmit = async (values) => {
    try {
      const saved = isEdit
        ? await expenseApi.update(expense._id, values)
        : await expenseApi.create(values);
      toast.success(isEdit ? 'Expense updated' : 'Expense added');
      onSaved(saved);
      onClose();
      notifyBudgetAlerts(values.date);
    } catch (err) {
      if (!applyServerErrors(err, setError, FIELDS)) toast.error(err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Amount (₹)"
          type="number"
          step="0.01"
          min="0"
          inputMode="decimal"
          autoFocus
          error={errors.amount?.message}
          {...register('amount')}
        />
        <Input
          label="Date"
          type="date"
          max={todayISO()}
          error={errors.date?.message}
          {...register('date')}
        />
        <Select label="Category" error={errors.category?.message} {...register('category')}>
          <option value="">Select…</option>
          {categories.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </Select>
        <Select
          label="Payment method"
          error={errors.paymentMethod?.message}
          {...register('paymentMethod')}
        >
          {PAYMENT_METHODS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </Select>
      </div>
      <Input
        label="Note"
        placeholder="e.g. Lunch with team"
        maxLength={200}
        error={errors.note?.message}
        {...register('note')}
      />
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" loading={isSubmitting}>
          {isEdit ? 'Save changes' : 'Add expense'}
        </Button>
      </div>
    </form>
  );
}

export default function ExpenseForm({ open, expense, categories, onClose, onSaved }) {
  return (
    <Modal open={open} onClose={onClose} title={expense ? 'Edit expense' : 'Add expense'}>
      {/* Keyed so the form resets whenever a different expense is opened. */}
      <ExpenseFormBody
        key={expense?._id ?? 'new'}
        expense={expense}
        categories={categories}
        onClose={onClose}
        onSaved={onSaved}
      />
    </Modal>
  );
}
