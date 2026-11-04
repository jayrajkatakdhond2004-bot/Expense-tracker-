import { useState } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { useTheme } from '../../context/ThemeContext';
import { formatCurrency, formatPercent } from '../../utils/format';
import { seriesColor } from '../../utils/colors';
import ChartTooltip from './ChartTooltip';

/**
 * Category share as a donut. The legend doubles as a data table (name, amount,
 * share), so identity never relies on color alone.
 */
export default function CategoryDonut({ categories, total, currency }) {
  const { isDark } = useTheme();
  const [active, setActive] = useState(null);
  const data = categories.map((c) => ({ ...c, fill: seriesColor(c.color, isDark) }));

  return (
    <div className="grid items-center gap-4 sm:grid-cols-[minmax(0,220px)_1fr]">
      <div className="relative mx-auto h-52 w-52 sm:h-56 sm:w-56">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="total"
              nameKey="name"
              innerRadius="62%"
              outerRadius="100%"
              stroke="var(--chart-surface)"
              strokeWidth={2}
              startAngle={90}
              endAngle={-270}
              isAnimationActive={false}
              onMouseEnter={(entry) =>
                setActive(entry?.payload?.categoryId ?? entry?.categoryId ?? null)
              }
              onMouseLeave={() => setActive(null)}
            >
              {data.map((d) => (
                <Cell
                  key={d.categoryId}
                  fill={d.fill}
                  opacity={active === null || active === d.categoryId ? 1 : 0.35}
                />
              ))}
            </Pie>
            <Tooltip
              content={({ active: isActive, payload }) =>
                isActive && payload?.length ? (
                  <ChartTooltip
                    title={payload[0].payload.name}
                    rows={[
                      {
                        label: 'Spent',
                        value: formatCurrency(payload[0].payload.total, currency),
                        color: payload[0].payload.fill,
                      },
                      { label: 'Share', value: formatPercent(payload[0].payload.percent) },
                    ]}
                  />
                ) : null
              }
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs text-stone-500">Total</span>
          <span className="text-lg font-semibold tabular-nums">
            {formatCurrency(total, currency, { compact: true })}
          </span>
        </div>
      </div>

      <table className="w-full text-sm">
        <caption className="sr-only">Spending by category</caption>
        <thead className="sr-only">
          <tr>
            <th>Category</th>
            <th>Amount</th>
            <th>Share</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr
              key={d.categoryId}
              onMouseEnter={() => setActive(d.categoryId)}
              onMouseLeave={() => setActive(null)}
              className="border-b border-stone-100 last:border-0 dark:border-stone-800"
            >
              <td className="py-1.5">
                <span className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-sm"
                    style={{ backgroundColor: d.fill }}
                  />
                  <span className="truncate text-stone-700 dark:text-stone-300">{d.name}</span>
                </span>
              </td>
              <td className="py-1.5 text-right font-medium tabular-nums">
                {formatCurrency(d.total, currency)}
              </td>
              <td className="w-16 py-1.5 text-right text-stone-500 tabular-nums">
                {formatPercent(d.percent)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
