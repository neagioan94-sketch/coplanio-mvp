"use client";

import { useActionState, useEffect, useRef } from "react";
import { addSessionExerciseAction } from "@/lib/training-sessions/actions";
import type { ExerciseRow } from "@/lib/exercises/get-exercises";

interface AddSessionExerciseFormProps {
  sessionId: string;
  organizationId: string;
  exercises: ExerciseRow[];
}

const DIFFICULTY_LABELS: Record<string, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export default function AddSessionExerciseForm({
  sessionId,
  organizationId,
  exercises,
}: AddSessionExerciseFormProps) {
  const [state, action, isPending] = useActionState(addSessionExerciseAction, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form action={action} ref={formRef} className="flex flex-col gap-4">
      <input type="hidden" name="organizationId" value={organizationId} />
      <input type="hidden" name="sessionId" value={sessionId} />

      {state?.error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-400">
          {state.error}
        </p>
      )}
      {state?.success && (
        <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-950 dark:text-green-400">
          Exercise added.
        </p>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="exercise_id" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Exercise <span className="text-red-500">*</span>
        </label>
        <select
          id="exercise_id"
          name="exercise_id"
          required
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
        >
          <option value="">Select an exercise…</option>
          {exercises.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
              {e.difficulty ? ` (${DIFFICULTY_LABELS[e.difficulty] ?? e.difficulty})` : ""}
              {e.durationMinutes ? ` — ${e.durationMinutes} min` : ""}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="planned_duration_minutes" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Planned duration (min)
          </label>
          <input
            id="planned_duration_minutes"
            name="planned_duration_minutes"
            type="number"
            min={1}
            placeholder="Override library default"
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
          />
        </div>

        <div className="flex flex-col gap-1.5 items-end justify-end">
          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {isPending ? "Adding…" : "Add to session"}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="ex_notes" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Notes for this exercise
        </label>
        <textarea
          id="ex_notes"
          name="notes"
          rows={2}
          placeholder="Coaching cues, modifications…"
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
        />
      </div>
    </form>
  );
}
