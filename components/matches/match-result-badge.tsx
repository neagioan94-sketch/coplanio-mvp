interface MatchResultBadgeProps {
  goalsFor: number | null;
  goalsAgainst: number | null;
  status: string;
}

export function MatchResultBadge({ goalsFor, goalsAgainst, status }: MatchResultBadgeProps) {
  if (status !== "completed" || goalsFor === null || goalsAgainst === null) {
    return null;
  }

  let resultClass = "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300";
  let label = "D";

  if (goalsFor > goalsAgainst) {
    resultClass = "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300";
    label = "W";
  } else if (goalsFor < goalsAgainst) {
    resultClass = "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300";
    label = "L";
  }

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${resultClass}`}>
      <span>{label}</span>
      <span>{goalsFor}–{goalsAgainst}</span>
    </span>
  );
}
