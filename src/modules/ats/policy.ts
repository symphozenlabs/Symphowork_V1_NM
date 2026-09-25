import { z } from "zod";
export const publicCandidateInput = z.object({ firstName: z.string().trim().min(1).max(80), lastName: z.string().trim().min(1).max(80), email: z.string().trim().email().max(320), phone: z.string().trim().max(40).optional(), totalExperience: z.number().min(0).max(80).optional(), consentStatus: z.literal("granted") });
export function atsSlug(value: string) { return value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 150); }
export function candidateDuplicateKeys(email: string, phone?: string) { return { email: email.trim().toLowerCase(), phone: phone?.replace(/\D/g, "") || undefined }; }
export function experienceYears(startDate: string, endDate = new Date().toISOString().slice(0, 10)) { const start = new Date(`${startDate}T00:00:00Z`); const end = new Date(`${endDate}T00:00:00Z`); if (Number.isNaN(start.valueOf()) || Number.isNaN(end.valueOf()) || end < start) throw new Error("Invalid experience dates."); return Math.round(((end.valueOf() - start.valueOf()) / 86400000 / 365.25) * 100) / 100; }
export function canPublishJob(requisitionStatus: string) { return requisitionStatus === "approved" || requisitionStatus === "open"; }
export function canMoveApplication(fromStage: string, toStage: string) { return fromStage !== toStage && toStage.length > 0; }
