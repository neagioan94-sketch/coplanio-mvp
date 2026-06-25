"use client";

import { useActionState } from "react";
import { updateOrganizationAction } from "@/lib/organizations/actions";

interface Org {
  id: string;
  name: string;
  country: string | null;
  timezone: string | null;
  status: string;
}

export default function UpdateOrganizationForm({ org }: { org: Org }) {
  const [state, action, pending] = useActionState(
    updateOrganizationAction,
    undefined,
  );

  return (
    <form action={action} className="flex flex-col gap-4 max-w-md">
      <input type="hidden" name="organizationId" value={org.id} />

      {state?.error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {state.error}
        </p>
      )}
      {state?.success && (
        <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-950 dark:text-green-300">
          Organization updated.
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
          defaultValue={org.name}
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:ring-zinc-100"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor="country"
          className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Country
        </label>
        <input
          id="country"
          name="country"
          type="text"
          defaultValue={org.country ?? ""}
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:ring-zinc-100"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor="timezone"
          className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Timezone
        </label>
        <input
          id="timezone"
          name="timezone"
          type="text"
          defaultValue={org.timezone ?? "UTC"}
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:ring-zinc-100"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {pending ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
