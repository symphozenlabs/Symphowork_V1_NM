import { z } from "zod";

export const SUPPORTED_DATE_FORMATS = ["dd/MM/yyyy", "MM/dd/yyyy", "yyyy-MM-dd"] as const;
export const SUPPORTED_BILLING_CYCLES = ["monthly", "annual"] as const;

export const organizationInputSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Organization name must be at least 2 characters.")
      .max(160, "Organization name must be at most 160 characters."),
    legalName: z
      .string()
      .trim()
      .max(240, "Legal name must be at most 240 characters.")
      .optional()
      .or(z.literal("")),
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .min(2, "Slug must be at least 2 characters.")
      .max(80, "Slug must be at most 80 characters.")
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "Slug must contain only lowercase letters, numbers, and hyphens (no leading or trailing hyphens)."
      ),
    website: z
      .string()
      .trim()
      .max(240, "Website must be at most 240 characters.")
      .optional()
      .or(z.literal(""))
      .refine((val) => {
        if (!val || val.trim() === "") return true;
        try {
          const candidate = val.includes("://") ? val : `https://${val}`;
          const url = new URL(candidate);
          return (
            (url.protocol === "http:" || url.protocol === "https:") &&
            url.hostname.includes(".") &&
            !url.hostname.startsWith(".") &&
            !url.hostname.endsWith(".")
          );
        } catch {
          return false;
        }
      }, "Please enter a valid website URL (e.g. https://example.com)."),
    contactEmail: z
      .string()
      .trim()
      .toLowerCase()
      .max(320, "Official organization email must be at most 320 characters.")
      .optional()
      .or(z.literal(""))
      .refine((val) => {
        if (!val || val.trim() === "") return true;
        return z.string().email().safeParse(val).success;
      }, "Please enter a valid official organization email address."),
    contactPhone: z
      .string()
      .trim()
      .max(40, "Phone number must be at most 40 characters.")
      .optional()
      .or(z.literal(""))
      .refine((val) => {
        if (!val || val.trim() === "") return true;
        return /^\+?[1-9]\d{7,14}$/.test(val);
      }, "Please enter a valid international phone number (e.g. +919876543210)."),
    addressLine1: z
      .string()
      .trim()
      .max(240, "Address line 1 must be at most 240 characters.")
      .optional()
      .or(z.literal("")),
    addressLine2: z
      .string()
      .trim()
      .max(240, "Address line 2 must be at most 240 characters.")
      .optional()
      .or(z.literal("")),
    city: z
      .string()
      .trim()
      .max(120, "City must be at most 120 characters.")
      .optional()
      .or(z.literal("")),
    state: z
      .string()
      .trim()
      .max(120, "State / Province must be at most 120 characters.")
      .optional()
      .or(z.literal("")),
    country: z
      .string()
      .trim()
      .max(120, "Country must be at most 120 characters.")
      .optional()
      .or(z.literal("")),
    postalCode: z
      .string()
      .trim()
      .max(20, "Postal code must be at most 20 characters.")
      .optional()
      .or(z.literal(""))
      .refine((val) => {
        if (!val || val.trim() === "") return true;
        return /^[A-Za-z0-9][A-Za-z0-9 -]{2,19}$/.test(val);
      }, "Please enter a valid postal or ZIP code."),
    ownerEmail: z
      .string()
      .trim()
      .toLowerCase()
      .max(320, "Owner email must be at most 320 characters.")
      .optional()
      .or(z.literal(""))
      .refine((val) => {
        if (!val || val.trim() === "") return true;
        return z.string().email().safeParse(val).success;
      }, "Please enter a valid owner email address."),
    ownerFullName: z
      .string()
      .trim()
      .max(160, "Owner full name must be at most 160 characters.")
      .optional()
      .or(z.literal(""))
      .refine((val) => {
        if (!val || val.trim() === "") return true;
        return val.length >= 2 && !/[<>{}\\]/.test(val);
      }, "Owner full name must be 2–160 characters."),
    planId: z.string().uuid("Invalid plan ID format.").optional().or(z.literal("")),
    billingCycle: z.enum(SUPPORTED_BILLING_CYCLES).optional().default("monthly"),
    timezone: z
      .string()
      .trim()
      .min(1, "Timezone is required.")
      .max(80, "Timezone must be at most 80 characters."),
    currency: z
      .string()
      .trim()
      .length(3, "Currency must be a 3-letter code (e.g. INR, USD).")
      .toUpperCase(),
    dateFormat: z
      .string()
      .trim()
      .max(40, "Date format must be at most 40 characters.")
      .refine(
        (val) => (SUPPORTED_DATE_FORMATS as readonly string[]).includes(val),
        "Unsupported date format. Supported formats: dd/MM/yyyy, MM/dd/yyyy, yyyy-MM-dd."
      )
      .default("dd/MM/yyyy"),
  })
  .refine(
    (data) => {
      const hasOwner = Boolean(data.ownerEmail && data.ownerEmail.trim().length > 0);
      const hasContact = Boolean(data.contactEmail && data.contactEmail.trim().length > 0);
      return hasOwner || hasContact;
    },
    {
      message: "An organization owner email is required.",
      path: ["ownerEmail"],
    }
  );

export const organizationStatusSchema = z.enum(["active", "suspended", "rejected", "archived"]);
export const platformRoleSchema = z.enum(["NONE", "PRODUCT_OWNER", "PLATFORM_OWNER", "PLATFORM_ADMIN", "PLATFORM_SUPPORT", "PLATFORM_BILLING"]);
export const authInputSchema = z.object({ email: z.string().email(), password: z.string().min(1) });
export const registrationInputSchema = authInputSchema.extend({ fullName: z.string().trim().min(2).max(160) });
export type OrganizationInput = z.input<typeof organizationInputSchema>;

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
