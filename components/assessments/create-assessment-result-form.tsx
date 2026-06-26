"use client";

import { useActionState } from "react";
import { createAssessmentResultAction } from "@/lib/assessments/actions";
import type { AssessmentTypeRow } from "@/lib/assessments/get-assessments";
import type { PlayerRow } from "@/lib/players/get-players";
import type { TeamRow } from "@/lib/teams/get-teams";

interface CreateAssessmentResultFormProps {
  players: PlayerRow[];
  types: AssessmentTypeRow[];
  teams: TeamRow[];
}

const INPUT_CLASS =
  "rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50";

const LABEL_CLASS = "text-sm font-medium text-zinc-700 dark:text-zinc-300";

export default function CreateAssessmentResultForm({
  players,
  types,
  teams,
}: CreateAssessmentResultFormProps) {
  const [state, action, isPending] = useActionState(createAssessmentResultAction, undefined);

  return (
    <form action={action} className="flex flex-col gap-5">
      {state?.error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-400">
          {state.error}
        </p>
      )}

      {/* Assessment type */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="assessment_type_id" className={LABEL_CLASS}>
          Assessment type <span className="text-red-500">*</span>
        </label>
        <select id="assessment_type_id" name="assessment_type_id" required className={INPUT_CLASS}>
          <option value="">Select a type…</option>
          {types.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
              {t.unit ? ` (${t.unit})` : ""}
            </option>
          ))}
        </select>
      </div>

      {/* Player */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="player_id" className={LABEL_CLASS}>
          Player <span className="text-red-500">*</span>
        </label>
        <select id="player_id" name="player_id" required className={INPUT_CLASS}>
          <option value="">Select a player…</option>
          {players.map((p) => (
            <option key={p.id} value={p.id}>
              {p.displayName ?? `${p.firstName} ${p.lastName}`}
            </option>
          ))}
        </select>
      </div>

      {/* Date + Value */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="assessed_at" className={LABEL_CLASS}>
            Date <span className="text-red-500">*</span>
          </label>
          <input
            id="assessed_at"
            name="assessed_at"
            type="date"
            required
            className={INPUT_CLASS}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="value" className={LABEL_CLASS}>
            Value <span className="text-red-500">*</span>
          </label>
          <input
            id="value"
            name="value"
            type="number"
            step="any"
            required
            placeholder="e.g. 4.35"
            className={INPUT_CLASS}
          />
        </div>
      </div>

      {/* Team (optional) */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="team_id" className={LABEL_CLASS}>
          Team (optional)
        </label>
        <select id="team_id" name="team_id" defaultValue="" className={INPUT_CLASS}>
          <option value="">—</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      {/* Notes */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="notes" className={LABEL_CLASS}>
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={2}
          placeholder="Optional notes…"
          className={INPUT_CLASS}
        />
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {isPending ? "Recording…" : "Record result"}
        </button>
      </div>
    </form>
  );
}
