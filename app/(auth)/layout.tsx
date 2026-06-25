export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
      <div className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-6 text-center">
          <span className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Coplanio
          </span>
        </div>
        {children}
      </div>
    </div>
  );
}
