import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/db/supabase-server";
import { requireUser } from "@/lib/auth/get-user";
import { getActiveOrganization, canManageExercises } from "@/lib/organizations/get-organization";
import { getExercises } from "@/lib/exercises/get-exercises";

const DIFFICULTY_LABELS: Record<string, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

interface ExercisesPageProps {
  searchParams: Promise<{ search?: string; category?: string }>;
}

export default async function ExercisesPage({ searchParams }: ExercisesPageProps) {
  const { search, category } = await searchParams;

  const user = await requireUser();
  const supabase = await createClient();
  if (!supabase) redirect("/login");

  const activeOrg = await getActiveOrganization(supabase, user.id);
  if (!activeOrg) redirect("/setup/organization");

  const [exercises, canManage] = await Promise.all([
    getExercises(supabase, activeOrg.organizationId, { search, category }),
    canManageExercises(supabase, user.id, activeOrg.organizationId),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Exercises</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Your organization&apos;s exercise library.
          </p>
        </div>
        {canManage && (
          <Link
            href="/exercises/new"
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Add exercise
          </Link>
        )}
      </div>

      {/* Search + filter */}
      <form method="get" className="flex flex-wrap gap-2">
        <input
          name="search"
          type="search"
          defaultValue={search ?? ""}
          placeholder="Search by name or objective…"
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder:text-zinc-500 sm:w-64"
        />
        <input
          name="category"
          type="text"
          defaultValue={category ?? ""}
          placeholder="Filter by category…"
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder:text-zinc-500 sm:w-48"
        />
        <button
          type="submit"
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          Search
        </button>
        {(search || category) && (
          <Link
            href="/exercises"
            className="rounded-md px-3 py-2 text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            Clear
          </Link>
        )}
      </form>

      {exercises.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 px-6 py-12 text-center dark:border-zinc-700">
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
            {search || category ? "No exercises match your search." : "No exercises yet"}
          </p>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {canManage && !search && !category
              ? "Add your first exercise to build the library."
              : null}
          </p>
          {canManage && !search && !category && (
            <Link
              href="/exercises/new"
              className="mt-4 inline-block rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Add exercise
            </Link>
          )}
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {exercises.map((exercise) => (
            <li key={exercise.id}>
              <Link
                href={`/exercises/${exercise.id}`}
                className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-4 py-3 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800"
              >
                <div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    {exercise.name}
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                    {[exercise.category, exercise.difficulty ? DIFFICULTY_LABELS[exercise.difficulty] : null]
                      .filter(Boolean)
                      .join(" · ") || exercise.objective.slice(0, 80)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {exercise.tags.slice(0, 2).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
