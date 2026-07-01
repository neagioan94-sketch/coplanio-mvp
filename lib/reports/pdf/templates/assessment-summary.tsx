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

interface AssessmentSummaryDocumentProps {
  report: ReportDetailRow;
}

export function AssessmentSummaryDocument({ report }: AssessmentSummaryDocumentProps) {
  const content = asRecord(report.content);

  return (
    <Document title={report.title}>
      <Page size="A4" style={styles.page}>
        <ReportHeader reportTypeLabel="Assessment Summary" report={report} />

        <KeyValueSection
          title="Assessment details"
          data={content}
          omitKeys={["player_history"]}
        />

        <DataTable
          title="Player history"
          columns={[
            { key: "assessed_at", label: "Date" },
            { key: "value", label: "Value" },
            { key: "unit", label: "Unit" },
          ]}
          rows={asArray(content?.player_history)}
          emptyLabel="No prior results for this assessment type and player."
        />

        <ReportFooter />
      </Page>
    </Document>
  );
}
