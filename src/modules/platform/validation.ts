import { z } from "zod";

export const organizationInputSchema = z.object({ name: z.string().trim().min(2).max(160), legalName: z.string().trim().min(2).max(240), slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(80), timezone: z.string().min(1).max(80), currency: z.string().length(3).toUpperCase(), contactEmail: z.string().trim().email().optional() });
export const organizationStatusSchema = z.enum(["active", "suspended", "rejected", "archived"]);
export const platformRoleSchema = z.enum(["NONE", "PRODUCT_OWNER", "PLATFORM_OWNER", "PLATFORM_ADMIN", "PLATFORM_SUPPORT", "PLATFORM_BILLING"]);
export const authInputSchema = z.object({ email: z.string().email(), password: z.string().min(1) });
export const registrationInputSchema = authInputSchema.extend({ fullName: z.string().trim().min(2).max(160) });
export type OrganizationInput = z.infer<typeof organizationInputSchema>;

export const planCodeSchema = z
  .string()
  .trim()
  .min(2, "Plan code must be at least 2 characters.")
  .max(40, "Plan code must be at most 40 characters.")
  .regex(
    /^[A-Z0-9_]{2,40}$/,
    "Plan code must contain only uppercase letters, numbers, and underscores (2-40 characters)."
  );

export const planNameSchema = z
  .string()
  .trim()
  .min(2, "Plan name must be at least 2 characters.")
  .max(80, "Plan name must be at most 80 characters.")
  .refine((val) => /[a-zA-Z]/.test(val), {
    message: "Plan name must contain at least one letter and cannot be numbers or symbols only.",
  })
  .refine((val) => /^[a-zA-Z0-9\s\-'.&()]+$/.test(val), {
    message: "Plan name contains invalid characters. Only letters, numbers, spaces, and - ' . & ( ) are allowed.",
  });

export const planInputSchema = z.object({
  code: planCodeSchema,
  name: planNameSchema,
  description: z.string().trim().max(240).optional(),
  monthlyPriceCents: z.number().int().nonnegative().nullable(),
  annualPriceCents: z.number().int().nonnegative().nullable(),
  currency: z.string().trim().length(3).toUpperCase(),
  trialDays: z.number().int().min(0).max(365),
  maxUsers: z.number().int().nonnegative().nullable(),
  maxStorageBytes: z.number().int().nonnegative().nullable(),
  billingInterval: z.enum(["monthly", "annual"]),
  active: z.boolean(),
});

export type PlanInput = z.infer<typeof planInputSchema>;
