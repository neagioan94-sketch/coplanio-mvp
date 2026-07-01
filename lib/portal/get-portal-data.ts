import type { SupabaseClient } from "@supabase/supabase-js";

export type PortalPlayerSummary = {
  id: string;
  organizationId: string;
  fullName: string;
  primaryPosition: string | null;
  dateOfBirth: string | null;
  teamId: string | null;
  teamName: string | null;
};

export type PortalUpcomingSession = {
  id: string;
  title: string;
  sessionDate: string;
  startTime: string | null;
  location: string | null;
};

export type PortalUpcomingMatch = {
  id: string;
  opponent: string;
  matchDate: string;
  location: string | null;
  homeAway: string | null;
};

export type PortalAttendanceSummaryRow = {
  present: number;
  absent: number;
  late: number;
  limited: number;
  excused: number;
  unknown: number;
};

/**
 * All functions in this module take an admin (service-role) client and a
 * playerId that the CALLER must already have verified against this user's
 * active portal_access rows — they perform no authorization of their own,
 * only organization/player-scoped data retrieval.
 */

export async function getPortalPlayerSummary(
  adminClient: SupabaseClient,
  playerId: string,
): Promise<PortalPlayerSummary | null> {
  const { data: player, error } = await adminClient
    .from("players")
    .select("id, organization_id, first_name, last_name, display_name, primary_position, date_of_birth")
    .eq("id", playerId)
    .is("deleted_at", null)
    .single();

  if (error || !player) return null;

  const { data: membership } = await adminClient
    .from("player_team_memberships")
    .select("team_id, teams(name)")
    .eq("player_id", playerId)
    .eq("status", "active")
    .limit(1)
    .single();

  const team = membership
    ? Array.isArray(membership.teams)
      ? (membership.teams[0] as { name: string } | undefined)
      : (membership.teams as { name: string } | null)
    : null;

  return {
    id: player.id,
    organizationId: player.organization_id,
    fullName: player.display_name ?? `${player.first_name} ${player.last_name}`,
    primaryPosition: player.primary_position,
    dateOfBirth: player.date_of_birth,
    teamId: membership?.team_id ?? null,
    teamName: team?.name ?? null,
  };
}

export async function getPortalUpcomingSessions(
  adminClient: SupabaseClient,
  organizationId: string,
  teamId: string,
): Promise<PortalUpcomingSession[]> {
  const { data, error } = await adminClient
    .from("training_sessions")
    .select("id, title, session_date, start_time, location")
    .eq("organization_id", organizationId)
    .eq("team_id", teamId)
    .eq("status", "planned")
    .is("deleted_at", null)
    .gte("session_date", new Date().toISOString().slice(0, 10))
    .order("session_date", { ascending: true })
    .limit(10);

  if (error) {
    console.error("[getPortalUpcomingSessions] query failed:", error.message);
    return [];
  }

  return (data ?? []).map((s) => ({
    id: s.id,
    title: s.title,
    sessionDate: s.session_date,
    startTime: s.start_time,
    location: s.location,
  }));
}

export async function getPortalUpcomingMatches(
  adminClient: SupabaseClient,
  organizationId: string,
  teamId: string,
): Promise<PortalUpcomingMatch[]> {
  const { data, error } = await adminClient
    .from("matches")
    .select("id, opponent, match_date, location, home_away")
    .eq("organization_id", organizationId)
    .eq("team_id", teamId)
    .eq("status", "scheduled")
    .is("deleted_at", null)
    .gte("match_date", new Date().toISOString().slice(0, 10))
    .order("match_date", { ascending: true })
    .limit(10);

  if (error) {
    console.error("[getPortalUpcomingMatches] query failed:", error.message);
    return [];
  }

  return (data ?? []).map((m) => ({
    id: m.id,
    opponent: m.opponent,
    matchDate: m.match_date,
    location: m.location,
    homeAway: m.home_away,
  }));
}

export async function getPortalAttendanceSummary(
  adminClient: SupabaseClient,
  organizationId: string,
  playerId: string,
): Promise<PortalAttendanceSummaryRow> {
  const summary: PortalAttendanceSummaryRow = {
    present: 0,
    absent: 0,
    late: 0,
    limited: 0,
    excused: 0,
    unknown: 0,
  };

  const { data, error } = await adminClient
    .from("attendance_records")
    .select("status")
    .eq("organization_id", organizationId)
    .eq("player_id", playerId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("[getPortalAttendanceSummary] query failed:", error.message);
    return summary;
  }

  for (const row of data ?? []) {
    if (row.status in summary) {
      summary[row.status as keyof PortalAttendanceSummaryRow] += 1;
    }
  }

  return summary;
}
