import { redirect } from "next/navigation";
import { createClient } from "@/lib/db/supabase-server";
import {
  getActiveOrganization,
  isOrganizationAdmin,
} from "@/lib/organizations/get-organization";
import AppShell from "@/components/layout/app-shell";

export default async function OrganizationLayout({
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
  if (!activeOrg) redirect("/setup/organization");

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

  return (
    <AppShell
      orgName={org?.name ?? "Organization"}
      role={activeOrg.role}
      userEmail={user.email ?? ""}
      isAdmin={admin}
    >
      {children}
    </AppShell>
  );
}
