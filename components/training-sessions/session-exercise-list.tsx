"use client";

import { useActionState } from "react";
import type { SessionExerciseRow } from "@/lib/training-sessions/get-training-sessions";
import {
  removeSessionExerciseAction,
  updateSessionExerciseAction,
} from "@/lib/training-sessions/actions";
import ReorderSessionExercises from "@/components/training-sessions/reorder-session-exercises";

interface SessionExerciseListProps {
  items: SessionExerciseRow[];
  canManage: boolean;
  sessionId: string;
  organizationId: string;
}

const DIFFICULTY_LABELS: Record<string, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

function RemoveForm({
  sessionExerciseId,
  sessionId,
  organizationId,
}: {
  sessionExerciseId: string;
  sessionId: string;
  organizationId: string;
}) {
  const [state, action, isPending] = useActionState(removeSessionExerciseAction, undefined);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (!confirm("Remove this exercise from the session?")) {
      e.preventDefault();
    }
  }

  return (
    <form action={action} onSubmit={handleSubmit}>
      <input type="hidden" name="organizationId" value={organizationId} />
      <input type="hidden" name="sessionId" value={sessionId} />
      <input type="hidden" name="sessionExerciseId" value={sessionExerciseId} />
      {state?.error && (
        <p className="text-xs text-red-600 dark:text-red-400">{state.error}</p>
      )}
      <button
        type="submit"
        disabled={isPending}
        className="rounded px-1.5 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-950"
      >
        Remove
      </button>
    </form>
  );
}

function UpdateForm({
  item,
  sessionId,
  organizationId,
}: {
  item: SessionExerciseRow;
  sessionId: string;
  organizationId: string;
}) {
  const [state, action, isPending] = useActionState(updateSessionExerciseAction, undefined);

  return (
    <form action={action} className="mt-2 flex flex-col gap-2 border-t border-zinc-100 pt-2 dark:border-zinc-700">
      <input type="hidden" name="organizationId" value={organizationId} />
      <input type="hidden" name="sessionId" value={sessionId} />
      <input type="hidden" name="sessionExerciseId" value={item.id} />

      {state?.error && (
        <p className="text-xs text-red-600 dark:text-red-400">{state.error}</p>
      )}
      {state?.success && (
        <p className="text-xs text-green-600 dark:text-green-400">Saved.</p>
      )}

      <div className="flex items-center gap-3">
        <div className="flex flex-col gap-0.5">
          <label className="text-xs text-zinc-500 dark:text-zinc-400">Planned duration (min)</label>
          <input
            name="planned_duration_minutes"
            type="number"
            min={1}
            defaultValue={item.plannedDurationMinutes ?? ""}
            placeholder={item.exerciseDurationMinutes ? String(item.exerciseDurationMinutes) : "—"}
            className="w-28 rounded border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
          />
        </div>

        <div className="flex flex-1 flex-col gap-0.5">
          <label className="text-xs text-zinc-500 dark:text-zinc-400">Notes</label>
          <input
            name="notes"
            type="text"
            defaultValue={item.notes ?? ""}
            placeholder="Coaching cues, modifications…"
            className="rounded border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="self-end rounded bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-200 disabled:opacity-50 dark:bg-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-600"
        >
          {isPending ? "…" : "Save"}
        </button>
      </div>
    </form>
  );
}

export default function SessionExerciseList({
  items,
  canManage,
  sessionId,
  organizationId,
}: SessionExerciseListProps) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        No exercises added yet.
      </p>
    );
  }

  return (
    <ol className="flex flex-col gap-2">
      {items.map((item, index) => (
        <li
          key={item.id}
          className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="flex items-start gap-3">
            {canManage && (
              <ReorderSessionExercises
                sessionExerciseId={item.id}
                sessionId={sessionId}
                organizationId={organizationId}
                isFirst={index === 0}
                isLast={index === items.length - 1}
              />
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    {index + 1}. {item.exerciseName}
                  </span>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                    {item.exerciseCategory && <span>{item.exerciseCategory}</span>}
                    {item.exerciseDifficulty && (
                      <span>{DIFFICULTY_LABELS[item.exerciseDifficulty] ?? item.exerciseDifficulty}</span>
                    )}
                    {item.plannedDurationMinutes ? (
                      <span className="font-medium text-zinc-700 dark:text-zinc-300">
                        {item.plannedDurationMinutes} min (planned)
                      </span>
                    ) : item.exerciseDurationMinutes ? (
                      <span>{item.exerciseDurationMinutes} min (library default)</span>
                    ) : null}
                    {item.notes && (
                      <span className="italic text-zinc-400 dark:text-zinc-500">{item.notes}</span>
                    )}
                  </div>
                </div>

                {canManage && (
                  <RemoveForm
                    sessionExerciseId={item.id}
                    sessionId={sessionId}
                    organizationId={organizationId}
                  />
                )}
              </div>

              {canManage && (
                <UpdateForm
                  item={item}
                  sessionId={sessionId}
                  organizationId={organizationId}
                />
              )}
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}
