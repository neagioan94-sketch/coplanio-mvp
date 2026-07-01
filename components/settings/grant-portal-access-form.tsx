"use client";

import { useActionState } from "react";
import { grantPortalAccessAction } from "@/lib/portal/actions";
import type { PlayerRow } from "@/lib/players/get-players";

interface GrantPortalAccessFormProps {
  organizationId: string;
  players: PlayerRow[];
}

export default function GrantPortalAccessForm({
  organizationId,
  players,
}: GrantPortalAccessFormProps) {
  const [state, action, isPending] = useActionState(grantPortalAccessAction, undefined);

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="organizationId" value={organizationId} />

      {state?.error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-400">
          {state.error}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="player_id" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Player <span className="text-red-500">*</span>
          </label>
          <select
            id="player_id"
            name="player_id"
            required
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
          >
            <option value="">Select a player…</option>
            {players.map((p) => (
              <option key={p.id} value={p.id}>
                {p.displayName ?? `${p.firstName} ${p.lastName}`}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Guardian email <span className="text-red-500">*</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            placeholder="parent@example.com"
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="relationship" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Relationship
          </label>
          <select
            id="relationship"
            name="relationship"
            defaultValue="guardian"
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
          >
            <option value="guardian">Guardian</option>
            <option value="player">Player</option>
          </select>
        </div>
      </div>

      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        The guardian must already have a Coplanio account (they need to register first).
      </p>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {isPending ? "Granting…" : "Grant access"}
        </button>
      </div>
    </form>
  );
}
