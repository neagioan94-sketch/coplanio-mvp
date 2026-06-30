"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/db/supabase-server";
import { requireUser } from "@/lib/auth/get-user";
import { requireRole } from "@/lib/organizations/get-organization";
import { createAuditEvent } from "@/lib/audit/create-audit-event";
import {
  createExerciseSchema,
  updateExerciseSchema,
  exerciseActionSchema,
} from "@/schemas/exercises";

type ActionState = { error?: string; success?: boolean } | undefined;

function parseTags(raw: FormDataEntryValue | null): string[] {
  if (!raw || typeof raw !== "string") return [];
  return raw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

// ---------------------------------------------------------------------------
// Create exercise
// ---------------------------------------------------------------------------

export async function createExerciseAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const organizationId = formData.get("organizationId");
  if (!organizationId || typeof organizationId !== "string") {
    return { error: "Invalid organization" };
  }

  const durationRaw = formData.get("duration_minutes");
  const minRaw = formData.get("player_count_min");
  const maxRaw = formData.get("player_count_max");

  const parsed = createExerciseSchema.safeParse({
    name: formData.get("name"),
    objective: formData.get("objective"),
    category: formData.get("category") || undefined,
    description: formData.get("description") || undefined,
    coaching_points: formData.get("coaching_points") || undefined,
    duration_minutes: durationRaw ? Number(durationRaw) : undefined,
    player_count_min: minRaw ? Number(minRaw) : undefined,
    player_count_max: maxRaw ? Number(maxRaw) : undefined,
    difficulty: formData.get("difficulty") || undefined,
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

  const tags = parseTags(formData.get("tags"));

  const { data: exercise, error: insertError } = await supabase
    .from("exercises")
    .insert({
      organization_id: organizationId,
      name: parsed.data.name,
      objective: parsed.data.objective,
      category: parsed.data.category ?? null,
      description: parsed.data.description ?? null,
      coaching_points: parsed.data.coaching_points ?? null,
      duration_minutes: parsed.data.duration_minutes ?? null,
      player_count_min: parsed.data.player_count_min ?? null,
      player_count_max: parsed.data.player_count_max ?? null,
      difficulty: parsed.data.difficulty ?? null,
      tags,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (insertError || !exercise) {
    console.error("[createExerciseAction] insert failed:", insertError?.message);
    return { error: "Could not create exercise. Please try again." };
  }

  await createAuditEvent(supabase, {
    organizationId,
    actorUserId: user.id,
    actionType: "exercise.created",
    targetType: "exercise",
    targetId: exercise.id,
    newValue: { name: parsed.data.name, objective: parsed.data.objective },
  });

  redirect(`/exercises/${exercise.id}`);
}

// ---------------------------------------------------------------------------
// Update exercise
// ---------------------------------------------------------------------------

export async function updateExerciseAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const organizationId = formData.get("organizationId");
  const exerciseId = formData.get("exerciseId");
  if (
    !organizationId ||
    typeof organizationId !== "string" ||
    !exerciseId ||
    typeof exerciseId !== "string"
  ) {
    return { error: "Invalid request" };
  }

  const durationRaw = formData.get("duration_minutes");
  const minRaw = formData.get("player_count_min");
  const maxRaw = formData.get("player_count_max");

  const parsed = updateExerciseSchema.safeParse({
    name: formData.get("name"),
    objective: formData.get("objective"),
    category: formData.get("category") || undefined,
    description: formData.get("description") || undefined,
    coaching_points: formData.get("coaching_points") || undefined,
    duration_minutes: durationRaw ? Number(durationRaw) : undefined,
    player_count_min: minRaw ? Number(minRaw) : undefined,
    player_count_max: maxRaw ? Number(maxRaw) : undefined,
    difficulty: formData.get("difficulty") || undefined,
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
    .from("exercises")
    .select("id, name, objective")
    .eq("id", exerciseId)
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .single();

  if (fetchError || !current) {
    return { error: "Exercise not found" };
  }

  const tags = parseTags(formData.get("tags"));

  const { error: updateError } = await supabase
    .from("exercises")
    .update({
      name: parsed.data.name,
      objective: parsed.data.objective,
      category: parsed.data.category ?? null,
      description: parsed.data.description ?? null,
      coaching_points: parsed.data.coaching_points ?? null,
      duration_minutes: parsed.data.duration_minutes ?? null,
      player_count_min: parsed.data.player_count_min ?? null,
      player_count_max: parsed.data.player_count_max ?? null,
      difficulty: parsed.data.difficulty ?? null,
      tags,
      updated_at: new Date().toISOString(),
    })
    .eq("id", exerciseId)
    .eq("organization_id", organizationId);

  if (updateError) {
    console.error("[updateExerciseAction] update failed:", updateError.message);
    return { error: "Could not update exercise. Please try again." };
  }

  await createAuditEvent(supabase, {
    organizationId,
    actorUserId: user.id,
    actionType: "exercise.updated",
    targetType: "exercise",
    targetId: exerciseId,
    previousValue: { name: current.name, objective: current.objective },
    newValue: { name: parsed.data.name, objective: parsed.data.objective },
  });

  revalidatePath(`/exercises/${exerciseId}`);
  revalidatePath(`/exercises/${exerciseId}/edit`);
  revalidatePath("/exercises");

  return { success: true };
}

// ---------------------------------------------------------------------------
// Archive exercise
// ---------------------------------------------------------------------------

export async function archiveExerciseAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const organizationId = formData.get("organizationId");
  if (!organizationId || typeof organizationId !== "string") {
    return { error: "Invalid organization" };
  }

  const parsed = exerciseActionSchema.safeParse({
    exerciseId: formData.get("exerciseId"),
  });
  if (!parsed.success) return { error: "Invalid input" };

  const user = await requireUser();
  const supabase = await createClient();
  if (!supabase) return { error: "Service unavailable" };

  await requireRole(supabase, user.id, organizationId, [
    "organization_admin",
    "head_coach",
  ]);

  const { data: exercise, error: fetchError } = await supabase
    .from("exercises")
    .select("id")
    .eq("id", parsed.data.exerciseId)
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .single();

  if (fetchError || !exercise) return { error: "Exercise not found" };

  const { error: updateError } = await supabase
    .from("exercises")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", parsed.data.exerciseId)
    .eq("organization_id", organizationId);

  if (updateError) {
    console.error("[archiveExerciseAction] update failed:", updateError.message);
    return { error: "Could not archive exercise. Please try again." };
  }

  await createAuditEvent(supabase, {
    organizationId,
    actorUserId: user.id,
    actionType: "exercise.archived",
    targetType: "exercise",
    targetId: parsed.data.exerciseId,
  });

  redirect("/exercises");
}
