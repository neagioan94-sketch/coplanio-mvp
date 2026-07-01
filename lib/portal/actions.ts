"use server";

import { createClient } from "@/lib/db/supabase-server";
import { createAdminClient } from "@/lib/db/supabase-admin";
import { requireUser } from "@/lib/auth/get-user";
import { requireRole } from "@/lib/organizations/get-organization";
import { createAuditEvent } from "@/lib/audit/create-audit-event";
import { revalidatePath } from "next/cache";
import { grantPortalAccessSchema, revokePortalAccessSchema } from "@/schemas/portal-access";

type ActionState = { error?: string; success?: boolean } | undefined;

const MANAGE_ROLES = ["organization_admin"] as const;

// ---------------------------------------------------------------------------
// Grant portal access
// ---------------------------------------------------------------------------

export async function grantPortalAccessAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const organizationId = formData.get("organizationId");
  if (!organizationId || typeof organizationId !== "string") {
    return { error: "Invalid organization" };
  }

  const parsed = grantPortalAccessSchema.safeParse({
    player_id: formData.get("player_id"),
    email: formData.get("email"),
    relationship: formData.get("relationship") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const user = await requireUser();
  const supabase = await createClient();
  if (!supabase) return { error: "Service unavailable" };

  await requireRole(supabase, user.id, organizationId, [...MANAGE_ROLES]);

  const { data: player, error: playerError } = await supabase
    .from("players")
    .select("id")
    .eq("id", parsed.data.player_id)
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .single();

  if (playerError || !player) {
    return { error: "Player not found or not accessible" };
  }

  const adminClient = createAdminClient();
  if (!adminClient) return { error: "Service unavailable" };

  // adminClient bypasses RLS for the cross-org profile lookup, same pattern
  // as inviteMemberAction: the guardian is not a member of this org, so the
  // regular client cannot see their profile.
  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("id")
    .eq("email", parsed.data.email)
    .limit(1)
    .single();

  if (profileError || !profile) {
    return { error: "This person must register an account before being granted portal access." };
  }

  // unique(player_id, user_id) means a previously revoked grant must be
  // reactivated via UPDATE, not re-inserted.
  const { data: existing } = await supabase
    .from("portal_access")
    .select("id, status")
    .eq("player_id", parsed.data.player_id)
    .eq("user_id", profile.id)
    .limit(1)
    .single();

  let portalAccessId: string;

  if (existing) {
    if (existing.status === "active") {
      return { error: "This person already has portal access to this player." };
    }
    const { error: reactivateError } = await supabase
      .from("portal_access")
      .update({
        status: "active",
        relationship: parsed.data.relationship,
        granted_by: user.id,
        granted_at: new Date().toISOString(),
        revoked_at: null,
        revoked_by: null,
      })
      .eq("id", existing.id);

    if (reactivateError) {
      console.error("[grantPortalAccessAction] reactivate failed:", reactivateError.message);
      return { error: "Could not grant portal access. Please try again." };
    }
    portalAccessId = existing.id;
  } else {
    const { data: inserted, error: insertError } = await supabase
      .from("portal_access")
      .insert({
        organization_id: organizationId,
        player_id: parsed.data.player_id,
        user_id: profile.id,
        relationship: parsed.data.relationship,
        granted_by: user.id,
      })
      .select("id")
      .single();

    if (insertError || !inserted) {
      console.error("[grantPortalAccessAction] insert failed:", insertError?.message);
      return { error: "Could not grant portal access. Please try again." };
    }
    portalAccessId = inserted.id;
  }

  await createAuditEvent(supabase, {
    organizationId,
    actorUserId: user.id,
    actionType: "portal_access.granted",
    targetType: "portal_access",
    targetId: portalAccessId,
    newValue: {
      player_id: parsed.data.player_id,
      relationship: parsed.data.relationship,
    },
  });

  revalidatePath("/settings/portal-access");

  return { success: true };
}

// ---------------------------------------------------------------------------
// Revoke portal access
// ---------------------------------------------------------------------------

export async function revokePortalAccessAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const organizationId = formData.get("organizationId");
  if (!organizationId || typeof organizationId !== "string") {
    return { error: "Invalid organization" };
  }

  const parsed = revokePortalAccessSchema.safeParse({
    portalAccessId: formData.get("portalAccessId"),
  });
  if (!parsed.success) return { error: "Invalid input" };

  const user = await requireUser();
  const supabase = await createClient();
  if (!supabase) return { error: "Service unavailable" };

  await requireRole(supabase, user.id, organizationId, [...MANAGE_ROLES]);

  const { data: grant, error: fetchError } = await supabase
    .from("portal_access")
    .select("id")
    .eq("id", parsed.data.portalAccessId)
    .eq("organization_id", organizationId)
    .eq("status", "active")
    .single();

  if (fetchError || !grant) return { error: "Portal access grant not found" };

  const { error: updateError } = await supabase
    .from("portal_access")
    .update({
      status: "revoked",
      revoked_at: new Date().toISOString(),
      revoked_by: user.id,
    })
    .eq("id", parsed.data.portalAccessId)
    .eq("organization_id", organizationId);

  if (updateError) {
    console.error("[revokePortalAccessAction] update failed:", updateError.message);
    return { error: "Could not revoke portal access. Please try again." };
  }

  await createAuditEvent(supabase, {
    organizationId,
    actorUserId: user.id,
    actionType: "portal_access.revoked",
    targetType: "portal_access",
    targetId: parsed.data.portalAccessId,
  });

  revalidatePath("/settings/portal-access");

  return { success: true };
}
