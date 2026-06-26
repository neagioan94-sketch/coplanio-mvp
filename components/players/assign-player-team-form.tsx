"use client";

import { useActionState, useEffect, useRef } from "react";
import { assignPlayerTeamAction } from "@/lib/players/actions";
import type { TeamRow } from "@/lib/teams/get-teams";

interface AssignPlayerTeamFormProps {
  playerId: string;
  organizationId: string;
  teams: TeamRow[];
}

export default function AssignPlayerTeamForm({
  playerId,
  organizationId,
  teams,
}: AssignPlayerTeamFormProps) {
  const [state, action, pending] = useActionState(assignPlayerTeamAction, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
    }
  }, [state?.success]);

  if (teams.length === 0) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        No active teams available. Create a team first.
      </p>
    );
  }

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-3">
      <input type="hidden" name="organizationId" value={organizationId} />
      <input type="hidden" name="playerId" value={playerId} />

      {state?.error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {state.error}
        </p>
      )}
      {state?.success && (
        <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-950 dark:text-green-300">
          Player assigned to team.
        </p>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="team_id" className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Team <span className="text-red-500">*</span>
          </label>
          <select
            id="team_id"
            name="team_id"
            required
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          >
            <option value="">— select team —</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
                {t.season ? ` (${t.season})` : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="squad_number" className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Squad #
          </label>
          <input
            id="squad_number"
            name="squad_number"
            type="number"
            min={1}
            max={99}
            placeholder="1–99"
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="start_date" className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Start date
          </label>
          <input
            id="start_date"
            name="start_date"
            type="date"
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          />
        </div>
      </div>

      <div>
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {pending ? "Assigning…" : "Assign to team"}
        </button>
      </div>
    </form>
  );
}
