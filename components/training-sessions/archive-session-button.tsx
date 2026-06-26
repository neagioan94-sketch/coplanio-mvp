"use client";

import { useActionState } from "react";
import { archiveSessionAction } from "@/lib/training-sessions/actions";

interface ArchiveSessionButtonProps {
  sessionId: string;
  organizationId: string;
}

export default function ArchiveSessionButton({ sessionId, organizationId }: ArchiveSessionButtonProps) {
  const [state, action, isPending] = useActionState(archiveSessionAction, undefined);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (!confirm("Archive this session? It will be removed from the active list.")) {
      e.preventDefault();
    }
  }

  return (
    <form action={action} onSubmit={handleSubmit}>
      <input type="hidden" name="organizationId" value={organizationId} />
      <input type="hidden" name="sessionId" value={sessionId} />
      {state?.error && (
        <p className="mb-2 text-sm text-red-600 dark:text-red-400">{state.error}</p>
      )}
      <button
        type="submit"
        disabled={isPending}
        className="rounded-md border border-red-300 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
      >
        {isPending ? "Archiving…" : "Archive session"}
      </button>
    </form>
  );
}
