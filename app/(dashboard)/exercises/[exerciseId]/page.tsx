import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/db/supabase-server";
import { requireUser } from "@/lib/auth/get-user";
import { getActiveOrganization, canManageExercises } from "@/lib/organizations/get-organization";
import { getExercise } from "@/lib/exercises/get-exercises";
import ArchiveExerciseButton from "@/components/exercises/archive-exercise-button";

interface ExerciseDetailPageProps {
  params: Promise<{ exerciseId: string }>;
}

const DIFFICULTY_LABELS: Record<string, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export default async function ExerciseDetailPage({ params }: ExerciseDetailPageProps) {
  const { exerciseId } = await params;

  const user = await requireUser();
  const supabase = await createClient();
  if (!supabase) redirect("/login");

  const activeOrg = await getActiveOrganization(supabase, user.id);
  if (!activeOrg) redirect("/setup/organization");

  const [exercise, canManage] = await Promise.all([
    getExercise(supabase, exerciseId, activeOrg.organizationId),
    canManageExercises(supabase, user.id, activeOrg.organizationId),
  ]);

  if (!exercise) redirect("/exercises");

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/exercises"
            className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            ← Back to exercises
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            {exercise.name}
          </h1>
          {exercise.category && (
            <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">{exercise.category}</p>
          )}
          {exercise.isArchived && (
            <span className="mt-2 inline-block rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
              Archived
            </span>
          )}
        </div>

        {canManage && !exercise.isArchived && (
          <Link
            href={`/exercises/${exercise.id}/edit`}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Edit
          </Link>
        )}
      </div>

      {/* Objective */}
      <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-1 text-sm font-medium text-zinc-500 dark:text-zinc-400">Objective</h2>
        <p className="text-sm text-zinc-900 dark:text-zinc-50">{exercise.objective}</p>
      </section>

      {/* Details grid */}
      <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-3 text-base font-medium text-zinc-900 dark:text-zinc-50">Details</h2>
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div>
            <dt className="text-xs text-zinc-500 dark:text-zinc-400">Difficulty</dt>
            <dd className="mt-0.5 text-sm capitalize text-zinc-900 dark:text-zinc-50">
              {exercise.difficulty ? DIFFICULTY_LABELS[exercise.difficulty] : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-zinc-500 dark:text-zinc-400">Duration</dt>
            <dd className="mt-0.5 text-sm text-zinc-900 dark:text-zinc-50">
              {exercise.durationMinutes ? `${exercise.durationMinutes} min` : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-zinc-500 dark:text-zinc-400">Min players</dt>
            <dd className="mt-0.5 text-sm text-zinc-900 dark:text-zinc-50">
              {exercise.playerCountMin ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-zinc-500 dark:text-zinc-400">Max players</dt>
            <dd className="mt-0.5 text-sm text-zinc-900 dark:text-zinc-50">
              {exercise.playerCountMax ?? "—"}
            </dd>
          </div>
        </dl>

        {exercise.tags.length > 0 && (
          <div className="mt-4 border-t border-zinc-100 pt-3 dark:border-zinc-800">
            <dt className="mb-1.5 text-xs text-zinc-500 dark:text-zinc-400">Tags</dt>
            <dd className="flex flex-wrap gap-1.5">
              {exercise.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                >
                  {tag}
                </span>
              ))}
            </dd>
          </div>
        )}
      </section>

      {/* Description */}
      {exercise.description && (
        <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-2 text-base font-medium text-zinc-900 dark:text-zinc-50">Description</h2>
          <p className="whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">
            {exercise.description}
          </p>
        </section>
      )}

      {/* Coaching points */}
      {exercise.coachingPoints && (
        <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-2 text-base font-medium text-zinc-900 dark:text-zinc-50">
            Coaching points
          </h2>
          <p className="whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">
            {exercise.coachingPoints}
          </p>
        </section>
      )}

      {/* Danger zone */}
      {canManage && !exercise.isArchived && (
        <section className="border-t border-zinc-200 pt-6 dark:border-zinc-800">
          <h2 className="mb-1 text-base font-medium text-red-700 dark:text-red-400">Danger zone</h2>
          <p className="mb-3 text-sm text-zinc-500 dark:text-zinc-400">
            Archiving removes the exercise from the active library. Historical session data is preserved.
          </p>
          <ArchiveExerciseButton
            exerciseId={exercise.id}
            organizationId={activeOrg.organizationId}
          />
        </section>
      )}
    </div>
  );
}
