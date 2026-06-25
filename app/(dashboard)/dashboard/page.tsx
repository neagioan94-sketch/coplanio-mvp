export const metadata = { title: "Dashboard — Coplanio" };

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Dashboard
        </h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          Manage your club from the navigation on the left.
        </p>
      </div>

      <section className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Coming soon
        </h2>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          Future modules — Players, Training Sessions, Matches, and Reports —
          will appear here once they are ready.
        </p>
      </section>
    </div>
  );
}
