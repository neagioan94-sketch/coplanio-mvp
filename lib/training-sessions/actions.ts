"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/db/supabase-server";
import { requireUser } from "@/lib/auth/get-user";
import { requireRole } from "@/lib/organizations/get-organization";
import { createAuditEvent } from "@/lib/audit/create-audit-event";
import {
  createSessionSchema,
  updateSessionSchema,
  sessionActionSchema,
  addSessionExerciseSchema,
  updateSessionExerciseSchema,
  reorderSessionExerciseSchema,
  removeSessionExerciseSchema,
} from "@/schemas/training-sessions";

type ActionState = { error?: string; success?: boolean } | undefined;

const MANAGE_ROLES = ["organization_admin", "head_coach", "coach"] as const;

// ---------------------------------------------------------------------------
// Create training session
// ---------------------------------------------------------------------------

export async function createSessionAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const organizationId = formData.get("organizationId");
  if (!organizationId || typeof organizationId !== "string") {
    return { error: "Invalid organization" };
  }

  const durationRaw = formData.get("duration_minutes");

  const parsed = createSessionSchema.safeParse({
    team_id: formData.get("team_id"),
    title: formData.get("title"),
    session_date: formData.get("session_date"),
    start_time: formData.get("start_time") || undefined,
    duration_minutes: durationRaw ? Number(durationRaw) : undefined,
    objective: formData.get("objective") || undefined,
    location: formData.get("location") || undefined,
    status: formData.get("status") || "planned",
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
    .in("status", ["active", "inactive"])
    .single();

  if (teamError || !team) {
    return { error: "Team not found or not accessible" };
  }

  const { data: session, error: insertError } = await supabase
    .from("training_sessions")
    .insert({
      organization_id: organizationId,
      team_id: parsed.data.team_id,
      title: parsed.data.title,
      session_date: parsed.data.session_date,
      start_time: parsed.data.start_time ?? null,
      duration_minutes: parsed.data.duration_minutes ?? null,
      objective: parsed.data.objective ?? null,
      location: parsed.data.location ?? null,
      status: parsed.data.status,
      notes: parsed.data.notes ?? null,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (insertError || !session) {
    console.error("[createSessionAction] insert failed:", insertError?.message);
    return { error: "Could not create session. Please try again." };
  }

  await createAuditEvent(supabase, {
    organizationId,
    actorUserId: user.id,
    actionType: "training_session.created",
    targetType: "training_session",
    targetId: session.id,
    newValue: { title: parsed.data.title, session_date: parsed.data.session_date },
  });

  redirect(`/training-sessions/${session.id}`);
}

// ---------------------------------------------------------------------------
// Update training session
// ---------------------------------------------------------------------------

export async function updateSessionAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const organizationId = formData.get("organizationId");
  const sessionId = formData.get("sessionId");
  if (
    !organizationId ||
    typeof organizationId !== "string" ||
    !sessionId ||
    typeof sessionId !== "string"
  ) {
    return { error: "Invalid request" };
  }

  const durationRaw = formData.get("duration_minutes");

  const parsed = updateSessionSchema.safeParse({
    title: formData.get("title"),
    session_date: formData.get("session_date"),
    start_time: formData.get("start_time") || undefined,
    duration_minutes: durationRaw ? Number(durationRaw) : undefined,
    objective: formData.get("objective") || undefined,
    location: formData.get("location") || undefined,
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
    .from("training_sessions")
    .select("id, title, session_date")
    .eq("id", sessionId)
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .single();

  if (fetchError || !current) {
    return { error: "Session not found" };
  }

  const { error: updateError } = await supabase
    .from("training_sessions")
    .update({
      title: parsed.data.title,
      session_date: parsed.data.session_date,
      start_time: parsed.data.start_time ?? null,
      duration_minutes: parsed.data.duration_minutes ?? null,
      objective: parsed.data.objective ?? null,
      location: parsed.data.location ?? null,
      status: parsed.data.status,
      notes: parsed.data.notes ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", sessionId)
    .eq("organization_id", organizationId);

  if (updateError) {
    console.error("[updateSessionAction] update failed:", updateError.message);
    return { error: "Could not update session. Please try again." };
  }

  await createAuditEvent(supabase, {
    organizationId,
    actorUserId: user.id,
    actionType: "training_session.updated",
    targetType: "training_session",
    targetId: sessionId,
    previousValue: { title: current.title, session_date: current.session_date },
    newValue: { title: parsed.data.title, session_date: parsed.data.session_date },
  });

  revalidatePath(`/training-sessions/${sessionId}`);
  revalidatePath(`/training-sessions/${sessionId}/edit`);
  revalidatePath("/training-sessions");

  return { success: true };
}

// ---------------------------------------------------------------------------
// Archive training session
// ---------------------------------------------------------------------------

export async function archiveSessionAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const organizationId = formData.get("organizationId");
  if (!organizationId || typeof organizationId !== "string") {
    return { error: "Invalid organization" };
  }

  const parsed = sessionActionSchema.safeParse({
    sessionId: formData.get("sessionId"),
  });
  if (!parsed.success) return { error: "Invalid input" };

  const user = await requireUser();
  const supabase = await createClient();
  if (!supabase) return { error: "Service unavailable" };

  await requireRole(supabase, user.id, organizationId, [...MANAGE_ROLES]);

  const { data: session, error: fetchError } = await supabase
    .from("training_sessions")
    .select("id")
    .eq("id", parsed.data.sessionId)
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .single();

  if (fetchError || !session) return { error: "Session not found" };

  const { error: updateError } = await supabase
    .from("training_sessions")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", parsed.data.sessionId)
    .eq("organization_id", organizationId);

  if (updateError) {
    console.error("[archiveSessionAction] update failed:", updateError.message);
    return { error: "Could not archive session. Please try again." };
  }

  await createAuditEvent(supabase, {
    organizationId,
    actorUserId: user.id,
    actionType: "training_session.archived",
    targetType: "training_session",
    targetId: parsed.data.sessionId,
  });

  redirect("/training-sessions");
}

// ---------------------------------------------------------------------------
// Add exercise to session
// ---------------------------------------------------------------------------

export async function addSessionExerciseAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const organizationId = formData.get("organizationId");
  const sessionId = formData.get("sessionId");
  if (
    !organizationId ||
    typeof organizationId !== "string" ||
    !sessionId ||
    typeof sessionId !== "string"
  ) {
    return { error: "Invalid request" };
  }

  const durationRaw = formData.get("planned_duration_minutes");

  const parsed = addSessionExerciseSchema.safeParse({
    exercise_id: formData.get("exercise_id"),
    planned_duration_minutes: durationRaw ? Number(durationRaw) : undefined,
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const user = await requireUser();
  const supabase = await createClient();
  if (!supabase) return { error: "Service unavailable" };

  await requireRole(supabase, user.id, organizationId, [...MANAGE_ROLES]);

  const { data: session, error: sessionError } = await supabase
    .from("training_sessions")
    .select("id")
    .eq("id", sessionId)
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .single();

  if (sessionError || !session) return { error: "Session not found" };

  const { data: exercise, error: exerciseError } = await supabase
    .from("exercises")
    .select("id")
    .eq("id", parsed.data.exercise_id)
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .single();

  if (exerciseError || !exercise) {
    return { error: "Exercise not found or has been archived" };
  }

  // Compute sort_order: COALESCE(MAX(existing), -1) + 1 — first item gets 0
  const { data: rows } = await supabase
    .from("session_exercises")
    .select("sort_order")
    .eq("session_id", sessionId)
    .order("sort_order", { ascending: false })
    .limit(1);

  const sortOrder = (rows?.[0]?.sort_order ?? -1) + 1;

  const { data: inserted, error: insertError } = await supabase
    .from("session_exercises")
    .insert({
      organization_id: organizationId,
      session_id: sessionId,
      exercise_id: parsed.data.exercise_id,
      sort_order: sortOrder,
      planned_duration_minutes: parsed.data.planned_duration_minutes ?? null,
      notes: parsed.data.notes ?? null,
    })
    .select("id")
    .single();

  if (insertError || !inserted) {
    console.error("[addSessionExerciseAction] insert failed:", insertError?.message);
    return { error: "Could not add exercise. Please try again." };
  }

  await createAuditEvent(supabase, {
    organizationId,
    actorUserId: user.id,
    actionType: "session_exercise.added",
    targetType: "session_exercise",
    targetId: inserted.id,
    newValue: { session_id: sessionId, exercise_id: parsed.data.exercise_id, sort_order: sortOrder },
  });

  revalidatePath(`/training-sessions/${sessionId}`);

  return { success: true };
}

// ---------------------------------------------------------------------------
// Update session exercise (planned duration + notes)
// ---------------------------------------------------------------------------

export async function updateSessionExerciseAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const organizationId = formData.get("organizationId");
  const sessionId = formData.get("sessionId");
  if (
    !organizationId ||
    typeof organizationId !== "string" ||
    !sessionId ||
    typeof sessionId !== "string"
  ) {
    return { error: "Invalid request" };
  }

  const durationRaw = formData.get("planned_duration_minutes");

  const parsed = updateSessionExerciseSchema.safeParse({
    sessionExerciseId: formData.get("sessionExerciseId"),
    planned_duration_minutes: durationRaw ? Number(durationRaw) : undefined,
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
    .from("session_exercises")
    .select("id, planned_duration_minutes, notes")
    .eq("id", parsed.data.sessionExerciseId)
    .eq("session_id", sessionId)
    .eq("organization_id", organizationId)
    .single();

  if (fetchError || !current) return { error: "Exercise entry not found" };

  const { error: updateError } = await supabase
    .from("session_exercises")
    .update({
      planned_duration_minutes: parsed.data.planned_duration_minutes ?? null,
      notes: parsed.data.notes ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.sessionExerciseId)
    .eq("organization_id", organizationId);

  if (updateError) {
    console.error("[updateSessionExerciseAction] update failed:", updateError.message);
    return { error: "Could not update exercise entry. Please try again." };
  }

  await createAuditEvent(supabase, {
    organizationId,
    actorUserId: user.id,
    actionType: "session_exercise.updated",
    targetType: "session_exercise",
    targetId: parsed.data.sessionExerciseId,
    previousValue: { planned_duration_minutes: current.planned_duration_minutes, notes: current.notes },
    newValue: { planned_duration_minutes: parsed.data.planned_duration_minutes ?? null, notes: parsed.data.notes ?? null },
  });

  revalidatePath(`/training-sessions/${sessionId}`);

  return { success: true };
}

// ---------------------------------------------------------------------------
// Reorder session exercise (up/down swap)
// ---------------------------------------------------------------------------

export async function reorderSessionExerciseAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const organizationId = formData.get("organizationId");
  const sessionId = formData.get("sessionId");
  if (
    !organizationId ||
    typeof organizationId !== "string" ||
    !sessionId ||
    typeof sessionId !== "string"
  ) {
    return { error: "Invalid request" };
  }

  const parsed = reorderSessionExerciseSchema.safeParse({
    sessionExerciseId: formData.get("sessionExerciseId"),
    direction: formData.get("direction"),
  });

  if (!parsed.success) return { error: "Invalid input" };

  const user = await requireUser();
  const supabase = await createClient();
  if (!supabase) return { error: "Service unavailable" };

  await requireRole(supabase, user.id, organizationId, [...MANAGE_ROLES]);

  const { data: current, error: currentError } = await supabase
    .from("session_exercises")
    .select("id, sort_order")
    .eq("id", parsed.data.sessionExerciseId)
    .eq("session_id", sessionId)
    .eq("organization_id", organizationId)
    .single();

  if (currentError || !current) return { error: "Exercise entry not found" };

  const { direction } = parsed.data;

  let adjacentQuery = supabase
    .from("session_exercises")
    .select("id, sort_order")
    .eq("session_id", sessionId)
    .eq("organization_id", organizationId)
    .limit(1);

  if (direction === "up") {
    adjacentQuery = adjacentQuery
      .lt("sort_order", current.sort_order)
      .order("sort_order", { ascending: false });
  } else {
    adjacentQuery = adjacentQuery
      .gt("sort_order", current.sort_order)
      .order("sort_order", { ascending: true });
  }

  const { data: adjacent, error: adjacentError } = await adjacentQuery.single();

  if (adjacentError || !adjacent) {
    return { error: "Already at boundary" };
  }

  const [err1, err2] = await Promise.all([
    supabase
      .from("session_exercises")
      .update({ sort_order: adjacent.sort_order })
      .eq("id", current.id)
      .eq("organization_id", organizationId)
      .then(({ error }) => error),
    supabase
      .from("session_exercises")
      .update({ sort_order: current.sort_order })
      .eq("id", adjacent.id)
      .eq("organization_id", organizationId)
      .then(({ error }) => error),
  ]);

  if (err1 || err2) {
    console.error("[reorderSessionExerciseAction] swap failed:", err1?.message ?? err2?.message);
    return { error: "Could not reorder exercises. Please try again." };
  }

  await createAuditEvent(supabase, {
    organizationId,
    actorUserId: user.id,
    actionType: "session_exercise.reordered",
    targetType: "session_exercise",
    targetId: current.id,
    newValue: { direction, new_sort_order: adjacent.sort_order },
  });

  revalidatePath(`/training-sessions/${sessionId}`);

  return { success: true };
}

// ---------------------------------------------------------------------------
// Remove exercise from session
// ---------------------------------------------------------------------------

export async function removeSessionExerciseAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const organizationId = formData.get("organizationId");
  const sessionId = formData.get("sessionId");
  if (
    !organizationId ||
    typeof organizationId !== "string" ||
    !sessionId ||
    typeof sessionId !== "string"
  ) {
    return { error: "Invalid request" };
  }

  const parsed = removeSessionExerciseSchema.safeParse({
    sessionExerciseId: formData.get("sessionExerciseId"),
  });
  if (!parsed.success) return { error: "Invalid input" };

  const user = await requireUser();
  const supabase = await createClient();
  if (!supabase) return { error: "Service unavailable" };

  await requireRole(supabase, user.id, organizationId, [...MANAGE_ROLES]);

  const { data: entry, error: fetchError } = await supabase
    .from("session_exercises")
    .select("id")
    .eq("id", parsed.data.sessionExerciseId)
    .eq("session_id", sessionId)
    .eq("organization_id", organizationId)
    .single();

  if (fetchError || !entry) return { error: "Exercise entry not found" };

  const { error: deleteError } = await supabase
    .from("session_exercises")
    .delete()
    .eq("id", parsed.data.sessionExerciseId)
    .eq("organization_id", organizationId);

  if (deleteError) {
    console.error("[removeSessionExerciseAction] delete failed:", deleteError.message);
    return { error: "Could not remove exercise. Please try again." };
  }

  await createAuditEvent(supabase, {
    organizationId,
    actorUserId: user.id,
    actionType: "session_exercise.removed",
    targetType: "session_exercise",
    targetId: parsed.data.sessionExerciseId,
    previousValue: { session_id: sessionId },
  });

  revalidatePath(`/training-sessions/${sessionId}`);

  return { success: true };
}
