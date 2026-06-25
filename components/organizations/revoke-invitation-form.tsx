"use client";

import { useActionState } from "react";
import { revokeInvitationAction } from "@/lib/organizations/actions";

interface RevokeInvitationFormProps {
  memberId: string;
  organizationId: string;
}

export default function RevokeInvitationForm({
  memberId,
  organizationId,
}: RevokeInvitationFormProps) {
  const [state, action, pending] = useActionState(
    revokeInvitationAction,
    undefined,
  );

  return (
    <form action={action} className="inline-flex items-center gap-2">
      <input type="hidden" name="memberId" value={memberId} />
      <input type="hidden" name="organizationId" value={organizationId} />
      {state?.error && (
        <span className="text-xs text-red-600 dark:text-red-400">
          {state.error}
        </span>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-red-50 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50 dark:bg-red-950 dark:text-red-300"
      >
        {pending ? "…" : "Revoke"}
      </button>
    </form>
  );
}
