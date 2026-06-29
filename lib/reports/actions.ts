"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/db/supabase-server";
import { requireUser } from "@/lib/auth/get-user";
import { requireRole, requireActiveOrganization } from "@/lib/organizations/get-organization";
import { createAuditEvent } from "@/lib/audit/create-audit-event";
import { createReportSchema, reportActionSchema } from "@/schemas/reports";
import { buildReportContent } from "@/lib/reports/build-report-content";

type ActionState = { error?: string; success?: boolean } | undefined;

const MANAGE_ROLES = ["organization_admin", "head_coach", "coach"] as const;

// ---------------------------------------------------------------------------
// Create report
// ---------------------------------------------------------------------------

export async function createReportAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const sourceEntityTypeRaw = formData.get("source_entity_type");
  const sourceEntityIdRaw = formData.get("source_entity_id");

  const parsed = createReportSchema.safeParse({
    title: formData.get("title"),
    report_type: formData.get("report_type"),
    source_entity_type:
      sourceEntityTypeRaw && typeof sourceEntityTypeRaw === "string" && sourceEntityTypeRaw.trim()
        ? sourceEntityTypeRaw.trim()
        : undefined,
    source_entity_id:
      sourceEntityIdRaw && typeof sourceEntityIdRaw === "string" && sourceEntityIdRaw.trim()
        ? sourceEntityIdRaw.trim()
        : undefined,
    summary: formData.get("summary") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const user = await requireUser();
  const supabase = await createClient();
  if (!supabase) return { error: "Service unavailable" };

  const activeOrg = await requireActiveOrganization(supabase, user.id);
  const { organizationId } = activeOrg;
  await requireRole(supabase, user.id, organizationId, [...MANAGE_ROLES]);

  let content: Record<string, unknown> | null = null;
  let summary: string | null = parsed.data.summary ?? null;

  if (parsed.data.source_entity_type && parsed.data.source_entity_id) {
    const built = await buildReportContent(
      supabase,
      organizationId,
      parsed.data.source_entity_type,
      parsed.data.source_entity_id,
    );
    if (!built) {
      return { error: "Source entity not found or not accessible" };
    }
    content = built.content;
    if (!summary) {
      summary = built.summary;
    }
  }

  const { data: report, error: insertError } = await supabase
    .from("reports")
    .insert({
      organization_id: organizationId,
      title: parsed.data.title,
      report_type: parsed.data.report_type,
      source_entity_type: parsed.data.source_entity_type ?? null,
      source_entity_id: parsed.data.source_entity_id ?? null,
      content,
      summary,
      status: "generated",
      generated_by: user.id,
    })
    .select("id")
    .single();

  if (insertError || !report) {
    console.error("[createReportAction] insert failed:", insertError?.message);
    return { error: "Could not create report. Please try again." };
  }

  await createAuditEvent(supabase, {
    organizationId,
    actorUserId: user.id,
    actionType: "report.created",
    targetType: "report",
    targetId: report.id,
    newValue: { title: parsed.data.title, report_type: parsed.data.report_type },
  });

  redirect(`/reports/${report.id}`);
}

// ---------------------------------------------------------------------------
// Archive report
// ---------------------------------------------------------------------------

export async function archiveReportAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = reportActionSchema.safeParse({
    reportId: formData.get("reportId"),
  });
  if (!parsed.success) return { error: "Invalid input" };

  const user = await requireUser();
  const supabase = await createClient();
  if (!supabase) return { error: "Service unavailable" };

  const activeOrg = await requireActiveOrganization(supabase, user.id);
  const { organizationId } = activeOrg;
  await requireRole(supabase, user.id, organizationId, [...MANAGE_ROLES]);

  const { data: report, error: fetchError } = await supabase
    .from("reports")
    .select("id")
    .eq("id", parsed.data.reportId)
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .single();

  if (fetchError || !report) return { error: "Report not found" };

  const { error: updateError } = await supabase
    .from("reports")
    .update({
      status: "archived",
      deleted_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.reportId)
    .eq("organization_id", organizationId);

  if (updateError) {
    console.error("[archiveReportAction] update failed:", updateError.message);
    return { error: "Could not archive report. Please try again." };
  }

  await createAuditEvent(supabase, {
    organizationId,
    actorUserId: user.id,
    actionType: "report.archived",
    targetType: "report",
    targetId: parsed.data.reportId,
  });

  redirect("/reports");
}
