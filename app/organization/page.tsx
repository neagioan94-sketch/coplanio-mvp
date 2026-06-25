import { redirect } from "next/navigation";
import { createClient } from "@/lib/db/supabase-server";
import {
  getActiveOrganization,
  isOrganizationAdmin,
} from "@/lib/organizations/get-organization";
import UpdateOrganizationForm from "@/components/organizations/update-organization-form";

export const metadata = { title: "Organization — Coplanio" };

export default async function OrganizationPage() {
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
    .select("id, name, country, timezone, status")
    .eq("id", activeOrg.organizationId)
    .single();

  if (!org) redirect("/setup/organization");

  const admin = await isOrganizationAdmin(
    supabase,
    user.id,
    activeOrg.organizationId,
  );

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        {org.name}
      </h1>

      {admin ? (
        <UpdateOrganizationForm org={org} />
      ) : (
        <dl className="flex flex-col gap-3 text-sm">
          <div>
            <dt className="font-medium text-zinc-500 dark:text-zinc-400">
              Country
            </dt>
            <dd className="text-zinc-900 dark:text-zinc-50">
              {org.country ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-zinc-500 dark:text-zinc-400">
              Timezone
            </dt>
            <dd className="text-zinc-900 dark:text-zinc-50">
              {org.timezone ?? "UTC"}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-zinc-500 dark:text-zinc-400">
              Status
            </dt>
            <dd className="text-zinc-900 dark:text-zinc-50">{org.status}</dd>
          </div>
        </dl>
      )}
    </div>
  );
}
