import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function getActiveMemberships(
  supabase: SupabaseClient,
  userId: string,
) {
  const { data, error } = await supabase
    .from("memberships")
    .select("id, organization_id, role, status, joined_at, organizations(name)")
    .eq("user_id", userId)
    .eq("status", "active");

  if (error) {
    console.error("[getActiveMemberships] query failed:", error.message);
    return [];
  }
  return data ?? [];
}

export async function getActiveOrganization(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ organizationId: string; role: string } | null> {
  const { data, error } = await supabase
    .from("memberships")
    .select("organization_id, role")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("joined_at", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true })
    .limit(1)
    .single();

  if (error || !data) return null;
  return { organizationId: data.organization_id, role: data.role };
}

export async function requireActiveOrganization(
  supabase: SupabaseClient,
  userId: string,
) {
  const org = await getActiveOrganization(supabase, userId);
  if (!org) redirect("/setup/organization");
  return org;
}

export async function requireOrganizationAccess(
  supabase: SupabaseClient,
  userId: string,
  organizationId: string,
) {
  const { data, error } = await supabase
    .from("memberships")
    .select("id, role")
    .eq("user_id", userId)
    .eq("organization_id", organizationId)
    .eq("status", "active")
    .limit(1)
    .single();

  if (error || !data) redirect("/setup/organization");
  return data;
}

export async function requireRole(
  supabase: SupabaseClient,
  userId: string,
  organizationId: string,
  allowedRoles: string[],
) {
  const membership = await requireOrganizationAccess(
    supabase,
    userId,
    organizationId,
  );
  if (!allowedRoles.includes(membership.role)) redirect("/dashboard");
  return membership;
}

export async function isOrganizationAdmin(
  supabase: SupabaseClient,
  userId: string,
  organizationId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("memberships")
    .select("id")
    .eq("user_id", userId)
    .eq("organization_id", organizationId)
    .eq("status", "active")
    .eq("role", "organization_admin")
    .limit(1);

  if (error) return false;
  return (data?.length ?? 0) > 0;
}

export async function canManageMembers(
  supabase: SupabaseClient,
  userId: string,
  organizationId: string,
): Promise<boolean> {
  return isOrganizationAdmin(supabase, userId, organizationId);
}

export async function canManageTeams(
  supabase: SupabaseClient,
  userId: string,
  organizationId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("memberships")
    .select("id")
    .eq("user_id", userId)
    .eq("organization_id", organizationId)
    .eq("status", "active")
    .in("role", ["organization_admin", "head_coach"])
    .limit(1);

  if (error) return false;
  return (data?.length ?? 0) > 0;
}

export async function canManageExercises(
  supabase: SupabaseClient,
  userId: string,
  organizationId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("memberships")
    .select("id")
    .eq("user_id", userId)
    .eq("organization_id", organizationId)
    .eq("status", "active")
    .in("role", ["organization_admin", "head_coach"])
    .limit(1);

  if (error) return false;
  return (data?.length ?? 0) > 0;
}

export async function canManagePlayers(
  supabase: SupabaseClient,
  userId: string,
  organizationId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("memberships")
    .select("id")
    .eq("user_id", userId)
    .eq("organization_id", organizationId)
    .eq("status", "active")
    .in("role", ["organization_admin", "head_coach"])
    .limit(1);

  if (error) return false;
  return (data?.length ?? 0) > 0;
}

export async function canManageSessions(
  supabase: SupabaseClient,
  userId: string,
  organizationId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("memberships")
    .select("id")
    .eq("user_id", userId)
    .eq("organization_id", organizationId)
    .eq("status", "active")
    .in("role", ["organization_admin", "head_coach", "coach"])
    .limit(1);

  if (error) return false;
  return (data?.length ?? 0) > 0;
}

export async function canManageMatches(
  supabase: SupabaseClient,
  userId: string,
  organizationId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("memberships")
    .select("id")
    .eq("user_id", userId)
    .eq("organization_id", organizationId)
    .eq("status", "active")
    .in("role", ["organization_admin", "head_coach", "coach"])
    .limit(1);

  if (error) return false;
  return (data?.length ?? 0) > 0;
}

export async function canManageAssessments(
  supabase: SupabaseClient,
  userId: string,
  organizationId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("memberships")
    .select("id")
    .eq("user_id", userId)
    .eq("organization_id", organizationId)
    .eq("status", "active")
    .in("role", ["organization_admin", "head_coach", "coach"])
    .limit(1);

  if (error) return false;
  return (data?.length ?? 0) > 0;
}

export async function canManageReports(
  supabase: SupabaseClient,
  userId: string,
  organizationId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("memberships")
    .select("id")
    .eq("user_id", userId)
    .eq("organization_id", organizationId)
    .eq("status", "active")
    .in("role", ["organization_admin", "head_coach", "coach"])
    .limit(1);

  if (error) return false;
  return (data?.length ?? 0) > 0;
}

export async function getInvitedMembership(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ id: string; organizationId: string; organizationName: string } | null> {
  const { data, error } = await supabase
    .from("memberships")
    .select("id, organization_id, organizations(name)")
    .eq("user_id", userId)
    .eq("status", "invited")
    .limit(1)
    .single();

  if (error || !data) return null;

  const orgName =
    Array.isArray(data.organizations)
      ? (data.organizations[0] as { name: string } | undefined)?.name ?? "Unknown organization"
      : (data.organizations as { name: string } | null)?.name ?? "Unknown organization";

  return {
    id: data.id,
    organizationId: data.organization_id,
    organizationName: orgName,
  };
}
