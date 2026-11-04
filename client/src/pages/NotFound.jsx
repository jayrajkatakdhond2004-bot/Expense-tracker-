import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-2 text-center">
      <p className="text-5xl font-bold text-stone-300 dark:text-stone-700">404</p>
      <h1 className="text-xl font-semibold">Page not found</h1>
      <Link
        to="/"
        className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
