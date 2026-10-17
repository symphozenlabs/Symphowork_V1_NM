import { z } from "zod";

export const departmentInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Department name must be at least 2 characters.")
    .max(120, "Department name cannot exceed 120 characters."),
  code: z
    .string()
    .trim()
    .min(2, "Department code must be at least 2 characters.")
    .max(40, "Department code cannot exceed 40 characters.")
    .regex(
      /^[A-Za-z0-9_-]+$/,
      "Department code can only contain letters, numbers, hyphens, and underscores."
    )
    .transform((val) => val.toUpperCase()),
  description: z.string().trim().max(500, "Description cannot exceed 500 characters.").optional().or(z.literal("")),
  headEmployeeId: z.string().uuid("Invalid manager selection.").nullable().optional().or(z.literal("")),
  status: z.enum(["active", "inactive"]).default("active"),
});

export const departmentUpdateSchema = departmentInputSchema.partial();

export const departmentQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format.").optional(),
});

export const departmentTeamInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Team name must be at least 2 characters.")
    .max(120, "Team name cannot exceed 120 characters."),
  code: z
    .string()
    .trim()
    .min(2, "Team code must be at least 2 characters.")
    .max(40, "Team code cannot exceed 40 characters.")
    .regex(
      /^[A-Za-z0-9_-]+$/,
      "Team code can only contain letters, numbers, hyphens, and underscores."
    )
    .transform((val) => val.toUpperCase()),
  description: z.string().trim().max(500, "Description cannot exceed 500 characters.").optional().or(z.literal("")),
  teamLeadEmployeeId: z.string().uuid("Invalid team lead selection.").nullable().optional().or(z.literal("")),
  status: z.enum(["active", "inactive"]).default("active"),
});

export const departmentTeamUpdateSchema = departmentTeamInputSchema.partial();

