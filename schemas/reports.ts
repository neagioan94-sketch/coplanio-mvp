import { z } from "zod";

export const REPORT_TYPES = [
  "player_summary",
  "team_summary",
  "session_summary",
  "match_summary",
  "assessment_summary",
] as const;

// "assessment" per DB constraint reports_source_entity_type_check (not "assessment_result")
export const SOURCE_ENTITY_TYPES = [
  "player",
  "team",
  "training_session",
  "match",
  "assessment",
] as const;

export const REPORT_STATUSES = ["draft", "generated", "archived"] as const;

export const createReportSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  report_type: z.enum(REPORT_TYPES, { message: "A valid report type is required" }),
  source_entity_type: z.enum(SOURCE_ENTITY_TYPES).optional(),
  source_entity_id: z.string().uuid().optional(),
  summary: z.string().trim().optional(),
});

export const reportActionSchema = z.object({
  reportId: z.string().min(1),
});
