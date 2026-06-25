import { redirect } from "next/navigation";
import { createClient } from "@/lib/db/supabase-server";
import {
  getActiveOrganization,
  isOrganizationAdmin,
} from "@/lib/organizations/get-organization";
import { getOrganizationMembers } from "@/lib/organizations/get-members";
import InviteMemberForm from "@/components/organizations/invite-member-form";
import MemberRowComponent from "@/components/organizations/member-row";

export const metadata = { title: "Members — Coplanio" };

export default async function MembersPage() {
  const supabase = await createClient();
  if (!supabase) redirect("/login");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const activeOrg = await getActiveOrganization(supabase, user.id);
  if (!activeOrg) redirect("/setup/organization");

  const [members, admin] = await Promise.all([
    getOrganizationMembers(supabase, activeOrg.organizationId),
    isOrganizationAdmin(supabase, user.id, activeOrg.organizationId),
  ]);

  const visibleMembers = members.filter((m) => m.status !== "removed");

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        Members
      </h1>

      {admin && (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Invite a member
          </h2>
          <InviteMemberForm organizationId={activeOrg.organizationId} />
        </section>
      )}

      <section>
        {visibleMembers.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No members yet.
          </p>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                <th className="pb-2 pr-4">Name</th>
                <th className="pb-2 pr-4">Email</th>
                <th className="pb-2 pr-4">Role</th>
                <th className="pb-2 pr-4">Status</th>
                {admin && <th className="pb-2 text-right">Actions</th>}
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
        )}
      </section>
    </div>
  );
}
