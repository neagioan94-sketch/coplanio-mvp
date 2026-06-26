import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/db/supabase-server";
import { requireUser } from "@/lib/auth/get-user";
import { getActiveOrganization, canManageMatches } from "@/lib/organizations/get-organization";
import { getMatch } from "@/lib/matches/get-matches";
import { MatchResultBadge } from "@/components/matches/match-result-badge";
import ArchiveMatchButton from "@/components/matches/archive-match-button";

interface MatchDetailPageProps {
  params: Promise<{ matchId: string }>;
}

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

export default async function MatchDetailPage({ params }: MatchDetailPageProps) {
  const { matchId } = await params;

  const user = await requireUser();
  const supabase = await createClient();
  if (!supabase) redirect("/login");

  const activeOrg = await getActiveOrganization(supabase, user.id);
  if (!activeOrg) redirect("/setup/organization");

  const [match, canManage] = await Promise.all([
    getMatch(supabase, matchId, activeOrg.organizationId),
    canManageMatches(supabase, user.id, activeOrg.organizationId),
  ]);

  if (!match) redirect("/matches");

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link
            href="/matches"
            className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            ← Back to matches
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            vs {match.opponent}
          </h1>
          <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">{match.teamName}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[match.status] ?? "bg-zinc-100 text-zinc-500"}`}
            >
              {STATUS_LABELS[match.status] ?? match.status}
            </span>
            <MatchResultBadge
              goalsFor={match.goalsFor}
              goalsAgainst={match.goalsAgainst}
              status={match.status}
            />
            {match.isArchived && (
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                Archived
              </span>
            )}
          </div>
        </div>

        {canManage && !match.isArchived && (
          <Link
            href={`/matches/${match.id}/edit`}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Edit
          </Link>
        )}
      </div>

      {/* Details grid */}
      <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-3 text-base font-medium text-zinc-900 dark:text-zinc-50">Details</h2>
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div>
            <dt className="text-xs text-zinc-500 dark:text-zinc-400">Date</dt>
            <dd className="mt-0.5 text-sm text-zinc-900 dark:text-zinc-50">{match.matchDate}</dd>
          </div>
          <div>
            <dt className="text-xs text-zinc-500 dark:text-zinc-400">Home / Away</dt>
            <dd className="mt-0.5 text-sm text-zinc-900 dark:text-zinc-50">
              {match.homeAway ? (HOME_AWAY_LABELS[match.homeAway] ?? match.homeAway) : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-zinc-500 dark:text-zinc-400">Competition</dt>
            <dd className="mt-0.5 text-sm text-zinc-900 dark:text-zinc-50">
              {match.competition ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-zinc-500 dark:text-zinc-400">Location</dt>
            <dd className="mt-0.5 text-sm text-zinc-900 dark:text-zinc-50">
              {match.location ?? "—"}
            </dd>
          </div>
        </dl>
      </section>

      {/* Notes */}
      {match.notes && (
        <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-1 text-sm font-medium text-zinc-500 dark:text-zinc-400">Notes</h2>
          <p className="whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">
            {match.notes}
          </p>
        </section>
      )}

      {/* Danger zone */}
      {canManage && !match.isArchived && (
        <section className="border-t border-zinc-200 pt-6 dark:border-zinc-800">
          <h2 className="mb-1 text-base font-medium text-red-700 dark:text-red-400">Danger zone</h2>
          <p className="mb-3 text-sm text-zinc-500 dark:text-zinc-400">
            Archiving removes the match from the active list. Match data is preserved.
          </p>
          <ArchiveMatchButton matchId={match.id} organizationId={activeOrg.organizationId} />
        </section>
      )}
    </div>
  );
}
