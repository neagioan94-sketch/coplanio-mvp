import { z } from "zod";

export const createOrganizationSchema = z.object({
  name: z.string().min(1, "Organization name is required").trim(),
  country: z.string().trim().optional(),
  timezone: z.string().trim().optional(),
});

export const inviteMemberSchema = z.object({
  email: z.email(),
  role: z.enum(["head_coach", "coach", "staff"]),
});

export const updateRoleSchema = z.object({
  memberId: z.string().min(1),
  role: z.enum(["head_coach", "coach", "staff"]),
});

export const memberActionSchema = z.object({
  memberId: z.string().min(1),
});

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
