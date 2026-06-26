"use client";

import { useActionState } from "react";
import { updateTeamStaffRoleAction, removeTeamStaffAction } from "@/lib/teams/actions";
import type { TeamStaffRow } from "@/lib/teams/get-teams";

const STAFF_ROLES = ["head_coach", "coach", "staff"] as const;

const ROLE_LABELS: Record<string, string> = {
  head_coach: "Head Coach",
  coach: "Coach",
  staff: "Staff",
};

interface StaffRowActionsProps {
  teamId: string;
  organizationId: string;
  row: TeamStaffRow;
}

function StaffRowActions({ teamId, organizationId, row }: StaffRowActionsProps) {
  const [updateState, updateAction, updatePending] = useActionState(
    updateTeamStaffRoleAction,
    undefined,
  );
  const [removeState, removeAction, removePending] = useActionState(
    removeTeamStaffAction,
    undefined,
  );

  return (
    <div className="flex flex-col gap-1">
      {updateState?.error && (
        <p className="text-xs text-red-600 dark:text-red-400">{updateState.error}</p>
      )}
      {removeState?.error && (
        <p className="text-xs text-red-600 dark:text-red-400">{removeState.error}</p>
      )}
      <div className="flex items-center gap-2">
        <form action={updateAction} className="flex items-center gap-2">
          <input type="hidden" name="teamId" value={teamId} />
          <input type="hidden" name="organizationId" value={organizationId} />
          <input type="hidden" name="teamStaffId" value={row.id} />
          <select
            name="staffRole"
            defaultValue={row.staffRole}
            className="rounded border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          >
            {STAFF_ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={updatePending}
            className="rounded bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-200 disabled:opacity-50 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            {updatePending ? "Saving…" : "Save"}
          </button>
        </form>

        <form action={removeAction}>
          <input type="hidden" name="teamId" value={teamId} />
          <input type="hidden" name="organizationId" value={organizationId} />
          <input type="hidden" name="teamStaffId" value={row.id} />
          <button
            type="submit"
            disabled={removePending}
            onClick={(e) => {
              if (!confirm("Remove this staff member from the team?")) e.preventDefault();
            }}
            className="rounded bg-red-50 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50 dark:bg-red-950 dark:text-red-300 dark:hover:bg-red-900"
          >
            {removePending ? "Removing…" : "Remove"}
          </button>
        </form>
      </div>
    </div>
  );
}

interface TeamStaffListProps {
  teamId: string;
  organizationId: string;
  staff: TeamStaffRow[];
  canManage: boolean;
}

export default function TeamStaffList({
  teamId,
  organizationId,
  staff,
  canManage,
}: TeamStaffListProps) {
  if (staff.length === 0) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">No staff assigned yet.</p>
    );
  }

  return (
    <ul className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800">
      {staff.map((row) => (
        <li key={row.id} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
              {row.fullName ?? row.email ?? row.userId}
            </p>
            {row.fullName && row.email && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{row.email}</p>
            )}
            {!canManage && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {ROLE_LABELS[row.staffRole] ?? row.staffRole}
              </p>
            )}
          </div>
          {canManage && (
            <StaffRowActions teamId={teamId} organizationId={organizationId} row={row} />
          )}
        </li>
      ))}
    </ul>
  );
}
