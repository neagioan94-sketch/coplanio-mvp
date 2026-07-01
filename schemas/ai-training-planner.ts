import { z } from "zod";

export const generatePlanInputSchema = z.object({
  team_id: z.string().uuid("A valid team is required"),
  focus: z.string().trim().min(1, "Describe what this session should focus on").max(500),
  target_duration_minutes: z
    .number()
    .int()
    .min(1)
    .optional()
    .or(z.nan().transform(() => undefined)),
  max_exercise_count: z
    .number()
    .int()
    .min(1)
    .max(15)
    .optional()
    .or(z.nan().transform(() => undefined)),
});

export const PLAN_SECTIONS = ["warmup", "main", "cooldown"] as const;

export const llmDraftItemSchema = z.object({
  exercise_id: z.string(),
  planned_duration_minutes: z.number().int(),
  rationale: z.string(),
});

export const llmDraftSectionSchema = z.object({
  section: z.enum(PLAN_SECTIONS),
  items: z.array(llmDraftItemSchema),
});

export const llmDraftSchema = z.object({
  title: z.string(),
  objective: z.string(),
  suggested_duration_minutes: z.number().int(),
  sections: z.array(llmDraftSectionSchema),
});

export type LlmDraft = z.infer<typeof llmDraftSchema>;

export const confirmPlanExerciseSchema = z.object({
  exercise_id: z.string().uuid(),
  section: z.enum(PLAN_SECTIONS),
  planned_duration_minutes: z
    .number()
    .int()
    .min(1)
    .optional()
    .or(z.nan().transform(() => undefined)),
  notes: z.string().trim().optional(),
});

export const confirmPlanSchema = z.object({
  team_id: z.string().uuid("A valid team is required"),
  title: z.string().trim().min(1, "Title is required"),
  session_date: z.string().min(1, "Session date is required"),
  start_time: z.string().trim().optional(),
  duration_minutes: z
    .number()
    .int()
    .min(1)
    .optional()
    .or(z.nan().transform(() => undefined)),
  objective: z.string().trim().optional(),
  location: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  exercises: z.array(confirmPlanExerciseSchema),
});
