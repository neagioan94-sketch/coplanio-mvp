"use client";

import { useActionState } from "react";
import { createPlayerAction } from "@/lib/players/actions";
import type { TeamRow } from "@/lib/teams/get-teams";

interface CreatePlayerFormProps {
  organizationId: string;
  teams: TeamRow[];
}

export default function CreatePlayerForm({ organizationId, teams }: CreatePlayerFormProps) {
  const [state, action, pending] = useActionState(createPlayerAction, undefined);

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="organizationId" value={organizationId} />

      {state?.error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {state.error}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label htmlFor="first_name" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            First name <span className="text-red-500">*</span>
          </label>
          <input
            id="first_name"
            name="first_name"
            type="text"
            required
            maxLength={100}
            placeholder="e.g. John"
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="last_name" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Last name <span className="text-red-500">*</span>
          </label>
          <input
            id="last_name"
            name="last_name"
            type="text"
            required
            maxLength={100}
            placeholder="e.g. Smith"
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="display_name" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Display name
        </label>
        <input
          id="display_name"
          name="display_name"
          type="text"
          maxLength={100}
          placeholder="Optional nickname or short name"
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="date_of_birth" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Date of birth
          </label>
          <input
            id="date_of_birth"
            name="date_of_birth"
            type="date"
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="primary_position" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Position
          </label>
          <input
            id="primary_position"
            name="primary_position"
            type="text"
            maxLength={50}
            placeholder="e.g. Midfielder"
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="preferred_foot" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Preferred foot
          </label>
          <select
            id="preferred_foot"
            name="preferred_foot"
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          >
            <option value="">— select —</option>
            <option value="left">Left</option>
            <option value="right">Right</option>
            <option value="both">Both</option>
            <option value="unknown">Unknown</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="notes" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          maxLength={1000}
          placeholder="Optional notes"
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        />
      </div>

      {teams.length > 0 && (
        <div className="rounded-md border border-zinc-200 p-4 dark:border-zinc-700">
          <p className="mb-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Assign to team (optional)
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="flex flex-col gap-1">
              <label htmlFor="team_id" className="text-xs text-zinc-500 dark:text-zinc-400">
                Team
              </label>
              <select
                id="team_id"
                name="team_id"
                className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
              >
                <option value="">— none —</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                    {t.season ? ` (${t.season})` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="squad_number" className="text-xs text-zinc-500 dark:text-zinc-400">
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
              <label htmlFor="start_date" className="text-xs text-zinc-500 dark:text-zinc-400">
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
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {pending ? "Creating…" : "Create player"}
        </button>
      </div>
    </form>
  );
}
