import Link from "next/link";
import { createClient } from "@/lib/db/supabase-server";
import { requireUser } from "@/lib/auth/get-user";
import { getActiveOrganization, canManageTeams } from "@/lib/organizations/get-organization";
import { getTeams } from "@/lib/teams/get-teams";
import { redirect } from "next/navigation";

export default async function TeamsPage() {
  const user = await requireUser();
  const supabase = await createClient();
  if (!supabase) redirect("/login");

  const activeOrg = await getActiveOrganization(supabase, user.id);
  if (!activeOrg) redirect("/setup/organization");

  const [teams, canManage] = await Promise.all([
    getTeams(supabase, activeOrg.organizationId),
    canManageTeams(supabase, user.id, activeOrg.organizationId),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Teams</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            All teams in your organization.
          </p>
        </div>
        {canManage && (
          <Link
            href="/teams/new"
            className="self-start rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 sm:self-auto"
          >
            New team
          </Link>
        )}
      </div>

      {teams.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 px-6 py-12 text-center dark:border-zinc-700">
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">No teams yet</p>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {canManage
              ? "Create your first team to get started."
              : "No teams have been created yet."}
          </p>
          {canManage && (
            <Link
              href="/teams/new"
              className="mt-4 inline-block rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              New team
            </Link>
          )}
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {teams.map((team) => (
            <li key={team.id}>
              <Link
                href={`/teams/${team.id}`}
                className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-4 py-3 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800"
              >
                <div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    {team.name}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {[team.ageGroup, team.season, team.level].filter(Boolean).join(" · ") ||
                      "No details"}
                  </p>
                </div>
                <span className="text-xs capitalize text-zinc-400 dark:text-zinc-500">
                  {team.status}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
