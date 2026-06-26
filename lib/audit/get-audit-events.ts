import type { SupabaseClient } from "@supabase/supabase-js";

export type AuditEventRow = {
  id: string;
  organizationId: string | null;
  actorUserId: string | null;
  actionType: string;
  targetType: string | null;
  targetId: string | null;
  previousValue: Record<string, unknown> | null;
  newValue: Record<string, unknown> | null;
  createdAt: string;
};

interface GetAuditEventsOptions {
  actionType?: string;
  targetType?: string;
  limit?: number;
}

export async function getAuditEvents(
  supabase: SupabaseClient,
  organizationId: string,
  opts: GetAuditEventsOptions = {},
): Promise<AuditEventRow[]> {
  let query = supabase
    .from("audit_events")
    .select(
      "id, organization_id, actor_user_id, action_type, target_type, target_id, previous_value, new_value, created_at",
    )
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(opts.limit ?? 50);

  if (opts.actionType) {
    query = query.eq("action_type", opts.actionType);
  }
  if (opts.targetType) {
    query = query.eq("target_type", opts.targetType);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[getAuditEvents] query failed:", error.message);
    return [];
  }

  return (data ?? []).map((e) => ({
    id: e.id,
    organizationId: e.organization_id,
    actorUserId: e.actor_user_id,
    actionType: e.action_type,
    targetType: e.target_type,
    targetId: e.target_id,
    previousValue: e.previous_value as Record<string, unknown> | null,
    newValue: e.new_value as Record<string, unknown> | null,
    createdAt: e.created_at,
  }));
}
