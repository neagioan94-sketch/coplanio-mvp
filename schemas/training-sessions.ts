import { z } from "zod";

export const createSessionSchema = z.object({
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
  status: z.enum(["planned", "completed", "cancelled"]).default("planned"),
  notes: z.string().trim().optional(),
});

export const updateSessionSchema = z.object({
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
  status: z.enum(["planned", "completed", "cancelled"]),
  notes: z.string().trim().optional(),
});

export const sessionActionSchema = z.object({
  sessionId: z.string().min(1),
});

export const addSessionExerciseSchema = z.object({
  exercise_id: z.string().uuid("A valid exercise is required"),
  planned_duration_minutes: z
    .number()
    .int()
    .min(1)
    .optional()
    .or(z.nan().transform(() => undefined)),
  notes: z.string().trim().optional(),
});

export const updateSessionExerciseSchema = z.object({
  sessionExerciseId: z.string().min(1),
  planned_duration_minutes: z
    .number()
    .int()
    .min(1)
    .optional()
    .or(z.nan().transform(() => undefined)),
  notes: z.string().trim().optional(),
});

export const reorderSessionExerciseSchema = z.object({
  sessionExerciseId: z.string().min(1),
  direction: z.enum(["up", "down"]),
});

export const removeSessionExerciseSchema = z.object({
  sessionExerciseId: z.string().min(1),
});
