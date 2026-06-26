import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/db/supabase-server";
import { requireUser } from "@/lib/auth/get-user";
import { getActiveOrganization, canManageAssessments } from "@/lib/organizations/get-organization";
import CreateAssessmentTypeForm from "@/components/assessments/create-assessment-type-form";

export default async function NewAssessmentTypePage() {
  const user = await requireUser();
  const supabase = await createClient();
  if (!supabase) redirect("/login");

  const activeOrg = await getActiveOrganization(supabase, user.id);
  if (!activeOrg) redirect("/setup/organization");

  const allowed = await canManageAssessments(supabase, user.id, activeOrg.organizationId);
  if (!allowed) redirect("/assessments");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/assessments"
          className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          ← Back to assessments
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          New assessment type
        </h1>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <CreateAssessmentTypeForm organizationId={activeOrg.organizationId} />
      </div>
    </div>
  );
}
