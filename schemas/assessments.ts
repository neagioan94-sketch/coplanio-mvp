import { z } from "zod";

export const createAssessmentTypeSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  category: z.string().trim().optional(),
  unit: z.string().trim().optional(),
  description: z.string().trim().optional(),
  higher_is_better: z.boolean().nullish(),
});

export const updateAssessmentTypeSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  category: z.string().trim().optional(),
  unit: z.string().trim().optional(),
  description: z.string().trim().optional(),
  higher_is_better: z.boolean().nullish(),
});

export const assessmentTypeActionSchema = z.object({
  assessmentTypeId: z.string().min(1),
});

export const createAssessmentResultSchema = z.object({
  assessment_type_id: z.string().uuid("A valid assessment type is required"),
  player_id: z.string().uuid("A valid player is required"),
  team_id: z.string().uuid().optional(),
  assessed_at: z.string().min(1, "Assessment date is required"),
  value: z.coerce.number({ message: "Value must be a number" }),
  notes: z.string().trim().optional(),
});
