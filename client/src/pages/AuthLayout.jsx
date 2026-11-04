import { Logo, ThemeToggle } from '../components/layout/AppLayout';

export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between px-4 py-4 sm:px-8">
        <Logo />
        <ThemeToggle />
      </header>
      <main className="flex flex-1 items-center justify-center px-4 pb-16">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <p className="mt-1 mb-6 text-sm text-stone-500 dark:text-stone-400">{subtitle}</p>
          <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm dark:border-stone-800 dark:bg-stone-900">
            {children}
          </div>
          <p className="mt-6 text-center text-sm text-stone-500">{footer}</p>
        </div>
      </main>
    </div>
  );
}
