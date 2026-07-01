"use client";

import { useActionState } from "react";
import { revokePortalAccessAction } from "@/lib/portal/actions";

interface RevokePortalAccessButtonProps {
  organizationId: string;
  portalAccessId: string;
}

export default function RevokePortalAccessButton({
  organizationId,
  portalAccessId,
}: RevokePortalAccessButtonProps) {
  const [, action, isPending] = useActionState(revokePortalAccessAction, undefined);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (!confirm("Revoke this portal access grant?")) {
      e.preventDefault();
    }
  }

  return (
    <form action={action} onSubmit={handleSubmit}>
      <input type="hidden" name="organizationId" value={organizationId} />
      <input type="hidden" name="portalAccessId" value={portalAccessId} />
      <button
        type="submit"
        disabled={isPending}
        className="text-sm text-red-600 hover:underline disabled:opacity-50 dark:text-red-400"
      >
        {isPending ? "Revoking…" : "Revoke"}
      </button>
    </form>
  );
}
