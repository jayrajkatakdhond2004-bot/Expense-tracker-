import { AlertTriangle, Inbox } from 'lucide-react';
import Button from './Button';

export function ErrorState({ error, onRetry, compact = false }) {
  return (
    <div
      role="alert"
      className={`flex flex-col items-center justify-center gap-3 text-center ${compact ? 'py-6' : 'py-12'}`}
    >
      <AlertTriangle className="h-8 w-8 text-red-500" aria-hidden="true" />
      <div>
        <p className="font-medium">Couldn&apos;t load this</p>
        <p className="text-sm text-stone-500">{error?.message || 'Something went wrong'}</p>
      </div>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

export function EmptyState({ title, description, action, icon: Icon = Inbox }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
      <Icon className="h-8 w-8 text-stone-400" aria-hidden="true" />
      <div>
        <p className="font-medium">{title}</p>
        {description && <p className="text-sm text-stone-500">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function Skeleton({ className = 'h-4 w-full' }) {
  return <div className={`animate-pulse rounded-md bg-stone-200 dark:bg-stone-800 ${className}`} />;
}
