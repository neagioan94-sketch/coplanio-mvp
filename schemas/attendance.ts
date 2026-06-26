import { z } from "zod";

export const ATTENDANCE_STATUSES = [
  "present",
  "absent",
  "late",
  "limited",
  "excused",
  "unknown",
] as const;

export const attendanceStatusSchema = z.enum(ATTENDANCE_STATUSES);

export const attendanceRecordSchema = z.object({
  player_id: z.string().uuid("Invalid player"),
  status: attendanceStatusSchema,
  notes: z.string().trim().optional(),
});

export const bulkSaveAttendanceSchema = z.object({
  sessionId: z.string().uuid("Invalid session"),
  records: z.array(attendanceRecordSchema),
});
