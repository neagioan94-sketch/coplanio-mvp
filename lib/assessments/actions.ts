"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/db/supabase-server";
import { requireUser } from "@/lib/auth/get-user";
import { requireRole, requireActiveOrganization } from "@/lib/organizations/get-organization";
import { createAuditEvent } from "@/lib/audit/create-audit-event";
import {
  createAssessmentTypeSchema,
  updateAssessmentTypeSchema,
  assessmentTypeActionSchema,
  createAssessmentResultSchema,
} from "@/schemas/assessments";

type ActionState = { error?: string; success?: boolean } | undefined;

const MANAGE_ROLES = ["organization_admin", "head_coach", "coach"] as const;

// ---------------------------------------------------------------------------
// Create assessment type
// ---------------------------------------------------------------------------

export async function createAssessmentTypeAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const organizationId = formData.get("organizationId");
  if (!organizationId || typeof organizationId !== "string") {
    return { error: "Invalid organization" };
  }

  const higherRaw = formData.get("higher_is_better");
  const higherIsBetter =
    higherRaw === "true" ? true : higherRaw === "false" ? false : null;

  const parsed = createAssessmentTypeSchema.safeParse({
    name: formData.get("name"),
    category: formData.get("category") || undefined,
    unit: formData.get("unit") || undefined,
    description: formData.get("description") || undefined,
    higher_is_better: higherIsBetter,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const user = await requireUser();
  const supabase = await createClient();
  if (!supabase) return { error: "Service unavailable" };

  await requireRole(supabase, user.id, organizationId, [...MANAGE_ROLES]);

  const { data: assessmentType, error: insertError } = await supabase
    .from("assessment_types")
    .insert({
      organization_id: organizationId,
      name: parsed.data.name,
      category: parsed.data.category ?? null,
      unit: parsed.data.unit ?? null,
      description: parsed.data.description ?? null,
      higher_is_better: parsed.data.higher_is_better ?? null,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (insertError || !assessmentType) {
    console.error("[createAssessmentTypeAction] insert failed:", insertError?.message);
    return { error: "Could not create assessment type. Please try again." };
  }

  await createAuditEvent(supabase, {
    organizationId,
    actorUserId: user.id,
    actionType: "assessment_type.created",
    targetType: "assessment_type",
    targetId: assessmentType.id,
    newValue: { name: parsed.data.name },
  });

  redirect("/assessments");
}

// ---------------------------------------------------------------------------
// Update assessment type
// ---------------------------------------------------------------------------

export async function updateAssessmentTypeAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const organizationId = formData.get("organizationId");
  const assessmentTypeId = formData.get("assessmentTypeId");
  if (
    !organizationId ||
    typeof organizationId !== "string" ||
    !assessmentTypeId ||
    typeof assessmentTypeId !== "string"
  ) {
    return { error: "Invalid request" };
  }

  const higherRaw = formData.get("higher_is_better");
  const higherIsBetter =
    higherRaw === "true" ? true : higherRaw === "false" ? false : null;

  const parsed = updateAssessmentTypeSchema.safeParse({
    name: formData.get("name"),
    category: formData.get("category") || undefined,
    unit: formData.get("unit") || undefined,
    description: formData.get("description") || undefined,
    higher_is_better: higherIsBetter,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const user = await requireUser();
  const supabase = await createClient();
  if (!supabase) return { error: "Service unavailable" };

  await requireRole(supabase, user.id, organizationId, [...MANAGE_ROLES]);

  const { data: current, error: fetchError } = await supabase
    .from("assessment_types")
    .select("id, name")
    .eq("id", assessmentTypeId)
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .single();

  if (fetchError || !current) {
    return { error: "Assessment type not found" };
  }

  const { error: updateError } = await supabase
    .from("assessment_types")
    .update({
      name: parsed.data.name,
      category: parsed.data.category ?? null,
      unit: parsed.data.unit ?? null,
      description: parsed.data.description ?? null,
      higher_is_better: parsed.data.higher_is_better ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", assessmentTypeId)
    .eq("organization_id", organizationId);

  if (updateError) {
    console.error("[updateAssessmentTypeAction] update failed:", updateError.message);
    return { error: "Could not update assessment type. Please try again." };
  }

  await createAuditEvent(supabase, {
    organizationId,
    actorUserId: user.id,
    actionType: "assessment_type.updated",
    targetType: "assessment_type",
    targetId: assessmentTypeId,
    previousValue: { name: current.name },
    newValue: { name: parsed.data.name },
  });

  revalidatePath("/assessments");
  revalidatePath(`/assessments/types/${assessmentTypeId}/edit`);

  return { success: true };
}

// ---------------------------------------------------------------------------
// Archive assessment type
// ---------------------------------------------------------------------------

export async function archiveAssessmentTypeAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const organizationId = formData.get("organizationId");
  if (!organizationId || typeof organizationId !== "string") {
    return { error: "Invalid organization" };
  }

  const parsed = assessmentTypeActionSchema.safeParse({
    assessmentTypeId: formData.get("assessmentTypeId"),
  });
  if (!parsed.success) return { error: "Invalid input" };

  const user = await requireUser();
  const supabase = await createClient();
  if (!supabase) return { error: "Service unavailable" };

  await requireRole(supabase, user.id, organizationId, [...MANAGE_ROLES]);

  const { data: assessmentType, error: fetchError } = await supabase
    .from("assessment_types")
    .select("id")
    .eq("id", parsed.data.assessmentTypeId)
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .single();

  if (fetchError || !assessmentType) return { error: "Assessment type not found" };

  const { error: updateError } = await supabase
    .from("assessment_types")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", parsed.data.assessmentTypeId)
    .eq("organization_id", organizationId);

  if (updateError) {
    console.error("[archiveAssessmentTypeAction] update failed:", updateError.message);
    return { error: "Could not archive assessment type. Please try again." };
  }

  await createAuditEvent(supabase, {
    organizationId,
    actorUserId: user.id,
    actionType: "assessment_type.archived",
    targetType: "assessment_type",
    targetId: parsed.data.assessmentTypeId,
  });

  redirect("/assessments");
}

// ---------------------------------------------------------------------------
// Create assessment result
// ---------------------------------------------------------------------------

export async function createAssessmentResultAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const supabase = await createClient();
  if (!supabase) return { error: "Service unavailable" };

  const activeOrg = await requireActiveOrganization(supabase, user.id);
  const { organizationId } = activeOrg;

  await requireRole(supabase, user.id, organizationId, [...MANAGE_ROLES]);

  const teamIdRaw = formData.get("team_id");

  const parsed = createAssessmentResultSchema.safeParse({
    assessment_type_id: formData.get("assessment_type_id"),
    player_id: formData.get("player_id"),
    team_id: teamIdRaw && typeof teamIdRaw === "string" && teamIdRaw.trim() ? teamIdRaw.trim() : undefined,
    assessed_at: formData.get("assessed_at"),
    value: formData.get("value"),
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  // Validate assessment type — org-scoped, not archived
  const { data: assessmentType, error: typeError } = await supabase
    .from("assessment_types")
    .select("id, unit")
    .eq("id", parsed.data.assessment_type_id)
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .single();

  if (typeError || !assessmentType) {
    return { error: "Assessment type not found or has been archived" };
  }

  // Validate player — org-scoped, not deleted
  const { data: player, error: playerError } = await supabase
    .from("players")
    .select("id")
    .eq("id", parsed.data.player_id)
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .single();

  if (playerError || !player) {
    return { error: "Player not found or not accessible" };
  }

  // Validate team if provided — org-scoped
  if (parsed.data.team_id) {
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
  }

  // Historical unit preservation: copy unit from assessment type
  const resultUnit = assessmentType.unit ?? null;

  const { data: result, error: insertError } = await supabase
    .from("assessment_results")
    .insert({
      organization_id: organizationId,
      assessment_type_id: parsed.data.assessment_type_id,
      player_id: parsed.data.player_id,
      team_id: parsed.data.team_id ?? null,
      assessed_at: parsed.data.assessed_at,
      value: parsed.data.value,
      unit: resultUnit,
      notes: parsed.data.notes ?? null,
      recorded_by: user.id,
    })
    .select("id")
    .single();

  if (insertError || !result) {
    console.error("[createAssessmentResultAction] insert failed:", insertError?.message);
    return { error: "Could not record result. Please try again." };
  }

  await createAuditEvent(supabase, {
    organizationId,
    actorUserId: user.id,
    actionType: "assessment_result.created",
    targetType: "assessment_result",
    targetId: result.id,
    newValue: {
      assessment_type_id: parsed.data.assessment_type_id,
      player_id: parsed.data.player_id,
      value: parsed.data.value,
      unit: resultUnit,
    },
  });

  redirect("/assessments");
}
