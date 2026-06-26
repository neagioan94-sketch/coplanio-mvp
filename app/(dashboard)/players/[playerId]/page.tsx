import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/db/supabase-server";
import { requireUser } from "@/lib/auth/get-user";
import { getActiveOrganization, canManagePlayers } from "@/lib/organizations/get-organization";
import { getPlayer, getPlayerTeamMemberships } from "@/lib/players/get-players";
import { getTeams } from "@/lib/teams/get-teams";
import PlayerTeamMemberships from "@/components/players/player-team-memberships";
import AssignPlayerTeamForm from "@/components/players/assign-player-team-form";
import ArchivePlayerButton from "@/components/players/archive-player-button";

interface PlayerDetailPageProps {
  params: Promise<{ playerId: string }>;
}

const STATUS_LABELS: Record<string, string> = {
  active: "Active",
  inactive: "Inactive",
  archived: "Archived",
};

export default async function PlayerDetailPage({ params }: PlayerDetailPageProps) {
  const { playerId } = await params;

  const user = await requireUser();
  const supabase = await createClient();
  if (!supabase) redirect("/login");

  const activeOrg = await getActiveOrganization(supabase, user.id);
  if (!activeOrg) redirect("/setup/organization");

  const [player, memberships, canManage] = await Promise.all([
    getPlayer(supabase, playerId, activeOrg.organizationId),
    getPlayerTeamMemberships(supabase, playerId, activeOrg.organizationId),
    canManagePlayers(supabase, user.id, activeOrg.organizationId),
  ]);

  if (!player) redirect("/players");

  const isArchived = player.status === "archived";

  const activeTeams = canManage && !isArchived
    ? await getTeams(supabase, activeOrg.organizationId)
    : [];

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link
            href="/players"
            className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            ← Back to players
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            {player.lastName}, {player.firstName}
          </h1>
          {player.displayName && (
            <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
              {player.displayName}
            </p>
          )}
          <span
            className={
              player.status === "active"
                ? "mt-2 inline-block rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900 dark:text-green-300"
                : "mt-2 inline-block rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
            }
          >
            {STATUS_LABELS[player.status] ?? player.status}
          </span>
        </div>

        {canManage && !isArchived && (
          <Link
            href={`/players/${player.id}/edit`}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Edit
          </Link>
        )}
      </div>

      {/* Details */}
      <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-3 text-base font-medium text-zinc-900 dark:text-zinc-50">Details</h2>
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div>
            <dt className="text-xs text-zinc-500 dark:text-zinc-400">Date of birth</dt>
            <dd className="mt-0.5 text-sm text-zinc-900 dark:text-zinc-50">
              {player.dateOfBirth ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-zinc-500 dark:text-zinc-400">Position</dt>
            <dd className="mt-0.5 text-sm text-zinc-900 dark:text-zinc-50">
              {player.primaryPosition ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-zinc-500 dark:text-zinc-400">Preferred foot</dt>
            <dd className="mt-0.5 text-sm capitalize text-zinc-900 dark:text-zinc-50">
              {player.preferredFoot ?? "—"}
            </dd>
          </div>
        </dl>
        {player.notes && (
          <div className="mt-4 border-t border-zinc-100 pt-3 dark:border-zinc-800">
            <dt className="text-xs text-zinc-500 dark:text-zinc-400">Notes</dt>
            <dd className="mt-0.5 text-sm text-zinc-700 dark:text-zinc-300">{player.notes}</dd>
          </div>
        )}
      </section>

      {/* Team memberships */}
      <section>
        <h2 className="mb-3 text-base font-medium text-zinc-900 dark:text-zinc-50">
          Team memberships
        </h2>
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <PlayerTeamMemberships
            memberships={memberships}
            canManage={canManage}
            playerId={player.id}
            organizationId={activeOrg.organizationId}
          />
        </div>

        {canManage && !isArchived && (
          <div className="mt-4">
            <h3 className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Assign to team
            </h3>
            <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
              <AssignPlayerTeamForm
                playerId={player.id}
                organizationId={activeOrg.organizationId}
                teams={activeTeams}
              />
            </div>
          </div>
        )}
      </section>

      {/* Danger zone */}
      {canManage && !isArchived && (
        <section className="border-t border-zinc-200 pt-6 dark:border-zinc-800">
          <h2 className="mb-1 text-base font-medium text-red-700 dark:text-red-400">
            Danger zone
          </h2>
          <p className="mb-3 text-sm text-zinc-500 dark:text-zinc-400">
            Archiving the player removes them from the active roster. Historical data is preserved.
          </p>
          <ArchivePlayerButton playerId={player.id} organizationId={activeOrg.organizationId} />
        </section>
      )}
    </div>
  );
}
