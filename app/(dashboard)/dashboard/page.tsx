import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/db/supabase-server";
import { createAdminClient } from "@/lib/db/supabase-admin";
import { getInvitedMembership } from "@/lib/organizations/get-organization";
import AcceptInvitationForm from "@/components/organizations/accept-invitation-form";

export const metadata = { title: "Dashboard — Coplanio" };

export default async function DashboardPage() {
  const supabase = await createClient();
  if (!supabase) redirect("/login");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // adminClient bypasses RLS: invited memberships have status='invited', not
  // 'active', so the normal client cannot read them (is_org_member requires active).
  const adminClient = createAdminClient();
  const pendingInvite = adminClient
    ? await getInvitedMembership(adminClient, user.id)
    : null;

  return (
    <div className="flex flex-col gap-8">
      {pendingInvite && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-5 dark:border-amber-800 dark:bg-amber-950/40">
          <p className="mb-3 text-sm font-semibold text-amber-900 dark:text-amber-100">
            Pending invitation
          </p>
          <AcceptInvitationForm
            organizationName={pendingInvite.organizationName}
            organizationId={pendingInvite.organizationId}
          />
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Dashboard
        </h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          Manage your club from the navigation on the left.
        </p>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Quick links
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Link
            href="/teams"
            className="rounded-lg border border-zinc-200 bg-white p-4 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800"
          >
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Teams</p>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              View and manage your teams
            </p>
          </Link>
          <Link
            href="/settings/members"
            className="rounded-lg border border-zinc-200 bg-white p-4 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800"
          >
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Members</p>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              View organization members
            </p>
          </Link>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Modules
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Link href="/players" className="rounded-lg border border-zinc-200 bg-white p-4 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800">
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Players</p>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">View and manage your players</p>
          </Link>
          <Link href="/training-sessions" className="rounded-lg border border-zinc-200 bg-white p-4 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800">
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Training Sessions</p>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Schedule and track sessions</p>
          </Link>
          <Link href="/matches" className="rounded-lg border border-zinc-200 bg-white p-4 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800">
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Matches</p>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Log and review match results</p>
          </Link>
          <Link href="/reports" className="rounded-lg border border-zinc-200 bg-white p-4 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800">
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Reports</p>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Generate and view reports</p>
          </Link>
        </div>
      </section>
    </div>
  );
}
