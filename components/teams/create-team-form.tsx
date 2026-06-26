"use client";

import { useActionState } from "react";
import { createTeamAction } from "@/lib/teams/actions";

interface CreateTeamFormProps {
  organizationId: string;
}

export default function CreateTeamForm({ organizationId }: CreateTeamFormProps) {
  const [state, action, pending] = useActionState(createTeamAction, undefined);

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="organizationId" value={organizationId} />

      {state?.error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {state.error}
        </p>
      )}

      <div className="flex flex-col gap-1">
        <label
          htmlFor="name"
          className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Team name <span className="text-red-500">*</span>
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          maxLength={100}
          placeholder="e.g. U12 Boys"
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-1">
          <label
            htmlFor="age_group"
            className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Age group
          </label>
          <input
            id="age_group"
            name="age_group"
            type="text"
            maxLength={50}
            placeholder="e.g. U12"
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label
            htmlFor="season"
            className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Season
          </label>
          <input
            id="season"
            name="season"
            type="text"
            maxLength={50}
            placeholder="e.g. 2025/2026"
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label
            htmlFor="level"
            className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Level
          </label>
          <input
            id="level"
            name="level"
            type="text"
            maxLength={50}
            placeholder="e.g. Regional"
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {pending ? "Creating…" : "Create team"}
        </button>
      </div>
    </form>
  );
}
