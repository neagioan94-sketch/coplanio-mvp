import Link from "next/link";
import type { ReportRow } from "@/lib/reports/get-reports";

const REPORT_TYPE_LABELS: Record<string, string> = {
  player_summary: "Player Summary",
  team_summary: "Team Summary",
  session_summary: "Session Summary",
  match_summary: "Match Summary",
  assessment_summary: "Assessment Summary",
};

const SOURCE_ENTITY_LABELS: Record<string, string> = {
  player: "Player",
  team: "Team",
  training_session: "Session",
  match: "Match",
  assessment: "Assessment",
};

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    generated:
      "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    draft:
      "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
    archived:
      "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-zinc-200 text-zinc-500 dark:bg-zinc-700 dark:text-zinc-400",
  };
  return (
    <span className={styles[status] ?? styles.draft}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

interface ReportsListProps {
  reports: ReportRow[];
  canManage: boolean;
}

export default function ReportsList({ reports }: ReportsListProps) {
  if (reports.length === 0) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        No reports yet. Create your first report.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-200 dark:border-zinc-800">
            <th className="pb-2 text-left font-medium text-zinc-500 dark:text-zinc-400">Title</th>
            <th className="pb-2 text-left font-medium text-zinc-500 dark:text-zinc-400">Type</th>
            <th className="pb-2 text-left font-medium text-zinc-500 dark:text-zinc-400">Source</th>
            <th className="pb-2 text-left font-medium text-zinc-500 dark:text-zinc-400">Status</th>
            <th className="pb-2 text-left font-medium text-zinc-500 dark:text-zinc-400">Date</th>
          </tr>
        </thead>
        <tbody>
          {reports.map((report) => (
            <tr
              key={report.id}
              className="border-b border-zinc-100 dark:border-zinc-800/50 last:border-0"
            >
              <td className="py-3 pr-4">
                <Link
                  href={`/reports/${report.id}`}
                  className="font-medium text-zinc-900 hover:text-zinc-600 dark:text-zinc-50 dark:hover:text-zinc-300"
                >
                  {report.title}
                </Link>
              </td>
              <td className="py-3 pr-4 text-zinc-600 dark:text-zinc-400">
                {REPORT_TYPE_LABELS[report.reportType] ?? report.reportType}
              </td>
              <td className="py-3 pr-4 text-zinc-600 dark:text-zinc-400">
                {report.sourceEntityType
                  ? (SOURCE_ENTITY_LABELS[report.sourceEntityType] ?? report.sourceEntityType)
                  : "—"}
              </td>
              <td className="py-3 pr-4">
                <StatusBadge status={report.status} />
              </td>
              <td className="py-3 text-zinc-500 dark:text-zinc-400">
                {new Date(report.createdAt).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
