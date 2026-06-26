"use client";

import { useActionState } from "react";
import { archiveExerciseAction } from "@/lib/exercises/actions";

interface ArchiveExerciseButtonProps {
  exerciseId: string;
  organizationId: string;
}

export default function ArchiveExerciseButton({
  exerciseId,
  organizationId,
}: ArchiveExerciseButtonProps) {
  const [state, action, pending] = useActionState(archiveExerciseAction, undefined);

  return (
    <form action={action}>
      <input type="hidden" name="exerciseId" value={exerciseId} />
      <input type="hidden" name="organizationId" value={organizationId} />
      {state?.error && (
        <p className="mb-2 text-xs text-red-600 dark:text-red-400">{state.error}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        onClick={(e) => {
          if (!confirm("Archive this exercise? It will no longer appear in the active library.")) {
            e.preventDefault();
          }
        }}
        className="rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-50 dark:bg-red-950 dark:text-red-300 dark:hover:bg-red-900"
      >
        {pending ? "Archiving…" : "Archive exercise"}
      </button>
    </form>
  );
}
