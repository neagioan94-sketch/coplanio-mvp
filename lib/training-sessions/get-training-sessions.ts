import type { SupabaseClient } from "@supabase/supabase-js";

export type TrainingSessionRow = {
  id: string;
  organizationId: string;
  teamId: string;
  teamName: string;
  title: string;
  sessionDate: string;
  startTime: string | null;
  durationMinutes: number | null;
  objective: string | null;
  location: string | null;
  status: string;
  notes: string | null;
  createdAt: string;
  isArchived: boolean;
};

export type SessionExerciseRow = {
  id: string;
  sessionId: string;
  exerciseId: string | null;
  sortOrder: number;
  exerciseName: string;
  exerciseCategory: string | null;
  exerciseDifficulty: string | null;
  exerciseDurationMinutes: number | null;
  plannedDurationMinutes: number | null;
  notes: string | null;
  createdAt: string;
};

interface GetTrainingSessionsOptions {
  teamId?: string;
  status?: string;
}

export async function getTrainingSessions(
  supabase: SupabaseClient,
  organizationId: string,
  opts: GetTrainingSessionsOptions = {},
): Promise<TrainingSessionRow[]> {
  let query = supabase
    .from("training_sessions")
    .select("id, organization_id, team_id, title, session_date, start_time, duration_minutes, objective, location, status, notes, created_at, deleted_at, teams(name)")
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .order("session_date", { ascending: false });

  if (opts.teamId && opts.teamId.trim()) {
    query = query.eq("team_id", opts.teamId.trim());
  }

  if (opts.status && opts.status.trim()) {
    query = query.eq("status", opts.status.trim());
  }

  const { data, error } = await query;

  if (error) {
    console.error("[getTrainingSessions] query failed:", error.message);
    return [];
  }

  return (data ?? []).map((s) => {
    const team = Array.isArray(s.teams)
      ? (s.teams[0] as { name: string } | undefined)
      : (s.teams as { name: string } | null);

    return {
      id: s.id,
      organizationId: s.organization_id,
      teamId: s.team_id,
      teamName: team?.name ?? "",
      title: s.title,
      sessionDate: s.session_date,
      startTime: s.start_time,
      durationMinutes: s.duration_minutes,
      objective: s.objective,
      location: s.location,
      status: s.status,
      notes: s.notes,
      createdAt: s.created_at,
      isArchived: s.deleted_at !== null,
    };
  });
}

export async function getTrainingSession(
  supabase: SupabaseClient,
  sessionId: string,
  organizationId: string,
): Promise<TrainingSessionRow | null> {
  const { data, error } = await supabase
    .from("training_sessions")
    .select("id, organization_id, team_id, title, session_date, start_time, duration_minutes, objective, location, status, notes, created_at, deleted_at, teams(name)")
    .eq("id", sessionId)
    .eq("organization_id", organizationId)
    .single();

  if (error || !data) return null;

  const team = Array.isArray(data.teams)
    ? (data.teams[0] as { name: string } | undefined)
    : (data.teams as { name: string } | null);

  return {
    id: data.id,
    organizationId: data.organization_id,
    teamId: data.team_id,
    teamName: team?.name ?? "",
    title: data.title,
    sessionDate: data.session_date,
    startTime: data.start_time,
    durationMinutes: data.duration_minutes,
    objective: data.objective,
    location: data.location,
    status: data.status,
    notes: data.notes,
    createdAt: data.created_at,
    isArchived: data.deleted_at !== null,
  };
}

export async function getSessionExercises(
  supabase: SupabaseClient,
  sessionId: string,
  organizationId: string,
): Promise<SessionExerciseRow[]> {
  const { data, error } = await supabase
    .from("session_exercises")
    .select("id, session_id, exercise_id, sort_order, planned_duration_minutes, notes, created_at, exercises(name, category, difficulty, duration_minutes)")
    .eq("session_id", sessionId)
    .eq("organization_id", organizationId)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("[getSessionExercises] query failed:", error.message);
    return [];
  }

  return (data ?? []).map((se) => {
    const exercise = Array.isArray(se.exercises)
      ? (se.exercises[0] as { name: string; category: string | null; difficulty: string | null; duration_minutes: number | null } | undefined)
      : (se.exercises as { name: string; category: string | null; difficulty: string | null; duration_minutes: number | null } | null);

    return {
      id: se.id,
      sessionId: se.session_id,
      exerciseId: se.exercise_id,
      sortOrder: se.sort_order,
      exerciseName: exercise?.name ?? "Unknown exercise",
      exerciseCategory: exercise?.category ?? null,
      exerciseDifficulty: exercise?.difficulty ?? null,
      exerciseDurationMinutes: exercise?.duration_minutes ?? null,
      plannedDurationMinutes: se.planned_duration_minutes,
      notes: se.notes,
      createdAt: se.created_at,
    };
  });
}
