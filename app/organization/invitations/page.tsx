import { redirect } from "next/navigation";
import { createClient } from "@/lib/db/supabase-server";
import {
  getActiveOrganization,
  requireRole,
} from "@/lib/organizations/get-organization";
import RevokeInvitationForm from "@/components/organizations/revoke-invitation-form";

export const metadata = { title: "Invitations — Coplanio" };

export default async function InvitationsPage() {
  const supabase = await createClient();
  if (!supabase) redirect("/login");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const activeOrg = await getActiveOrganization(supabase, user.id);
  if (!activeOrg) redirect("/setup/organization");

  await requireRole(supabase, user.id, activeOrg.organizationId, [
    "organization_admin",
  ]);

  const { data: invitations } = await supabase
    .from("memberships")
    .select("id, role, profiles(full_name, email)")
    .eq("organization_id", activeOrg.organizationId)
    .eq("status", "invited");

  type Invitation = {
    id: string;
    role: string;
    profiles:
      | { full_name: string | null; email: string | null }
      | { full_name: string | null; email: string | null }[]
      | null;
  };

  const normalized = ((invitations ?? []) as Invitation[]).map((inv) => {
    const profile = Array.isArray(inv.profiles)
      ? inv.profiles[0]
      : inv.profiles;
    return {
      id: inv.id,
      role: inv.role,
      email: profile?.email ?? "—",
      fullName: profile?.full_name ?? null,
    };
  });

  const ROLE_LABELS: Record<string, string> = {
    head_coach: "Head Coach",
    coach: "Coach",
    staff: "Staff",
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        Pending invitations
      </h1>

      {normalized.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          No pending invitations.
        </p>
      ) : (
        <table className="w-full text-left">
          <thead>
            <tr className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              <th className="pb-2 pr-4">Email</th>
              <th className="pb-2 pr-4">Role</th>
              <th className="pb-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {normalized.map((inv) => (
              <tr
                key={inv.id}
                className="border-t border-zinc-100 dark:border-zinc-800"
              >
                <td className="py-3 pr-4 text-sm text-zinc-900 dark:text-zinc-50">
                  {inv.email}
                </td>
                <td className="py-3 pr-4 text-sm text-zinc-700 dark:text-zinc-300">
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
      )}
    </div>
  );
}
