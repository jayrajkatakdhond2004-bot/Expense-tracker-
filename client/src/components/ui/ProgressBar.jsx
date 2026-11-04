import { STATUS } from '../../utils/colors';

/** Budget meter. Status is shown as color + icon + text, never color alone. */
export default function ProgressBar({ percent, status = 'ok', label }) {
  const width = Math.min(100, Math.max(0, percent));
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(percent)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className="h-2.5 w-full overflow-hidden rounded-full bg-stone-200 dark:bg-stone-800"
    >
      <div
        className="h-full rounded-full transition-[width] duration-500"
        style={{ width: `${width}%`, backgroundColor: STATUS[status].color }}
      />
    </div>
  );
}
