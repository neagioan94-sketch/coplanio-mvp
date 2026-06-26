import Link from "next/link";

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

      <section>
        <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Quick links
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Link
            href="/teams"
            className="rounded-lg border border-zinc-200 bg-white p-4 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800"
          >
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Teams</p>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              View and manage your teams
            </p>
          </Link>
          <Link
            href="/organization/members"
            className="rounded-lg border border-zinc-200 bg-white p-4 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800"
          >
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Members</p>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              View organization members
            </p>
          </Link>
        </div>
      </section>

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
