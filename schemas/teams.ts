import { z } from "zod";

export const createTeamSchema = z.object({
  name: z
    .string()
    .min(2, "Team name must be at least 2 characters")
    .max(100, "Team name must be at most 100 characters")
    .trim(),
  age_group: z.string().trim().max(50).optional(),
  season: z.string().trim().max(50).optional(),
  level: z.string().trim().max(50).optional(),
});

export const updateTeamSchema = createTeamSchema;

export const assignStaffSchema = z.object({
  userId: z.string().min(1, "Member is required"),
  staffRole: z.enum(["head_coach", "coach", "staff"]),
});

export const updateStaffRoleSchema = z.object({
  teamStaffId: z.string().min(1),
  staffRole: z.enum(["head_coach", "coach", "staff"]),
});

export const teamStaffActionSchema = z.object({
  teamStaffId: z.string().min(1),
});

export const teamActionSchema = z.object({
  teamId: z.string().min(1),
});
