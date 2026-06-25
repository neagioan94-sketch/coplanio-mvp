"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/db/supabase-server";
import { createAdminClient } from "@/lib/db/supabase-admin";
import { requireUser } from "@/lib/auth/get-user";
import {
  requireRole,
  requireOrganizationAccess,
} from "@/lib/organizations/get-organization";
import { countActiveAdmins } from "@/lib/organizations/get-members";
import {
  createOrganizationSchema,
  inviteMemberSchema,
  updateRoleSchema,
  memberActionSchema,
} from "@/schemas/organization";

type ActionState = { error?: string; success?: boolean } | undefined;

// ---------------------------------------------------------------------------
// Bootstrap: create first organization + admin membership
// ---------------------------------------------------------------------------

export async function createOrganizationAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = createOrganizationSchema.safeParse({
    name: formData.get("name"),
    country: formData.get("country") || undefined,
    timezone: formData.get("timezone") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const user = await requireUser();

  const supabase = await createClient();
  if (!supabase) return { error: "Service unavailable" };

  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .insert({
      name: parsed.data.name,
      country: parsed.data.country ?? null,
      timezone: parsed.data.timezone ?? "UTC",
      created_by: user.id,
    })
    .select("id")
    .single();

  if (orgError || !org) {
    console.error("[createOrganizationAction] org insert failed:", orgError?.message);
    return { error: "Could not create organization. Please try again." };
  }

  const adminClient = createAdminClient();
  if (!adminClient) {
    await supabase.from("organizations").delete().eq("id", org.id);
    return { error: "Service unavailable" };
  }

  const { error: membershipError } = await adminClient
    .from("memberships")
    .insert({
      organization_id: org.id,
      user_id: user.id,
      role: "organization_admin",
      status: "active",
      joined_at: new Date().toISOString(),
    });

  if (membershipError) {
    console.error(
      "[createOrganizationAction] membership insert failed:",
      membershipError.message,
    );
    await adminClient.from("organizations").delete().eq("id", org.id);
    return { error: "Could not complete organization setup. Please try again." };
  }

  redirect("/dashboard");
}

// ---------------------------------------------------------------------------
// Invitee: accept own invited membership
// ---------------------------------------------------------------------------

export async function acceptInvitationAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const organizationId = formData.get("organizationId");
  if (!organizationId || typeof organizationId !== "string") {
    return { error: "Invalid invitation" };
  }

  const user = await requireUser();

  const supabase = await createClient();
  if (!supabase) return { error: "Service unavailable" };

  const { data: membership, error: fetchError } = await supabase
    .from("memberships")
    .select("id")
    .eq("user_id", user.id)
    .eq("organization_id", organizationId)
    .eq("status", "invited")
    .limit(1)
    .single();

  if (fetchError || !membership) {
    return { error: "No pending invitation found" };
  }

  const adminClient = createAdminClient();
  if (!adminClient) return { error: "Service unavailable" };

  const { error: updateError } = await adminClient
    .from("memberships")
    .update({ status: "active", joined_at: new Date().toISOString() })
    .eq("id", membership.id)
    .eq("user_id", user.id)
    .eq("status", "invited");

  if (updateError) {
    console.error("[acceptInvitationAction] update failed:", updateError.message);
    return { error: "Could not accept invitation. Please try again." };
  }

  redirect("/dashboard");
}

// ---------------------------------------------------------------------------
// Admin: invite an existing registered user
// ---------------------------------------------------------------------------

export async function inviteMemberAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const organizationId = formData.get("organizationId");
  if (!organizationId || typeof organizationId !== "string") {
    return { error: "Invalid organization" };
  }

  const parsed = inviteMemberSchema.safeParse({
    email: formData.get("email"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const user = await requireUser();

  const supabase = await createClient();
  if (!supabase) return { error: "Service unavailable" };

  await requireRole(supabase, user.id, organizationId, ["organization_admin"]);

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", parsed.data.email)
    .limit(1)
    .single();

  if (profileError || !profile) {
    return {
      error: "User must register before being invited to an organization.",
    };
  }

  const { data: existing } = await supabase
    .from("memberships")
    .select("id, status")
    .eq("organization_id", organizationId)
    .eq("user_id", profile.id)
    .in("status", ["active", "invited"])
    .limit(1)
    .single();

  if (existing) {
    return {
      error:
        existing.status === "active"
          ? "This user is already an active member."
          : "This user already has a pending invitation.",
    };
  }

  const { error: insertError } = await supabase.from("memberships").insert({
    organization_id: organizationId,
    user_id: profile.id,
    role: parsed.data.role,
    status: "invited",
    invited_by: user.id,
  });

  if (insertError) {
    console.error("[inviteMemberAction] insert failed:", insertError.message);
    return { error: "Could not send invitation. Please try again." };
  }

  return { success: true };
}

// ---------------------------------------------------------------------------
// Admin: update a member's role
// ---------------------------------------------------------------------------

export async function updateMemberRoleAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const organizationId = formData.get("organizationId");
  if (!organizationId || typeof organizationId !== "string") {
    return { error: "Invalid organization" };
  }

  const parsed = updateRoleSchema.safeParse({
    memberId: formData.get("memberId"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const user = await requireUser();

  const supabase = await createClient();
  if (!supabase) return { error: "Service unavailable" };

  await requireRole(supabase, user.id, organizationId, ["organization_admin"]);

  const { data: target, error: targetError } = await supabase
    .from("memberships")
    .select("id, role, status")
    .eq("id", parsed.data.memberId)
    .eq("organization_id", organizationId)
    .single();

  if (targetError || !target) return { error: "Member not found" };

  if (target.role === "organization_admin" && target.status === "active") {
    const adminCount = await countActiveAdmins(supabase, organizationId);
    if (adminCount <= 1) {
      return { error: "Cannot change the role of the last active administrator." };
    }
  }

  const { error: updateError } = await supabase
    .from("memberships")
    .update({ role: parsed.data.role })
    .eq("id", parsed.data.memberId)
    .eq("organization_id", organizationId);

  if (updateError) {
    console.error("[updateMemberRoleAction] update failed:", updateError.message);
    return { error: "Could not update role. Please try again." };
  }

  return { success: true };
}

// ---------------------------------------------------------------------------
// Admin: suspend a member
// ---------------------------------------------------------------------------

export async function suspendMemberAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const organizationId = formData.get("organizationId");
  if (!organizationId || typeof organizationId !== "string") {
    return { error: "Invalid organization" };
  }

  const parsed = memberActionSchema.safeParse({
    memberId: formData.get("memberId"),
  });

  if (!parsed.success) return { error: "Invalid input" };

  const user = await requireUser();

  const supabase = await createClient();
  if (!supabase) return { error: "Service unavailable" };

  await requireRole(supabase, user.id, organizationId, ["organization_admin"]);

  const { data: target, error: targetError } = await supabase
    .from("memberships")
    .select("id, role, status")
    .eq("id", parsed.data.memberId)
    .eq("organization_id", organizationId)
    .single();

  if (targetError || !target) return { error: "Member not found" };

  if (target.role === "organization_admin" && target.status === "active") {
    const adminCount = await countActiveAdmins(supabase, organizationId);
    if (adminCount <= 1) {
      return { error: "Cannot suspend the last active administrator." };
    }
  }

  const { error: updateError } = await supabase
    .from("memberships")
    .update({ status: "suspended" })
    .eq("id", parsed.data.memberId)
    .eq("organization_id", organizationId);

  if (updateError) {
    console.error("[suspendMemberAction] update failed:", updateError.message);
    return { error: "Could not suspend member. Please try again." };
  }

  return { success: true };
}

// ---------------------------------------------------------------------------
// Admin: remove a member
// ---------------------------------------------------------------------------

export async function removeMemberAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const organizationId = formData.get("organizationId");
  if (!organizationId || typeof organizationId !== "string") {
    return { error: "Invalid organization" };
  }

  const parsed = memberActionSchema.safeParse({
    memberId: formData.get("memberId"),
  });

  if (!parsed.success) return { error: "Invalid input" };

  const user = await requireUser();

  const supabase = await createClient();
  if (!supabase) return { error: "Service unavailable" };

  await requireRole(supabase, user.id, organizationId, ["organization_admin"]);

  const { data: target, error: targetError } = await supabase
    .from("memberships")
    .select("id, role, status")
    .eq("id", parsed.data.memberId)
    .eq("organization_id", organizationId)
    .single();

  if (targetError || !target) return { error: "Member not found" };

  if (target.role === "organization_admin" && target.status === "active") {
    const adminCount = await countActiveAdmins(supabase, organizationId);
    if (adminCount <= 1) {
      return { error: "Cannot remove the last active administrator." };
    }
  }

  const { error: updateError } = await supabase
    .from("memberships")
    .update({ status: "removed" })
    .eq("id", parsed.data.memberId)
    .eq("organization_id", organizationId);

  if (updateError) {
    console.error("[removeMemberAction] update failed:", updateError.message);
    return { error: "Could not remove member. Please try again." };
  }

  return { success: true };
}

// ---------------------------------------------------------------------------
// Admin: update organization profile
// ---------------------------------------------------------------------------

export async function updateOrganizationAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const organizationId = formData.get("organizationId");
  if (!organizationId || typeof organizationId !== "string") {
    return { error: "Invalid organization" };
  }

  const parsed = createOrganizationSchema.safeParse({
    name: formData.get("name"),
    country: formData.get("country") || undefined,
    timezone: formData.get("timezone") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const user = await requireUser();

  const supabase = await createClient();
  if (!supabase) return { error: "Service unavailable" };

  await requireRole(supabase, user.id, organizationId, ["organization_admin"]);

  const { error: updateError } = await supabase
    .from("organizations")
    .update({
      name: parsed.data.name,
      country: parsed.data.country ?? null,
      timezone: parsed.data.timezone ?? "UTC",
    })
    .eq("id", organizationId);

  if (updateError) {
    console.error("[updateOrganizationAction] update failed:", updateError.message);
    return { error: "Could not update organization. Please try again." };
  }

  return { success: true };
}

// ---------------------------------------------------------------------------
// Admin: revoke a pending invitation
// ---------------------------------------------------------------------------

export async function revokeInvitationAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const organizationId = formData.get("organizationId");
  if (!organizationId || typeof organizationId !== "string") {
    return { error: "Invalid organization" };
  }

  const parsed = memberActionSchema.safeParse({
    memberId: formData.get("memberId"),
  });

  if (!parsed.success) return { error: "Invalid input" };

  const user = await requireUser();

  const supabase = await createClient();
  if (!supabase) return { error: "Service unavailable" };

  await requireRole(supabase, user.id, organizationId, ["organization_admin"]);

  const { data: target, error: targetError } = await supabase
    .from("memberships")
    .select("id, status")
    .eq("id", parsed.data.memberId)
    .eq("organization_id", organizationId)
    .eq("status", "invited")
    .single();

  if (targetError || !target) {
    return { error: "Pending invitation not found" };
  }

  const { error: updateError } = await supabase
    .from("memberships")
    .update({ status: "removed" })
    .eq("id", parsed.data.memberId)
    .eq("organization_id", organizationId);

  if (updateError) {
    console.error("[revokeInvitationAction] update failed:", updateError.message);
    return { error: "Could not revoke invitation. Please try again." };
  }

  return { success: true };
}

// Re-export requireOrganizationAccess for use in layout
export { requireOrganizationAccess };
