import { redirect } from "next/navigation";
import { createClient } from "@/lib/db/supabase-server";
import { createAdminClient } from "@/lib/db/supabase-admin";
import {
  getActiveOrganization,
  getActiveMemberships,
  isOrganizationAdmin,
} from "@/lib/organizations/get-organization";
import { getActivePortalAccessForUser } from "@/lib/portal/get-portal-access";
import AppShell from "@/components/layout/app-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  if (!supabase) redirect("/login");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const activeOrg = await getActiveOrganization(supabase, user.id);
  if (!activeOrg) {
    // No internal membership — check whether this is a portal-only user
    // (parent/guardian) before falling back to organization setup.
    const adminClient = createAdminClient();
    if (adminClient) {
      const portalGrants = await getActivePortalAccessForUser(adminClient, user.id);
      if (portalGrants.length > 0) redirect("/portal");
    }
    redirect("/setup/organization");
  }

  const { data: org } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", activeOrg.organizationId)
    .single();

  const admin = await isOrganizationAdmin(
    supabase,
    user.id,
    activeOrg.organizationId,
  );

  const memberships = await getActiveMemberships(supabase, user.id);
  const organizations = memberships.map((m) => ({
    organizationId: m.organization_id,
    organizationName: Array.isArray(m.organizations)
      ? (m.organizations[0] as { name: string } | undefined)?.name ?? "Unknown organization"
      : (m.organizations as { name: string } | null)?.name ?? "Unknown organization",
  }));

  return (
    <AppShell
      orgName={org?.name ?? "Organization"}
      role={activeOrg.role}
      userEmail={user.email ?? ""}
      isAdmin={admin}
      organizations={organizations}
      activeOrganizationId={activeOrg.organizationId}
    >
      {children}
    </AppShell>
  );
}
