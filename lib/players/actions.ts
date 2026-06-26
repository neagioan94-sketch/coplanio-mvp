"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/db/supabase-server";
import { requireUser } from "@/lib/auth/get-user";
import { requireRole } from "@/lib/organizations/get-organization";
import { createAuditEvent } from "@/lib/audit/create-audit-event";
import {
  createPlayerSchema,
  updatePlayerSchema,
  playerActionSchema,
  assignPlayerTeamSchema,
  updatePlayerTeamSchema,
  removePlayerTeamSchema,
} from "@/schemas/players";

type ActionState = { error?: string; success?: boolean } | undefined;

// ---------------------------------------------------------------------------
// Create player
// ---------------------------------------------------------------------------

export async function createPlayerAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const organizationId = formData.get("organizationId");
  if (!organizationId || typeof organizationId !== "string") {
    return { error: "Invalid organization" };
  }

  const parsed = createPlayerSchema.safeParse({
    first_name: formData.get("first_name"),
    last_name: formData.get("last_name"),
    display_name: formData.get("display_name") || undefined,
    date_of_birth: formData.get("date_of_birth") || undefined,
    primary_position: formData.get("primary_position") || undefined,
    preferred_foot: formData.get("preferred_foot") || undefined,
    notes: formData.get("notes") || undefined,
    status: "active",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const user = await requireUser();
  const supabase = await createClient();
  if (!supabase) return { error: "Service unavailable" };

  await requireRole(supabase, user.id, organizationId, [
    "organization_admin",
    "head_coach",
  ]);

  const { data: player, error: insertError } = await supabase
    .from("players")
    .insert({
      organization_id: organizationId,
      first_name: parsed.data.first_name,
      last_name: parsed.data.last_name,
      display_name: parsed.data.display_name ?? null,
      date_of_birth: parsed.data.date_of_birth ?? null,
      primary_position: parsed.data.primary_position ?? null,
      preferred_foot: parsed.data.preferred_foot ?? null,
      notes: parsed.data.notes ?? null,
      status: "active",
      created_by: user.id,
    })
    .select("id")
    .single();

  if (insertError || !player) {
    console.error("[createPlayerAction] insert failed:", insertError?.message);
    return { error: "Could not create player. Please try again." };
  }

  await createAuditEvent(supabase, {
    organizationId,
    actorUserId: user.id,
    actionType: "player.created",
    targetType: "player",
    targetId: player.id,
    newValue: {
      first_name: parsed.data.first_name,
      last_name: parsed.data.last_name,
    },
  });

  // Optional team assignment at creation
  const teamIdRaw = formData.get("team_id");
  if (teamIdRaw && typeof teamIdRaw === "string" && teamIdRaw.trim()) {
    const squadRaw = formData.get("squad_number");
    const assignParsed = assignPlayerTeamSchema.safeParse({
      team_id: teamIdRaw,
      squad_number: squadRaw ? Number(squadRaw) : undefined,
      start_date: formData.get("start_date") || undefined,
    });

    if (assignParsed.success) {
      const { data: team } = await supabase
        .from("teams")
        .select("id")
        .eq("id", assignParsed.data.team_id)
        .eq("organization_id", organizationId)
        .in("status", ["active", "inactive"])
        .is("deleted_at", null)
        .single();

      if (team) {
        const { error: membershipError } = await supabase
          .from("player_team_memberships")
          .insert({
            organization_id: organizationId,
            player_id: player.id,
            team_id: assignParsed.data.team_id,
            squad_number: assignParsed.data.squad_number ?? null,
            start_date: assignParsed.data.start_date ?? null,
            status: "active",
          });

        if (!membershipError) {
          await createAuditEvent(supabase, {
            organizationId,
            actorUserId: user.id,
            actionType: "player_team.assigned",
            targetType: "player",
            targetId: player.id,
            newValue: { team_id: assignParsed.data.team_id },
          });
        }
      }
    }
  }

  redirect(`/players/${player.id}`);
}

// ---------------------------------------------------------------------------
// Update player
// ---------------------------------------------------------------------------

export async function updatePlayerAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const organizationId = formData.get("organizationId");
  const playerId = formData.get("playerId");
  if (
    !organizationId ||
    typeof organizationId !== "string" ||
    !playerId ||
    typeof playerId !== "string"
  ) {
    return { error: "Invalid request" };
  }

  const parsed = updatePlayerSchema.safeParse({
    first_name: formData.get("first_name"),
    last_name: formData.get("last_name"),
    display_name: formData.get("display_name") || undefined,
    date_of_birth: formData.get("date_of_birth") || undefined,
    primary_position: formData.get("primary_position") || undefined,
    preferred_foot: formData.get("preferred_foot") || undefined,
    notes: formData.get("notes") || undefined,
    status: formData.get("status") || "active",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const user = await requireUser();
  const supabase = await createClient();
  if (!supabase) return { error: "Service unavailable" };

  await requireRole(supabase, user.id, organizationId, [
    "organization_admin",
    "head_coach",
  ]);

  const { data: current, error: fetchError } = await supabase
    .from("players")
    .select("id, first_name, last_name, display_name, date_of_birth, primary_position, preferred_foot, notes, status")
    .eq("id", playerId)
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .single();

  if (fetchError || !current) {
    return { error: "Player not found" };
  }

  const { error: updateError } = await supabase
    .from("players")
    .update({
      first_name: parsed.data.first_name,
      last_name: parsed.data.last_name,
      display_name: parsed.data.display_name ?? null,
      date_of_birth: parsed.data.date_of_birth ?? null,
      primary_position: parsed.data.primary_position ?? null,
      preferred_foot: parsed.data.preferred_foot ?? null,
      notes: parsed.data.notes ?? null,
      status: parsed.data.status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", playerId)
    .eq("organization_id", organizationId);

  if (updateError) {
    console.error("[updatePlayerAction] update failed:", updateError.message);
    return { error: "Could not update player. Please try again." };
  }

  await createAuditEvent(supabase, {
    organizationId,
    actorUserId: user.id,
    actionType: "player.updated",
    targetType: "player",
    targetId: playerId,
    previousValue: {
      first_name: current.first_name,
      last_name: current.last_name,
      status: current.status,
    },
    newValue: {
      first_name: parsed.data.first_name,
      last_name: parsed.data.last_name,
      status: parsed.data.status,
    },
  });

  return { success: true };
}

// ---------------------------------------------------------------------------
// Archive player
// ---------------------------------------------------------------------------

export async function archivePlayerAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const organizationId = formData.get("organizationId");
  if (!organizationId || typeof organizationId !== "string") {
    return { error: "Invalid organization" };
  }

  const parsed = playerActionSchema.safeParse({ playerId: formData.get("playerId") });
  if (!parsed.success) return { error: "Invalid input" };

  const user = await requireUser();
  const supabase = await createClient();
  if (!supabase) return { error: "Service unavailable" };

  await requireRole(supabase, user.id, organizationId, [
    "organization_admin",
    "head_coach",
  ]);

  const { data: player, error: fetchError } = await supabase
    .from("players")
    .select("id, status")
    .eq("id", parsed.data.playerId)
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .single();

  if (fetchError || !player) return { error: "Player not found" };
  if (player.status === "archived") return { error: "Player is already archived" };

  const { error: updateError } = await supabase
    .from("players")
    .update({ status: "archived", deleted_at: new Date().toISOString() })
    .eq("id", parsed.data.playerId)
    .eq("organization_id", organizationId);

  if (updateError) {
    console.error("[archivePlayerAction] update failed:", updateError.message);
    return { error: "Could not archive player. Please try again." };
  }

  await createAuditEvent(supabase, {
    organizationId,
    actorUserId: user.id,
    actionType: "player.archived",
    targetType: "player",
    targetId: parsed.data.playerId,
  });

  redirect("/players");
}

// ---------------------------------------------------------------------------
// Assign player to team
// ---------------------------------------------------------------------------

export async function assignPlayerTeamAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const organizationId = formData.get("organizationId");
  const playerId = formData.get("playerId");
  if (
    !organizationId ||
    typeof organizationId !== "string" ||
    !playerId ||
    typeof playerId !== "string"
  ) {
    return { error: "Invalid request" };
  }

  const squadRaw = formData.get("squad_number");
  const parsed = assignPlayerTeamSchema.safeParse({
    team_id: formData.get("team_id"),
    squad_number: squadRaw ? Number(squadRaw) : undefined,
    start_date: formData.get("start_date") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const user = await requireUser();
  const supabase = await createClient();
  if (!supabase) return { error: "Service unavailable" };

  await requireRole(supabase, user.id, organizationId, [
    "organization_admin",
    "head_coach",
  ]);

  const { data: player } = await supabase
    .from("players")
    .select("id, status")
    .eq("id", playerId)
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .single();

  if (!player) return { error: "Player not found" };
  if (player.status === "archived") return { error: "Cannot assign an archived player to a team" };

  const { data: team } = await supabase
    .from("teams")
    .select("id")
    .eq("id", parsed.data.team_id)
    .eq("organization_id", organizationId)
    .in("status", ["active", "inactive"])
    .is("deleted_at", null)
    .single();

  if (!team) return { error: "Team not found or not active in this organization" };

  const { data: existing } = await supabase
    .from("player_team_memberships")
    .select("id")
    .eq("player_id", playerId)
    .eq("team_id", parsed.data.team_id)
    .eq("organization_id", organizationId)
    .eq("status", "active")
    .limit(1)
    .single();

  if (existing) {
    return { error: "Player already has an active assignment to this team" };
  }

  const { error: insertError } = await supabase
    .from("player_team_memberships")
    .insert({
      organization_id: organizationId,
      player_id: playerId,
      team_id: parsed.data.team_id,
      squad_number: parsed.data.squad_number ?? null,
      start_date: parsed.data.start_date ?? null,
      status: "active",
    });

  if (insertError) {
    console.error("[assignPlayerTeamAction] insert failed:", insertError.message);
    return { error: "Could not assign player to team. Please try again." };
  }

  await createAuditEvent(supabase, {
    organizationId,
    actorUserId: user.id,
    actionType: "player_team.assigned",
    targetType: "player",
    targetId: playerId,
    newValue: { team_id: parsed.data.team_id, squad_number: parsed.data.squad_number ?? null },
  });

  return { success: true };
}

// ---------------------------------------------------------------------------
// Update player team membership (TD-1: action exists, no UI in Phase 6)
// ---------------------------------------------------------------------------

export async function updatePlayerTeamAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const organizationId = formData.get("organizationId");
  const playerId = formData.get("playerId");
  if (
    !organizationId ||
    typeof organizationId !== "string" ||
    !playerId ||
    typeof playerId !== "string"
  ) {
    return { error: "Invalid request" };
  }

  const squadRaw = formData.get("squad_number");
  const parsed = updatePlayerTeamSchema.safeParse({
    membership_id: formData.get("membership_id"),
    squad_number: squadRaw ? Number(squadRaw) : undefined,
    end_date: formData.get("end_date") || undefined,
    status: formData.get("status") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const user = await requireUser();
  const supabase = await createClient();
  if (!supabase) return { error: "Service unavailable" };

  await requireRole(supabase, user.id, organizationId, [
    "organization_admin",
    "head_coach",
  ]);

  const { data: membership, error: fetchError } = await supabase
    .from("player_team_memberships")
    .select("id, squad_number, end_date, status")
    .eq("id", parsed.data.membership_id)
    .eq("organization_id", organizationId)
    .eq("player_id", playerId)
    .single();

  if (fetchError || !membership) return { error: "Membership not found" };

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (parsed.data.squad_number !== undefined) updates.squad_number = parsed.data.squad_number;
  if (parsed.data.end_date !== undefined) updates.end_date = parsed.data.end_date;
  if (parsed.data.status !== undefined) updates.status = parsed.data.status;

  const { error: updateError } = await supabase
    .from("player_team_memberships")
    .update(updates)
    .eq("id", parsed.data.membership_id)
    .eq("organization_id", organizationId);

  if (updateError) {
    console.error("[updatePlayerTeamAction] update failed:", updateError.message);
    return { error: "Could not update membership. Please try again." };
  }

  await createAuditEvent(supabase, {
    organizationId,
    actorUserId: user.id,
    actionType: "player_team.updated",
    targetType: "player",
    targetId: playerId,
    previousValue: {
      membership_id: membership.id,
      squad_number: membership.squad_number,
      end_date: membership.end_date,
      status: membership.status,
    },
    newValue: updates,
  });

  return { success: true };
}

// ---------------------------------------------------------------------------
// Remove player from team
// ---------------------------------------------------------------------------

export async function removePlayerTeamAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const organizationId = formData.get("organizationId");
  const playerId = formData.get("playerId");
  if (
    !organizationId ||
    typeof organizationId !== "string" ||
    !playerId ||
    typeof playerId !== "string"
  ) {
    return { error: "Invalid request" };
  }

  const parsed = removePlayerTeamSchema.safeParse({
    membership_id: formData.get("membership_id"),
  });

  if (!parsed.success) return { error: "Invalid input" };

  const user = await requireUser();
  const supabase = await createClient();
  if (!supabase) return { error: "Service unavailable" };

  await requireRole(supabase, user.id, organizationId, [
    "organization_admin",
    "head_coach",
  ]);

  const { data: membership, error: fetchError } = await supabase
    .from("player_team_memberships")
    .select("id, start_date")
    .eq("id", parsed.data.membership_id)
    .eq("organization_id", organizationId)
    .eq("player_id", playerId)
    .eq("status", "active")
    .single();

  if (fetchError || !membership) return { error: "Active membership not found" };

  // TD-6: end_date = MAX(today, start_date) to avoid violating DB constraint
  const today = new Date().toISOString().slice(0, 10);
  const safeEndDate =
    membership.start_date && membership.start_date > today ? membership.start_date : today;

  const { error: updateError } = await supabase
    .from("player_team_memberships")
    .update({ status: "archived", end_date: safeEndDate })
    .eq("id", parsed.data.membership_id)
    .eq("organization_id", organizationId);

  if (updateError) {
    console.error("[removePlayerTeamAction] update failed:", updateError.message);
    return { error: "Could not remove player from team. Please try again." };
  }

  await createAuditEvent(supabase, {
    organizationId,
    actorUserId: user.id,
    actionType: "player_team.removed",
    targetType: "player",
    targetId: playerId,
    previousValue: { membership_id: parsed.data.membership_id },
  });

  return { success: true };
}
