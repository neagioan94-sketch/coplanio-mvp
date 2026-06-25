"use client";

import { useActionState } from "react";
import { inviteMemberAction } from "@/lib/organizations/actions";

const ROLE_LABELS: Record<string, string> = {
  head_coach: "Head Coach",
  coach: "Coach",
  staff: "Staff",
};

interface InviteMemberFormProps {
  organizationId: string;
}

export default function InviteMemberForm({
  organizationId,
}: InviteMemberFormProps) {
  const [state, action, pending] = useActionState(inviteMemberAction, undefined);

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="organizationId" value={organizationId} />

      {state?.error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {state.error}
        </p>
      )}
      {state?.success && (
        <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-950 dark:text-green-300">
          Invitation sent.
        </p>
      )}

      <div className="flex gap-2">
        <input
          name="email"
          type="email"
          required
          placeholder="member@example.com"
          className="flex-1 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:ring-zinc-100"
        />
        <select
          name="role"
          required
          defaultValue="coach"
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:ring-zinc-100"
        >
          {Object.entries(ROLE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {pending ? "Sending…" : "Invite"}
        </button>
      </div>
    </form>
  );
}
