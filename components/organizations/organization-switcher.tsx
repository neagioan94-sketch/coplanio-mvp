"use client";

import { useActionState } from "react";
import { switchOrganizationAction } from "@/lib/organizations/actions";

interface OrgOption {
  organizationId: string;
  organizationName: string;
}

export default function OrganizationSwitcher({
  organizations,
  activeOrganizationId,
}: {
  organizations: OrgOption[];
  activeOrganizationId: string;
}) {
  const [state, action, pending] = useActionState(switchOrganizationAction, undefined);

  return (
    <form action={action} className="flex flex-col gap-1">
      <select
        name="organizationId"
        defaultValue={activeOrganizationId}
        disabled={pending}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
      >
        {organizations.map((o) => (
          <option key={o.organizationId} value={o.organizationId}>
            {o.organizationName}
          </option>
        ))}
      </select>
      {state?.error && (
        <p className="text-xs text-red-600 dark:text-red-400">{state.error}</p>
      )}
    </form>
  );
}
