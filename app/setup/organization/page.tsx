import { redirect } from "next/navigation";
import { createClient } from "@/lib/db/supabase-server";
import { getActiveOrganization, getInvitedMembership } from "@/lib/organizations/get-organization";
import CreateOrganizationForm from "@/components/organizations/create-organization-form";
import AcceptInvitationForm from "@/components/organizations/accept-invitation-form";

export const metadata = { title: "Organization setup — Coplanio" };

export default async function SetupOrganizationPage({
  searchParams,
}: {
  searchParams: Promise<{ skip?: string }>;
}) {
  const supabase = await createClient();
  if (!supabase) redirect("/login");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const activeOrg = await getActiveOrganization(supabase, user.id);
  if (activeOrg) redirect("/dashboard");

  const params = await searchParams;
  const skipInvite = params.skip === "true";

  const invited = skipInvite
    ? null
    : await getInvitedMembership(supabase, user.id);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
      <div className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-6 text-center">
          <span className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Coplanio
          </span>
        </div>

        {invited ? (
          <>
            <h1 className="mb-6 text-center text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              You have an invitation
            </h1>
            <AcceptInvitationForm
              organizationName={invited.organizationName}
              organizationId={invited.organizationId}
            />
          </>
        ) : (
          <>
            <h1 className="mb-6 text-center text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              Set up your organization
            </h1>
            <CreateOrganizationForm />
          </>
        )}
      </div>
    </main>
  );
}
