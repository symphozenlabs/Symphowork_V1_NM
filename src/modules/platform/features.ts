import { desc, eq, ilike } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { platformFeatureFlags } from "@/db/schema";
import { recordAudit } from "@/lib/audit";
import { AppError } from "@/lib/errors";
import { authorizePlatform, PLATFORM_PERMISSIONS } from "@/modules/platform/authorization";

export const featureFlagInputSchema = z.object({ key: z.string().trim().regex(/^[a-z0-9]+(?:[._-][a-z0-9]+)*$/).max(120), name: z.string().trim().min(2).max(160), description: z.string().trim().max(500).nullable().optional(), enabled: z.boolean(), metadata: z.record(z.string(), z.string()).optional() });
export async function listFeatureFlags(query?: string) { await authorizePlatform(PLATFORM_PERMISSIONS.featureView); return db.select().from(platformFeatureFlags).where(query ? orFeature(query) : undefined).orderBy(desc(platformFeatureFlags.updatedAt)); }
function orFeature(query: string) { return ilike(platformFeatureFlags.name, `%${query}%`); }
export async function getFeatureFlag(key: string) { await authorizePlatform(PLATFORM_PERMISSIONS.featureView); return db.query.platformFeatureFlags.findFirst({ where: eq(platformFeatureFlags.key, key) }); }
export function evaluateFeatureFlag(flag: { enabled: boolean } | null | undefined, context?: { platform?: boolean }) { return Boolean(flag?.enabled && context?.platform !== false); }
export async function isFeatureEnabled(key: string, context?: { organizationId?: string; platform?: boolean }) { const flag = await db.query.platformFeatureFlags.findFirst({ where: eq(platformFeatureFlags.key, key) }); return evaluateFeatureFlag(flag, context); }
export async function saveFeatureFlag(input: unknown, actorUserId: string, flagId?: string) { await authorizePlatform(PLATFORM_PERMISSIONS.featureManage); const data = featureFlagInputSchema.parse(input); const [flag] = flagId ? await db.update(platformFeatureFlags).set({ key: data.key, name: data.name, description: data.description, enabled: data.enabled, metadata: data.metadata ? JSON.stringify(data.metadata) : undefined, updatedByUserId: actorUserId, updatedAt: new Date() }).where(eq(platformFeatureFlags.id, flagId)).returning() : await db.insert(platformFeatureFlags).values({ key: data.key, name: data.name, description: data.description, enabled: data.enabled, metadata: data.metadata ? JSON.stringify(data.metadata) : undefined, createdByUserId: actorUserId, updatedByUserId: actorUserId }).returning(); if (!flag) throw new AppError("NOT_FOUND", "Feature flag was not found.", 404); await recordAudit({ actorUserId, action: flagId ? "platform_feature_flag_updated" : "platform_feature_flag_created", resource: "platform_feature_flag", resourceId: flag.id, metadata: { key: flag.key, enabled: flag.enabled } }); return flag; }
