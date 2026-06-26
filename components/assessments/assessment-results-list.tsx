import type { AssessmentResultRow } from "@/lib/assessments/get-assessments";

interface AssessmentResultsListProps {
  results: AssessmentResultRow[];
}

export function AssessmentResultsList({ results }: AssessmentResultsListProps) {
  if (results.length === 0) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">No results recorded yet.</p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-xs text-zinc-500 dark:text-zinc-400">
            <th className="pb-2 pr-4 font-medium">Date</th>
            <th className="pb-2 pr-4 font-medium">Player</th>
            <th className="pb-2 pr-4 font-medium">Assessment</th>
            <th className="pb-2 pr-4 font-medium">Value</th>
            <th className="pb-2 font-medium">Notes</th>
          </tr>
        </thead>
        <tbody>
          {results.map((r) => (
            <tr key={r.id} className="border-b last:border-0">
              <td className="py-2 pr-4 text-zinc-500 dark:text-zinc-400">{r.assessedAt}</td>
              <td className="py-2 pr-4 font-medium text-zinc-900 dark:text-zinc-50">
                {r.playerName}
              </td>
              <td className="py-2 pr-4 text-zinc-700 dark:text-zinc-300">
                {r.assessmentTypeName}
              </td>
              <td className="py-2 pr-4 text-zinc-900 dark:text-zinc-50">
                {r.value}
                {r.unit && (
                  <span className="ml-1 text-xs text-zinc-400 dark:text-zinc-500">{r.unit}</span>
                )}
              </td>
              <td className="py-2 text-zinc-500 dark:text-zinc-400">{r.notes ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
