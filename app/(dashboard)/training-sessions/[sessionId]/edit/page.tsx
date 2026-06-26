import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/db/supabase-server";
import { requireUser } from "@/lib/auth/get-user";
import { getActiveOrganization, canManageSessions } from "@/lib/organizations/get-organization";
import { getTrainingSession } from "@/lib/training-sessions/get-training-sessions";
import EditSessionForm from "@/components/training-sessions/edit-session-form";

interface EditSessionPageProps {
  params: Promise<{ sessionId: string }>;
}

export default async function EditSessionPage({ params }: EditSessionPageProps) {
  const { sessionId } = await params;

  const user = await requireUser();
  const supabase = await createClient();
  if (!supabase) redirect("/login");

  const activeOrg = await getActiveOrganization(supabase, user.id);
  if (!activeOrg) redirect("/setup/organization");

  const allowed = await canManageSessions(supabase, user.id, activeOrg.organizationId);
  if (!allowed) redirect(`/training-sessions/${sessionId}`);

  const session = await getTrainingSession(supabase, sessionId, activeOrg.organizationId);
  if (!session) redirect("/training-sessions");
  if (session.isArchived) redirect(`/training-sessions/${sessionId}`);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href={`/training-sessions/${sessionId}`}
          className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          ← Back to session
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Edit session
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{session.title}</p>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <EditSessionForm session={session} organizationId={activeOrg.organizationId} />
      </div>
    </div>
  );
}
