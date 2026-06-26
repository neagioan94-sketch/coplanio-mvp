import type { SupabaseClient } from "@supabase/supabase-js";

export type AttendanceRosterEntry = {
  playerId: string;
  firstName: string;
  lastName: string;
  displayName: string | null;
  squadNumber: number | null;
  existingRecordId: string | null;
  currentStatus: string;
  currentNotes: string;
};

export async function getAttendanceRoster(
  supabase: SupabaseClient,
  sessionId: string,
  organizationId: string,
): Promise<AttendanceRosterEntry[]> {
  const { data: session, error: sessionError } = await supabase
    .from("training_sessions")
    .select("team_id")
    .eq("id", sessionId)
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .single();

  if (sessionError || !session) return [];

  const [membershipsResult, attendanceResult] = await Promise.all([
    supabase
      .from("player_team_memberships")
      .select("squad_number, players(id, first_name, last_name, display_name, status, deleted_at)")
      .eq("team_id", session.team_id)
      .eq("organization_id", organizationId)
      .eq("status", "active"),
    supabase
      .from("attendance_records")
      .select("id, player_id, status, notes")
      .eq("session_id", sessionId)
      .eq("organization_id", organizationId),
  ]);

  if (membershipsResult.error) {
    console.error("[getAttendanceRoster] memberships query failed:", membershipsResult.error.message);
    return [];
  }

  const attendanceMap = new Map(
    (attendanceResult.data ?? []).map((r) => [
      r.player_id,
      { id: r.id, status: r.status, notes: r.notes },
    ]),
  );

  const entries: AttendanceRosterEntry[] = [];

  for (const m of membershipsResult.data ?? []) {
    const player = Array.isArray(m.players)
      ? (m.players[0] as {
          id: string;
          first_name: string;
          last_name: string;
          display_name: string | null;
          status: string;
          deleted_at: string | null;
        } | undefined)
      : (m.players as {
          id: string;
          first_name: string;
          last_name: string;
          display_name: string | null;
          status: string;
          deleted_at: string | null;
        } | null);

    if (!player) continue;
    if (player.deleted_at !== null) continue;
    if (!["active", "inactive"].includes(player.status)) continue;

    const existing = attendanceMap.get(player.id) ?? null;

    entries.push({
      playerId: player.id,
      firstName: player.first_name,
      lastName: player.last_name,
      displayName: player.display_name,
      squadNumber: m.squad_number ?? null,
      existingRecordId: existing?.id ?? null,
      currentStatus: existing?.status ?? "unknown",
      currentNotes: existing?.notes ?? "",
    });
  }

  entries.sort((a, b) => a.lastName.localeCompare(b.lastName));

  return entries;
}
