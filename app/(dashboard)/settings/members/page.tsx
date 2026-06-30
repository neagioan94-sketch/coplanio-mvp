import { redirect } from "next/navigation";
import { createClient } from "@/lib/db/supabase-server";
import { createAdminClient } from "@/lib/db/supabase-admin";
import { requireUser } from "@/lib/auth/get-user";
import { getActiveOrganization, isOrganizationAdmin, requireRole } from "@/lib/organizations/get-organization";
import { getOrganizationMembers } from "@/lib/organizations/get-members";
import InviteMemberForm from "@/components/organizations/invite-member-form";
import MemberRowComponent from "@/components/organizations/member-row";
import RevokeInvitationForm from "@/components/organizations/revoke-invitation-form";

const ROLE_LABELS: Record<string, string> = {
  organization_admin: "Admin",
  head_coach: "Head Coach",
  coach: "Coach",
  staff: "Staff",
};

export default async function SettingsMembersPage() {
  const user = await requireUser();
  const supabase = await createClient();
  if (!supabase) redirect("/login");

  const activeOrg = await getActiveOrganization(supabase, user.id);
  if (!activeOrg) redirect("/setup/organization");

  await requireRole(supabase, user.id, activeOrg.organizationId, ["organization_admin", "head_coach"]);

  // adminClient bypasses RLS: "users can view profiles of shared org members"
  // requires the TARGET membership to also be status='active', so a regular
  // client cannot read the email/name of a pending (status='invited') member.
  const adminClient = createAdminClient();
  const [members, admin] = await Promise.all([
    getOrganizationMembers(adminClient ?? supabase, activeOrg.organizationId),
    isOrganizationAdmin(supabase, user.id, activeOrg.organizationId),
  ]);

  const visibleMembers = members.filter(
    (m) => m.status !== "removed" && m.status !== "invited",
  );
  const pendingInvitations = members.filter((m) => m.status === "invited");

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Members</h1>

      {admin && (
        <section className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-4 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Invite a member
          </h2>
          <InviteMemberForm organizationId={activeOrg.organizationId} />
        </section>
      )}

      <section className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-4 text-sm font-medium text-zinc-700 dark:text-zinc-300">Members</h2>
        {visibleMembers.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">No members yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800">
                  <th className="pb-2 pr-4 font-medium text-zinc-500 dark:text-zinc-400">Name</th>
                  <th className="pb-2 pr-4 font-medium text-zinc-500 dark:text-zinc-400">Email</th>
                  <th className="pb-2 pr-4 font-medium text-zinc-500 dark:text-zinc-400">Role</th>
                  <th className="pb-2 pr-4 font-medium text-zinc-500 dark:text-zinc-400">Status</th>
                  {admin && (
                    <th className="pb-2 text-right font-medium text-zinc-500 dark:text-zinc-400">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {visibleMembers.map((member) => (
                  <MemberRowComponent
                    key={member.id}
                    member={member}
                    organizationId={activeOrg.organizationId}
                    isAdmin={admin}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {admin && pendingInvitations.length > 0 && (
        <section className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-4 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Pending invitations
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800">
                  <th className="pb-2 pr-4 font-medium text-zinc-500 dark:text-zinc-400">Email</th>
                  <th className="pb-2 pr-4 font-medium text-zinc-500 dark:text-zinc-400">Role</th>
                  <th className="pb-2 text-right font-medium text-zinc-500 dark:text-zinc-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {pendingInvitations.map((inv) => (
                  <tr
                    key={inv.id}
                    className="border-b border-zinc-100 dark:border-zinc-800/50 last:border-0"
                  >
                    <td className="py-3 pr-4 text-zinc-900 dark:text-zinc-50">
                      {inv.email ?? "—"}
                    </td>
                    <td className="py-3 pr-4 text-zinc-600 dark:text-zinc-400">
                      {ROLE_LABELS[inv.role] ?? inv.role}
                    </td>
                    <td className="py-3 text-right">
                      <RevokeInvitationForm
                        memberId={inv.id}
                        organizationId={activeOrg.organizationId}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
