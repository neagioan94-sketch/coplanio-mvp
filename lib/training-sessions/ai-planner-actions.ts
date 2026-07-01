"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/db/supabase-server";
import { requireUser } from "@/lib/auth/get-user";
import { requireRole } from "@/lib/organizations/get-organization";
import { createAuditEvent } from "@/lib/audit/create-audit-event";
import { getTeam } from "@/lib/teams/get-teams";
import { getExercises } from "@/lib/exercises/get-exercises";
import { generateTrainingPlanDraft } from "@/lib/ai-training-planner/generate-plan";
import {
  generatePlanInputSchema,
  confirmPlanSchema,
  type LlmDraft,
} from "@/schemas/ai-training-planner";

type ActionState = { error?: string; success?: boolean } | undefined;

type GenerateActionState =
  | { error: string }
  | { success: true; draft: LlmDraft; teamId: string }
  | undefined;

const MANAGE_ROLES = ["organization_admin", "head_coach", "coach"] as const;

// ---------------------------------------------------------------------------
// Generate AI draft (read-only — writes nothing to training_sessions/session_exercises)
// ---------------------------------------------------------------------------

export async function generateTrainingPlanAction(
  _prev: GenerateActionState,
  formData: FormData,
): Promise<GenerateActionState> {
  const organizationId = formData.get("organizationId");
  if (!organizationId || typeof organizationId !== "string") {
    return { error: "Invalid organization" };
  }

  const targetDurationRaw = formData.get("target_duration_minutes");
  const maxExerciseCountRaw = formData.get("max_exercise_count");

  const parsed = generatePlanInputSchema.safeParse({
    team_id: formData.get("team_id"),
    focus: formData.get("focus"),
    target_duration_minutes: targetDurationRaw ? Number(targetDurationRaw) : undefined,
    max_exercise_count: maxExerciseCountRaw ? Number(maxExerciseCountRaw) : undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const user = await requireUser();
  const supabase = await createClient();
  if (!supabase) return { error: "Service unavailable" };

  await requireRole(supabase, user.id, organizationId, [...MANAGE_ROLES]);

  const team = await getTeam(supabase, parsed.data.team_id, organizationId);
  if (!team) return { error: "Team not found or not accessible" };

  const exercises = await getExercises(supabase, organizationId);
  if (exercises.length === 0) {
    return {
      error: "Your organization has no exercises yet. Add exercises to your library before generating an AI plan.",
    };
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return { error: "Service unavailable" };
  }

  let draft: LlmDraft;
  try {
    draft = await generateTrainingPlanDraft({
      team,
      focus: parsed.data.focus,
      targetDurationMinutes: parsed.data.target_duration_minutes,
      maxExerciseCount: parsed.data.max_exercise_count,
      exercises,
    });
  } catch (err) {
    console.error("[generateTrainingPlanAction] LLM call failed:", err);
    return { error: "Could not generate a plan right now. Please try again." };
  }

  // Defense in depth: re-check every returned exercise_id against the real,
  // org-scoped exercise list, even though the JSON schema enum already constrains it.
  const allowedIds = new Set(exercises.map((e) => e.id));
  const filteredSections = draft.sections.map((section) => ({
    ...section,
    items: section.items.filter((item) => allowedIds.has(item.exercise_id)),
  }));
  const safeDraft: LlmDraft = { ...draft, sections: filteredSections };

  const exerciseCount = safeDraft.sections.reduce((sum, s) => sum + s.items.length, 0);

  await createAuditEvent(supabase, {
    organizationId,
    actorUserId: user.id,
    actionType: "ai.training_plan.generated",
    targetType: "team",
    targetId: parsed.data.team_id,
    newValue: {
      team_id: parsed.data.team_id,
      focus_summary: parsed.data.focus.slice(0, 200),
      target_duration_minutes: parsed.data.target_duration_minutes ?? null,
      exercise_count: exerciseCount,
    },
  });

  return { success: true, draft: safeDraft, teamId: parsed.data.team_id };
}

// ---------------------------------------------------------------------------
// Confirm AI draft — the only path that actually writes to the database
// ---------------------------------------------------------------------------

export async function confirmTrainingPlanAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const organizationId = formData.get("organizationId");
  if (!organizationId || typeof organizationId !== "string") {
    return { error: "Invalid organization" };
  }

  const durationRaw = formData.get("duration_minutes");
  const draftJsonRaw = formData.get("draftJson");

  let exercisesRaw: unknown = [];
  if (typeof draftJsonRaw === "string" && draftJsonRaw.trim()) {
    try {
      exercisesRaw = JSON.parse(draftJsonRaw);
    } catch {
      return { error: "Invalid draft data" };
    }
  }

  const parsed = confirmPlanSchema.safeParse({
    team_id: formData.get("team_id"),
    title: formData.get("title"),
    session_date: formData.get("session_date"),
    start_time: formData.get("start_time") || undefined,
    duration_minutes: durationRaw ? Number(durationRaw) : undefined,
    objective: formData.get("objective") || undefined,
    location: formData.get("location") || undefined,
    notes: formData.get("notes") || undefined,
    exercises: exercisesRaw,
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

  // Defense in depth: re-validate every submitted exercise_id actually belongs
  // to this organization and isn't archived, even though it came from a
  // server-generated draft — the draft round-trips through client state and a
  // hidden form field between generate and confirm.
  const submittedIds = parsed.data.exercises.map((e) => e.exercise_id);
  let validExerciseIds = new Set<string>();
  if (submittedIds.length > 0) {
    const { data: validExercises } = await supabase
      .from("exercises")
      .select("id")
      .eq("organization_id", organizationId)
      .in("id", submittedIds)
      .is("deleted_at", null);
    validExerciseIds = new Set((validExercises ?? []).map((e) => e.id));
  }
  const confirmedExercises = parsed.data.exercises.filter((e) =>
    validExerciseIds.has(e.exercise_id),
  );

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
      status: "planned",
      notes: parsed.data.notes ?? null,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (insertError || !session) {
    console.error("[confirmTrainingPlanAction] insert failed:", insertError?.message);
    return { error: "Could not create session. Please try again." };
  }

  await createAuditEvent(supabase, {
    organizationId,
    actorUserId: user.id,
    actionType: "training_session.created",
    targetType: "training_session",
    targetId: session.id,
    newValue: {
      title: parsed.data.title,
      session_date: parsed.data.session_date,
      source: "ai_planner",
    },
  });

  if (confirmedExercises.length > 0) {
    const rows = confirmedExercises.map((e, index) => ({
      organization_id: organizationId,
      session_id: session.id,
      exercise_id: e.exercise_id,
      sort_order: index,
      planned_duration_minutes: e.planned_duration_minutes ?? null,
      notes: e.notes ?? null,
    }));

    const { data: inserted, error: exercisesError } = await supabase
      .from("session_exercises")
      .insert(rows)
      .select("id, exercise_id, sort_order");

    if (exercisesError) {
      console.error(
        "[confirmTrainingPlanAction] session_exercises insert failed:",
        exercisesError.message,
      );
    } else {
      for (const row of inserted ?? []) {
        await createAuditEvent(supabase, {
          organizationId,
          actorUserId: user.id,
          actionType: "session_exercise.added",
          targetType: "session_exercise",
          targetId: row.id,
          newValue: {
            session_id: session.id,
            exercise_id: row.exercise_id,
            sort_order: row.sort_order,
            source: "ai_planner",
          },
        });
      }
    }
  }

  redirect(`/training-sessions/${session.id}`);
}
