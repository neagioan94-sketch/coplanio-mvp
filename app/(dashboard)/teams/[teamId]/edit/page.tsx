import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/db/supabase-server";
import { requireUser } from "@/lib/auth/get-user";
import { getActiveOrganization, canManageTeams } from "@/lib/organizations/get-organization";
import { getTeam } from "@/lib/teams/get-teams";
import EditTeamForm from "@/components/teams/edit-team-form";

interface EditTeamPageProps {
  params: Promise<{ teamId: string }>;
}

export default async function EditTeamPage({ params }: EditTeamPageProps) {
  const { teamId } = await params;

  const user = await requireUser();
  const supabase = await createClient();
  if (!supabase) redirect("/login");

  const activeOrg = await getActiveOrganization(supabase, user.id);
  if (!activeOrg) redirect("/setup/organization");

  const allowed = await canManageTeams(supabase, user.id, activeOrg.organizationId);
  if (!allowed) redirect(`/teams/${teamId}`);

  const team = await getTeam(supabase, teamId, activeOrg.organizationId);
  if (!team) redirect("/teams");
  if (team.status === "archived") redirect(`/teams/${teamId}`);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href={`/teams/${teamId}`}
          className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          ← Back to team
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Edit {team.name}
        </h1>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <EditTeamForm team={team} organizationId={activeOrg.organizationId} />
      </div>
    </div>
  );
}
