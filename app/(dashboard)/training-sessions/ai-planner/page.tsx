import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/db/supabase-server";
import { requireUser } from "@/lib/auth/get-user";
import { getActiveOrganization, canManageSessions } from "@/lib/organizations/get-organization";
import { getTeams } from "@/lib/teams/get-teams";
import { getExercises } from "@/lib/exercises/get-exercises";
import AiPlannerForm from "@/components/training-sessions/ai-planner-form";

export default async function AiTrainingPlannerPage() {
  const user = await requireUser();
  const supabase = await createClient();
  if (!supabase) redirect("/login");

  const activeOrg = await getActiveOrganization(supabase, user.id);
  if (!activeOrg) redirect("/setup/organization");

  const allowed = await canManageSessions(supabase, user.id, activeOrg.organizationId);
  if (!allowed) redirect("/training-sessions");

  const teams = await getTeams(supabase, activeOrg.organizationId);
  const exercises = await getExercises(supabase, activeOrg.organizationId);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/training-sessions"
          className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          ← Back to sessions
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          AI training planner
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Describe what you want this session to focus on. The AI drafts a session and exercise
          plan from your existing exercise library — nothing is saved until you review and confirm.
        </p>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <AiPlannerForm
          organizationId={activeOrg.organizationId}
          teams={teams}
          exercises={exercises}
        />
      </div>
    </div>
  );
}
