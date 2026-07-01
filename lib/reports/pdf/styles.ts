import { StyleSheet } from "@react-pdf/renderer";

export const styles = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingBottom: 48,
    paddingHorizontal: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#27272a", // zinc-800
  },
  eyebrow: {
    fontSize: 9,
    color: "#71717a", // zinc-500
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: 700,
    color: "#18181b", // zinc-900
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: "row",
    marginTop: 10,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e4e4e7", // zinc-200
    paddingBottom: 12,
  },
  metaItem: {
    marginRight: 28,
  },
  metaLabel: {
    fontSize: 8,
    color: "#71717a",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 10,
    color: "#18181b",
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: "#18181b",
    marginBottom: 6,
  },
  paragraph: {
    fontSize: 10,
    color: "#3f3f46", // zinc-700
    lineHeight: 1.4,
  },
  emptyState: {
    fontSize: 9,
    color: "#a1a1aa", // zinc-400
    fontStyle: "italic",
  },
  table: {
    width: "100%",
  },
  tableHeaderRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#d4d4d8", // zinc-300
    paddingBottom: 4,
    marginBottom: 4,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#f4f4f5", // zinc-100
    paddingVertical: 4,
  },
  tableHeaderCell: {
    fontSize: 8,
    fontWeight: 700,
    color: "#71717a",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tableCell: {
    fontSize: 9,
    color: "#27272a",
  },
  kvRow: {
    flexDirection: "row",
    paddingVertical: 3,
    borderBottomWidth: 1,
    borderBottomColor: "#f4f4f5",
  },
  kvKey: {
    width: 140,
    fontSize: 9,
    fontWeight: 700,
    color: "#3f3f46",
  },
  kvValue: {
    flex: 1,
    fontSize: 9,
    color: "#52525b",
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8,
    color: "#a1a1aa",
    borderTopWidth: 1,
    borderTopColor: "#e4e4e7",
    paddingTop: 6,
  },
});
