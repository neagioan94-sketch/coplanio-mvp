import type { SupabaseClient } from "@supabase/supabase-js";

export type MatchRow = {
  id: string;
  organizationId: string;
  teamId: string;
  teamName: string;
  matchDate: string;
  opponent: string;
  location: string | null;
  competition: string | null;
  homeAway: string | null;
  goalsFor: number | null;
  goalsAgainst: number | null;
  status: string;
  notes: string | null;
  createdAt: string;
  isArchived: boolean;
};

interface GetMatchesOptions {
  teamId?: string;
  status?: string;
}

export async function getMatches(
  supabase: SupabaseClient,
  organizationId: string,
  opts: GetMatchesOptions = {},
): Promise<MatchRow[]> {
  let query = supabase
    .from("matches")
    .select("id, organization_id, team_id, match_date, opponent, location, competition, home_away, goals_for, goals_against, status, notes, created_at, deleted_at, teams(name)")
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .order("match_date", { ascending: false });

  if (opts.teamId && opts.teamId.trim()) {
    query = query.eq("team_id", opts.teamId.trim());
  }

  if (opts.status && opts.status.trim()) {
    query = query.eq("status", opts.status.trim());
  }

  const { data, error } = await query;

  if (error) {
    console.error("[getMatches] query failed:", error.message);
    return [];
  }

  return (data ?? []).map((m) => {
    const team = Array.isArray(m.teams)
      ? (m.teams[0] as { name: string } | undefined)
      : (m.teams as { name: string } | null);

    return {
      id: m.id,
      organizationId: m.organization_id,
      teamId: m.team_id,
      teamName: team?.name ?? "",
      matchDate: m.match_date,
      opponent: m.opponent,
      location: m.location,
      competition: m.competition,
      homeAway: m.home_away,
      goalsFor: m.goals_for,
      goalsAgainst: m.goals_against,
      status: m.status,
      notes: m.notes,
      createdAt: m.created_at,
      isArchived: m.deleted_at !== null,
    };
  });
}

export async function getMatch(
  supabase: SupabaseClient,
  matchId: string,
  organizationId: string,
): Promise<MatchRow | null> {
  const { data, error } = await supabase
    .from("matches")
    .select("id, organization_id, team_id, match_date, opponent, location, competition, home_away, goals_for, goals_against, status, notes, created_at, deleted_at, teams(name)")
    .eq("id", matchId)
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
    matchDate: data.match_date,
    opponent: data.opponent,
    location: data.location,
    competition: data.competition,
    homeAway: data.home_away,
    goalsFor: data.goals_for,
    goalsAgainst: data.goals_against,
    status: data.status,
    notes: data.notes,
    createdAt: data.created_at,
    isArchived: data.deleted_at !== null,
  };
}
