import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Lock, Pencil, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { categoryApi } from '../api';
import { useCategories } from '../hooks/useCategories';
import { useTheme } from '../context/ThemeContext';
import { PageHeader } from '../components/layout/AppLayout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { Input } from '../components/ui/Field';
import { EmptyState, ErrorState, Skeleton } from '../components/ui/States';
import { PALETTE, seriesColor } from '../utils/colors';
import { applyServerErrors, categorySchema } from '../utils/validation';

function ColorSwatches({ value, onChange, isDark }) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium text-stone-700 dark:text-stone-300">Color</legend>
      <div className="flex flex-wrap gap-2">
        {PALETTE.map((p) => (
          <button
            key={p.light}
            type="button"
            onClick={() => onChange(p.light)}
            aria-label={p.name}
            aria-pressed={value === p.light}
            className={`h-8 w-8 rounded-full ring-offset-2 ring-offset-white dark:ring-offset-stone-900 ${
              value === p.light ? 'ring-2 ring-stone-900 dark:ring-stone-100' : ''
            }`}
            style={{ backgroundColor: isDark ? p.dark : p.light }}
          />
        ))}
      </div>
    </fieldset>
  );
}

function CategoryForm({ category, onClose, onSaved }) {
  const { isDark } = useTheme();
  const {
    register,
    handleSubmit,
    control,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: category?.name ?? '', color: category?.color ?? PALETTE[0].light },
  });

  const color = useWatch({ control, name: 'color' });

  const onSubmit = async (values) => {
    try {
      if (category) await categoryApi.update(category._id, values);
      else await categoryApi.create(values);
      toast.success(category ? 'Category updated' : 'Category created');
      onSaved();
      onClose();
    } catch (err) {
      if (err.status === 409) setError('name', { message: err.message });
      else if (!applyServerErrors(err, setError, ['name', 'color'])) toast.error(err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <Input
        label="Name"
        autoFocus
        maxLength={30}
        error={errors.name?.message}
        {...register('name')}
      />
      <ColorSwatches value={color} onChange={(c) => setValue('color', c)} isDark={isDark} />
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" loading={isSubmitting}>
          {category ? 'Save' : 'Create'}
        </Button>
      </div>
    </form>
  );
}

function CategoryItem({ category, isDark, actions }) {
  return (
    <li className="flex items-center gap-3 rounded-xl border border-stone-200 px-3 py-2.5 dark:border-stone-800">
      <span
        className="h-3 w-3 shrink-0 rounded-full"
        style={{ backgroundColor: seriesColor(category.color, isDark) }}
      />
      <span className="flex-1 truncate font-medium">{category.name}</span>
      {actions}
    </li>
  );
}

export default function Categories() {
  const { isDark } = useTheme();
  const { categories, loading, error, reload } = useCategories();
  const [editing, setEditing] = useState(null); // null closed, {} new, category = edit
  const [deleting, setDeleting] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const defaults = categories.filter((c) => c.isDefault);
  const custom = categories.filter((c) => !c.isDefault);

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await categoryApi.remove(deleting._id);
      toast.success('Category deleted');
      setDeleting(null);
      reload();
    } catch (err) {
      toast.error(err.message);
      setDeleting(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  if (error) return <ErrorState error={error} onRetry={reload} />;

  return (
    <>
      <PageHeader
        title="Categories"
        description="Built-in categories plus your own."
        actions={
          <Button onClick={() => setEditing({})}>
            <Plus className="h-4 w-4" /> New category
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Your categories">
          {loading ? (
            <Skeleton className="h-24" />
          ) : custom.length ? (
            <ul className="space-y-2">
              {custom.map((c) => (
                <CategoryItem
                  key={c._id}
                  category={c}
                  isDark={isDark}
                  actions={
                    <span className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => setEditing(c)}
                        className="rounded-md p-1.5 text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800"
                        aria-label={`Edit ${c.name}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleting(c)}
                        className="rounded-md p-1.5 text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800"
                        aria-label={`Delete ${c.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </span>
                  }
                />
              ))}
            </ul>
          ) : (
            <EmptyState
              title="No custom categories"
              description="Create one for anything the defaults don't cover."
            />
          )}
        </Card>
        <Card title="Default categories" subtitle="Available to everyone and can't be changed.">
          {loading ? (
            <Skeleton className="h-40" />
          ) : (
            <ul className="grid gap-2 sm:grid-cols-2">
              {defaults.map((c) => (
                <CategoryItem
                  key={c._id}
                  category={c}
                  isDark={isDark}
                  actions={<Lock className="h-3.5 w-3.5 text-stone-400" aria-label="Default" />}
                />
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing?._id ? 'Edit category' : 'New category'}
      >
        <CategoryForm
          key={editing?._id ?? 'new'}
          category={editing?._id ? editing : null}
          onClose={() => setEditing(null)}
          onSaved={reload}
        />
      </Modal>
      <ConfirmDialog
        open={deleting !== null}
        title="Delete category?"
        message={`Delete "${deleting?.name}"? Categories that are still used by expenses can't be deleted.`}
        loading={deleteLoading}
        onConfirm={handleDelete}
        onClose={() => setDeleting(null)}
      />
    </>
  );
}
