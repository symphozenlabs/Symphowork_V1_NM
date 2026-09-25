import { and, count, desc, eq, ilike, or } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { employees, organizations, planFeatures, plans, subscriptions } from "@/db/schema";
import { recordAudit } from "@/lib/audit";
import { billingProviderConfigured } from "@/lib/billing";
import { AppError } from "@/lib/errors";
import { authorizePlatform, authorizePlatformTargetOrganization, PLATFORM_PERMISSIONS } from "@/modules/platform/authorization";

export const planInputSchema = z.object({ code: z.enum(["FREE", "STARTER", "PROFESSIONAL", "ENTERPRISE"]), name: z.string().trim().min(2).max(80), description: z.string().trim().max(240).optional(), monthlyPriceCents: z.number().int().nonnegative().nullable(), annualPriceCents: z.number().int().nonnegative().nullable(), currency: z.string().length(3).toUpperCase(), trialDays: z.number().int().min(0).max(365), maxUsers: z.number().int().nonnegative().nullable(), maxStorageBytes: z.number().int().nonnegative().nullable(), billingInterval: z.enum(["monthly", "annual"]), active: z.boolean() });
export const featureInputSchema = z.object({ planId: z.string().uuid(), featureKey: z.string().trim().min(2).max(120), enabled: z.boolean(), limitValue: z.number().int().nonnegative().nullable() });
export const subscriptionInputSchema = z.object({ organizationId: z.string().uuid(), planId: z.string().uuid(), billingCycle: z.enum(["monthly", "annual"]), status: z.enum(["pending", "active", "suspended", "cancelled", "expired"]), billingStatus: z.enum(["trialing", "active", "past_due", "paused", "cancelled", "expired"]), renewalAt: z.string().datetime().nullable().optional() });

const subscriptionTransitions: Record<string, string[]> = { pending: ["active", "cancelled"], active: ["suspended", "cancelled", "expired"], suspended: ["active", "cancelled", "expired"], cancelled: ["active", "expired"], expired: [] };
export function canTransitionSubscriptionStatus(current: string, next: string) { return current === next || subscriptionTransitions[current]?.includes(next) === true; }

export async function listPlans() { await authorizePlatform(PLATFORM_PERMISSIONS.planView); return db.select().from(plans).orderBy(desc(plans.createdAt)); }
export async function savePlan(input: unknown, actorUserId: string, planId?: string) {
  await authorizePlatform(PLATFORM_PERMISSIONS.planManage);
  const data = planInputSchema.parse(input);
  const [plan] = planId ? await db.update(plans).set({ ...data, updatedAt: new Date() }).where(eq(plans.id, planId)).returning() : await db.insert(plans).values(data).returning();
  if (!plan) throw new AppError("NOT_FOUND", "Plan was not found.", 404);
  await recordAudit({ actorUserId, action: planId ? "plan_updated" : "plan_created", resource: "plan", resourceId: plan.id, metadata: { code: plan.code, active: plan.active } });
  return plan;
}
export async function setPlanFeatures(input: unknown, actorUserId: string) {
  await authorizePlatform(PLATFORM_PERMISSIONS.entitlementManage);
  const data = featureInputSchema.parse(input);
  const [plan] = await db.select().from(plans).where(eq(plans.id, data.planId));
  if (!plan) throw new AppError("NOT_FOUND", "Plan was not found.", 404);
  const [feature] = await db.insert(planFeatures).values(data).onConflictDoUpdate({ target: [planFeatures.planId, planFeatures.featureKey], set: { enabled: data.enabled, limitValue: data.limitValue } }).returning();
  await recordAudit({ actorUserId, action: "plan_feature_changed", resource: "plan_feature", resourceId: feature.id, metadata: { planId: data.planId, featureKey: data.featureKey, enabled: data.enabled, limitValue: data.limitValue } });
  return feature;
}
export async function getPlanFeatures(planId: string) { await authorizePlatform(PLATFORM_PERMISSIONS.entitlementView); return db.select().from(planFeatures).where(eq(planFeatures.planId, planId)).orderBy(planFeatures.featureKey); }

export async function listSubscriptions(input: { query?: string; status?: string }) {
  await authorizePlatform(PLATFORM_PERMISSIONS.subscriptionView);
  const filters = [];
  if (input.query) filters.push(or(ilike(organizations.name, `%${input.query}%`), ilike(organizations.slug, `%${input.query}%`)));
  if (input.status) filters.push(eq(subscriptions.status, input.status as typeof subscriptions.status.enumValues[number]));
  return db.select({ subscription: subscriptions, organization: { id: organizations.id, name: organizations.name, slug: organizations.slug }, plan: plans }).from(subscriptions).innerJoin(organizations, eq(subscriptions.organizationId, organizations.id)).innerJoin(plans, eq(subscriptions.planId, plans.id)).where(filters.length ? and(...filters) : undefined).orderBy(desc(subscriptions.updatedAt));
}
export async function updateSubscription(input: unknown, actorUserId: string, subscriptionId?: string) {
  await authorizePlatform(PLATFORM_PERMISSIONS.subscriptionManage);
  const data = subscriptionInputSchema.parse(input);
  await authorizePlatformTargetOrganization({ organizationId: data.organizationId, permission: PLATFORM_PERMISSIONS.subscriptionManage, action: "subscription_update" });
  const [plan] = await db.select().from(plans).where(eq(plans.id, data.planId));
  if (!plan) throw new AppError("NOT_FOUND", "Plan was not found.", 404);
  const [existing] = subscriptionId ? await db.select().from(subscriptions).where(eq(subscriptions.id, subscriptionId)) : await db.select().from(subscriptions).where(eq(subscriptions.organizationId, data.organizationId));
  if (existing && !canTransitionSubscriptionStatus(existing.status, data.status)) throw new AppError("INVALID_STATUS_TRANSITION", `Subscription status cannot change from ${existing.status} to ${data.status}.`, 409);
  const values = { organizationId: data.organizationId, planId: data.planId, billingCycle: data.billingCycle, status: data.status, billingStatus: data.billingStatus, renewalAt: data.renewalAt ? new Date(data.renewalAt) : undefined, updatedAt: new Date(), startsAt: existing?.startsAt ?? new Date() };
  const [subscription] = existing ? await db.update(subscriptions).set(values).where(eq(subscriptions.id, existing.id)).returning() : await db.insert(subscriptions).values(values).returning();
  if (!subscription) throw new AppError("NOT_FOUND", "Subscription was not found.", 404);
  await recordAudit({ actorUserId, organizationId: data.organizationId, action: existing ? "subscription_updated" : "subscription_created", resource: "subscription", resourceId: subscription.id, metadata: { planId: data.planId, status: data.status, billingCycle: data.billingCycle, billingStatus: data.billingStatus } });
  return subscription;
}

export async function getOrganizationUsage(organizationId: string) {
  await authorizePlatformTargetOrganization({ organizationId, permission: PLATFORM_PERMISSIONS.usageView, action: "commercial_usage_inspection" });
  const [row] = await db.select({ organization: organizations, plan: plans, subscription: subscriptions }).from(organizations).leftJoin(subscriptions, eq(subscriptions.organizationId, organizations.id)).leftJoin(plans, eq(subscriptions.planId, plans.id)).where(eq(organizations.id, organizationId));
  const [active] = await db.select({ value: count() }).from(employees).where(and(eq(employees.organizationId, organizationId), eq(employees.status, "active")));
  const limit = row?.plan?.maxUsers ?? null;
  return { organization: row?.organization ?? null, plan: row?.plan ?? null, subscription: row?.subscription ?? null, activeEmployees: active.value, employeeLimit: limit, remaining: limit === null ? null : Math.max(0, limit - active.value), overLimit: limit !== null && active.value > limit, providerConfigured: billingProviderConfigured() };
}
export async function listOrganizationUsage() {
  await authorizePlatform(PLATFORM_PERMISSIONS.usageView);
  const rows = await db.select({ organization: organizations, plan: plans, subscription: subscriptions }).from(organizations).leftJoin(subscriptions, eq(subscriptions.organizationId, organizations.id)).leftJoin(plans, eq(subscriptions.planId, plans.id)).orderBy(desc(organizations.createdAt));
  const counts = await db.select({ organizationId: employees.organizationId, value: count() }).from(employees).where(eq(employees.status, "active")).groupBy(employees.organizationId);
  const countByOrg = new Map(counts.map((item) => [item.organizationId, item.value]));
  return rows.map((row) => { const activeEmployees = countByOrg.get(row.organization.id) ?? 0; const employeeLimit = row.plan?.maxUsers ?? null; return { ...row, activeEmployees, employeeLimit, remaining: employeeLimit === null ? null : Math.max(0, employeeLimit - activeEmployees), overLimit: employeeLimit !== null && activeEmployees > employeeLimit }; });
}
export async function commercialDashboard() { await authorizePlatform(PLATFORM_PERMISSIONS.subscriptionView); const [total, active, trialing, pastDue, distribution, usage] = await Promise.all([db.select({ value: count() }).from(subscriptions), db.select({ value: count() }).from(subscriptions).where(eq(subscriptions.status, "active")), db.select({ value: count() }).from(subscriptions).where(eq(subscriptions.billingStatus, "trialing")), db.select({ value: count() }).from(subscriptions).where(eq(subscriptions.billingStatus, "past_due")), db.select({ planId: subscriptions.planId, plan: plans.name, value: count() }).from(subscriptions).innerJoin(plans, eq(subscriptions.planId, plans.id)).groupBy(subscriptions.planId, plans.name), listOrganizationUsage()]); return { total: total[0].value, active: active[0].value, trialing: trialing[0].value, pastDue: pastDue[0].value, distribution, overLimit: usage.filter((item) => item.overLimit).length, approachingLimit: usage.filter((item) => item.employeeLimit !== null && !item.overLimit && item.activeEmployees >= item.employeeLimit * 0.8).length, providerConfigured: billingProviderConfigured() }; }
