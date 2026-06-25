"use client";

import { useActionState } from "react";
import Link from "next/link";
import { acceptInvitationAction } from "@/lib/organizations/actions";

interface AcceptInvitationFormProps {
  organizationName: string;
  organizationId: string;
}

export default function AcceptInvitationForm({
  organizationName,
  organizationId,
}: AcceptInvitationFormProps) {
  const [state, action, pending] = useActionState(
    acceptInvitationAction,
    undefined,
  );

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        You have been invited to join{" "}
        <span className="font-semibold text-zinc-900 dark:text-zinc-50">
          {organizationName}
        </span>
        .
      </p>

      {state?.error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {state.error}
        </p>
      )}

      <form action={action}>
        <input type="hidden" name="organizationId" value={organizationId} />
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {pending ? "Accepting…" : "Accept invitation"}
        </button>
      </form>

      <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
        or{" "}
        <Link
          href="/setup/organization?skip=true"
          className="font-medium text-zinc-900 underline-offset-4 hover:underline dark:text-zinc-50"
        >
          create a different organization
        </Link>
      </p>
    </div>
  );
}
