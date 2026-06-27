import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/db/supabase-server";
import { requireUser } from "@/lib/auth/get-user";
import { getActiveOrganization, canManageMatches } from "@/lib/organizations/get-organization";
import { getMatches } from "@/lib/matches/get-matches";
import { getTeams } from "@/lib/teams/get-teams";
import { MatchResultBadge } from "@/components/matches/match-result-badge";

const STATUS_LABELS: Record<string, string> = {
  scheduled: "Scheduled",
  completed: "Completed",
  cancelled: "Cancelled",
};

const STATUS_COLORS: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  completed: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  cancelled: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
};

const HOME_AWAY_LABELS: Record<string, string> = {
  home: "Home",
  away: "Away",
  neutral: "Neutral",
};

interface SearchParams {
  teamId?: string;
  status?: string;
}

export default async function MatchesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { teamId, status } = await searchParams;

  const user = await requireUser();
  const supabase = await createClient();
  if (!supabase) redirect("/login");

  const activeOrg = await getActiveOrganization(supabase, user.id);
  if (!activeOrg) redirect("/setup/organization");

  const [matches, canManage, teams] = await Promise.all([
    getMatches(supabase, activeOrg.organizationId, {
      teamId: teamId || undefined,
      status: status || undefined,
    }),
    canManageMatches(supabase, user.id, activeOrg.organizationId),
    getTeams(supabase, activeOrg.organizationId),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Matches</h1>
        {canManage && (
          <Link
            href="/matches/new"
            className="self-start rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 sm:self-auto"
          >
            New match
          </Link>
        )}
      </div>

      {/* Filters */}
      <form method="get" className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="teamId" className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Team
          </label>
          <select
            id="teamId"
            name="teamId"
            defaultValue={teamId ?? ""}
            className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
          >
            <option value="">All teams</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="status" className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={status ?? ""}
            className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
          >
            <option value="">All statuses</option>
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <button
          type="submit"
          className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          Filter
        </button>

        {(teamId || status) && (
          <Link
            href="/matches"
            className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            Clear
          </Link>
        )}
      </form>

      {matches.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-700">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No matches yet. Create your first match record.
          </p>
          {canManage && (
            <Link
              href="/matches/new"
              className="mt-3 inline-block text-sm font-medium text-zinc-900 underline underline-offset-2 hover:no-underline dark:text-zinc-50"
            >
              Create match
            </Link>
          )}
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {matches.map((m) => (
            <li key={m.id}>
              <Link
                href={`/matches/${m.id}`}
                className="flex items-start justify-between rounded-lg border border-zinc-200 bg-white p-4 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700 dark:hover:bg-zinc-800"
              >
                <div className="flex min-w-0 flex-col gap-1">
                  <p className="truncate font-medium text-zinc-900 dark:text-zinc-50">
                    vs {m.opponent}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                    <span>{m.teamName}</span>
                    <span>·</span>
                    <span>{m.matchDate}</span>
                    {m.homeAway && (
                      <>
                        <span>·</span>
                        <span>{HOME_AWAY_LABELS[m.homeAway] ?? m.homeAway}</span>
                      </>
                    )}
                    {m.competition && (
                      <>
                        <span>·</span>
                        <span>{m.competition}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="ml-3 mt-0.5 flex flex-shrink-0 flex-col items-end gap-1">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[m.status] ?? "bg-zinc-100 text-zinc-500"}`}
                  >
                    {STATUS_LABELS[m.status] ?? m.status}
                  </span>
                  <MatchResultBadge
                    goalsFor={m.goalsFor}
                    goalsAgainst={m.goalsAgainst}
                    status={m.status}
                  />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
