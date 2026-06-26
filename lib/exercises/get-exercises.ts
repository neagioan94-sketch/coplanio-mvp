import type { SupabaseClient } from "@supabase/supabase-js";

export type ExerciseRow = {
  id: string;
  organizationId: string;
  name: string;
  objective: string;
  category: string | null;
  description: string | null;
  coachingPoints: string | null;
  durationMinutes: number | null;
  playerCountMin: number | null;
  playerCountMax: number | null;
  difficulty: string | null;
  tags: string[];
  createdAt: string;
  isArchived: boolean;
};

interface GetExercisesOptions {
  search?: string;
  category?: string;
  includeArchived?: boolean;
}

export async function getExercises(
  supabase: SupabaseClient,
  organizationId: string,
  opts: GetExercisesOptions = {},
): Promise<ExerciseRow[]> {
  let query = supabase
    .from("exercises")
    .select(
      "id, organization_id, name, objective, category, description, coaching_points, duration_minutes, player_count_min, player_count_max, difficulty, tags, created_at, deleted_at",
    )
    .eq("organization_id", organizationId)
    .order("name", { ascending: true });

  if (!opts.includeArchived) {
    query = query.is("deleted_at", null);
  }

  if (opts.search && opts.search.trim()) {
    const term = opts.search.trim();
    query = query.or(`name.ilike.%${term}%,objective.ilike.%${term}%`);
  }

  if (opts.category && opts.category.trim()) {
    query = query.eq("category", opts.category.trim());
  }

  const { data, error } = await query;

  if (error) {
    console.error("[getExercises] query failed:", error.message);
    return [];
  }

  return (data ?? []).map((e) => ({
    id: e.id,
    organizationId: e.organization_id,
    name: e.name,
    objective: e.objective,
    category: e.category,
    description: e.description,
    coachingPoints: e.coaching_points,
    durationMinutes: e.duration_minutes,
    playerCountMin: e.player_count_min,
    playerCountMax: e.player_count_max,
    difficulty: e.difficulty,
    tags: e.tags ?? [],
    createdAt: e.created_at,
    isArchived: e.deleted_at !== null,
  }));
}

export async function getExercise(
  supabase: SupabaseClient,
  exerciseId: string,
  organizationId: string,
): Promise<ExerciseRow | null> {
  const { data, error } = await supabase
    .from("exercises")
    .select(
      "id, organization_id, name, objective, category, description, coaching_points, duration_minutes, player_count_min, player_count_max, difficulty, tags, created_at, deleted_at",
    )
    .eq("id", exerciseId)
    .eq("organization_id", organizationId)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    organizationId: data.organization_id,
    name: data.name,
    objective: data.objective,
    category: data.category,
    description: data.description,
    coachingPoints: data.coaching_points,
    durationMinutes: data.duration_minutes,
    playerCountMin: data.player_count_min,
    playerCountMax: data.player_count_max,
    difficulty: data.difficulty,
    tags: data.tags ?? [],
    createdAt: data.created_at,
    isArchived: data.deleted_at !== null,
  };
}
