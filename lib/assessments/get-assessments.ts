import type { SupabaseClient } from "@supabase/supabase-js";

export type AssessmentTypeRow = {
  id: string;
  organizationId: string;
  name: string;
  category: string | null;
  unit: string | null;
  description: string | null;
  higherIsBetter: boolean | null;
  createdAt: string;
  isArchived: boolean;
};

export type AssessmentResultRow = {
  id: string;
  organizationId: string;
  assessmentTypeId: string;
  assessmentTypeName: string;
  assessmentTypeUnit: string | null;
  playerId: string;
  playerName: string;
  teamId: string | null;
  assessedAt: string;
  value: number;
  unit: string | null;
  notes: string | null;
  recordedBy: string | null;
  createdAt: string;
};

export async function getAssessmentTypes(
  supabase: SupabaseClient,
  organizationId: string,
  includeArchived = false,
): Promise<AssessmentTypeRow[]> {
  let query = supabase
    .from("assessment_types")
    .select("id, organization_id, name, category, unit, description, higher_is_better, created_at, deleted_at")
    .eq("organization_id", organizationId)
    .order("name", { ascending: true });

  if (!includeArchived) {
    query = query.is("deleted_at", null);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[getAssessmentTypes] query failed:", error.message);
    return [];
  }

  return (data ?? []).map((t) => ({
    id: t.id,
    organizationId: t.organization_id,
    name: t.name,
    category: t.category,
    unit: t.unit,
    description: t.description,
    higherIsBetter: t.higher_is_better,
    createdAt: t.created_at,
    isArchived: t.deleted_at !== null,
  }));
}

export async function getAssessmentType(
  supabase: SupabaseClient,
  typeId: string,
  organizationId: string,
): Promise<AssessmentTypeRow | null> {
  const { data, error } = await supabase
    .from("assessment_types")
    .select("id, organization_id, name, category, unit, description, higher_is_better, created_at, deleted_at")
    .eq("id", typeId)
    .eq("organization_id", organizationId)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    organizationId: data.organization_id,
    name: data.name,
    category: data.category,
    unit: data.unit,
    description: data.description,
    higherIsBetter: data.higher_is_better,
    createdAt: data.created_at,
    isArchived: data.deleted_at !== null,
  };
}

interface GetAssessmentResultsOptions {
  playerId?: string;
  assessmentTypeId?: string;
  limit?: number;
}

export async function getAssessmentResults(
  supabase: SupabaseClient,
  organizationId: string,
  opts: GetAssessmentResultsOptions = {},
): Promise<AssessmentResultRow[]> {
  let query = supabase
    .from("assessment_results")
    .select("id, organization_id, assessment_type_id, player_id, team_id, assessed_at, value, unit, notes, recorded_by, created_at, players(first_name, last_name, display_name), assessment_types(name, unit)")
    .eq("organization_id", organizationId)
    .order("assessed_at", { ascending: false })
    .limit(opts.limit ?? 20);

  if (opts.playerId && opts.playerId.trim()) {
    query = query.eq("player_id", opts.playerId.trim());
  }

  if (opts.assessmentTypeId && opts.assessmentTypeId.trim()) {
    query = query.eq("assessment_type_id", opts.assessmentTypeId.trim());
  }

  const { data, error } = await query;

  if (error) {
    console.error("[getAssessmentResults] query failed:", error.message);
    return [];
  }

  return (data ?? []).map((r) => {
    const player = Array.isArray(r.players)
      ? (r.players[0] as { first_name: string; last_name: string; display_name: string | null } | undefined)
      : (r.players as { first_name: string; last_name: string; display_name: string | null } | null);

    const assessmentType = Array.isArray(r.assessment_types)
      ? (r.assessment_types[0] as { name: string; unit: string | null } | undefined)
      : (r.assessment_types as { name: string; unit: string | null } | null);

    const playerName = player
      ? (player.display_name ?? `${player.first_name} ${player.last_name}`)
      : "Unknown player";

    return {
      id: r.id,
      organizationId: r.organization_id,
      assessmentTypeId: r.assessment_type_id,
      assessmentTypeName: assessmentType?.name ?? "Unknown type",
      assessmentTypeUnit: assessmentType?.unit ?? null,
      playerId: r.player_id,
      playerName,
      teamId: r.team_id,
      assessedAt: r.assessed_at,
      value: r.value,
      unit: r.unit,
      notes: r.notes,
      recordedBy: r.recorded_by,
      createdAt: r.created_at,
    };
  });
}
