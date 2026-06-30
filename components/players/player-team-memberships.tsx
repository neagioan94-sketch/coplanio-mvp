"use client";

import { useState, useEffect, useActionState } from "react";
import { removePlayerTeamAction, updatePlayerTeamAction } from "@/lib/players/actions";
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

function EditMembershipForm({
  membership,
  playerId,
  organizationId,
  onClose,
}: {
  membership: PlayerTeamMembershipRow;
  playerId: string;
  organizationId: string;
  onClose: () => void;
}) {
  const [state, action, pending] = useActionState(updatePlayerTeamAction, undefined);

  useEffect(() => {
    if (state?.success) onClose();
  }, [state?.success, onClose]);

  return (
    <form
      action={action}
      className="flex flex-wrap items-end gap-3 rounded-md bg-zinc-50 p-3 dark:bg-zinc-800/50"
    >
      <input type="hidden" name="organizationId" value={organizationId} />
      <input type="hidden" name="playerId" value={playerId} />
      <input type="hidden" name="membership_id" value={membership.id} />

      <div className="flex flex-col gap-1">
        <label className="text-xs text-zinc-500 dark:text-zinc-400">Squad #</label>
        <input
          name="squad_number"
          type="number"
          min={1}
          max={99}
          defaultValue={membership.squadNumber ?? ""}
          className="w-20 rounded border border-zinc-300 bg-white px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-zinc-500 dark:text-zinc-400">Status</label>
        <select
          name="status"
          defaultValue={membership.status}
          className="rounded border border-zinc-300 bg-white px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900"
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="transferred">Transferred</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-zinc-500 dark:text-zinc-400">End date</label>
        <input
          name="end_date"
          type="date"
          defaultValue={membership.endDate ?? ""}
          className="rounded border border-zinc-300 bg-white px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-zinc-900 px-2 py-1 text-xs font-medium text-white disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900"
        >
          {pending ? "…" : "Save"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700 dark:text-zinc-300"
        >
          Cancel
        </button>
      </div>

      {state?.error && (
        <p className="w-full text-xs text-red-600 dark:text-red-400">{state.error}</p>
      )}
    </form>
  );
}

function MembershipRow({
  membership,
  canManage,
  playerId,
  organizationId,
}: {
  membership: PlayerTeamMembershipRow;
  canManage: boolean;
  playerId: string;
  organizationId: string;
}) {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <>
      <tr>
        <td className="py-2 pr-4 font-medium text-zinc-900 dark:text-zinc-50">
          {membership.teamName}
        </td>
        <td className="py-2 pr-4 text-zinc-500 dark:text-zinc-400">
          {membership.squadNumber ?? "—"}
        </td>
        <td className="py-2 pr-4">
          <span
            className={
              membership.status === "active"
                ? "rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900 dark:text-green-300"
                : "rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
            }
          >
            {STATUS_LABELS[membership.status] ?? membership.status}
          </span>
        </td>
        <td className="py-2 pr-4 text-zinc-500 dark:text-zinc-400">
          {membership.startDate ?? "—"}
        </td>
        <td className="py-2 pr-4 text-zinc-500 dark:text-zinc-400">
          {membership.endDate ?? "—"}
        </td>
        {canManage && (
          <td className="py-2 text-right">
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsEditing((v) => !v)}
                className="text-xs text-zinc-600 hover:underline dark:text-zinc-400"
              >
                {isEditing ? "Close" : "Edit"}
              </button>
              {membership.status === "active" && (
                <RemoveMembershipForm
                  membership={membership}
                  playerId={playerId}
                  organizationId={organizationId}
                />
              )}
            </div>
          </td>
        )}
      </tr>
      {isEditing && (
        <tr>
          <td colSpan={6} className="pb-3">
            <EditMembershipForm
              membership={membership}
              playerId={playerId}
              organizationId={organizationId}
              onClose={() => setIsEditing(false)}
            />
          </td>
        </tr>
      )}
    </>
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
            <MembershipRow
              key={m.id}
              membership={m}
              canManage={canManage}
              playerId={playerId}
              organizationId={organizationId}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
