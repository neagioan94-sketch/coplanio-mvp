"use client";

import { useActionState } from "react";
import { archiveReportAction } from "@/lib/reports/actions";

type ActionState = { error?: string; success?: boolean } | undefined;

interface ArchiveReportButtonProps {
  reportId: string;
}

export default function ArchiveReportButton({
  reportId,
}: ArchiveReportButtonProps) {
  const [state, action, isPending] = useActionState<ActionState, FormData>(
    archiveReportAction,
    undefined,
  );

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (!confirm("Archive this report? It will be removed from the active list.")) {
      e.preventDefault();
    }
  }

  return (
    <form action={action} onSubmit={handleSubmit}>
      <input type="hidden" name="reportId" value={reportId} />
      {state?.error && (
        <p className="mb-2 text-sm text-red-600 dark:text-red-400">{state.error}</p>
      )}
      <button
        type="submit"
        disabled={isPending}
        className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
      >
        {isPending ? "Archiving…" : "Archive"}
      </button>
    </form>
  );
}
