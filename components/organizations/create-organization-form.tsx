"use client";

import { useActionState } from "react";
import { createOrganizationAction } from "@/lib/organizations/actions";

export default function CreateOrganizationForm() {
  const [state, action, pending] = useActionState(
    createOrganizationAction,
    undefined,
  );

  return (
    <form action={action} className="flex flex-col gap-4">
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
          Organization name <span className="text-red-500">*</span>
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:ring-zinc-100"
          placeholder="FC Example"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor="country"
          className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Country <span className="text-zinc-400 text-xs">(optional)</span>
        </label>
        <input
          id="country"
          name="country"
          type="text"
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:ring-zinc-100"
          placeholder="Romania"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor="timezone"
          className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Timezone <span className="text-zinc-400 text-xs">(optional, defaults to UTC)</span>
        </label>
        <input
          id="timezone"
          name="timezone"
          type="text"
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:ring-zinc-100"
          placeholder="Europe/Bucharest"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {pending ? "Creating…" : "Create organization"}
      </button>
    </form>
  );
}
