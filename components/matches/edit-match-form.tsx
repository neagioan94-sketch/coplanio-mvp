"use client";

import { useActionState } from "react";
import { updateMatchAction } from "@/lib/matches/actions";
import type { MatchRow } from "@/lib/matches/get-matches";

interface EditMatchFormProps {
  match: MatchRow;
  organizationId: string;
}

const INPUT_CLASS =
  "rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50";

const LABEL_CLASS = "text-sm font-medium text-zinc-700 dark:text-zinc-300";

export default function EditMatchForm({ match, organizationId }: EditMatchFormProps) {
  const [state, action, isPending] = useActionState(updateMatchAction, undefined);

  return (
    <form action={action} className="flex flex-col gap-5">
      <input type="hidden" name="organizationId" value={organizationId} />
      <input type="hidden" name="matchId" value={match.id} />

      {state?.error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-400">
          {state.error}
        </p>
      )}
      {state?.success && (
        <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-950 dark:text-green-400">
          Match updated.
        </p>
      )}

      {/* Team — read-only */}
      <div className="flex flex-col gap-1.5">
        <span className={LABEL_CLASS}>Team</span>
        <p className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-400">
          {match.teamName}
        </p>
      </div>

      {/* Opponent */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="opponent" className={LABEL_CLASS}>
          Opponent <span className="text-red-500">*</span>
        </label>
        <input
          id="opponent"
          name="opponent"
          type="text"
          required
          defaultValue={match.opponent}
          className={INPUT_CLASS}
        />
      </div>

      {/* Date + Home/Away */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="match_date" className={LABEL_CLASS}>
            Date <span className="text-red-500">*</span>
          </label>
          <input
            id="match_date"
            name="match_date"
            type="date"
            required
            defaultValue={match.matchDate}
            className={INPUT_CLASS}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="home_away" className={LABEL_CLASS}>
            Home / Away
          </label>
          <select
            id="home_away"
            name="home_away"
            defaultValue={match.homeAway ?? ""}
            className={INPUT_CLASS}
          >
            <option value="">—</option>
            <option value="home">Home</option>
            <option value="away">Away</option>
            <option value="neutral">Neutral</option>
          </select>
        </div>
      </div>

      {/* Competition + Location */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="competition" className={LABEL_CLASS}>
            Competition
          </label>
          <input
            id="competition"
            name="competition"
            type="text"
            defaultValue={match.competition ?? ""}
            placeholder="e.g. League Cup"
            className={INPUT_CLASS}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="location" className={LABEL_CLASS}>
            Location
          </label>
          <input
            id="location"
            name="location"
            type="text"
            defaultValue={match.location ?? ""}
            placeholder="e.g. Stadium name"
            className={INPUT_CLASS}
          />
        </div>
      </div>

      {/* Score + Status */}
      <div className="grid grid-cols-3 gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="goals_for" className={LABEL_CLASS}>
            Goals for
          </label>
          <input
            id="goals_for"
            name="goals_for"
            type="number"
            min={0}
            defaultValue={match.goalsFor ?? ""}
            placeholder="0"
            className={INPUT_CLASS}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="goals_against" className={LABEL_CLASS}>
            Goals against
          </label>
          <input
            id="goals_against"
            name="goals_against"
            type="number"
            min={0}
            defaultValue={match.goalsAgainst ?? ""}
            placeholder="0"
            className={INPUT_CLASS}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="status" className={LABEL_CLASS}>
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={match.status}
            className={INPUT_CLASS}
          >
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Notes */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="notes" className={LABEL_CLASS}>
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={match.notes ?? ""}
          placeholder="Additional notes…"
          className={INPUT_CLASS}
        />
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {isPending ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
