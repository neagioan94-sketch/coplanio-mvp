import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/db/supabase-server";
import { requireUser } from "@/lib/auth/get-user";
import { getActiveOrganization, canManageReports } from "@/lib/organizations/get-organization";
import { getPlayers } from "@/lib/players/get-players";
import { getTeams } from "@/lib/teams/get-teams";
import { getTrainingSessions } from "@/lib/training-sessions/get-training-sessions";
import { getMatches } from "@/lib/matches/get-matches";
import { getAssessmentResults } from "@/lib/assessments/get-assessments";
import CreateReportForm from "@/components/reports/create-report-form";

export default async function NewReportPage() {
  const user = await requireUser();
  const supabase = await createClient();
  if (!supabase) redirect("/login");

  const activeOrg = await getActiveOrganization(supabase, user.id);
  if (!activeOrg) redirect("/setup/organization");

  const allowed = await canManageReports(supabase, user.id, activeOrg.organizationId);
  if (!allowed) redirect("/reports");

  const [players, teams, sessions, matches, assessmentResults] = await Promise.all([
    getPlayers(supabase, activeOrg.organizationId),
    getTeams(supabase, activeOrg.organizationId),
    getTrainingSessions(supabase, activeOrg.organizationId),
    getMatches(supabase, activeOrg.organizationId),
    getAssessmentResults(supabase, activeOrg.organizationId, { limit: 50 }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/reports"
          className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          ← Back to reports
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">New report</h1>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <CreateReportForm
          players={players}
          teams={teams}
          sessions={sessions}
          matches={matches}
          assessmentResults={assessmentResults}
        />
      </div>
    </div>
  );
}
