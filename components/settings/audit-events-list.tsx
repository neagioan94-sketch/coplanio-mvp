import type { AuditEventRow } from "@/lib/audit/get-audit-events";

function formatActionType(actionType: string): string {
  return actionType
    .split(".")
    .map((part) =>
      part
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" "),
    )
    .join(" — ");
}

function truncateId(id: string | null): string {
  if (!id) return "—";
  return id.length > 12 ? `${id.slice(0, 8)}…` : id;
}

interface AuditEventsListProps {
  events: AuditEventRow[];
}

export default function AuditEventsList({ events }: AuditEventsListProps) {
  if (events.length === 0) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">No audit events yet.</p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-200 dark:border-zinc-800">
            <th className="pb-2 text-left font-medium text-zinc-500 dark:text-zinc-400">Date</th>
            <th className="pb-2 text-left font-medium text-zinc-500 dark:text-zinc-400">Action</th>
            <th className="pb-2 text-left font-medium text-zinc-500 dark:text-zinc-400">Target type</th>
            <th className="pb-2 text-left font-medium text-zinc-500 dark:text-zinc-400">Target ID</th>
            <th className="pb-2 text-left font-medium text-zinc-500 dark:text-zinc-400">Actor</th>
          </tr>
        </thead>
        <tbody>
          {events.map((event) => (
            <tr
              key={event.id}
              className="border-b border-zinc-100 dark:border-zinc-800/50 last:border-0"
            >
              <td className="py-2.5 pr-4 text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                {new Date(event.createdAt).toLocaleString()}
              </td>
              <td className="py-2.5 pr-4 text-zinc-900 dark:text-zinc-50 font-medium">
                {formatActionType(event.actionType)}
              </td>
              <td className="py-2.5 pr-4 text-zinc-600 dark:text-zinc-400">
                {event.targetType ?? "—"}
              </td>
              <td className="py-2.5 pr-4 font-mono text-xs text-zinc-500 dark:text-zinc-400">
                {truncateId(event.targetId)}
              </td>
              <td className="py-2.5 text-xs text-zinc-500 dark:text-zinc-400">
                {event.actorFullName ?? event.actorEmail ?? truncateId(event.actorUserId)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
