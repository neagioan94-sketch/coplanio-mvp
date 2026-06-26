import { z } from "zod";

export const createPlayerSchema = z.object({
  first_name: z.string().trim().min(1, "First name is required"),
  last_name: z.string().trim().min(1, "Last name is required"),
  display_name: z.string().trim().optional(),
  date_of_birth: z
    .string()
    .trim()
    .refine((v) => !v || !isNaN(Date.parse(v)), { message: "Invalid date of birth" })
    .optional(),
  primary_position: z.string().trim().optional(),
  preferred_foot: z.enum(["left", "right", "both", "unknown"]).optional(),
  notes: z.string().trim().optional(),
  status: z.enum(["active", "inactive", "archived"]).default("active"),
});

export const updatePlayerSchema = createPlayerSchema;

export const playerActionSchema = z.object({
  playerId: z.string().min(1),
});

export const assignPlayerTeamSchema = z.object({
  team_id: z.string().min(1, "Team is required"),
  squad_number: z
    .number()
    .int()
    .min(1)
    .max(99)
    .optional()
    .or(z.nan().transform(() => undefined)),
  start_date: z
    .string()
    .trim()
    .refine((v) => !v || !isNaN(Date.parse(v)), { message: "Invalid start date" })
    .optional(),
});

export const updatePlayerTeamSchema = z.object({
  membership_id: z.string().min(1),
  squad_number: z
    .number()
    .int()
    .min(1)
    .max(99)
    .optional()
    .or(z.nan().transform(() => undefined)),
  end_date: z
    .string()
    .trim()
    .refine((v) => !v || !isNaN(Date.parse(v)), { message: "Invalid end date" })
    .optional(),
  status: z.enum(["active", "inactive", "transferred", "archived"]).optional(),
});

export const removePlayerTeamSchema = z.object({
  membership_id: z.string().min(1),
});
