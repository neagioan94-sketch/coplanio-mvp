import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/db/supabase-server";
import { requireUser } from "@/lib/auth/get-user";
import { getActiveOrganization, canManageMatches } from "@/lib/organizations/get-organization";
import { getMatch } from "@/lib/matches/get-matches";
import EditMatchForm from "@/components/matches/edit-match-form";

interface EditMatchPageProps {
  params: Promise<{ matchId: string }>;
}

export default async function EditMatchPage({ params }: EditMatchPageProps) {
  const { matchId } = await params;

  const user = await requireUser();
  const supabase = await createClient();
  if (!supabase) redirect("/login");

  const activeOrg = await getActiveOrganization(supabase, user.id);
  if (!activeOrg) redirect("/setup/organization");

  const [match, canManage] = await Promise.all([
    getMatch(supabase, matchId, activeOrg.organizationId),
    canManageMatches(supabase, user.id, activeOrg.organizationId),
  ]);

  if (!match || !canManage || match.isArchived) redirect(`/matches/${matchId}`);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href={`/matches/${match.id}`}
          className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          ← Back to match
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Edit match
        </h1>
        <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
          vs {match.opponent} · {match.teamName}
        </p>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <EditMatchForm match={match} organizationId={activeOrg.organizationId} />
      </div>
    </div>
  );
}
