import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/db/supabase-server";
import { createAdminClient } from "@/lib/db/supabase-admin";
import { getActivePortalAccessForUser } from "@/lib/portal/get-portal-access";
import {
  getPortalPlayerSummary,
  getPortalUpcomingSessions,
  getPortalUpcomingMatches,
  getPortalAttendanceSummary,
} from "@/lib/portal/get-portal-data";

interface PortalPlayerPageProps {
  params: Promise<{ playerId: string }>;
}

const ATTENDANCE_LABELS: Record<string, string> = {
  present: "Present",
  absent: "Absent",
  late: "Late",
  limited: "Limited",
  excused: "Excused",
  unknown: "Unknown",
};

export default async function PortalPlayerPage({ params }: PortalPlayerPageProps) {
  const { playerId } = await params;

  const supabase = await createClient();
  if (!supabase) redirect("/login");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const adminClient = createAdminClient();
  if (!adminClient) redirect("/login");

  // Authorization boundary: the requested playerId must be in this user's own
  // active portal_access set. Never trust the URL param alone.
  const grants = await getActivePortalAccessForUser(adminClient, user.id);
  const grant = grants.find((g) => g.playerId === playerId);
  if (!grant) redirect("/portal");

  const player = await getPortalPlayerSummary(adminClient, playerId);
  if (!player) redirect("/portal");

  const [sessions, matches, attendance] = await Promise.all([
    player.teamId
      ? getPortalUpcomingSessions(adminClient, player.organizationId, player.teamId)
      : Promise.resolve([]),
    player.teamId
      ? getPortalUpcomingMatches(adminClient, player.organizationId, player.teamId)
      : Promise.resolve([]),
    getPortalAttendanceSummary(adminClient, player.organizationId, playerId),
  ]);

  return (
    <div className="flex flex-col gap-6">
      {grants.length > 1 && (
        <Link
          href="/portal"
          className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          ← All players
        </Link>
      )}

      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          {player.fullName}
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {player.teamName ?? "No team assigned"}
          {player.primaryPosition && ` · ${player.primaryPosition}`}
        </p>
      </div>

      <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Upcoming training sessions
        </h2>
        {sessions.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">No upcoming sessions.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {sessions.map((s) => (
              <li key={s.id} className="text-sm text-zinc-700 dark:text-zinc-300">
                <span className="font-medium">{s.title}</span> — {s.sessionDate}
                {s.startTime && ` at ${s.startTime.slice(0, 5)}`}
                {s.location && ` (${s.location})`}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Upcoming matches
        </h2>
        {matches.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">No upcoming matches.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {matches.map((m) => (
              <li key={m.id} className="text-sm text-zinc-700 dark:text-zinc-300">
                vs <span className="font-medium">{m.opponent}</span> — {m.matchDate}
                {m.homeAway && ` (${m.homeAway})`}
                {m.location && ` · ${m.location}`}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Attendance summary
        </h2>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {Object.entries(attendance).map(([status, count]) => (
            <div key={status} className="text-center">
              <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">{count}</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {ATTENDANCE_LABELS[status] ?? status}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
