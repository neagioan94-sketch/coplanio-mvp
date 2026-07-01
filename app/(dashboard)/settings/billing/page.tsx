import { redirect } from "next/navigation";
import { createClient } from "@/lib/db/supabase-server";
import { requireUser } from "@/lib/auth/get-user";
import { getActiveOrganization, requireRole } from "@/lib/organizations/get-organization";
import { BILLING_PLANS } from "@/lib/billing/plans";
import BillingOverview from "@/components/settings/billing-overview";

export default async function SettingsBillingPage() {
  const user = await requireUser();
  const supabase = await createClient();
  if (!supabase) redirect("/login");

  const activeOrg = await getActiveOrganization(supabase, user.id);
  if (!activeOrg) redirect("/setup/organization");

  // Billing management is organization_admin only (Readiness Pack 41 §7).
  await requireRole(supabase, user.id, activeOrg.organizationId, ["organization_admin"]);

  const { data: org } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", activeOrg.organizationId)
    .single();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Billing</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Your organization&apos;s subscription and plan information.
        </p>
      </div>

      <BillingOverview orgName={org?.name ?? "Your organization"} plans={BILLING_PLANS} />
    </div>
  );
}
