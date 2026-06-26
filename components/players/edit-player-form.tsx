"use client";

import { useActionState } from "react";
import { updatePlayerAction } from "@/lib/players/actions";
import type { PlayerRow } from "@/lib/players/get-players";

interface EditPlayerFormProps {
  player: PlayerRow;
  organizationId: string;
}

export default function EditPlayerForm({ player, organizationId }: EditPlayerFormProps) {
  const [state, action, pending] = useActionState(updatePlayerAction, undefined);

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="organizationId" value={organizationId} />
      <input type="hidden" name="playerId" value={player.id} />

      {state?.error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {state.error}
        </p>
      )}
      {state?.success && (
        <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-950 dark:text-green-300">
          Player updated successfully.
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
            defaultValue={player.firstName}
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
            defaultValue={player.lastName}
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
          defaultValue={player.displayName ?? ""}
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
            defaultValue={player.dateOfBirth ?? ""}
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
            defaultValue={player.primaryPosition ?? ""}
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
            defaultValue={player.preferredFoot ?? ""}
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
        <label htmlFor="status" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Status
        </label>
        <select
          id="status"
          name="status"
          defaultValue={player.status}
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
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
          defaultValue={player.notes ?? ""}
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        />
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {pending ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
