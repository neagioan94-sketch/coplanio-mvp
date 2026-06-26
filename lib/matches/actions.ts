"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/db/supabase-server";
import { requireUser } from "@/lib/auth/get-user";
import { requireRole } from "@/lib/organizations/get-organization";
import { createAuditEvent } from "@/lib/audit/create-audit-event";
import {
  createMatchSchema,
  updateMatchSchema,
  matchActionSchema,
  HOME_AWAY_VALUES,
} from "@/schemas/matches";

type ActionState = { error?: string; success?: boolean } | undefined;

const MANAGE_ROLES = ["organization_admin", "head_coach", "coach"] as const;

// ---------------------------------------------------------------------------
// Create match
// ---------------------------------------------------------------------------

export async function createMatchAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const organizationId = formData.get("organizationId");
  if (!organizationId || typeof organizationId !== "string") {
    return { error: "Invalid organization" };
  }

  const goalsForRaw = formData.get("goals_for");
  const goalsAgainstRaw = formData.get("goals_against");
  const homeAwayRaw = formData.get("home_away");

  const parsed = createMatchSchema.safeParse({
    team_id: formData.get("team_id"),
    match_date: formData.get("match_date"),
    opponent: formData.get("opponent"),
    location: formData.get("location") || undefined,
    competition: formData.get("competition") || undefined,
    home_away: HOME_AWAY_VALUES.includes(homeAwayRaw as (typeof HOME_AWAY_VALUES)[number])
      ? homeAwayRaw
      : undefined,
    goals_for: goalsForRaw ? Number(goalsForRaw) : undefined,
    goals_against: goalsAgainstRaw ? Number(goalsAgainstRaw) : undefined,
    status: formData.get("status") || "scheduled",
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const user = await requireUser();
  const supabase = await createClient();
  if (!supabase) return { error: "Service unavailable" };

  await requireRole(supabase, user.id, organizationId, [...MANAGE_ROLES]);

  const { data: team, error: teamError } = await supabase
    .from("teams")
    .select("id")
    .eq("id", parsed.data.team_id)
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .single();

  if (teamError || !team) {
    return { error: "Team not found or not accessible" };
  }

  const { data: match, error: insertError } = await supabase
    .from("matches")
    .insert({
      organization_id: organizationId,
      team_id: parsed.data.team_id,
      match_date: parsed.data.match_date,
      opponent: parsed.data.opponent,
      location: parsed.data.location ?? null,
      competition: parsed.data.competition ?? null,
      home_away: parsed.data.home_away ?? null,
      goals_for: parsed.data.goals_for ?? null,
      goals_against: parsed.data.goals_against ?? null,
      status: parsed.data.status,
      notes: parsed.data.notes ?? null,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (insertError || !match) {
    console.error("[createMatchAction] insert failed:", insertError?.message);
    return { error: "Could not create match. Please try again." };
  }

  await createAuditEvent(supabase, {
    organizationId,
    actorUserId: user.id,
    actionType: "match.created",
    targetType: "match",
    targetId: match.id,
    newValue: { opponent: parsed.data.opponent, match_date: parsed.data.match_date },
  });

  redirect(`/matches/${match.id}`);
}

// ---------------------------------------------------------------------------
// Update match
// ---------------------------------------------------------------------------

export async function updateMatchAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const organizationId = formData.get("organizationId");
  const matchId = formData.get("matchId");
  if (
    !organizationId ||
    typeof organizationId !== "string" ||
    !matchId ||
    typeof matchId !== "string"
  ) {
    return { error: "Invalid request" };
  }

  const goalsForRaw = formData.get("goals_for");
  const goalsAgainstRaw = formData.get("goals_against");
  const homeAwayRaw = formData.get("home_away");

  const parsed = updateMatchSchema.safeParse({
    match_date: formData.get("match_date"),
    opponent: formData.get("opponent"),
    location: formData.get("location") || undefined,
    competition: formData.get("competition") || undefined,
    home_away: HOME_AWAY_VALUES.includes(homeAwayRaw as (typeof HOME_AWAY_VALUES)[number])
      ? homeAwayRaw
      : undefined,
    goals_for: goalsForRaw ? Number(goalsForRaw) : undefined,
    goals_against: goalsAgainstRaw ? Number(goalsAgainstRaw) : undefined,
    status: formData.get("status"),
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const user = await requireUser();
  const supabase = await createClient();
  if (!supabase) return { error: "Service unavailable" };

  await requireRole(supabase, user.id, organizationId, [...MANAGE_ROLES]);

  const { data: current, error: fetchError } = await supabase
    .from("matches")
    .select("id, opponent, match_date")
    .eq("id", matchId)
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .single();

  if (fetchError || !current) {
    return { error: "Match not found" };
  }

  const { error: updateError } = await supabase
    .from("matches")
    .update({
      match_date: parsed.data.match_date,
      opponent: parsed.data.opponent,
      location: parsed.data.location ?? null,
      competition: parsed.data.competition ?? null,
      home_away: parsed.data.home_away ?? null,
      goals_for: parsed.data.goals_for ?? null,
      goals_against: parsed.data.goals_against ?? null,
      status: parsed.data.status,
      notes: parsed.data.notes ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", matchId)
    .eq("organization_id", organizationId);

  if (updateError) {
    console.error("[updateMatchAction] update failed:", updateError.message);
    return { error: "Could not update match. Please try again." };
  }

  await createAuditEvent(supabase, {
    organizationId,
    actorUserId: user.id,
    actionType: "match.updated",
    targetType: "match",
    targetId: matchId,
    previousValue: { opponent: current.opponent, match_date: current.match_date },
    newValue: { opponent: parsed.data.opponent, match_date: parsed.data.match_date },
  });

  return { success: true };
}

// ---------------------------------------------------------------------------
// Archive match
// ---------------------------------------------------------------------------

export async function archiveMatchAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const organizationId = formData.get("organizationId");
  if (!organizationId || typeof organizationId !== "string") {
    return { error: "Invalid organization" };
  }

  const parsed = matchActionSchema.safeParse({
    matchId: formData.get("matchId"),
  });
  if (!parsed.success) return { error: "Invalid input" };

  const user = await requireUser();
  const supabase = await createClient();
  if (!supabase) return { error: "Service unavailable" };

  await requireRole(supabase, user.id, organizationId, [...MANAGE_ROLES]);

  const { data: match, error: fetchError } = await supabase
    .from("matches")
    .select("id")
    .eq("id", parsed.data.matchId)
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .single();

  if (fetchError || !match) return { error: "Match not found" };

  const { error: updateError } = await supabase
    .from("matches")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", parsed.data.matchId)
    .eq("organization_id", organizationId);

  if (updateError) {
    console.error("[archiveMatchAction] update failed:", updateError.message);
    return { error: "Could not archive match. Please try again." };
  }

  await createAuditEvent(supabase, {
    organizationId,
    actorUserId: user.id,
    actionType: "match.archived",
    targetType: "match",
    targetId: parsed.data.matchId,
  });

  redirect("/matches");
}
