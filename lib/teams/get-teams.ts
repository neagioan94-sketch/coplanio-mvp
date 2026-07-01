import type { SupabaseClient } from "@supabase/supabase-js";

export type TeamRow = {
  id: string;
  name: string;
  ageGroup: string | null;
  season: string | null;
  level: string | null;
  status: string;
  createdAt: string;
};

export type TeamStaffRow = {
  id: string;
  userId: string;
  staffRole: string;
  fullName: string | null;
  email: string | null;
};

export async function getTeams(
  supabase: SupabaseClient,
  organizationId: string,
  includeArchived = false,
): Promise<TeamRow[]> {
  let query = supabase
    .from("teams")
    .select("id, name, age_group, season, level, status, created_at")
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .order("name", { ascending: true });

  if (!includeArchived) {
    query = query.in("status", ["active", "inactive"]);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[getTeams] query failed:", error.message);
    return [];
  }

  return (data ?? []).map((t) => ({
    id: t.id,
    name: t.name,
    ageGroup: t.age_group,
    season: t.season,
    level: t.level,
    status: t.status,
    createdAt: t.created_at,
  }));
}

export async function getTeam(
  supabase: SupabaseClient,
  teamId: string,
  organizationId: string,
): Promise<TeamRow | null> {
  const { data, error } = await supabase
    .from("teams")
    .select("id, name, age_group, season, level, status, created_at")
    .eq("id", teamId)
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    name: data.name,
    ageGroup: data.age_group,
    season: data.season,
    level: data.level,
    status: data.status,
    createdAt: data.created_at,
  };
}

export type TeamRosterRow = {
  membershipId: string;
  playerId: string;
  fullName: string;
  squadNumber: number | null;
  status: string;
  primaryPosition: string | null;
};

export async function getTeamRoster(
  supabase: SupabaseClient,
  teamId: string,
  organizationId: string,
): Promise<TeamRosterRow[]> {
  const { data, error } = await supabase
    .from("player_team_memberships")
    .select("id, player_id, squad_number, status, players(first_name, last_name, primary_position)")
    .eq("team_id", teamId)
    .eq("organization_id", organizationId)
    .eq("status", "active")
    .order("squad_number", { ascending: true, nullsFirst: false });

  if (error) {
    console.error("[getTeamRoster] query failed:", error.message);
    return [];
  }

  return (data ?? []).map((m) => {
    const player = Array.isArray(m.players)
      ? (m.players[0] as { first_name: string; last_name: string; primary_position: string | null } | undefined)
      : (m.players as { first_name: string; last_name: string; primary_position: string | null } | null);

    return {
      membershipId: m.id,
      playerId: m.player_id,
      fullName: player ? `${player.first_name} ${player.last_name}` : "Unknown player",
      squadNumber: m.squad_number,
      status: m.status,
      primaryPosition: player?.primary_position ?? null,
    };
  });
}

export async function getTeamStaff(
  supabase: SupabaseClient,
  teamId: string,
  organizationId: string,
): Promise<TeamStaffRow[]> {
  const { data, error } = await supabase
    .from("team_staff")
    .select("id, user_id, staff_role, profiles(full_name, email)")
    .eq("team_id", teamId)
    .eq("organization_id", organizationId)
    .eq("status", "active");

  if (error) {
    console.error("[getTeamStaff] query failed:", error.message);
    return [];
  }

  return (data ?? []).map((s) => {
    const profile = Array.isArray(s.profiles)
      ? (s.profiles[0] as { full_name: string | null; email: string | null } | undefined)
      : (s.profiles as { full_name: string | null; email: string | null } | null);

    return {
      id: s.id,
      userId: s.user_id,
      staffRole: s.staff_role,
      fullName: profile?.full_name ?? null,
      email: profile?.email ?? null,
    };
  });
}
