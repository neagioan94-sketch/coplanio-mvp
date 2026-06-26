"use server";

import { createClient } from "@/lib/db/supabase-server";
import { requireUser } from "@/lib/auth/get-user";
import { requireRole, requireActiveOrganization } from "@/lib/organizations/get-organization";
import { createAuditEvent } from "@/lib/audit/create-audit-event";
import { attendanceRecordSchema } from "@/schemas/attendance";

type ActionState = { error?: string; success?: boolean } | undefined;

const MANAGE_ROLES = ["organization_admin", "head_coach", "coach"] as const;

export async function saveAttendanceAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const sessionId = formData.get("sessionId");
  if (!sessionId || typeof sessionId !== "string") {
    return { error: "Invalid session" };
  }

  const playerIds = formData.getAll("player_id") as string[];
  const statuses = formData.getAll("status") as string[];
  const notes = formData.getAll("notes") as string[];

  if (playerIds.length !== statuses.length) {
    return { error: "Malformed attendance payload" };
  }

  const user = await requireUser();
  const supabase = await createClient();
  if (!supabase) return { error: "Service unavailable" };

  const activeOrg = await requireActiveOrganization(supabase, user.id);
  const { organizationId } = activeOrg;

  await requireRole(supabase, user.id, organizationId, [...MANAGE_ROLES]);

  const { data: session, error: sessionError } = await supabase
    .from("training_sessions")
    .select("id, team_id")
    .eq("id", sessionId)
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .single();

  if (sessionError || !session) {
    return { error: "Session not found" };
  }

  const { data: memberships, error: membershipError } = await supabase
    .from("player_team_memberships")
    .select("players(id)")
    .eq("team_id", session.team_id)
    .eq("organization_id", organizationId)
    .eq("status", "active");

  if (membershipError) {
    return { error: "Could not load team roster" };
  }

  const validPlayerIds = new Set<string>();
  for (const m of memberships ?? []) {
    const player = Array.isArray(m.players)
      ? (m.players[0] as { id: string } | undefined)
      : (m.players as { id: string } | null);
    if (player?.id) validPlayerIds.add(player.id);
  }

  const rosterSize = validPlayerIds.size;

  if (rosterSize === 0) {
    return { success: true };
  }

  if (playerIds.length === 0) {
    return { error: "No attendance data received" };
  }

  const recordMap = new Map<string, { player_id: string; status: string; notes: string | null }>();

  for (let i = 0; i < playerIds.length; i++) {
    const rawRecord = {
      player_id: playerIds[i],
      status: statuses[i],
      notes: notes[i] || undefined,
    };

    if (!validPlayerIds.has(rawRecord.player_id ?? "")) {
      return { error: "Invalid player in payload" };
    }

    const parsed = attendanceRecordSchema.safeParse(rawRecord);
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Invalid attendance data" };
    }

    recordMap.set(parsed.data.player_id, {
      player_id: parsed.data.player_id,
      status: parsed.data.status,
      notes: parsed.data.notes ?? null,
    });
  }

  const now = new Date().toISOString();
  const upsertPayload = Array.from(recordMap.values()).map((r) => ({
    organization_id: organizationId,
    session_id: sessionId,
    player_id: r.player_id,
    status: r.status,
    notes: r.notes,
    recorded_by: user.id,
    recorded_at: now,
  }));

  const { error: upsertError } = await supabase
    .from("attendance_records")
    .upsert(upsertPayload, { onConflict: "session_id,player_id" });

  if (upsertError) {
    console.error("[saveAttendanceAction] upsert failed:", upsertError.message);
    return { error: "Could not save attendance. Please try again." };
  }

  await createAuditEvent(supabase, {
    organizationId,
    actorUserId: user.id,
    actionType: "attendance.bulk_updated",
    targetType: "training_session",
    targetId: sessionId,
    newValue: { count: upsertPayload.length, session_id: sessionId },
  });

  return { success: true };
}
