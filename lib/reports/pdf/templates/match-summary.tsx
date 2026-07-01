import { Document, Page } from "@react-pdf/renderer";
import { styles } from "../styles";
import { ReportHeader, ReportFooter, KeyValueSection, asRecord } from "../layout";
import type { ReportDetailRow } from "@/lib/reports/get-reports";

interface MatchSummaryDocumentProps {
  report: ReportDetailRow;
}

export function MatchSummaryDocument({ report }: MatchSummaryDocumentProps) {
  const content = asRecord(report.content);

  return (
    <Document title={report.title}>
      <Page size="A4" style={styles.page}>
        <ReportHeader reportTypeLabel="Match Summary" report={report} />

        <KeyValueSection title="Match details" data={content} />

        <ReportFooter />
      </Page>
    </Document>
  );
}
