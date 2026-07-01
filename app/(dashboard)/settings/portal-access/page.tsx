import { redirect } from "next/navigation";
import { createClient } from "@/lib/db/supabase-server";
import { createAdminClient } from "@/lib/db/supabase-admin";
import { requireUser } from "@/lib/auth/get-user";
import { getActiveOrganization, requireRole } from "@/lib/organizations/get-organization";
import { getPortalAccessGrants } from "@/lib/portal/get-portal-access";
import { getPlayers } from "@/lib/players/get-players";
import GrantPortalAccessForm from "@/components/settings/grant-portal-access-form";
import PortalAccessList from "@/components/settings/portal-access-list";

export default async function SettingsPortalAccessPage() {
  const user = await requireUser();
  const supabase = await createClient();
  if (!supabase) redirect("/login");

  const activeOrg = await getActiveOrganization(supabase, user.id);
  if (!activeOrg) redirect("/setup/organization");

  await requireRole(supabase, user.id, activeOrg.organizationId, ["organization_admin"]);

  // adminClient bypasses RLS for the guardian email lookup: "users can view
  // profiles of shared org members" requires a shared active membership,
  // which a portal guardian never has.
  const adminClient = createAdminClient();
  const [grants, players] = await Promise.all([
    getPortalAccessGrants(adminClient ?? supabase, activeOrg.organizationId),
    getPlayers(supabase, activeOrg.organizationId),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Portal access</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Grant parents or guardians read-only access to a specific player&apos;s schedule and
          attendance. Access can be revoked at any time.
        </p>
      </div>

      <section className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-4 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Grant portal access
        </h2>
        <GrantPortalAccessForm organizationId={activeOrg.organizationId} players={players} />
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-4 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Active grants
        </h2>
        <PortalAccessList organizationId={activeOrg.organizationId} grants={grants} />
      </section>
    </div>
  );
}
