"use client";

import { useActionState } from "react";
import type { MemberRow } from "@/lib/organizations/get-members";
import {
  updateMemberRoleAction,
  suspendMemberAction,
  removeMemberAction,
} from "@/lib/organizations/actions";

const ROLE_LABELS: Record<string, string> = {
  organization_admin: "Admin",
  head_coach: "Head Coach",
  coach: "Coach",
  staff: "Staff",
};

const STATUS_LABELS: Record<string, string> = {
  active: "Active",
  invited: "Invited",
  suspended: "Suspended",
  removed: "Removed",
};

interface MemberRowProps {
  member: MemberRow;
  organizationId: string;
  isAdmin: boolean;
}

function RoleUpdateForm({
  member,
  organizationId,
}: {
  member: MemberRow;
  organizationId: string;
}) {
  const [state, action, pending] = useActionState(
    updateMemberRoleAction,
    undefined,
  );

  if (member.role === "organization_admin") return null;

  return (
    <form action={action} className="flex items-center gap-1">
      <input type="hidden" name="organizationId" value={organizationId} />
      <input type="hidden" name="memberId" value={member.id} />
      <select
        key={member.role}
        name="role"
        defaultValue={member.role}
        disabled={pending}
        className="rounded border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
      >
        <option value="head_coach">Head Coach</option>
        <option value="coach">Coach</option>
        <option value="staff">Staff</option>
      </select>
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-200 disabled:opacity-50 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
      >
        {pending ? "…" : "Save"}
      </button>
      {state?.error && (
        <span className="text-xs text-red-600 dark:text-red-400">
          {state.error}
        </span>
      )}
    </form>
  );
}

function StatusActionForm({
  member,
  organizationId,
}: {
  member: MemberRow;
  organizationId: string;
}) {
  const [suspendState, suspendAction, suspendPending] = useActionState(
    suspendMemberAction,
    undefined,
  );
  const [removeState, removeAction, removePending] = useActionState(
    removeMemberAction,
    undefined,
  );

  const error = suspendState?.error ?? removeState?.error;

  return (
    <div className="flex items-center gap-1">
      {member.status === "active" && (
        <form action={suspendAction}>
          <input type="hidden" name="organizationId" value={organizationId} />
          <input type="hidden" name="memberId" value={member.id} />
          <button
            type="submit"
            disabled={suspendPending}
            className="rounded bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-700 hover:bg-yellow-100 disabled:opacity-50 dark:bg-yellow-950 dark:text-yellow-300"
          >
            {suspendPending ? "…" : "Suspend"}
          </button>
        </form>
      )}
      <form action={removeAction}>
        <input type="hidden" name="organizationId" value={organizationId} />
        <input type="hidden" name="memberId" value={member.id} />
        <button
          type="submit"
          disabled={removePending}
          className="rounded bg-red-50 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50 dark:bg-red-950 dark:text-red-300"
        >
          {removePending ? "…" : "Remove"}
        </button>
      </form>
      {error && (
        <span className="text-xs text-red-600 dark:text-red-400">{error}</span>
      )}
    </div>
  );
}

export default function MemberRowComponent({
  member,
  organizationId,
  isAdmin,
}: MemberRowProps) {
  return (
    <tr className="border-t border-zinc-100 dark:border-zinc-800">
      <td className="py-3 pr-4 text-sm text-zinc-900 dark:text-zinc-50">
        {member.fullName ?? "—"}
      </td>
      <td className="py-3 pr-4 text-sm text-zinc-500 dark:text-zinc-400">
        {member.email ?? "—"}
      </td>
      <td className="py-3 pr-4 text-sm text-zinc-700 dark:text-zinc-300">
        {isAdmin && member.role !== "organization_admin" ? (
          <RoleUpdateForm member={member} organizationId={organizationId} />
        ) : (
          ROLE_LABELS[member.role] ?? member.role
        )}
      </td>
      <td className="py-3 pr-4 text-sm">
        <span
          className={
            member.status === "active"
              ? "text-green-700 dark:text-green-400"
              : member.status === "invited"
                ? "text-yellow-700 dark:text-yellow-400"
                : "text-zinc-400"
          }
        >
          {STATUS_LABELS[member.status] ?? member.status}
        </span>
      </td>
      {isAdmin && (
        <td className="py-3 text-right">
          {member.role !== "organization_admin" && (
            <StatusActionForm member={member} organizationId={organizationId} />
          )}
        </td>
      )}
    </tr>
  );
}
