import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/db/supabase-server";
import { requireUser } from "@/lib/auth/get-user";
import { getActiveOrganization, canManageTeams } from "@/lib/organizations/get-organization";
import { getTeam, getTeamStaff } from "@/lib/teams/get-teams";
import { getOrganizationMembers } from "@/lib/organizations/get-members";
import AssignStaffForm from "@/components/teams/assign-staff-form";
import TeamStaffList from "@/components/teams/team-staff-list";

interface StaffPageProps {
  params: Promise<{ teamId: string }>;
}

export default async function TeamStaffPage({ params }: StaffPageProps) {
  const { teamId } = await params;

  const user = await requireUser();
  const supabase = await createClient();
  if (!supabase) redirect("/login");

  const activeOrg = await getActiveOrganization(supabase, user.id);
  if (!activeOrg) redirect("/setup/organization");

  const allowed = await canManageTeams(supabase, user.id, activeOrg.organizationId);
  if (!allowed) redirect(`/teams/${teamId}`);

  const [team, staff, members] = await Promise.all([
    getTeam(supabase, teamId, activeOrg.organizationId),
    getTeamStaff(supabase, teamId, activeOrg.organizationId),
    getOrganizationMembers(supabase, activeOrg.organizationId),
  ]);

  if (!team) redirect("/teams");
  if (team.status === "archived") redirect(`/teams/${teamId}`);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Link
          href={`/teams/${teamId}`}
          className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          ← Back to team
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Manage staff — {team.name}
        </h1>
      </div>

      <section>
        <h2 className="mb-3 text-base font-medium text-zinc-900 dark:text-zinc-50">
          Assign staff
        </h2>
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <AssignStaffForm
            teamId={team.id}
            organizationId={activeOrg.organizationId}
            members={members}
          />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-base font-medium text-zinc-900 dark:text-zinc-50">
          Current staff
        </h2>
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <TeamStaffList
            teamId={team.id}
            organizationId={activeOrg.organizationId}
            staff={staff}
            canManage={true}
          />
        </div>
      </section>
    </div>
  );
}
