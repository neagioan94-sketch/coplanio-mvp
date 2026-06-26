import { z } from "zod";

export const MATCH_STATUSES = ["scheduled", "completed", "cancelled"] as const;
export const HOME_AWAY_VALUES = ["home", "away", "neutral"] as const;

export const createMatchSchema = z.object({
  team_id: z.string().uuid("A valid team is required"),
  match_date: z.string().min(1, "Match date is required"),
  opponent: z.string().trim().min(1, "Opponent is required"),
  location: z.string().trim().optional(),
  competition: z.string().trim().optional(),
  home_away: z.enum(HOME_AWAY_VALUES).optional(),
  goals_for: z
    .number()
    .int()
    .min(0)
    .optional()
    .or(z.nan().transform(() => undefined)),
  goals_against: z
    .number()
    .int()
    .min(0)
    .optional()
    .or(z.nan().transform(() => undefined)),
  status: z.enum(MATCH_STATUSES).default("scheduled"),
  notes: z.string().trim().optional(),
});

export const updateMatchSchema = z.object({
  match_date: z.string().min(1, "Match date is required"),
  opponent: z.string().trim().min(1, "Opponent is required"),
  location: z.string().trim().optional(),
  competition: z.string().trim().optional(),
  home_away: z.enum(HOME_AWAY_VALUES).optional(),
  goals_for: z
    .number()
    .int()
    .min(0)
    .optional()
    .or(z.nan().transform(() => undefined)),
  goals_against: z
    .number()
    .int()
    .min(0)
    .optional()
    .or(z.nan().transform(() => undefined)),
  status: z.enum(MATCH_STATUSES),
  notes: z.string().trim().optional(),
});

export const matchActionSchema = z.object({
  matchId: z.string().min(1),
});
