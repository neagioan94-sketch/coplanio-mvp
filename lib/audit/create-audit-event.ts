import type { SupabaseClient } from "@supabase/supabase-js";

interface AuditParams {
  organizationId: string;
  actorUserId: string;
  actionType: string;
  targetType?: string;
  targetId?: string;
  previousValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  source?: "web_app" | "server_action" | "api_route" | "system";
}

export async function createAuditEvent(
  supabase: SupabaseClient,
  params: AuditParams,
): Promise<void> {
  const { error } = await supabase.from("audit_events").insert({
    organization_id: params.organizationId,
    actor_user_id: params.actorUserId,
    action_type: params.actionType,
    target_type: params.targetType ?? null,
    target_id: params.targetId ?? null,
    previous_value: params.previousValue ?? null,
    new_value: params.newValue ?? null,
    source: params.source ?? "server_action",
  });
  if (error) {
    console.error(
      "[createAuditEvent] failed:",
      params.actionType,
      error.message,
    );
  }
}
