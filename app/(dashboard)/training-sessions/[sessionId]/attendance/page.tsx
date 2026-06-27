import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/db/supabase-server";
import { requireUser } from "@/lib/auth/get-user";
import { getActiveOrganization, canManageSessions } from "@/lib/organizations/get-organization";
import { getTrainingSession } from "@/lib/training-sessions/get-training-sessions";
import { getAttendanceRoster } from "@/lib/attendance/get-attendance";
import { AttendanceForm } from "@/components/attendance/attendance-form";

interface AttendancePageProps {
  params: Promise<{ sessionId: string }>;
}

export default async function AttendancePage({ params }: AttendancePageProps) {
  const { sessionId } = await params;

  const user = await requireUser();
  const supabase = await createClient();
  if (!supabase) redirect("/login");

  const activeOrg = await getActiveOrganization(supabase, user.id);
  if (!activeOrg) redirect("/setup/organization");

  const [session, roster, canManage] = await Promise.all([
    getTrainingSession(supabase, sessionId, activeOrg.organizationId),
    getAttendanceRoster(supabase, sessionId, activeOrg.organizationId),
    canManageSessions(supabase, user.id, activeOrg.organizationId),
  ]);

  if (!session) redirect("/training-sessions");

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <Link
          href={`/training-sessions/${session.id}`}
          className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          ← Back to session
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Attendance — {session.title}
        </h1>
        <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
          {session.teamName} · {session.sessionDate}
        </p>
      </div>

      {/* Content */}
      <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        {canManage ? (
          <AttendanceForm roster={roster} sessionId={session.id} />
        ) : (
          <div>
            {roster.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No active players are assigned to this team yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-2 pr-4 font-medium">#</th>
                      <th className="pb-2 pr-4 font-medium">Player</th>
                      <th className="pb-2 pr-4 font-medium">Status</th>
                      <th className="pb-2 font-medium">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roster.map((entry) => (
                      <tr key={entry.playerId} className="border-b last:border-0">
                        <td className="py-2 pr-4 text-muted-foreground">
                          {entry.squadNumber ?? "—"}
                        </td>
                        <td className="py-2 pr-4">
                          {entry.displayName ?? `${entry.firstName} ${entry.lastName}`}
                        </td>
                        <td className="py-2 pr-4 capitalize">{entry.currentStatus}</td>
                        <td className="py-2 text-muted-foreground">
                          {entry.currentNotes || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
