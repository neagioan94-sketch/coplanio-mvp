import type { SupabaseClient } from "@supabase/supabase-js";

export type ReportRow = {
  id: string;
  organizationId: string;
  title: string;
  reportType: string;
  sourceEntityType: string | null;
  sourceEntityId: string | null;
  summary: string | null;
  status: string;
  generatedBy: string | null;
  createdAt: string;
  isArchived: boolean;
};

export type ReportDetailRow = ReportRow & {
  content: Record<string, unknown> | null;
};

interface GetReportsOptions {
  reportType?: string;
  status?: string;
}

export async function getReports(
  supabase: SupabaseClient,
  organizationId: string,
  opts: GetReportsOptions = {},
): Promise<ReportRow[]> {
  let query = supabase
    .from("reports")
    .select(
      "id, organization_id, title, report_type, source_entity_type, source_entity_id, summary, status, generated_by, created_at, deleted_at",
    )
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (opts.reportType) {
    query = query.eq("report_type", opts.reportType);
  }
  if (opts.status) {
    query = query.eq("status", opts.status);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[getReports] query failed:", error.message);
    return [];
  }

  return (data ?? []).map((r) => ({
    id: r.id,
    organizationId: r.organization_id,
    title: r.title,
    reportType: r.report_type,
    sourceEntityType: r.source_entity_type,
    sourceEntityId: r.source_entity_id,
    summary: r.summary,
    status: r.status,
    generatedBy: r.generated_by,
    createdAt: r.created_at,
    isArchived: r.deleted_at !== null,
  }));
}

export async function getReport(
  supabase: SupabaseClient,
  reportId: string,
  organizationId: string,
): Promise<ReportDetailRow | null> {
  const { data, error } = await supabase
    .from("reports")
    .select(
      "id, organization_id, title, report_type, source_entity_type, source_entity_id, content, summary, status, generated_by, created_at, deleted_at",
    )
    .eq("id", reportId)
    .eq("organization_id", organizationId)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    organizationId: data.organization_id,
    title: data.title,
    reportType: data.report_type,
    sourceEntityType: data.source_entity_type,
    sourceEntityId: data.source_entity_id,
    content: data.content as Record<string, unknown> | null,
    summary: data.summary,
    status: data.status,
    generatedBy: data.generated_by,
    createdAt: data.created_at,
    isArchived: data.deleted_at !== null,
  };
}
