import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/db/supabase-server";
import { requireUser } from "@/lib/auth/get-user";
import { getActiveOrganization, canManageReports } from "@/lib/organizations/get-organization";
import { getReports } from "@/lib/reports/get-reports";
import ReportsList from "@/components/reports/reports-list";

export default async function ReportsPage() {
  const user = await requireUser();
  const supabase = await createClient();
  if (!supabase) redirect("/login");

  const activeOrg = await getActiveOrganization(supabase, user.id);
  if (!activeOrg) redirect("/setup/organization");

  const [reports, canManage] = await Promise.all([
    getReports(supabase, activeOrg.organizationId),
    canManageReports(supabase, user.id, activeOrg.organizationId),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Reports</h1>
        {canManage && (
          <Link
            href="/reports/new"
            className="self-start rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 sm:self-auto"
          >
            New report
          </Link>
        )}
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <ReportsList reports={reports} canManage={canManage} />
      </div>
    </div>
  );
}
