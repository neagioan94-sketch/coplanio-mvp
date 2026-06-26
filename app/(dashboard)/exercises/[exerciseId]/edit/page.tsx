import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/db/supabase-server";
import { requireUser } from "@/lib/auth/get-user";
import { getActiveOrganization, canManageExercises } from "@/lib/organizations/get-organization";
import { getExercise } from "@/lib/exercises/get-exercises";
import EditExerciseForm from "@/components/exercises/edit-exercise-form";

interface EditExercisePageProps {
  params: Promise<{ exerciseId: string }>;
}

export default async function EditExercisePage({ params }: EditExercisePageProps) {
  const { exerciseId } = await params;

  const user = await requireUser();
  const supabase = await createClient();
  if (!supabase) redirect("/login");

  const activeOrg = await getActiveOrganization(supabase, user.id);
  if (!activeOrg) redirect("/setup/organization");

  const allowed = await canManageExercises(supabase, user.id, activeOrg.organizationId);
  if (!allowed) redirect(`/exercises/${exerciseId}`);

  const exercise = await getExercise(supabase, exerciseId, activeOrg.organizationId);
  if (!exercise) redirect("/exercises");
  if (exercise.isArchived) redirect(`/exercises/${exerciseId}`);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href={`/exercises/${exerciseId}`}
          className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          ← Back to exercise
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Edit exercise
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{exercise.name}</p>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <EditExerciseForm exercise={exercise} organizationId={activeOrg.organizationId} />
      </div>
    </div>
  );
}
