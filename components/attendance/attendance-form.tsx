"use client";

import { useActionState } from "react";
import type { AttendanceRosterEntry } from "@/lib/attendance/get-attendance";
import { saveAttendanceAction } from "@/lib/attendance/actions";
import { AttendanceStatusSelect } from "./attendance-status-select";

interface AttendanceFormProps {
  roster: AttendanceRosterEntry[];
  sessionId: string;
}

export function AttendanceForm({ roster, sessionId }: AttendanceFormProps) {
  const [state, formAction, isPending] = useActionState(saveAttendanceAction, undefined);

  if (roster.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No active players are assigned to this team yet.
      </p>
    );
  }

  return (
    <form action={formAction}>
      <input type="hidden" name="sessionId" value={sessionId} />

      {state?.error && (
        <p className="mb-4 text-sm text-destructive">{state.error}</p>
      )}
      {state?.success && (
        <p className="mb-4 text-sm text-green-600">Attendance saved.</p>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="pb-2 pr-4 font-medium">#</th>
              <th className="pb-2 pr-4 font-medium">Player</th>
              <th className="pb-2 pr-4 font-medium">Status</th>
              <th className="pb-2 font-medium">Notes</th>
            </tr>
          </thead>
          <tbody>
            {roster.map((entry) => (
              <tr key={entry.playerId} className="border-b last:border-0">
                <td className="py-2 pr-4 text-muted-foreground">
                  {entry.squadNumber ?? "—"}
                </td>
                <td className="py-2 pr-4">
                  <input type="hidden" name="player_id" value={entry.playerId} />
                  {entry.displayName ??
                    `${entry.firstName} ${entry.lastName}`}
                </td>
                <td className="py-2 pr-4">
                  <AttendanceStatusSelect
                    name="status"
                    defaultValue={entry.currentStatus}
                  />
                </td>
                <td className="py-2">
                  <input
                    type="text"
                    name="notes"
                    defaultValue={entry.currentNotes}
                    placeholder="Optional note"
                    className="w-full rounded border border-input bg-background px-2 py-1 text-sm"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4">
        <button
          type="submit"
          disabled={isPending}
          className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {isPending ? "Saving…" : "Save attendance"}
        </button>
      </div>
    </form>
  );
}
