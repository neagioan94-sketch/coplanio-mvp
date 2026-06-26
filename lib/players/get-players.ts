import type { SupabaseClient } from "@supabase/supabase-js";

export type PlayerRow = {
  id: string;
  organizationId: string;
  firstName: string;
  lastName: string;
  displayName: string | null;
  dateOfBirth: string | null;
  primaryPosition: string | null;
  preferredFoot: string | null;
  status: string;
  notes: string | null;
  createdAt: string;
};

export type PlayerTeamMembershipRow = {
  id: string;
  playerId: string;
  teamId: string;
  teamName: string;
  squadNumber: number | null;
  status: string;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
};

export async function getPlayers(
  supabase: SupabaseClient,
  organizationId: string,
  includeArchived = false,
): Promise<PlayerRow[]> {
  let query = supabase
    .from("players")
    .select(
      "id, organization_id, first_name, last_name, display_name, date_of_birth, primary_position, preferred_foot, status, notes, created_at",
    )
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .order("last_name", { ascending: true });

  if (!includeArchived) {
    query = query.in("status", ["active", "inactive"]);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[getPlayers] query failed:", error.message);
    return [];
  }

  return (data ?? []).map((p) => ({
    id: p.id,
    organizationId: p.organization_id,
    firstName: p.first_name,
    lastName: p.last_name,
    displayName: p.display_name,
    dateOfBirth: p.date_of_birth,
    primaryPosition: p.primary_position,
    preferredFoot: p.preferred_foot,
    status: p.status,
    notes: p.notes,
    createdAt: p.created_at,
  }));
}

export async function getPlayer(
  supabase: SupabaseClient,
  playerId: string,
  organizationId: string,
): Promise<PlayerRow | null> {
  const { data, error } = await supabase
    .from("players")
    .select(
      "id, organization_id, first_name, last_name, display_name, date_of_birth, primary_position, preferred_foot, status, notes, created_at",
    )
    .eq("id", playerId)
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    organizationId: data.organization_id,
    firstName: data.first_name,
    lastName: data.last_name,
    displayName: data.display_name,
    dateOfBirth: data.date_of_birth,
    primaryPosition: data.primary_position,
    preferredFoot: data.preferred_foot,
    status: data.status,
    notes: data.notes,
    createdAt: data.created_at,
  };
}

export async function getPlayerTeamMemberships(
  supabase: SupabaseClient,
  playerId: string,
  organizationId: string,
): Promise<PlayerTeamMembershipRow[]> {
  const { data, error } = await supabase
    .from("player_team_memberships")
    .select("id, player_id, team_id, squad_number, status, start_date, end_date, created_at, teams(name)")
    .eq("player_id", playerId)
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getPlayerTeamMemberships] query failed:", error.message);
    return [];
  }

  return (data ?? []).map((m) => {
    const team = Array.isArray(m.teams)
      ? (m.teams[0] as { name: string } | undefined)
      : (m.teams as { name: string } | null);

    return {
      id: m.id,
      playerId: m.player_id,
      teamId: m.team_id,
      teamName: team?.name ?? "Unknown team",
      squadNumber: m.squad_number,
      status: m.status,
      startDate: m.start_date,
      endDate: m.end_date,
      createdAt: m.created_at,
    };
  });
}
