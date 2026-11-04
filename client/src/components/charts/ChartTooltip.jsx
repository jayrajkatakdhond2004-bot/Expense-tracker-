export default function ChartTooltip({ title, rows }) {
  return (
    <div className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs shadow-lg dark:border-stone-700 dark:bg-stone-900">
      {title && <p className="mb-1 font-medium text-stone-900 dark:text-stone-100">{title}</p>}
      {rows.map((row) => (
        <div key={row.label} className="flex items-center gap-2 text-stone-600 dark:text-stone-300">
          {row.color && (
            <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: row.color }} />
          )}
          <span>{row.label}</span>
          <span className="ml-auto pl-3 font-medium tabular-nums text-stone-900 dark:text-stone-100">
            {row.value}
          </span>
        </div>
      ))}
    </div>
  );
}
