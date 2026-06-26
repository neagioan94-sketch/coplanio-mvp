"use client";

import { useActionState } from "react";
import { archiveTeamAction } from "@/lib/teams/actions";

interface ArchiveTeamButtonProps {
  teamId: string;
  organizationId: string;
}

export default function ArchiveTeamButton({
  teamId,
  organizationId,
}: ArchiveTeamButtonProps) {
  const [state, action, pending] = useActionState(archiveTeamAction, undefined);

  return (
    <form action={action}>
      <input type="hidden" name="teamId" value={teamId} />
      <input type="hidden" name="organizationId" value={organizationId} />
      {state?.error && (
        <p className="mb-2 text-xs text-red-600 dark:text-red-400">{state.error}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        onClick={(e) => {
          if (!confirm("Archive this team? It will no longer appear in the active list.")) {
            e.preventDefault();
          }
        }}
        className="rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-50 dark:bg-red-950 dark:text-red-300 dark:hover:bg-red-900"
      >
        {pending ? "Archiving…" : "Archive team"}
      </button>
    </form>
  );
}
