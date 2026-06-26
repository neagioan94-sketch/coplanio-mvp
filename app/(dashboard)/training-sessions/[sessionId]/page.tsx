import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/db/supabase-server";
import { requireUser } from "@/lib/auth/get-user";
import { getActiveOrganization, canManageSessions } from "@/lib/organizations/get-organization";
import { getTrainingSession, getSessionExercises } from "@/lib/training-sessions/get-training-sessions";
import { getExercises } from "@/lib/exercises/get-exercises";
import SessionExerciseList from "@/components/training-sessions/session-exercise-list";
import AddSessionExerciseForm from "@/components/training-sessions/add-session-exercise-form";
import ArchiveSessionButton from "@/components/training-sessions/archive-session-button";
import { getAttendanceRoster } from "@/lib/attendance/get-attendance";
import { AttendanceSummary } from "@/components/attendance/attendance-summary";

interface SessionDetailPageProps {
  params: Promise<{ sessionId: string }>;
}

const STATUS_LABELS: Record<string, string> = {
  planned: "Planned",
  completed: "Completed",
  cancelled: "Cancelled",
};

const STATUS_COLORS: Record<string, string> = {
  planned: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  completed: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  cancelled: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
};

export default async function SessionDetailPage({ params }: SessionDetailPageProps) {
  const { sessionId } = await params;

  const user = await requireUser();
  const supabase = await createClient();
  if (!supabase) redirect("/login");

  const activeOrg = await getActiveOrganization(supabase, user.id);
  if (!activeOrg) redirect("/setup/organization");

  const [session, exercises, sessionExercises, canManage, roster] = await Promise.all([
    getTrainingSession(supabase, sessionId, activeOrg.organizationId),
    getExercises(supabase, activeOrg.organizationId),
    getSessionExercises(supabase, sessionId, activeOrg.organizationId),
    canManageSessions(supabase, user.id, activeOrg.organizationId),
    getAttendanceRoster(supabase, sessionId, activeOrg.organizationId),
  ]);

  if (!session) redirect("/training-sessions");

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link
            href="/training-sessions"
            className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            ← Back to sessions
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            {session.title}
          </h1>
          <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">{session.teamName}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[session.status] ?? "bg-zinc-100 text-zinc-500"}`}
            >
              {STATUS_LABELS[session.status] ?? session.status}
            </span>
            {session.isArchived && (
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                Archived
              </span>
            )}
          </div>
        </div>

        {canManage && !session.isArchived && (
          <Link
            href={`/training-sessions/${session.id}/edit`}
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
            <dd className="mt-0.5 text-sm text-zinc-900 dark:text-zinc-50">{session.sessionDate}</dd>
          </div>
          <div>
            <dt className="text-xs text-zinc-500 dark:text-zinc-400">Start time</dt>
            <dd className="mt-0.5 text-sm text-zinc-900 dark:text-zinc-50">
              {session.startTime ? session.startTime.slice(0, 5) : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-zinc-500 dark:text-zinc-400">Duration</dt>
            <dd className="mt-0.5 text-sm text-zinc-900 dark:text-zinc-50">
              {session.durationMinutes ? `${session.durationMinutes} min` : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-zinc-500 dark:text-zinc-400">Location</dt>
            <dd className="mt-0.5 text-sm text-zinc-900 dark:text-zinc-50">
              {session.location ?? "—"}
            </dd>
          </div>
        </dl>
      </section>

      {/* Objective */}
      {session.objective && (
        <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-1 text-sm font-medium text-zinc-500 dark:text-zinc-400">Objective</h2>
          <p className="whitespace-pre-wrap text-sm text-zinc-900 dark:text-zinc-50">
            {session.objective}
          </p>
        </section>
      )}

      {/* Notes */}
      {session.notes && (
        <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-1 text-sm font-medium text-zinc-500 dark:text-zinc-400">Notes</h2>
          <p className="whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">
            {session.notes}
          </p>
        </section>
      )}

      {/* Attendance summary */}
      <AttendanceSummary roster={roster} sessionId={session.id} />

      {/* Session plan */}
      <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-3 text-base font-medium text-zinc-900 dark:text-zinc-50">
          Session plan
          {sessionExercises.length > 0 && (
            <span className="ml-2 text-sm font-normal text-zinc-500 dark:text-zinc-400">
              ({sessionExercises.length} exercise{sessionExercises.length !== 1 ? "s" : ""})
            </span>
          )}
        </h2>

        <SessionExerciseList
          items={sessionExercises}
          canManage={canManage && !session.isArchived}
          sessionId={session.id}
          organizationId={activeOrg.organizationId}
        />

        {canManage && !session.isArchived && (
          <div className="mt-4 border-t border-zinc-100 pt-4 dark:border-zinc-800">
            <h3 className="mb-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Add exercise
            </h3>
            <AddSessionExerciseForm
              sessionId={session.id}
              organizationId={activeOrg.organizationId}
              exercises={exercises}
            />
          </div>
        )}
      </section>

      {/* Danger zone */}
      {canManage && !session.isArchived && (
        <section className="border-t border-zinc-200 pt-6 dark:border-zinc-800">
          <h2 className="mb-1 text-base font-medium text-red-700 dark:text-red-400">Danger zone</h2>
          <p className="mb-3 text-sm text-zinc-500 dark:text-zinc-400">
            Archiving removes the session from the active list. Session data is preserved.
          </p>
          <ArchiveSessionButton
            sessionId={session.id}
            organizationId={activeOrg.organizationId}
          />
        </section>
      )}
    </div>
  );
}
