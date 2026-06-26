import type { SupabaseClient } from "@supabase/supabase-js";

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

    const name = data.display_name ?? `${data.first_name} ${data.last_name}`;
    return {
      content: {
        player_name: name,
        position: data.primary_position,
        date_of_birth: data.date_of_birth,
      },
      summary: `Player report for ${name}`,
    };
  }

  if (sourceEntityType === "team") {
    const { data, error } = await supabase
      .from("teams")
      .select("id, name, description")
      .eq("id", sourceEntityId)
      .eq("organization_id", organizationId)
      .is("deleted_at", null)
      .single();

    if (error || !data) return null;

    return {
      content: {
        team_name: data.name,
        description: data.description,
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

    return {
      content: {
        title: data.title,
        session_date: data.session_date,
        status: data.status,
        location: data.location,
      },
      summary: `Session report for ${data.title} on ${data.session_date}`,
    };
  }

  if (sourceEntityType === "match") {
    const { data, error } = await supabase
      .from("matches")
      .select("id, opponent, match_date, status, goals_for, goals_against, home_away, competition")
      .eq("id", sourceEntityId)
      .eq("organization_id", organizationId)
      .is("deleted_at", null)
      .single();

    if (error || !data) return null;

    return {
      content: {
        opponent: data.opponent,
        match_date: data.match_date,
        status: data.status,
        home_away: data.home_away,
        goals_for: data.goals_for,
        goals_against: data.goals_against,
        competition: data.competition,
      },
      summary: `Match report: vs ${data.opponent} on ${data.match_date}`,
    };
  }

  // "assessment" → queries assessment_results table
  if (sourceEntityType === "assessment") {
    const { data, error } = await supabase
      .from("assessment_results")
      .select(
        "id, value, unit, assessed_at, assessment_types(name), players(first_name, last_name, display_name)",
      )
      .eq("id", sourceEntityId)
      .eq("organization_id", organizationId)
      .single();

    if (error || !data) return null;

    const typeRaw = Array.isArray(data.assessment_types)
      ? (data.assessment_types[0] as { name: string } | undefined)
      : (data.assessment_types as { name: string } | null);

    const playerRaw = Array.isArray(data.players)
      ? (data.players[0] as { first_name: string; last_name: string; display_name: string | null } | undefined)
      : (data.players as { first_name: string; last_name: string; display_name: string | null } | null);

    const typeName = typeRaw?.name ?? "Unknown type";
    const playerName = playerRaw
      ? (playerRaw.display_name ?? `${playerRaw.first_name} ${playerRaw.last_name}`)
      : "Unknown player";

    const valueLabel = data.unit ? `${data.value} ${data.unit}` : String(data.value);

    return {
      content: {
        assessment_type: typeName,
        player: playerName,
        value: data.value,
        unit: data.unit,
        assessed_at: data.assessed_at,
      },
      summary: `${typeName} result for ${playerName}: ${valueLabel}`,
    };
  }

  return null;
}
