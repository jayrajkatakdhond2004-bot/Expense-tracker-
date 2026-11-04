import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatCurrency, formatDate, formatMonth } from '../../utils/format';
import ChartTooltip from './ChartTooltip';

const axisProps = {
  stroke: 'var(--chart-axis)',
  tick: { fill: 'var(--chart-axis)', fontSize: 12 },
  tickLine: false,
  axisLine: false,
};

/**
 * Daily view: bars, because each day's spending is a separate amount and a
 * smoothed line would invent values between days. Monthly view: a line, since
 * it shows the direction of change across months.
 */
export default function TrendChart({ points, granularity, currency }) {
  const daily = granularity === 'daily';
  const labelFor = (period) =>
    daily ? formatDate(period, { day: 'numeric', month: 'short' }) : formatMonth(period, 'short');

  const tooltip = (
    <Tooltip
      cursor={
        daily
          ? { fill: 'var(--chart-grid)', opacity: 0.6 }
          : { stroke: 'var(--chart-axis)', strokeDasharray: '4 4' }
      }
      content={({ active, payload }) =>
        active && payload?.length ? (
          <ChartTooltip
            title={labelFor(payload[0].payload.period)}
            rows={[
              {
                label: 'Spent',
                value: formatCurrency(payload[0].payload.total, currency),
                color: 'var(--series-1)',
              },
              { label: 'Transactions', value: payload[0].payload.count },
            ]}
          />
        ) : null
      }
    />
  );

  const axes = (
    <>
      <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
      <XAxis
        dataKey="period"
        {...axisProps}
        tickFormatter={(p) =>
          daily ? String(Number(p.slice(8, 10))) : formatMonth(p, 'short').split(' ')[0]
        }
        interval="preserveStartEnd"
        minTickGap={16}
      />
      <YAxis
        {...axisProps}
        width={56}
        tickFormatter={(v) => formatCurrency(v, currency, { compact: true })}
      />
    </>
  );

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        {daily ? (
          <BarChart
            data={points}
            margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
            barCategoryGap={2}
          >
            {axes}
            {tooltip}
            <Bar
              dataKey="total"
              fill="var(--series-1)"
              radius={[4, 4, 0, 0]}
              maxBarSize={28}
              isAnimationActive={false}
            />
          </BarChart>
        ) : (
          <LineChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            {axes}
            {tooltip}
            <Line
              type="linear"
              dataKey="total"
              stroke="var(--series-1)"
              strokeWidth={2}
              dot={{
                r: 4,
                fill: 'var(--series-1)',
                stroke: 'var(--chart-surface)',
                strokeWidth: 2,
              }}
              activeDot={{ r: 6, stroke: 'var(--chart-surface)', strokeWidth: 2 }}
              isAnimationActive={false}
            />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
