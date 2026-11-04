import { Search, X } from 'lucide-react';
import { Input, Select, inputClass } from '../ui/Field';
import Button from '../ui/Button';
import { EMPTY_FILTERS } from '../../utils/filters';

export default function ExpenseFilters({ filters, onChange, categories }) {
  const set = (key) => (e) => onChange({ ...filters, [key]: e.target.value });
  const active = Object.entries(filters).some(([k, v]) => k !== 'sort' && v !== '');
  const invalidRange =
    filters.minAmount !== '' &&
    filters.maxAmount !== '' &&
    Number(filters.minAmount) > Number(filters.maxAmount);

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-stone-400" />
        <input
          type="search"
          value={filters.q}
          onChange={set('q')}
          placeholder="Search notes…"
          aria-label="Search notes"
          className={`${inputClass} pl-9`}
        />
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <Input
          label="From"
          type="date"
          value={filters.from}
          onChange={set('from')}
          max={filters.to || undefined}
        />
        <Input
          label="To"
          type="date"
          value={filters.to}
          onChange={set('to')}
          min={filters.from || undefined}
        />
        <Select label="Category" value={filters.category} onChange={set('category')}>
          <option value="">All</option>
          {categories.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </Select>
        <Input
          label="Min ₹"
          type="number"
          min="0"
          inputMode="decimal"
          value={filters.minAmount}
          onChange={set('minAmount')}
          error={invalidRange ? 'Min > max' : undefined}
        />
        <Input
          label="Max ₹"
          type="number"
          min="0"
          inputMode="decimal"
          value={filters.maxAmount}
          onChange={set('maxAmount')}
        />
        <Select label="Sort by" value={filters.sort} onChange={set('sort')}>
          <option value="-date">Newest first</option>
          <option value="date">Oldest first</option>
          <option value="-amount">Highest amount</option>
          <option value="amount">Lowest amount</option>
        </Select>
      </div>
      {active && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onChange({ ...EMPTY_FILTERS, sort: filters.sort })}
        >
          <X className="h-4 w-4" /> Clear filters
        </Button>
      )}
    </div>
  );
}
