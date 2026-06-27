import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/db/supabase-server";
import { requireUser } from "@/lib/auth/get-user";
import { getActiveOrganization, canManageAssessments } from "@/lib/organizations/get-organization";
import { getAssessmentTypes, getAssessmentResults } from "@/lib/assessments/get-assessments";
import { AssessmentTypesList } from "@/components/assessments/assessment-types-list";
import { AssessmentResultsList } from "@/components/assessments/assessment-results-list";

interface SearchParams {
  assessmentTypeId?: string;
}

export default async function AssessmentsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { assessmentTypeId } = await searchParams;

  const user = await requireUser();
  const supabase = await createClient();
  if (!supabase) redirect("/login");

  const activeOrg = await getActiveOrganization(supabase, user.id);
  if (!activeOrg) redirect("/setup/organization");

  const [types, results, canManage] = await Promise.all([
    getAssessmentTypes(supabase, activeOrg.organizationId),
    getAssessmentResults(supabase, activeOrg.organizationId, {
      assessmentTypeId: assessmentTypeId || undefined,
    }),
    canManageAssessments(supabase, user.id, activeOrg.organizationId),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Assessments</h1>
        {canManage && (
          <div className="flex flex-wrap gap-2">
            <Link
              href="/assessments/results/new"
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Record result
            </Link>
            <Link
              href="/assessments/new"
              className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              New type
            </Link>
          </div>
        )}
      </div>

      {/* Assessment types */}
      <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-3 text-base font-medium text-zinc-900 dark:text-zinc-50">
          Assessment types
          {types.length > 0 && (
            <span className="ml-2 text-sm font-normal text-zinc-500 dark:text-zinc-400">
              ({types.length})
            </span>
          )}
        </h2>
        <AssessmentTypesList
          types={types}
          canManage={canManage}
          organizationId={activeOrg.organizationId}
        />
      </section>

      {/* Recent results */}
      <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-medium text-zinc-900 dark:text-zinc-50">
            Recent results
            {results.length > 0 && (
              <span className="ml-2 text-sm font-normal text-zinc-500 dark:text-zinc-400">
                ({results.length})
              </span>
            )}
          </h2>
          {(assessmentTypeId) && (
            <Link
              href="/assessments"
              className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
            >
              Clear filter
            </Link>
          )}
        </div>
        <AssessmentResultsList results={results} />
      </section>
    </div>
  );
}
