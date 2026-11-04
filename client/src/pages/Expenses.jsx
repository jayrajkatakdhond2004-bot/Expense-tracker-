import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Download, Plus, Receipt } from 'lucide-react';
import toast from 'react-hot-toast';
import { expenseApi } from '../api';
import { useApi } from '../hooks/useApi';
import { useDebounce } from '../hooks/useDebounce';
import { useCategories } from '../hooks/useCategories';
import { useAuth } from '../context/AuthContext';
import { PageHeader } from '../components/layout/AppLayout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Pagination from '../components/ui/Pagination';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { EmptyState, ErrorState, Skeleton } from '../components/ui/States';
import ExpenseFilters from '../components/expenses/ExpenseFilters';
import { EMPTY_FILTERS } from '../utils/filters';
import ExpenseList from '../components/expenses/ExpenseList';
import ExpenseForm from '../components/expenses/ExpenseForm';
import { formatCurrency } from '../utils/format';
import { downloadBlob, filenameFromDisposition } from '../utils/download';

const PAGE_SIZE = 10;

export default function Expenses() {
  const { user } = useAuth();
  const currency = user?.currency ?? 'INR';
  const { categories } = useCategories();

  // Filters live in the URL, so a filtered view can be bookmarked or shared and survives refresh.
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = useMemo(
    () =>
      Object.fromEntries(
        Object.keys(EMPTY_FILTERS).map((k) => [k, searchParams.get(k) ?? EMPTY_FILTERS[k]]),
      ),
    [searchParams],
  );
  const page = Math.max(1, Number(searchParams.get('page')) || 1);

  const setFilters = (next) => {
    const params = Object.fromEntries(
      Object.entries(next).filter(([k, v]) => v !== '' && !(k === 'sort' && v === '-date')),
    );
    setSearchParams(params, { replace: true }); // changing filters resets to page 1
  };
  const setPage = (p) => {
    const params = new URLSearchParams(searchParams);
    if (p > 1) params.set('page', String(p));
    else params.delete('page');
    setSearchParams(params);
  };

  // Debounce typing in search/amount boxes so we don't fire a request per keystroke.
  const filtersKey = useDebounce(JSON.stringify(filters), 350);
  const invalidRange =
    filters.minAmount !== '' &&
    filters.maxAmount !== '' &&
    Number(filters.minAmount) > Number(filters.maxAmount);

  const { data, loading, error, reload } = useApi(() => {
    const f = JSON.parse(filtersKey);
    if (f.minAmount !== '' && f.maxAmount !== '' && Number(f.minAmount) > Number(f.maxAmount)) {
      return Promise.resolve(null);
    }
    return expenseApi.list({ ...f, page, limit: PAGE_SIZE });
  }, [filtersKey, page]);

  const [editing, setEditing] = useState(null); // null = closed, {} = new, expense = edit
  const [deleting, setDeleting] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await expenseApi.remove(deleting._id);
      toast.success('Expense deleted');
      setDeleting(null);
      // Step back a page if we just removed the last item on this one.
      if (data?.items.length === 1 && page > 1) setPage(page - 1);
      else reload();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const { sort: _sort, ...exportFilters } = filters;
      const res = await expenseApi.exportCsv(exportFilters);
      downloadBlob(
        res.data,
        filenameFromDisposition(res.headers['content-disposition'], 'expenses.csv'),
      );
    } catch (err) {
      toast.error(err.message);
    } finally {
      setExporting(false);
    }
  };

  const hasFilters = Object.entries(filters).some(([k, v]) => k !== 'sort' && v !== '');

  return (
    <>
      <PageHeader
        title="Expenses"
        description={
          data
            ? `${data.pagination.total} expense${data.pagination.total === 1 ? '' : 's'} · ${formatCurrency(data.totalAmount, currency)} total${hasFilters ? ' (filtered)' : ''}`
            : 'All your spending in one place.'
        }
        actions={
          <>
            <Button
              variant="secondary"
              onClick={handleExport}
              loading={exporting}
              disabled={!data?.pagination.total}
            >
              {!exporting && <Download className="h-4 w-4" />} Export CSV
            </Button>
            <Button onClick={() => setEditing({})}>
              <Plus className="h-4 w-4" /> Add expense
            </Button>
          </>
        }
      />

      <div className="space-y-4">
        <Card>
          <ExpenseFilters filters={filters} onChange={setFilters} categories={categories} />
        </Card>

        <Card>
          {error ? (
            <ErrorState error={error} onRetry={reload} />
          ) : invalidRange ? (
            <EmptyState
              title="Invalid amount range"
              description="The minimum amount must be less than the maximum."
            />
          ) : loading && !data ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }, (_, i) => (
                <Skeleton key={i} className="h-10" />
              ))}
            </div>
          ) : data?.items.length ? (
            <div
              className={`space-y-4 transition-opacity ${loading ? 'opacity-60' : ''}`}
              aria-busy={loading}
            >
              <ExpenseList
                expenses={data.items}
                currency={currency}
                onEdit={setEditing}
                onDelete={setDeleting}
              />
              <Pagination {...data.pagination} onPageChange={setPage} />
            </div>
          ) : (
            <EmptyState
              icon={Receipt}
              title={hasFilters ? 'No expenses match these filters' : 'No expenses yet'}
              description={
                hasFilters
                  ? 'Try widening the date range or clearing filters.'
                  : 'Add your first expense to get started.'
              }
              action={!hasFilters && <Button onClick={() => setEditing({})}>Add expense</Button>}
            />
          )}
        </Card>
      </div>

      <ExpenseForm
        open={editing !== null}
        expense={editing?._id ? editing : null}
        categories={categories}
        onClose={() => setEditing(null)}
        onSaved={reload}
      />
      <ConfirmDialog
        open={deleting !== null}
        title="Delete expense?"
        message={`This will permanently delete "${deleting?.note || 'this expense'}" (${formatCurrency(deleting?.amount, currency)}).`}
        loading={deleteLoading}
        onConfirm={handleDelete}
        onClose={() => setDeleting(null)}
      />
    </>
  );
}
