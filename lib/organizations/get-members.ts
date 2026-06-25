import type { SupabaseClient } from "@supabase/supabase-js";

export type MemberRow = {
  id: string;
  userId: string;
  role: string;
  status: string;
  joinedAt: string | null;
  fullName: string | null;
  email: string | null;
};

export async function getOrganizationMembers(
  supabase: SupabaseClient,
  organizationId: string,
): Promise<MemberRow[]> {
  const { data, error } = await supabase
    .from("memberships")
    .select("id, user_id, role, status, joined_at, profiles(full_name, email)")
    .eq("organization_id", organizationId)
    .order("joined_at", { ascending: true, nullsFirst: false });

  if (error) {
    console.error("[getOrganizationMembers] query failed:", error.message);
    return [];
  }

  return (data ?? []).map((m) => {
    const profile = Array.isArray(m.profiles)
      ? (m.profiles[0] as { full_name: string | null; email: string | null } | undefined)
      : (m.profiles as { full_name: string | null; email: string | null } | null);

    return {
      id: m.id,
      userId: m.user_id,
      role: m.role,
      status: m.status,
      joinedAt: m.joined_at,
      fullName: profile?.full_name ?? null,
      email: profile?.email ?? null,
    };
  });
}

export async function countActiveAdmins(
  supabase: SupabaseClient,
  organizationId: string,
): Promise<number> {
  const { count, error } = await supabase
    .from("memberships")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .eq("status", "active")
    .eq("role", "organization_admin");

  if (error) {
    console.error("[countActiveAdmins] query failed:", error.message);
    return 0;
  }
  return count ?? 0;
}
