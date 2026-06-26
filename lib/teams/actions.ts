"use server";

import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/db/supabase-server";
import { requireUser } from "@/lib/auth/get-user";
import { requireRole } from "@/lib/organizations/get-organization";
import { createAuditEvent } from "@/lib/audit/create-audit-event";
import {
  createTeamSchema,
  updateTeamSchema,
  teamActionSchema,
  assignStaffSchema,
  updateStaffRoleSchema,
  teamStaffActionSchema,
} from "@/schemas/teams";

type ActionState = { error?: string; success?: boolean } | undefined;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function checkDuplicateTeam(
  supabase: SupabaseClient,
  organizationId: string,
  name: string,
  season: string | undefined,
  excludeTeamId?: string,
): Promise<boolean> {
  let query = supabase
    .from("teams")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .ilike("name", name)
    .in("status", ["active", "inactive"])
    .is("deleted_at", null);

  if (season) {
    query = query.eq("season", season);
  }
  if (excludeTeamId) {
    query = query.neq("id", excludeTeamId);
  }

  const { count } = await query;
  return (count ?? 0) > 0;
}

// ---------------------------------------------------------------------------
// Create team
// ---------------------------------------------------------------------------

export async function createTeamAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const organizationId = formData.get("organizationId");
  if (!organizationId || typeof organizationId !== "string") {
    return { error: "Invalid organization" };
  }

  const parsed = createTeamSchema.safeParse({
    name: formData.get("name"),
    age_group: formData.get("age_group") || undefined,
    season: formData.get("season") || undefined,
    level: formData.get("level") || undefined,
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

  const duplicate = await checkDuplicateTeam(
    supabase,
    organizationId,
    parsed.data.name,
    parsed.data.season,
  );
  if (duplicate) {
    return { error: "A team with this name already exists for this season." };
  }

  const { data: team, error: insertError } = await supabase
    .from("teams")
    .insert({
      organization_id: organizationId,
      name: parsed.data.name,
      age_group: parsed.data.age_group ?? null,
      season: parsed.data.season ?? null,
      level: parsed.data.level ?? null,
      status: "active",
      created_by: user.id,
    })
    .select("id")
    .single();

  if (insertError || !team) {
    console.error("[createTeamAction] insert failed:", insertError?.message);
    return { error: "Could not create team. Please try again." };
  }

  await createAuditEvent(supabase, {
    organizationId,
    actorUserId: user.id,
    actionType: "team.created",
    targetType: "team",
    targetId: team.id,
    newValue: {
      name: parsed.data.name,
      age_group: parsed.data.age_group ?? null,
      season: parsed.data.season ?? null,
      level: parsed.data.level ?? null,
    },
  });

  redirect(`/teams/${team.id}`);
}

// ---------------------------------------------------------------------------
// Update team
// ---------------------------------------------------------------------------

export async function updateTeamAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const organizationId = formData.get("organizationId");
  const teamId = formData.get("teamId");
  if (
    !organizationId ||
    typeof organizationId !== "string" ||
    !teamId ||
    typeof teamId !== "string"
  ) {
    return { error: "Invalid request" };
  }

  const parsed = updateTeamSchema.safeParse({
    name: formData.get("name"),
    age_group: formData.get("age_group") || undefined,
    season: formData.get("season") || undefined,
    level: formData.get("level") || undefined,
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
    .from("teams")
    .select("id, name, age_group, season, level, status")
    .eq("id", teamId)
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .single();

  if (fetchError || !current) {
    return { error: "Team not found" };
  }

  const duplicate = await checkDuplicateTeam(
    supabase,
    organizationId,
    parsed.data.name,
    parsed.data.season,
    teamId,
  );
  if (duplicate) {
    return { error: "A team with this name already exists for this season." };
  }

  const { error: updateError } = await supabase
    .from("teams")
    .update({
      name: parsed.data.name,
      age_group: parsed.data.age_group ?? null,
      season: parsed.data.season ?? null,
      level: parsed.data.level ?? null,
    })
    .eq("id", teamId)
    .eq("organization_id", organizationId);

  if (updateError) {
    console.error("[updateTeamAction] update failed:", updateError.message);
    return { error: "Could not update team. Please try again." };
  }

  await createAuditEvent(supabase, {
    organizationId,
    actorUserId: user.id,
    actionType: "team.updated",
    targetType: "team",
    targetId: teamId,
    previousValue: {
      name: current.name,
      age_group: current.age_group,
      season: current.season,
      level: current.level,
    },
    newValue: {
      name: parsed.data.name,
      age_group: parsed.data.age_group ?? null,
      season: parsed.data.season ?? null,
      level: parsed.data.level ?? null,
    },
  });

  return { success: true };
}

// ---------------------------------------------------------------------------
// Archive team
// ---------------------------------------------------------------------------

export async function archiveTeamAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const organizationId = formData.get("organizationId");
  if (!organizationId || typeof organizationId !== "string") {
    return { error: "Invalid organization" };
  }

  const parsed = teamActionSchema.safeParse({ teamId: formData.get("teamId") });
  if (!parsed.success) return { error: "Invalid input" };

  const user = await requireUser();

  const supabase = await createClient();
  if (!supabase) return { error: "Service unavailable" };

  await requireRole(supabase, user.id, organizationId, [
    "organization_admin",
    "head_coach",
  ]);

  const { data: team, error: fetchError } = await supabase
    .from("teams")
    .select("id, status")
    .eq("id", parsed.data.teamId)
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .single();

  if (fetchError || !team) return { error: "Team not found" };
  if (team.status === "archived") return { error: "Team is already archived" };

  const { error: updateError } = await supabase
    .from("teams")
    .update({ status: "archived", deleted_at: new Date().toISOString() })
    .eq("id", parsed.data.teamId)
    .eq("organization_id", organizationId);

  if (updateError) {
    console.error("[archiveTeamAction] update failed:", updateError.message);
    return { error: "Could not archive team. Please try again." };
  }

  await createAuditEvent(supabase, {
    organizationId,
    actorUserId: user.id,
    actionType: "team.archived",
    targetType: "team",
    targetId: parsed.data.teamId,
  });

  redirect("/teams");
}

// ---------------------------------------------------------------------------
// Assign team staff
// ---------------------------------------------------------------------------

export async function assignTeamStaffAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const organizationId = formData.get("organizationId");
  const teamId = formData.get("teamId");
  if (
    !organizationId ||
    typeof organizationId !== "string" ||
    !teamId ||
    typeof teamId !== "string"
  ) {
    return { error: "Invalid request" };
  }

  const parsed = assignStaffSchema.safeParse({
    userId: formData.get("userId"),
    staffRole: formData.get("staffRole"),
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

  const { data: member } = await supabase
    .from("memberships")
    .select("id")
    .eq("user_id", parsed.data.userId)
    .eq("organization_id", organizationId)
    .eq("status", "active")
    .limit(1)
    .single();

  if (!member) {
    return { error: "User is not an active member of this organization." };
  }

  const { data: existing } = await supabase
    .from("team_staff")
    .select("id, status")
    .eq("team_id", teamId)
    .eq("user_id", parsed.data.userId)
    .limit(1)
    .single();

  if (existing) {
    if (existing.status === "active") {
      return { error: "This member is already assigned to the team." };
    }
    const { error: updateError } = await supabase
      .from("team_staff")
      .update({ status: "active", staff_role: parsed.data.staffRole })
      .eq("id", existing.id);

    if (updateError) {
      console.error("[assignTeamStaffAction] update failed:", updateError.message);
      return { error: "Could not assign staff. Please try again." };
    }
  } else {
    const { error: insertError } = await supabase.from("team_staff").insert({
      organization_id: organizationId,
      team_id: teamId,
      user_id: parsed.data.userId,
      staff_role: parsed.data.staffRole,
      status: "active",
    });

    if (insertError) {
      console.error("[assignTeamStaffAction] insert failed:", insertError.message);
      return { error: "Could not assign staff. Please try again." };
    }
  }

  await createAuditEvent(supabase, {
    organizationId,
    actorUserId: user.id,
    actionType: "team_staff.assigned",
    targetType: "team",
    targetId: teamId,
    newValue: { userId: parsed.data.userId, staffRole: parsed.data.staffRole },
  });

  return { success: true };
}

// ---------------------------------------------------------------------------
// Update team staff role
// ---------------------------------------------------------------------------

export async function updateTeamStaffRoleAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const organizationId = formData.get("organizationId");
  const teamId = formData.get("teamId");
  if (
    !organizationId ||
    typeof organizationId !== "string" ||
    !teamId ||
    typeof teamId !== "string"
  ) {
    return { error: "Invalid request" };
  }

  const parsed = updateStaffRoleSchema.safeParse({
    teamStaffId: formData.get("teamStaffId"),
    staffRole: formData.get("staffRole"),
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

  const { data: staffRow, error: fetchError } = await supabase
    .from("team_staff")
    .select("id, staff_role")
    .eq("id", parsed.data.teamStaffId)
    .eq("team_id", teamId)
    .eq("organization_id", organizationId)
    .eq("status", "active")
    .single();

  if (fetchError || !staffRow) return { error: "Staff assignment not found" };

  const { error: updateError } = await supabase
    .from("team_staff")
    .update({ staff_role: parsed.data.staffRole })
    .eq("id", parsed.data.teamStaffId);

  if (updateError) {
    console.error("[updateTeamStaffRoleAction] update failed:", updateError.message);
    return { error: "Could not update role. Please try again." };
  }

  await createAuditEvent(supabase, {
    organizationId,
    actorUserId: user.id,
    actionType: "team_staff.updated",
    targetType: "team",
    targetId: teamId,
    previousValue: { teamStaffId: staffRow.id, staffRole: staffRow.staff_role },
    newValue: { teamStaffId: staffRow.id, staffRole: parsed.data.staffRole },
  });

  return { success: true };
}

// ---------------------------------------------------------------------------
// Remove team staff
// ---------------------------------------------------------------------------

export async function removeTeamStaffAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const organizationId = formData.get("organizationId");
  const teamId = formData.get("teamId");
  if (
    !organizationId ||
    typeof organizationId !== "string" ||
    !teamId ||
    typeof teamId !== "string"
  ) {
    return { error: "Invalid request" };
  }

  const parsed = teamStaffActionSchema.safeParse({
    teamStaffId: formData.get("teamStaffId"),
  });

  if (!parsed.success) return { error: "Invalid input" };

  const user = await requireUser();

  const supabase = await createClient();
  if (!supabase) return { error: "Service unavailable" };

  await requireRole(supabase, user.id, organizationId, [
    "organization_admin",
    "head_coach",
  ]);

  const { data: staffRow, error: fetchError } = await supabase
    .from("team_staff")
    .select("id")
    .eq("id", parsed.data.teamStaffId)
    .eq("team_id", teamId)
    .eq("organization_id", organizationId)
    .eq("status", "active")
    .single();

  if (fetchError || !staffRow) return { error: "Staff assignment not found" };

  const { error: updateError } = await supabase
    .from("team_staff")
    .update({ status: "removed" })
    .eq("id", parsed.data.teamStaffId);

  if (updateError) {
    console.error("[removeTeamStaffAction] update failed:", updateError.message);
    return { error: "Could not remove staff. Please try again." };
  }

  await createAuditEvent(supabase, {
    organizationId,
    actorUserId: user.id,
    actionType: "team_staff.removed",
    targetType: "team",
    targetId: teamId,
    previousValue: { teamStaffId: parsed.data.teamStaffId },
  });

  return { success: true };
}
