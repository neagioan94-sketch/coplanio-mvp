import { z } from "zod";

export const PORTAL_RELATIONSHIPS = ["guardian", "player"] as const;

export const grantPortalAccessSchema = z.object({
  player_id: z.string().uuid("A valid player is required"),
  email: z.string().trim().email("A valid email is required"),
  relationship: z.enum(PORTAL_RELATIONSHIPS).default("guardian"),
});

export const revokePortalAccessSchema = z.object({
  portalAccessId: z.string().min(1),
});
