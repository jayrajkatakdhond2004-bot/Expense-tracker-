import { forwardRef, useId } from 'react';
import clsx from 'clsx';

export const inputClass =
  'block w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 focus:outline-none disabled:opacity-60 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100';

const errorClass = 'border-red-500 focus:border-red-500 focus:ring-red-500/30 dark:border-red-500';

function FieldWrapper({ id, label, error, hint, children, className }) {
  return (
    <div className={clsx('space-y-1', className)}>
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-stone-700 dark:text-stone-300"
        >
          {label}
        </label>
      )}
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : (
        hint && <p className="text-xs text-stone-500">{hint}</p>
      )}
    </div>
  );
}

export const Input = forwardRef(function Input({ label, error, hint, className, ...props }, ref) {
  const id = useId();
  return (
    <FieldWrapper id={id} label={label} error={error} hint={hint} className={className}>
      <input
        ref={ref}
        id={id}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className={clsx(inputClass, error && errorClass)}
        {...props}
      />
    </FieldWrapper>
  );
});

export const Select = forwardRef(function Select(
  { label, error, hint, className, children, ...props },
  ref,
) {
  const id = useId();
  return (
    <FieldWrapper id={id} label={label} error={error} hint={hint} className={className}>
      <select
        ref={ref}
        id={id}
        aria-invalid={!!error}
        className={clsx(inputClass, error && errorClass)}
        {...props}
      >
        {children}
      </select>
    </FieldWrapper>
  );
});
