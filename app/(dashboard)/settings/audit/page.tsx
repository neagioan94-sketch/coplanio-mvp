import { redirect } from "next/navigation";
import { createClient } from "@/lib/db/supabase-server";
import { requireUser } from "@/lib/auth/get-user";
import { getActiveOrganization } from "@/lib/organizations/get-organization";
import { getAuditEvents } from "@/lib/audit/get-audit-events";
import AuditEventsList from "@/components/settings/audit-events-list";

const SETTINGS_ROLES = ["organization_admin", "head_coach"] as const;

export default async function SettingsAuditPage() {
  const user = await requireUser();
  const supabase = await createClient();
  if (!supabase) redirect("/login");

  const activeOrg = await getActiveOrganization(supabase, user.id);
  if (!activeOrg) redirect("/setup/organization");

  if (!(SETTINGS_ROLES as readonly string[]).includes(activeOrg.role)) {
    redirect("/dashboard");
  }

  const events = await getAuditEvents(supabase, activeOrg.organizationId, { limit: 50 });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Audit Log</h1>

      <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <AuditEventsList events={events} />
      </div>
    </div>
  );
}
