import RevokePortalAccessButton from "@/components/settings/revoke-portal-access-button";
import type { PortalAccessRow } from "@/lib/portal/get-portal-access";

interface PortalAccessListProps {
  organizationId: string;
  grants: PortalAccessRow[];
}

const RELATIONSHIP_LABELS: Record<string, string> = {
  guardian: "Guardian",
  player: "Player",
};

export default function PortalAccessList({ organizationId, grants }: PortalAccessListProps) {
  if (grants.length === 0) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        No portal access has been granted yet.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-zinc-200 dark:border-zinc-800">
            <th className="pb-2 pr-4 font-medium text-zinc-500 dark:text-zinc-400">Player</th>
            <th className="pb-2 pr-4 font-medium text-zinc-500 dark:text-zinc-400">Email</th>
            <th className="pb-2 pr-4 font-medium text-zinc-500 dark:text-zinc-400">Relationship</th>
            <th className="pb-2 text-right font-medium text-zinc-500 dark:text-zinc-400">Actions</th>
          </tr>
        </thead>
        <tbody>
          {grants.map((grant) => (
            <tr key={grant.id} className="border-b border-zinc-100 dark:border-zinc-800/50 last:border-0">
              <td className="py-3 pr-4 text-zinc-900 dark:text-zinc-50">{grant.playerName}</td>
              <td className="py-3 pr-4 text-zinc-600 dark:text-zinc-400">
                {grant.guardianEmail ?? "—"}
              </td>
              <td className="py-3 pr-4 text-zinc-600 dark:text-zinc-400">
                {RELATIONSHIP_LABELS[grant.relationship] ?? grant.relationship}
              </td>
              <td className="py-3 text-right">
                <RevokePortalAccessButton
                  organizationId={organizationId}
                  portalAccessId={grant.id}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
