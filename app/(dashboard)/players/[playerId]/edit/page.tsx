import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/db/supabase-server";
import { requireUser } from "@/lib/auth/get-user";
import { getActiveOrganization, canManagePlayers } from "@/lib/organizations/get-organization";
import { getPlayer } from "@/lib/players/get-players";
import EditPlayerForm from "@/components/players/edit-player-form";

interface EditPlayerPageProps {
  params: Promise<{ playerId: string }>;
}

export default async function EditPlayerPage({ params }: EditPlayerPageProps) {
  const { playerId } = await params;

  const user = await requireUser();
  const supabase = await createClient();
  if (!supabase) redirect("/login");

  const activeOrg = await getActiveOrganization(supabase, user.id);
  if (!activeOrg) redirect("/setup/organization");

  const allowed = await canManagePlayers(supabase, user.id, activeOrg.organizationId);
  if (!allowed) redirect(`/players/${playerId}`);

  const player = await getPlayer(supabase, playerId, activeOrg.organizationId);
  if (!player) redirect("/players");
  if (player.status === "archived") redirect(`/players/${playerId}`);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href={`/players/${playerId}`}
          className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          ← Back to player
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Edit player
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {player.lastName}, {player.firstName}
        </p>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <EditPlayerForm player={player} organizationId={activeOrg.organizationId} />
      </div>
    </div>
  );
}
