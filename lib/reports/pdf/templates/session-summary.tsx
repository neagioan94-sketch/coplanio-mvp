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

interface SessionSummaryDocumentProps {
  report: ReportDetailRow;
}

export function SessionSummaryDocument({ report }: SessionSummaryDocumentProps) {
  const content = asRecord(report.content);

  return (
    <Document title={report.title}>
      <Page size="A4" style={styles.page}>
        <ReportHeader reportTypeLabel="Training Session Summary" report={report} />

        <KeyValueSection
          title="Session details"
          data={content}
          omitKeys={["attendance_summary", "attendance_roster", "exercises"]}
        />

        <KeyValueSection
          title="Attendance summary"
          data={asRecord(content?.attendance_summary)}
        />

        <DataTable
          title="Attendance roster"
          columns={[
            { key: "player_name", label: "Player" },
            { key: "status", label: "Status" },
            { key: "notes", label: "Notes" },
          ]}
          rows={asArray(content?.attendance_roster)}
          emptyLabel="No attendance records available."
        />

        <DataTable
          title="Exercises"
          columns={[
            { key: "sort_order", label: "#" },
            { key: "name", label: "Exercise" },
            { key: "category", label: "Category" },
            { key: "planned_duration_minutes", label: "Duration (min)" },
          ]}
          rows={asArray(content?.exercises)}
          emptyLabel="No exercises planned for this session."
        />

        <ReportFooter />
      </Page>
    </Document>
  );
}
