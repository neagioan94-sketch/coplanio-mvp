import { z } from "zod";

export const createExerciseSchema = z.object({
  name: z.string().trim().min(1, "Exercise name is required"),
  objective: z.string().trim().min(1, "Objective is required"),
  category: z.string().trim().optional(),
  description: z.string().trim().optional(),
  coaching_points: z.string().trim().optional(),
  duration_minutes: z
    .number()
    .int()
    .min(1)
    .optional()
    .or(z.nan().transform(() => undefined)),
  player_count_min: z
    .number()
    .int()
    .min(1)
    .optional()
    .or(z.nan().transform(() => undefined)),
  player_count_max: z
    .number()
    .int()
    .min(1)
    .optional()
    .or(z.nan().transform(() => undefined)),
  difficulty: z.enum(["low", "medium", "high"]).optional(),
});

export const updateExerciseSchema = createExerciseSchema;

export const exerciseActionSchema = z.object({
  exerciseId: z.string().min(1),
});
