import type { SupabaseClient } from "@supabase/supabase-js";

const RECENT_LIMIT = 10;

function resolvePlayerName(player: {
  first_name: string;
  last_name: string;
  display_name: string | null;
} | null | undefined): string {
  if (!player) return "Unknown player";
  return player.display_name ?? `${player.first_name} ${player.last_name}`;
}

function unwrapRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

// ---------------------------------------------------------------------------
// Player report enrichment
// ---------------------------------------------------------------------------

async function getPlayerTeamMemberships(
  supabase: SupabaseClient,
  organizationId: string,
  playerId: string,
) {
  const { data } = await supabase
    .from("player_team_memberships")
    .select("squad_number, status, teams(name)")
    .eq("organization_id", organizationId)
    .eq("player_id", playerId)
    .eq("status", "active");

  return (data ?? []).map((row) => ({
    team_name: unwrapRelation<{ name: string }>(row.teams)?.name ?? "Unknown team",
    squad_number: row.squad_number,
    status: row.status,
  }));
}

async function getPlayerRecentAttendance(
  supabase: SupabaseClient,
  organizationId: string,
  playerId: string,
) {
  const { data } = await supabase
    .from("attendance_records")
    .select("status, notes, created_at, training_sessions(title, session_date)")
    .eq("organization_id", organizationId)
    .eq("player_id", playerId)
    .order("created_at", { ascending: false })
    .limit(RECENT_LIMIT);

  return (data ?? []).map((row) => {
    const session = unwrapRelation<{ title: string; session_date: string }>(
      row.training_sessions,
    );
    return {
      session_title: session?.title ?? "Unknown session",
      session_date: session?.session_date ?? null,
      status: row.status,
      notes: row.notes,
    };
  });
}

async function getPlayerRecentAssessments(
  supabase: SupabaseClient,
  organizationId: string,
  playerId: string,
) {
  const { data } = await supabase
    .from("assessment_results")
    .select("value, unit, assessed_at, assessment_types(name)")
    .eq("organization_id", organizationId)
    .eq("player_id", playerId)
    .order("assessed_at", { ascending: false })
    .limit(RECENT_LIMIT);

  return (data ?? []).map((row) => ({
    assessment_type: unwrapRelation<{ name: string }>(row.assessment_types)?.name ?? "Unknown type",
    value: row.value,
    unit: row.unit,
    assessed_at: row.assessed_at,
  }));
}

// ---------------------------------------------------------------------------
// Team report enrichment
// ---------------------------------------------------------------------------

async function getTeamRoster(
  supabase: SupabaseClient,
  organizationId: string,
  teamId: string,
) {
  const { data } = await supabase
    .from("player_team_memberships")
    .select("squad_number, players(first_name, last_name, display_name, primary_position)")
    .eq("organization_id", organizationId)
    .eq("team_id", teamId)
    .eq("status", "active");

  return (data ?? []).map((row) => {
    const player = unwrapRelation<{
      first_name: string;
      last_name: string;
      display_name: string | null;
      primary_position: string | null;
    }>(row.players);
    return {
      player_name: resolvePlayerName(player),
      squad_number: row.squad_number,
      position: player?.primary_position ?? null,
    };
  });
}

async function getTeamRecentSessions(
  supabase: SupabaseClient,
  organizationId: string,
  teamId: string,
) {
  const { data } = await supabase
    .from("training_sessions")
    .select("title, session_date, status")
    .eq("organization_id", organizationId)
    .eq("team_id", teamId)
    .order("session_date", { ascending: false })
    .limit(RECENT_LIMIT);

  return data ?? [];
}

async function getTeamRecentMatches(
  supabase: SupabaseClient,
  organizationId: string,
  teamId: string,
) {
  const { data } = await supabase
    .from("matches")
    .select("opponent, match_date, status, goals_for, goals_against, competition")
    .eq("organization_id", organizationId)
    .eq("team_id", teamId)
    .is("deleted_at", null)
    .order("match_date", { ascending: false })
    .limit(RECENT_LIMIT);

  return (data ?? []).map((row) => ({
    opponent: row.opponent,
    match_date: row.match_date,
    competition: row.competition,
    goals_for: row.goals_for,
    goals_against: row.goals_against,
    result_label: deriveResultLabel(row.status, row.goals_for, row.goals_against),
  }));
}

function deriveResultLabel(
  status: string,
  goalsFor: number | null,
  goalsAgainst: number | null,
): string | null {
  if (status !== "completed" || goalsFor === null || goalsAgainst === null) return null;
  if (goalsFor > goalsAgainst) return "Win";
  if (goalsFor < goalsAgainst) return "Loss";
  return "Draw";
}

// ---------------------------------------------------------------------------
// Training session report enrichment
// ---------------------------------------------------------------------------

async function getSessionAttendance(
  supabase: SupabaseClient,
  organizationId: string,
  sessionId: string,
) {
  const { data } = await supabase
    .from("attendance_records")
    .select("status, notes, players(first_name, last_name, display_name)")
    .eq("organization_id", organizationId)
    .eq("session_id", sessionId);

  const roster = (data ?? []).map((row) => ({
    player_name: resolvePlayerName(
      unwrapRelation<{ first_name: string; last_name: string; display_name: string | null }>(
        row.players,
      ),
    ),
    status: row.status,
    notes: row.notes,
  }));

  const summary: Record<string, number> = {
    present: 0,
    absent: 0,
    late: 0,
    limited: 0,
    excused: 0,
    unknown: 0,
  };
  for (const row of data ?? []) {
    summary[row.status] = (summary[row.status] ?? 0) + 1;
  }

  return { attendance_summary: summary, attendance_roster: roster };
}

async function getSessionExercises(
  supabase: SupabaseClient,
  organizationId: string,
  sessionId: string,
) {
  const { data } = await supabase
    .from("session_exercises")
    .select("sort_order, planned_duration_minutes, exercises(name, category)")
    .eq("organization_id", organizationId)
    .eq("session_id", sessionId)
    .order("sort_order", { ascending: true });

  return (data ?? []).map((row) => {
    const exercise = unwrapRelation<{ name: string; category: string | null }>(row.exercises);
    return {
      name: exercise?.name ?? "Unknown exercise",
      category: exercise?.category ?? null,
      planned_duration_minutes: row.planned_duration_minutes,
      sort_order: row.sort_order,
    };
  });
}

// ---------------------------------------------------------------------------
// Assessment report enrichment
// ---------------------------------------------------------------------------

async function getAssessmentPlayerHistory(
  supabase: SupabaseClient,
  organizationId: string,
  assessmentTypeId: string,
  playerId: string,
  excludeResultId: string,
) {
  const { data } = await supabase
    .from("assessment_results")
    .select("value, unit, assessed_at")
    .eq("organization_id", organizationId)
    .eq("assessment_type_id", assessmentTypeId)
    .eq("player_id", playerId)
    .neq("id", excludeResultId)
    .order("assessed_at", { ascending: false })
    .limit(RECENT_LIMIT);

  return data ?? [];
}

// ---------------------------------------------------------------------------
// Main dispatcher (existing signature, preserved)
// ---------------------------------------------------------------------------

export async function buildReportContent(
  supabase: SupabaseClient,
  organizationId: string,
  sourceEntityType: string,
  sourceEntityId: string,
): Promise<{ content: Record<string, unknown>; summary: string } | null> {
  if (sourceEntityType === "player") {
    const { data, error } = await supabase
      .from("players")
      .select("id, first_name, last_name, display_name, primary_position, date_of_birth")
      .eq("id", sourceEntityId)
      .eq("organization_id", organizationId)
      .is("deleted_at", null)
      .single();

    if (error || !data) return null;

    const name = resolvePlayerName(data);
    const [teamMemberships, recentAttendance, recentAssessments] = await Promise.all([
      getPlayerTeamMemberships(supabase, organizationId, sourceEntityId),
      getPlayerRecentAttendance(supabase, organizationId, sourceEntityId),
      getPlayerRecentAssessments(supabase, organizationId, sourceEntityId),
    ]);

    return {
      content: {
        player_name: name,
        position: data.primary_position,
        date_of_birth: data.date_of_birth,
        team_memberships: teamMemberships,
        recent_attendance: recentAttendance,
        recent_assessments: recentAssessments,
      },
      summary: `Player report for ${name}`,
    };
  }

  if (sourceEntityType === "team") {
    const { data, error } = await supabase
      .from("teams")
      .select("id, name, age_group, season, level")
      .eq("id", sourceEntityId)
      .eq("organization_id", organizationId)
      .is("deleted_at", null)
      .single();

    if (error || !data) return null;

    const [roster, recentSessions, recentMatches] = await Promise.all([
      getTeamRoster(supabase, organizationId, sourceEntityId),
      getTeamRecentSessions(supabase, organizationId, sourceEntityId),
      getTeamRecentMatches(supabase, organizationId, sourceEntityId),
    ]);

    return {
      content: {
        team_name: data.name,
        age_group: data.age_group,
        season: data.season,
        level: data.level,
        roster,
        recent_sessions: recentSessions,
        recent_matches: recentMatches,
      },
      summary: `Team report for ${data.name}`,
    };
  }

  if (sourceEntityType === "training_session") {
    const { data, error } = await supabase
      .from("training_sessions")
      .select("id, title, session_date, status, location")
      .eq("id", sourceEntityId)
      .eq("organization_id", organizationId)
      .single();

    if (error || !data) return null;

    const [{ attendance_summary, attendance_roster }, exercises] = await Promise.all([
      getSessionAttendance(supabase, organizationId, sourceEntityId),
      getSessionExercises(supabase, organizationId, sourceEntityId),
    ]);

    return {
      content: {
        title: data.title,
        session_date: data.session_date,
        status: data.status,
        location: data.location,
        attendance_summary,
        attendance_roster,
        exercises,
      },
      summary: `Session report for ${data.title} on ${data.session_date}`,
    };
  }

  if (sourceEntityType === "match") {
    const { data, error } = await supabase
      .from("matches")
      .select(
        "id, opponent, match_date, status, goals_for, goals_against, home_away, competition, teams(name)",
      )
      .eq("id", sourceEntityId)
      .eq("organization_id", organizationId)
      .is("deleted_at", null)
      .single();

    if (error || !data) return null;

    const teamName = unwrapRelation<{ name: string }>(data.teams)?.name ?? null;

    return {
      content: {
        opponent: data.opponent,
        match_date: data.match_date,
        status: data.status,
        home_away: data.home_away,
        goals_for: data.goals_for,
        goals_against: data.goals_against,
        competition: data.competition,
        team_name: teamName,
        result_label: deriveResultLabel(data.status, data.goals_for, data.goals_against),
      },
      summary: `Match report: vs ${data.opponent} on ${data.match_date}`,
    };
  }

  // "assessment" → queries assessment_results table
  if (sourceEntityType === "assessment") {
    const { data, error } = await supabase
      .from("assessment_results")
      .select(
        "id, value, unit, assessed_at, assessment_type_id, player_id, assessment_types(name, higher_is_better), players(first_name, last_name, display_name)",
      )
      .eq("id", sourceEntityId)
      .eq("organization_id", organizationId)
      .single();

    if (error || !data) return null;

    const assessmentType = unwrapRelation<{ name: string; higher_is_better: boolean | null }>(
      data.assessment_types,
    );
    const player = unwrapRelation<{
      first_name: string;
      last_name: string;
      display_name: string | null;
    }>(data.players);

    const typeName = assessmentType?.name ?? "Unknown type";
    const playerName = resolvePlayerName(player);
    const valueLabel = data.unit ? `${data.value} ${data.unit}` : String(data.value);

    const playerHistory = await getAssessmentPlayerHistory(
      supabase,
      organizationId,
      data.assessment_type_id,
      data.player_id,
      sourceEntityId,
    );

    return {
      content: {
        assessment_type: typeName,
        player: playerName,
        value: data.value,
        unit: data.unit,
        assessed_at: data.assessed_at,
        higher_is_better: assessmentType?.higher_is_better ?? null,
        player_history: playerHistory,
      },
      summary: `${typeName} result for ${playerName}: ${valueLabel}`,
    };
  }

  return null;
}
