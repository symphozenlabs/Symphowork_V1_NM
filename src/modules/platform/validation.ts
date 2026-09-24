import { z } from "zod";

export const organizationInputSchema = z.object({ name: z.string().trim().min(2).max(160), legalName: z.string().trim().min(2).max(240), slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(80), timezone: z.string().min(1).max(80), currency: z.string().length(3).toUpperCase() });
export const authInputSchema = z.object({ email: z.string().email(), password: z.string().min(1) });
export const registrationInputSchema = authInputSchema.extend({ fullName: z.string().trim().min(2).max(160) });
export type OrganizationInput = z.infer<typeof organizationInputSchema>;
