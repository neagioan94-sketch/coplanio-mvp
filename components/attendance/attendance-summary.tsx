import Link from "next/link";
import type { AttendanceRosterEntry } from "@/lib/attendance/get-attendance";

interface AttendanceSummaryProps {
  roster: AttendanceRosterEntry[];
  sessionId: string;
}

export function AttendanceSummary({ roster, sessionId }: AttendanceSummaryProps) {
  if (roster.length === 0) return null;

  const counts: Record<string, number> = {};
  for (const entry of roster) {
    counts[entry.currentStatus] = (counts[entry.currentStatus] ?? 0) + 1;
  }

  const ORDER = ["present", "absent", "late", "limited", "excused", "unknown"] as const;
  const LABELS: Record<string, string> = {
    present: "Present",
    absent: "Absent",
    late: "Late",
    limited: "Limited",
    excused: "Excused",
    unknown: "Unknown",
  };

  return (
    <div className="rounded border p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Attendance</h3>
        <Link
          href={`/training-sessions/${sessionId}/attendance`}
          className="text-sm text-primary hover:underline"
        >
          View / Edit →
        </Link>
      </div>
      <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
        {ORDER.filter((s) => counts[s]).map((s) => (
          <span key={s}>
            {LABELS[s]}: <strong className="text-foreground">{counts[s]}</strong>
          </span>
        ))}
      </div>
    </div>
  );
}
