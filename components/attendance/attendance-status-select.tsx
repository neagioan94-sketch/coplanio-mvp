import { ATTENDANCE_STATUSES } from "@/schemas/attendance";

const STATUS_LABELS: Record<string, string> = {
  present: "Present",
  absent: "Absent",
  late: "Late",
  limited: "Limited",
  excused: "Excused",
  unknown: "Unknown",
};

interface AttendanceStatusSelectProps {
  name: string;
  defaultValue: string;
}

export function AttendanceStatusSelect({ name, defaultValue }: AttendanceStatusSelectProps) {
  return (
    <select
      name={name}
      defaultValue={defaultValue}
      className="rounded border border-input bg-background px-2 py-1 text-sm"
    >
      {ATTENDANCE_STATUSES.map((s) => (
        <option key={s} value={s}>
          {STATUS_LABELS[s]}
        </option>
      ))}
    </select>
  );
}
