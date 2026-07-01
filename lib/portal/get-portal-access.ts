import type { SupabaseClient } from "@supabase/supabase-js";

export type PortalAccessRow = {
  id: string;
  organizationId: string;
  playerId: string;
  playerName: string;
  userId: string;
  guardianEmail: string | null;
  relationship: string;
  status: string;
  grantedAt: string;
};

/**
 * Admin-client lookup used by the (portal) route group to resolve which
 * players the authenticated user is allowed to see. This is the sole
 * authorization boundary for portal reads — never trust a client-supplied
 * player_id without checking it against this set first.
 */
export async function getActivePortalAccessForUser(
  adminClient: SupabaseClient,
  userId: string,
): Promise<{ playerId: string; organizationId: string; relationship: string }[]> {
  const { data, error } = await adminClient
    .from("portal_access")
    .select("player_id, organization_id, relationship")
    .eq("user_id", userId)
    .eq("status", "active");

  if (error) {
    console.error("[getActivePortalAccessForUser] query failed:", error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    playerId: row.player_id,
    organizationId: row.organization_id,
    relationship: row.relationship,
  }));
}

/**
 * List for the /settings/portal-access management page. Pass an admin
 * (service-role) client when available: the guardian's `profiles.email` is
 * only visible under RLS to users who share an active org membership, which
 * a portal guardian never has, so the RLS-scoped client would silently
 * return a null profile embed for every row.
 */
export async function getPortalAccessGrants(
  supabase: SupabaseClient,
  organizationId: string,
): Promise<PortalAccessRow[]> {
  const { data, error } = await supabase
    .from("portal_access")
    .select(
      "id, organization_id, player_id, user_id, relationship, status, granted_at, players(first_name, last_name, display_name), profiles!user_id(email)",
    )
    .eq("organization_id", organizationId)
    .eq("status", "active")
    .order("granted_at", { ascending: false });

  if (error) {
    console.error("[getPortalAccessGrants] query failed:", error.message);
    return [];
  }

  return (data ?? []).map((row) => {
    const player = Array.isArray(row.players)
      ? (row.players[0] as
          | { first_name: string; last_name: string; display_name: string | null }
          | undefined)
      : (row.players as
          | { first_name: string; last_name: string; display_name: string | null }
          | null);
    const profile = Array.isArray(row.profiles)
      ? (row.profiles[0] as { email: string | null } | undefined)
      : (row.profiles as { email: string | null } | null);

    return {
      id: row.id,
      organizationId: row.organization_id,
      playerId: row.player_id,
      playerName: player
        ? (player.display_name ?? `${player.first_name} ${player.last_name}`)
        : "Unknown player",
      userId: row.user_id,
      guardianEmail: profile?.email ?? null,
      relationship: row.relationship,
      status: row.status,
      grantedAt: row.granted_at,
    };
  });
}
