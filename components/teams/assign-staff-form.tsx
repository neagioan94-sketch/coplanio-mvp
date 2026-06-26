"use client";

import { useActionState } from "react";
import { assignTeamStaffAction } from "@/lib/teams/actions";
import type { MemberRow } from "@/lib/organizations/get-members";

const STAFF_ROLE_LABELS: Record<string, string> = {
  head_coach: "Head Coach",
  coach: "Coach",
  staff: "Staff",
};

interface AssignStaffFormProps {
  teamId: string;
  organizationId: string;
  members: MemberRow[];
}

export default function AssignStaffForm({
  teamId,
  organizationId,
  members,
}: AssignStaffFormProps) {
  const [state, action, pending] = useActionState(assignTeamStaffAction, undefined);

  const activeMembers = members.filter((m) => m.status === "active");

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="teamId" value={teamId} />
      <input type="hidden" name="organizationId" value={organizationId} />

      {state?.error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {state.error}
        </p>
      )}
      {state?.success && (
        <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-950 dark:text-green-300">
          Staff member assigned.
        </p>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="flex flex-1 flex-col gap-1">
          <label
            htmlFor="userId"
            className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Member
          </label>
          <select
            id="userId"
            name="userId"
            required
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          >
            <option value="">Select a member…</option>
            {activeMembers.map((m) => (
              <option key={m.userId} value={m.userId}>
                {m.fullName ?? m.email ?? m.userId}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label
            htmlFor="staffRole"
            className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Role
          </label>
          <select
            id="staffRole"
            name="staffRole"
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          >
            {Object.entries(STAFF_ROLE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {pending ? "Assigning…" : "Assign"}
        </button>
      </div>
    </form>
  );
}
