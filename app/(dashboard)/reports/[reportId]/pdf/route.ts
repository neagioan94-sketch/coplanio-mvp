import { createClient } from "@/lib/db/supabase-server";
import { requireUser } from "@/lib/auth/get-user";
import { requireActiveOrganization, canManageReports } from "@/lib/organizations/get-organization";
import { getReport } from "@/lib/reports/get-reports";
import { createAuditEvent } from "@/lib/audit/create-audit-event";
import { renderReportPdf } from "@/lib/reports/pdf/render-report-pdf";
import { toSafeFilename } from "@/lib/reports/pdf/filename";

interface RouteContext {
  params: Promise<{ reportId: string }>;
}

export async function GET(_request: Request, { params }: RouteContext) {
  const { reportId } = await params;

  const user = await requireUser();
  const supabase = await createClient();
  if (!supabase) return new Response("Service unavailable", { status: 503 });

  const activeOrg = await requireActiveOrganization(supabase, user.id);
  const { organizationId } = activeOrg;

  const canExport = await canManageReports(supabase, user.id, organizationId);
  if (!canExport) return new Response("Forbidden", { status: 403 });

  const report = await getReport(supabase, reportId, organizationId);
  if (!report) return new Response("Not found", { status: 404 });

  let pdfBytes: Buffer;
  try {
    pdfBytes = await renderReportPdf(report);
  } catch (err) {
    console.error("[GET /reports/[reportId]/pdf] render failed:", err);
    return new Response("Could not generate PDF", { status: 500 });
  }

  await createAuditEvent(supabase, {
    organizationId,
    actorUserId: user.id,
    actionType: "report.pdf_exported",
    targetType: "report",
    targetId: report.id,
    source: "api_route",
  });

  const filename = toSafeFilename(report.title, report.id);

  return new Response(new Uint8Array(pdfBytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}.pdf"`,
      "Content-Length": String(pdfBytes.length),
      "Cache-Control": "private, no-store",
    },
  });
}
