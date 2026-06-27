import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/db/supabase-server";
import { requireUser } from "@/lib/auth/get-user";
import { getActiveOrganization, canManagePlayers } from "@/lib/organizations/get-organization";
import { getPlayers } from "@/lib/players/get-players";

const STATUS_LABELS: Record<string, string> = {
  active: "Active",
  inactive: "Inactive",
  archived: "Archived",
};

export default async function PlayersPage() {
  const user = await requireUser();
  const supabase = await createClient();
  if (!supabase) redirect("/login");

  const activeOrg = await getActiveOrganization(supabase, user.id);
  if (!activeOrg) redirect("/setup/organization");

  const [players, canManage] = await Promise.all([
    getPlayers(supabase, activeOrg.organizationId),
    canManagePlayers(supabase, user.id, activeOrg.organizationId),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Players</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            All active players in your organization.
          </p>
        </div>
        {canManage && (
          <Link
            href="/players/new"
            className="self-start rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 sm:self-auto"
          >
            Add player
          </Link>
        )}
      </div>

      {players.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 px-6 py-12 text-center dark:border-zinc-700">
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">No players yet</p>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {canManage
              ? "Add your first player to get started."
              : "No players have been added yet."}
          </p>
          {canManage && (
            <Link
              href="/players/new"
              className="mt-4 inline-block rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Add player
            </Link>
          )}
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {players.map((player) => (
            <li key={player.id}>
              <Link
                href={`/players/${player.id}`}
                className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-4 py-3 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800"
              >
                <div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    {player.lastName}, {player.firstName}
                    {player.displayName ? (
                      <span className="ml-2 text-xs text-zinc-400 dark:text-zinc-500">
                        ({player.displayName})
                      </span>
                    ) : null}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {[player.primaryPosition, player.preferredFoot]
                      .filter(Boolean)
                      .join(" · ") || "No details"}
                  </p>
                </div>
                <span
                  className={
                    player.status === "active"
                      ? "rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900 dark:text-green-300"
                      : "rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                  }
                >
                  {STATUS_LABELS[player.status] ?? player.status}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
