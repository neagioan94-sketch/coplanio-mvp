import type { SupabaseClient } from "@supabase/supabase-js";

export async function hasAnyActiveMembership(
  supabase: SupabaseClient,
  userId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("memberships")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "active")
    .limit(1);

  if (error) {
    console.error("[hasAnyActiveMembership] query failed:", error.message);
    return false;
  }
  return (data?.length ?? 0) > 0;
}
