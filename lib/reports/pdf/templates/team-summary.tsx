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

interface TeamSummaryDocumentProps {
  report: ReportDetailRow;
}

export function TeamSummaryDocument({ report }: TeamSummaryDocumentProps) {
  const content = asRecord(report.content);

  return (
    <Document title={report.title}>
      <Page size="A4" style={styles.page}>
        <ReportHeader reportTypeLabel="Team Summary" report={report} />

        <KeyValueSection
          title="Team details"
          data={content}
          omitKeys={["roster", "recent_sessions", "recent_matches"]}
        />

        <DataTable
          title="Roster"
          columns={[
            { key: "player_name", label: "Player" },
            { key: "squad_number", label: "Squad #" },
            { key: "position", label: "Position" },
          ]}
          rows={asArray(content?.roster)}
          emptyLabel="No active roster entries."
        />

        <DataTable
          title="Recent training sessions"
          columns={[
            { key: "session_date", label: "Date" },
            { key: "title", label: "Title" },
            { key: "status", label: "Status" },
          ]}
          rows={asArray(content?.recent_sessions)}
          emptyLabel="No training sessions available."
        />

        <DataTable
          title="Recent matches"
          columns={[
            { key: "match_date", label: "Date" },
            { key: "opponent", label: "Opponent" },
            { key: "result_label", label: "Result" },
            { key: "goals_for", label: "GF" },
            { key: "goals_against", label: "GA" },
          ]}
          rows={asArray(content?.recent_matches)}
          emptyLabel="No matches available."
        />

        <ReportFooter />
      </Page>
    </Document>
  );
}
