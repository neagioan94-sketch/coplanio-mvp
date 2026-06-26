"use client";

import { useActionState } from "react";
import { archiveAssessmentTypeAction } from "@/lib/assessments/actions";

interface ArchiveAssessmentTypeButtonProps {
  assessmentTypeId: string;
  organizationId: string;
}

export default function ArchiveAssessmentTypeButton({
  assessmentTypeId,
  organizationId,
}: ArchiveAssessmentTypeButtonProps) {
  const [state, action, isPending] = useActionState(archiveAssessmentTypeAction, undefined);

  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm("Archive this assessment type? Existing results will be preserved.")) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="assessmentTypeId" value={assessmentTypeId} />
      <input type="hidden" name="organizationId" value={organizationId} />

      {state?.error && (
        <span className="text-xs text-red-600 dark:text-red-400">{state.error}</span>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="text-xs text-red-600 hover:text-red-800 disabled:opacity-50 dark:text-red-400 dark:hover:text-red-300"
      >
        {isPending ? "Archiving…" : "Archive"}
      </button>
    </form>
  );
}
