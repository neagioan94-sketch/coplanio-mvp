import { redirect } from "next/navigation";
import { createClient } from "@/lib/db/supabase-server";
import { requireUser } from "@/lib/auth/get-user";
import { getActiveOrganization, isOrganizationAdmin } from "@/lib/organizations/get-organization";
import UpdateOrganizationForm from "@/components/organizations/update-organization-form";

const SETTINGS_ROLES = ["organization_admin", "head_coach"] as const;

export default async function SettingsOrganizationPage() {
  const user = await requireUser();
  const supabase = await createClient();
  if (!supabase) redirect("/login");

  const activeOrg = await getActiveOrganization(supabase, user.id);
  if (!activeOrg) redirect("/setup/organization");

  if (!(SETTINGS_ROLES as readonly string[]).includes(activeOrg.role)) {
    redirect("/dashboard");
  }

  const { data: org } = await supabase
    .from("organizations")
    .select("id, name, country, timezone, status")
    .eq("id", activeOrg.organizationId)
    .single();

  if (!org) redirect("/setup/organization");

  const admin = await isOrganizationAdmin(supabase, user.id, activeOrg.organizationId);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Organization</h1>

      <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        {admin ? (
          <UpdateOrganizationForm org={org} />
        ) : (
          <dl className="flex flex-col gap-4 text-sm">
            <div>
              <dt className="font-medium text-zinc-500 dark:text-zinc-400">Name</dt>
              <dd className="mt-0.5 text-zinc-900 dark:text-zinc-50">{org.name}</dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-500 dark:text-zinc-400">Country</dt>
              <dd className="mt-0.5 text-zinc-900 dark:text-zinc-50">{org.country ?? "—"}</dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-500 dark:text-zinc-400">Timezone</dt>
              <dd className="mt-0.5 text-zinc-900 dark:text-zinc-50">{org.timezone ?? "UTC"}</dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-500 dark:text-zinc-400">Status</dt>
              <dd className="mt-0.5 text-zinc-900 dark:text-zinc-50">{org.status}</dd>
            </div>
          </dl>
        )}
      </div>
    </div>
  );
}
