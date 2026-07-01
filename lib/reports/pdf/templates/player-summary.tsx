import { Document, Page } from "@react-pdf/renderer";
import { styles } from "../styles";
import {
  ReportHeader,
  ReportFooter,
  KeyValueSection,
  DataTable,
  asArray,
  asRecord,
} from "../layout";
import type { ReportDetailRow } from "@/lib/reports/get-reports";

interface PlayerSummaryDocumentProps {
  report: ReportDetailRow;
}

export function PlayerSummaryDocument({ report }: PlayerSummaryDocumentProps) {
  const content = asRecord(report.content);

  return (
    <Document title={report.title}>
      <Page size="A4" style={styles.page}>
        <ReportHeader reportTypeLabel="Player Summary" report={report} />

        <KeyValueSection
          title="Player details"
          data={content}
          omitKeys={["team_memberships", "recent_attendance", "recent_assessments"]}
        />

        <DataTable
          title="Team memberships"
          columns={[
            { key: "team_name", label: "Team" },
            { key: "squad_number", label: "Squad #" },
            { key: "status", label: "Status" },
          ]}
          rows={asArray(content?.team_memberships)}
          emptyLabel="No active team memberships."
        />

        <DataTable
          title="Recent attendance"
          columns={[
            { key: "session_date", label: "Date" },
            { key: "session_title", label: "Session" },
            { key: "status", label: "Status" },
          ]}
          rows={asArray(content?.recent_attendance)}
          emptyLabel="No attendance records available."
        />

        <DataTable
          title="Recent assessments"
          columns={[
            { key: "assessed_at", label: "Date" },
            { key: "assessment_type", label: "Assessment" },
            { key: "value", label: "Value" },
            { key: "unit", label: "Unit" },
          ]}
          rows={asArray(content?.recent_assessments)}
          emptyLabel="No assessment results available."
        />

        <ReportFooter />
      </Page>
    </Document>
  );
}
