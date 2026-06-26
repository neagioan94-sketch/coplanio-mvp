"use client";

import { useActionState } from "react";
import { removePlayerTeamAction } from "@/lib/players/actions";
import type { PlayerTeamMembershipRow } from "@/lib/players/get-players";

const STATUS_LABELS: Record<string, string> = {
  active: "Active",
  inactive: "Inactive",
  transferred: "Transferred",
  archived: "Archived",
};

function RemoveMembershipForm({
  membership,
  playerId,
  organizationId,
}: {
  membership: PlayerTeamMembershipRow;
  playerId: string;
  organizationId: string;
}) {
  const [state, action, pending] = useActionState(removePlayerTeamAction, undefined);

  return (
    <form action={action} className="inline">
      <input type="hidden" name="organizationId" value={organizationId} />
      <input type="hidden" name="playerId" value={playerId} />
      <input type="hidden" name="membership_id" value={membership.id} />
      {state?.error && (
        <span className="mr-2 text-xs text-red-600 dark:text-red-400">{state.error}</span>
      )}
      <button
        type="submit"
        disabled={pending}
        onClick={(e) => {
          if (!confirm(`Remove player from ${membership.teamName}?`)) {
            e.preventDefault();
          }
        }}
        className="text-xs text-red-600 hover:underline disabled:opacity-50 dark:text-red-400"
      >
        {pending ? "Removing…" : "Remove"}
      </button>
    </form>
  );
}

interface PlayerTeamMembershipsProps {
  memberships: PlayerTeamMembershipRow[];
  canManage: boolean;
  playerId: string;
  organizationId: string;
}

export default function PlayerTeamMemberships({
  memberships,
  canManage,
  playerId,
  organizationId,
}: PlayerTeamMembershipsProps) {
  if (memberships.length === 0) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        No team memberships yet.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-200 dark:border-zinc-700">
            <th className="pb-2 text-left font-medium text-zinc-500 dark:text-zinc-400">Team</th>
            <th className="pb-2 text-left font-medium text-zinc-500 dark:text-zinc-400">#</th>
            <th className="pb-2 text-left font-medium text-zinc-500 dark:text-zinc-400">Status</th>
            <th className="pb-2 text-left font-medium text-zinc-500 dark:text-zinc-400">From</th>
            <th className="pb-2 text-left font-medium text-zinc-500 dark:text-zinc-400">To</th>
            {canManage && <th className="pb-2" />}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {memberships.map((m) => (
            <tr key={m.id}>
              <td className="py-2 pr-4 font-medium text-zinc-900 dark:text-zinc-50">
                {m.teamName}
              </td>
              <td className="py-2 pr-4 text-zinc-500 dark:text-zinc-400">
                {m.squadNumber ?? "—"}
              </td>
              <td className="py-2 pr-4">
                <span
                  className={
                    m.status === "active"
                      ? "rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900 dark:text-green-300"
                      : "rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                  }
                >
                  {STATUS_LABELS[m.status] ?? m.status}
                </span>
              </td>
              <td className="py-2 pr-4 text-zinc-500 dark:text-zinc-400">
                {m.startDate ?? "—"}
              </td>
              <td className="py-2 pr-4 text-zinc-500 dark:text-zinc-400">
                {m.endDate ?? "—"}
              </td>
              {canManage && (
                <td className="py-2 text-right">
                  {m.status === "active" && (
                    <RemoveMembershipForm
                      membership={m}
                      playerId={playerId}
                      organizationId={organizationId}
                    />
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
