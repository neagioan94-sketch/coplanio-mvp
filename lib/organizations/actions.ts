"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
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

  const supabase = await createClient();
  if (!supabase) return { error: "Service unavailable" };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const adminClient = createAdminClient();
  if (!adminClient) return { error: "Service unavailable" };

  const { data: org, error: orgError } = await adminClient
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

  // Ensure profile row exists before inserting membership (FK: memberships.user_id → profiles.id)
  const { error: profileError } = await adminClient
    .from("profiles")
    .upsert({ id: user.id, email: user.email }, { onConflict: "id" });

  if (profileError) {
    console.error("[createOrganizationAction] profile upsert failed:", profileError.message);
    await adminClient.from("organizations").delete().eq("id", org.id);
    return { error: "Could not complete organization setup. Please try again." };
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

  const adminClient = createAdminClient();
  if (!adminClient) return { error: "Service unavailable" };

  // adminClient bypasses RLS: invited memberships have status='invited' so the
  // normal client cannot read or update them (policies require active membership).
  const { data: membership, error: fetchError } = await adminClient
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

  // Switch the active org context to the one just joined, so the user lands
  // in it immediately instead of staying on whichever org they joined first.
  const cookieStore = await cookies();
  cookieStore.set("active_organization_id", organizationId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });

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

  // adminClient bypasses RLS for the cross-org profile lookup:
  // the invitee is not yet a member of this org, so the regular client
  // cannot see their profile (RLS only allows reading profiles of existing
  // shared-org members).
  const adminClient = createAdminClient();
  if (!adminClient) return { error: "Service unavailable" };

  const { data: profile, error: profileError } = await adminClient
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

  // unique(organization_id, user_id) means a removed/suspended row from a prior
  // membership must be reactivated via UPDATE, not re-inserted.
  const { data: existing } = await supabase
    .from("memberships")
    .select("id, status")
    .eq("organization_id", organizationId)
    .eq("user_id", profile.id)
    .limit(1)
    .single();

  if (existing?.status === "active") {
    return { error: "This user is already an active member." };
  }
  if (existing?.status === "invited") {
    return { error: "This user already has a pending invitation." };
  }

  if (existing) {
    const { error: updateError } = await supabase
      .from("memberships")
      .update({
        role: parsed.data.role,
        status: "invited",
        invited_by: user.id,
      })
      .eq("id", existing.id);

    if (updateError) {
      console.error("[inviteMemberAction] update failed:", updateError.message);
      return { error: "Could not send invitation. Please try again." };
    }
  } else {
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
  }

  revalidatePath("/settings/members");

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

  revalidatePath("/settings/members");

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

  revalidatePath("/settings/members");

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

  revalidatePath("/settings/members");

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

  // The org name is rendered by the shared app/(dashboard)/layout.tsx (sidebar)
  // on every route in the group — revalidate the layout, not just this page,
  // or the sidebar keeps showing the stale name on /teams, /players, etc.
  revalidatePath("/settings/organization");
  revalidatePath("/settings/organization", "layout");

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

  revalidatePath("/settings/members");

  return { success: true };
}

// ---------------------------------------------------------------------------
// Member: switch active organization
// ---------------------------------------------------------------------------

export async function switchOrganizationAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const organizationId = formData.get("organizationId");
  if (!organizationId || typeof organizationId !== "string") {
    return { error: "Invalid organization" };
  }

  const user = await requireUser();

  const supabase = await createClient();
  if (!supabase) return { error: "Service unavailable" };

  // Re-validate membership server-side -- never trust the form value alone,
  // even though getActiveOrganization() re-checks this too on every read.
  const { data: membership } = await supabase
    .from("memberships")
    .select("id")
    .eq("user_id", user.id)
    .eq("organization_id", organizationId)
    .eq("status", "active")
    .limit(1)
    .single();

  if (!membership) {
    return { error: "You are not an active member of that organization" };
  }

  const cookieStore = await cookies();
  cookieStore.set("active_organization_id", organizationId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });

  redirect("/dashboard");
}

// Re-export requireOrganizationAccess for use in layout
export { requireOrganizationAccess };
