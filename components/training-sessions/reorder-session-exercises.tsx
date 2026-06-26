"use client";

import { useActionState } from "react";
import { reorderSessionExerciseAction } from "@/lib/training-sessions/actions";

interface ReorderSessionExercisesProps {
  sessionExerciseId: string;
  sessionId: string;
  organizationId: string;
  isFirst: boolean;
  isLast: boolean;
}

function ReorderButton({
  sessionExerciseId,
  sessionId,
  organizationId,
  direction,
  disabled,
  label,
}: {
  sessionExerciseId: string;
  sessionId: string;
  organizationId: string;
  direction: "up" | "down";
  disabled: boolean;
  label: string;
}) {
  const [, action, isPending] = useActionState(reorderSessionExerciseAction, undefined);

  return (
    <form action={action}>
      <input type="hidden" name="organizationId" value={organizationId} />
      <input type="hidden" name="sessionId" value={sessionId} />
      <input type="hidden" name="sessionExerciseId" value={sessionExerciseId} />
      <input type="hidden" name="direction" value={direction} />
      <button
        type="submit"
        disabled={disabled || isPending}
        aria-label={label}
        className="rounded px-1.5 py-1 text-xs text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-zinc-700 dark:hover:text-zinc-300"
      >
        {direction === "up" ? "↑" : "↓"}
      </button>
    </form>
  );
}

export default function ReorderSessionExercises({
  sessionExerciseId,
  sessionId,
  organizationId,
  isFirst,
  isLast,
}: ReorderSessionExercisesProps) {
  return (
    <div className="flex flex-col">
      <ReorderButton
        sessionExerciseId={sessionExerciseId}
        sessionId={sessionId}
        organizationId={organizationId}
        direction="up"
        disabled={isFirst}
        label="Move up"
      />
      <ReorderButton
        sessionExerciseId={sessionExerciseId}
        sessionId={sessionId}
        organizationId={organizationId}
        direction="down"
        disabled={isLast}
        label="Move down"
      />
    </div>
  );
}
