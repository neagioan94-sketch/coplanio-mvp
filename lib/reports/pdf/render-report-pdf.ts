import { renderToBuffer } from "@react-pdf/renderer";
import type { ReportDetailRow } from "@/lib/reports/get-reports";
import { PlayerSummaryDocument } from "./templates/player-summary";
import { TeamSummaryDocument } from "./templates/team-summary";
import { SessionSummaryDocument } from "./templates/session-summary";
import { MatchSummaryDocument } from "./templates/match-summary";
import { AssessmentSummaryDocument } from "./templates/assessment-summary";

export async function renderReportPdf(report: ReportDetailRow): Promise<Buffer> {
  switch (report.reportType) {
    case "player_summary":
      return renderToBuffer(PlayerSummaryDocument({ report }));
    case "team_summary":
      return renderToBuffer(TeamSummaryDocument({ report }));
    case "session_summary":
      return renderToBuffer(SessionSummaryDocument({ report }));
    case "match_summary":
      return renderToBuffer(MatchSummaryDocument({ report }));
    case "assessment_summary":
      return renderToBuffer(AssessmentSummaryDocument({ report }));
    default:
      throw new Error(`Unsupported report type for PDF export: ${report.reportType}`);
  }
}
