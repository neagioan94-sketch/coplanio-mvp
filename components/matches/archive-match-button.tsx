"use client";

import { useActionState } from "react";
import { archiveMatchAction } from "@/lib/matches/actions";

interface ArchiveMatchButtonProps {
  matchId: string;
  organizationId: string;
}

export default function ArchiveMatchButton({ matchId, organizationId }: ArchiveMatchButtonProps) {
  const [state, action, isPending] = useActionState(archiveMatchAction, undefined);

  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm("Archive this match? It will be removed from the active list.")) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="matchId" value={matchId} />
      <input type="hidden" name="organizationId" value={organizationId} />

      {state?.error && (
        <p className="mb-2 text-sm text-red-600 dark:text-red-400">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-md border border-red-300 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-950"
      >
        {isPending ? "Archiving…" : "Archive match"}
      </button>
    </form>
  );
}
