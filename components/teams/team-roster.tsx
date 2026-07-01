import Link from "next/link";
import type { TeamRosterRow } from "@/lib/teams/get-teams";

interface TeamRosterProps {
  roster: TeamRosterRow[];
}

export default function TeamRoster({ roster }: TeamRosterProps) {
  if (roster.length === 0) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">No players assigned yet.</p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-200 dark:border-zinc-700">
            <th className="pb-2 text-left font-medium text-zinc-500 dark:text-zinc-400">#</th>
            <th className="pb-2 text-left font-medium text-zinc-500 dark:text-zinc-400">Name</th>
            <th className="pb-2 text-left font-medium text-zinc-500 dark:text-zinc-400">Position</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {roster.map((row) => (
            <tr key={row.membershipId}>
              <td className="py-2.5 pr-4 text-zinc-500 dark:text-zinc-400">
                {row.squadNumber ?? "—"}
              </td>
              <td className="py-2.5 pr-4">
                <Link
                  href={`/players/${row.playerId}`}
                  className="font-medium text-zinc-900 hover:underline dark:text-zinc-50"
                >
                  {row.fullName}
                </Link>
              </td>
              <td className="py-2.5 text-zinc-500 dark:text-zinc-400">
                {row.primaryPosition ?? "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
