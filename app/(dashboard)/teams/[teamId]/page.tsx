import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/db/supabase-server";
import { requireUser } from "@/lib/auth/get-user";
import { getActiveOrganization, canManageTeams } from "@/lib/organizations/get-organization";
import { getTeam, getTeamStaff } from "@/lib/teams/get-teams";
import TeamStaffList from "@/components/teams/team-staff-list";
import ArchiveTeamButton from "@/components/teams/archive-team-button";

interface TeamDetailPageProps {
  params: Promise<{ teamId: string }>;
}

export default async function TeamDetailPage({ params }: TeamDetailPageProps) {
  const { teamId } = await params;

  const user = await requireUser();
  const supabase = await createClient();
  if (!supabase) redirect("/login");

  const activeOrg = await getActiveOrganization(supabase, user.id);
  if (!activeOrg) redirect("/setup/organization");

  const [team, staff, canManage] = await Promise.all([
    getTeam(supabase, teamId, activeOrg.organizationId),
    getTeamStaff(supabase, teamId, activeOrg.organizationId),
    canManageTeams(supabase, user.id, activeOrg.organizationId),
  ]);

  if (!team) redirect("/teams");

  const isArchived = team.status === "archived";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/teams"
            className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            ← Back to teams
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            {team.name}
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {[team.ageGroup, team.season, team.level].filter(Boolean).join(" · ") ||
              "No details"}
          </p>
          {isArchived && (
            <span className="mt-2 inline-block rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
              Archived
            </span>
          )}
        </div>

        {canManage && !isArchived && (
          <div className="flex items-center gap-2">
            <Link
              href={`/teams/${team.id}/edit`}
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Edit
            </Link>
            <Link
              href={`/teams/${team.id}/staff`}
              className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Manage staff
            </Link>
          </div>
        )}
      </div>

      <section>
        <h2 className="mb-3 text-base font-medium text-zinc-900 dark:text-zinc-50">Staff</h2>
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <TeamStaffList
            teamId={team.id}
            organizationId={activeOrg.organizationId}
            staff={staff}
            canManage={false}
          />
        </div>
      </section>

      {canManage && !isArchived && (
        <section className="border-t border-zinc-200 pt-6 dark:border-zinc-800">
          <h2 className="mb-1 text-base font-medium text-red-700 dark:text-red-400">
            Danger zone
          </h2>
          <p className="mb-3 text-sm text-zinc-500 dark:text-zinc-400">
            Archiving the team removes it from the active list. This cannot be undone from
            the app.
          </p>
          <ArchiveTeamButton teamId={team.id} organizationId={activeOrg.organizationId} />
        </section>
      )}
    </div>
  );
}
