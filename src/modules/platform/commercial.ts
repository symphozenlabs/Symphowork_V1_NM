import { and, count, desc, eq, ilike, ne, or, type SQL } from "drizzle-orm";
import { z } from "zod";
import { withPlatformTransaction } from "@/db/client";
import { employees, organizations, planFeatures, plans, subscriptions } from "@/db/schema";
import { recordAudit } from "@/lib/audit";
import { billingProviderConfigured } from "@/lib/billing";
import { AppError } from "@/lib/errors";
import { authorizePlatform, authorizePlatformTargetOrganization, PLATFORM_PERMISSIONS } from "@/modules/platform/authorization";

import { planInputSchema } from "@/modules/platform/validation";
export { planInputSchema };
export const featureInputSchema = z.object({ planId: z.string().uuid(), featureKey: z.string().trim().min(2).max(120), enabled: z.boolean(), limitValue: z.number().int().nonnegative().nullable() });
export const subscriptionInputSchema = z.object({ organizationId: z.string().uuid(), planId: z.string().uuid(), billingCycle: z.enum(["monthly", "annual"]), status: z.enum(["pending", "active", "suspended", "cancelled", "expired"]), billingStatus: z.enum(["trialing", "active", "past_due", "paused", "cancelled", "expired"]), renewalAt: z.string().datetime().nullable().optional() });

const subscriptionTransitions: Record<string, string[]> = { pending: ["active", "cancelled"], active: ["suspended", "cancelled", "expired"], suspended: ["active", "cancelled", "expired"], cancelled: ["active", "expired"], expired: [] };
export function canTransitionSubscriptionStatus(current: string, next: string) { return current === next || subscriptionTransitions[current]?.includes(next) === true; }

export async function listPlans() { await authorizePlatform(PLATFORM_PERMISSIONS.planView); return withPlatformTransaction((tx) => tx.select().from(plans).orderBy(desc(plans.createdAt))); }

export async function savePlan(input: unknown, actorUserId: string, planId?: string) {
  await authorizePlatform(PLATFORM_PERMISSIONS.planManage);
  const data = planInputSchema.parse(input);

  if (!planId) {
    // Check duplicate code on create
    const existing = await withPlatformTransaction((tx) =>
      tx.select({ id: plans.id }).from(plans).where(eq(plans.code, data.code))
    );
    if (existing.length > 0) {
      throw new AppError("VALIDATION_ERROR", "Plan code already exists.", 409);
    }

    const [plan] = await withPlatformTransaction((tx) =>
      tx.insert(plans).values(data).returning()
    );
    if (!plan) throw new AppError("NOT_FOUND", "Plan was not found.", 404);
    await recordAudit({
      actorUserId,
      action: "plan_created",
      resource: "plan",
      resourceId: plan.id,
      metadata: { code: plan.code, active: plan.active },
      platform: true,
    });
    return plan;
  }

  // Update existing plan - keep code immutable
  const [existingPlan] = await withPlatformTransaction((tx) =>
    tx.select().from(plans).where(eq(plans.id, planId))
  );
  if (!existingPlan) throw new AppError("NOT_FOUND", "Plan was not found.", 404);

  const { code: _ignored, ...updateFields } = data;
  void _ignored;
  const [plan] = await withPlatformTransaction((tx) =>
    tx
      .update(plans)
      .set({ ...updateFields, updatedAt: new Date() })
      .where(eq(plans.id, planId))
      .returning()
  );
  if (!plan) throw new AppError("NOT_FOUND", "Plan was not found.", 404);
  await recordAudit({
    actorUserId,
    action: "plan_updated",
    resource: "plan",
    resourceId: plan.id,
    metadata: { code: plan.code, active: plan.active },
    platform: true,
  });
  return plan;
}

export async function deletePlan(planId: string, actorUserId: string) {
  await authorizePlatform(PLATFORM_PERMISSIONS.planManage);

  const [existingPlan] = await withPlatformTransaction((tx) =>
    tx.select().from(plans).where(eq(plans.id, planId))
  );
  if (!existingPlan) throw new AppError("NOT_FOUND", "Plan was not found.", 404);

  // Check if any subscriptions reference this plan
  const [subRef] = await withPlatformTransaction((tx) =>
    tx.select({ count: count() }).from(subscriptions).where(eq(subscriptions.planId, planId))
  );

  if (subRef && subRef.count > 0) {
    throw new AppError(
      "VALIDATION_ERROR",
      "Cannot delete this plan because it is currently assigned to one or more active subscriptions. You can deactivate it instead.",
      409
    );
  }

  await withPlatformTransaction(async (tx) => {
    await tx.delete(planFeatures).where(eq(planFeatures.planId, planId));
    await tx.delete(plans).where(eq(plans.id, planId));
  });

  await recordAudit({
    actorUserId,
    action: "plan_deleted",
    resource: "plan",
    resourceId: planId,
    metadata: { code: existingPlan.code, name: existingPlan.name },
    platform: true,
  });

  return { id: planId, code: existingPlan.code, name: existingPlan.name };
}

export async function setPlanFeatures(input: unknown, actorUserId: string) {
  await authorizePlatform(PLATFORM_PERMISSIONS.entitlementManage);
  const data = featureInputSchema.parse(input);
  const [plan] = await withPlatformTransaction((tx) => tx.select().from(plans).where(eq(plans.id, data.planId)));
  if (!plan) throw new AppError("NOT_FOUND", "Plan was not found.", 404);
  const [feature] = await withPlatformTransaction((tx) => tx.insert(planFeatures).values(data).onConflictDoUpdate({ target: [planFeatures.planId, planFeatures.featureKey], set: { enabled: data.enabled, limitValue: data.limitValue } }).returning());
  await recordAudit({ actorUserId, action: "plan_feature_changed", resource: "plan_feature", resourceId: feature.id, metadata: { planId: data.planId, featureKey: data.featureKey, enabled: data.enabled, limitValue: data.limitValue }, platform: true });
  return feature;
}
export async function getPlanFeatures(planId: string) { await authorizePlatform(PLATFORM_PERMISSIONS.entitlementView); return withPlatformTransaction((tx) => tx.select().from(planFeatures).where(eq(planFeatures.planId, planId)).orderBy(planFeatures.featureKey)); }

export interface ListSubscriptionsInput {
  query?: string;
  status?: string;
  billingInterval?: string;
  billingCycle?: string;
  page?: number;
  pageSize?: number;
}

export async function listSubscriptions(input: ListSubscriptionsInput = {}) {
  await authorizePlatform(PLATFORM_PERMISSIONS.subscriptionView);
  const page = Math.max(1, input.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, input.pageSize ?? 10));
  const offset = (page - 1) * pageSize;

  const filters: SQL[] = [];

  // Search by organization name, slug, plan name, plan code (case-insensitive partial match)
  const q = input.query?.trim();
  if (q) {
    const queryFilter = or(
      ilike(organizations.name, `%${q}%`),
      ilike(organizations.slug, `%${q}%`),
      ilike(plans.name, `%${q}%`),
      ilike(plans.code, `%${q}%`)
    );
    if (queryFilter) filters.push(queryFilter);
  }

  // Filter by status: all, active, inactive, or specific status enum value
  if (input.status && input.status !== "all") {
    if (input.status === "active") {
      filters.push(eq(subscriptions.status, "active"));
    } else if (input.status === "inactive") {
      filters.push(ne(subscriptions.status, "active"));
    } else {
      filters.push(eq(subscriptions.status, input.status as typeof subscriptions.status.enumValues[number]));
    }
  }

  // Filter by billing cycle / interval: all, monthly, annual
  const billing = input.billingInterval ?? input.billingCycle;
  if (billing && billing !== "all") {
    if (billing === "monthly" || billing === "annual") {
      filters.push(eq(subscriptions.billingCycle, billing));
    }
  }

  const whereClause = filters.length ? and(...filters) : undefined;

  const { rows, total } = await withPlatformTransaction(async (tx) => {
    const rows = await tx
      .select({
        subscription: subscriptions,
        organization: { id: organizations.id, name: organizations.name, slug: organizations.slug },
        plan: plans,
      })
      .from(subscriptions)
      .innerJoin(organizations, eq(subscriptions.organizationId, organizations.id))
      .innerJoin(plans, eq(subscriptions.planId, plans.id))
      .where(whereClause)
      .orderBy(desc(subscriptions.updatedAt))
      .limit(pageSize)
      .offset(offset);

    const [{ total }] = await tx
      .select({ total: count() })
      .from(subscriptions)
      .innerJoin(organizations, eq(subscriptions.organizationId, organizations.id))
      .innerJoin(plans, eq(subscriptions.planId, plans.id))
      .where(whereClause);

    return { rows, total: Number(total) };
  });

  return {
    rows,
    total,
    page,
    pageSize,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
  };
}
export async function updateSubscription(input: unknown, actorUserId: string, subscriptionId?: string) {
  await authorizePlatform(PLATFORM_PERMISSIONS.subscriptionManage);
  const data = subscriptionInputSchema.parse(input);
  await authorizePlatformTargetOrganization({ organizationId: data.organizationId, permission: PLATFORM_PERMISSIONS.subscriptionManage, action: "subscription_update" });
  const [plan] = await withPlatformTransaction((tx) => tx.select().from(plans).where(eq(plans.id, data.planId)));
  if (!plan) throw new AppError("NOT_FOUND", "Plan was not found.", 404);
  const [existing] = await withPlatformTransaction((tx) => subscriptionId ? tx.select().from(subscriptions).where(eq(subscriptions.id, subscriptionId)) : tx.select().from(subscriptions).where(eq(subscriptions.organizationId, data.organizationId)));
  if (existing && !canTransitionSubscriptionStatus(existing.status, data.status)) throw new AppError("INVALID_STATUS_TRANSITION", `Subscription status cannot change from ${existing.status} to ${data.status}.`, 409);
  const values = { organizationId: data.organizationId, planId: data.planId, billingCycle: data.billingCycle, status: data.status, billingStatus: data.billingStatus, renewalAt: data.renewalAt ? new Date(data.renewalAt) : undefined, updatedAt: new Date(), startsAt: existing?.startsAt ?? new Date() };
  const [subscription] = await withPlatformTransaction((tx) => existing ? tx.update(subscriptions).set(values).where(eq(subscriptions.id, existing.id)).returning() : tx.insert(subscriptions).values(values).returning());
  if (!subscription) throw new AppError("NOT_FOUND", "Subscription was not found.", 404);
  await recordAudit({ actorUserId, organizationId: data.organizationId, action: existing ? "subscription_updated" : "subscription_created", resource: "subscription", resourceId: subscription.id, metadata: { planId: data.planId, status: data.status, billingCycle: data.billingCycle, billingStatus: data.billingStatus }, platform: true });
  return subscription;
}

export type UsageStatus = "within_limit" | "near_limit" | "limit_reached" | "over_limit";

export function calculateUsageStatus(
  activeEmployees: number,
  employeeLimit: number | null
): {
  status: UsageStatus;
  statusLabel: "Within limit" | "Near limit" | "Limit reached" | "Over limit";
  remaining: number | null;
  overLimit: boolean;
  nearLimit: boolean;
  limitReached: boolean;
} {
  if (employeeLimit === null) {
    return {
      status: "within_limit",
      statusLabel: "Within limit",
      remaining: null,
      overLimit: false,
      nearLimit: false,
      limitReached: false,
    };
  }

  const remaining = employeeLimit - activeEmployees;
  const overLimit = activeEmployees > employeeLimit;
  const limitReached = activeEmployees === employeeLimit;
  const nearLimit = !overLimit && !limitReached && activeEmployees >= employeeLimit * 0.8;

  let status: UsageStatus = "within_limit";
  let statusLabel: "Within limit" | "Near limit" | "Limit reached" | "Over limit" = "Within limit";

  if (overLimit) {
    status = "over_limit";
    statusLabel = "Over limit";
  } else if (limitReached) {
    status = "limit_reached";
    statusLabel = "Limit reached";
  } else if (nearLimit) {
    status = "near_limit";
    statusLabel = "Near limit";
  }

  return {
    status,
    statusLabel,
    remaining,
    overLimit,
    nearLimit,
    limitReached,
  };
}

export async function getOrganizationUsage(organizationId: string) {
  await authorizePlatformTargetOrganization({ organizationId, permission: PLATFORM_PERMISSIONS.usageView, action: "commercial_usage_inspection" });
  const { row, active } = await withPlatformTransaction(async (tx) => {
    const [row] = await tx.select({ organization: organizations, plan: plans, subscription: subscriptions }).from(organizations).leftJoin(subscriptions, eq(subscriptions.organizationId, organizations.id)).leftJoin(plans, eq(subscriptions.planId, plans.id)).where(eq(organizations.id, organizationId));
    const [active] = await tx.select({ value: count() }).from(employees).where(and(eq(employees.organizationId, organizationId), eq(employees.status, "active")));
    return { row, active: active.value };
  });
  const limit = row?.plan?.maxUsers ?? null;
  const statusInfo = calculateUsageStatus(active, limit);
  return {
    organization: row?.organization ?? null,
    plan: row?.plan ?? null,
    subscription: row?.subscription ?? null,
    activeEmployees: active,
    employeeLimit: limit,
    remaining: statusInfo.remaining,
    overLimit: statusInfo.overLimit,
    nearLimit: statusInfo.nearLimit,
    limitReached: statusInfo.limitReached,
    status: statusInfo.status,
    statusLabel: statusInfo.statusLabel,
    providerConfigured: billingProviderConfigured(),
  };
}

export interface ListUsageInput {
  query?: string;
  status?: string;
  plan?: string;
  page?: number;
  pageSize?: number;
}

export interface OrganizationUsageRow {
  organization: {
    id: string;
    name: string;
    slug: string;
    createdAt: Date;
    [key: string]: unknown;
  };
  plan: {
    id: string;
    code: string;
    name: string;
    maxUsers: number | null;
    [key: string]: unknown;
  } | null;
  subscription: unknown | null;
  activeEmployees: number;
  employeeLimit: number | null;
  remaining: number | null;
  overLimit: boolean;
  nearLimit: boolean;
  limitReached: boolean;
  status: UsageStatus;
  statusLabel: "Within limit" | "Near limit" | "Limit reached" | "Over limit";
}

export interface PaginatedUsageResult {
  rows: OrganizationUsageRow[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
  availablePlans: Array<{ id: string; code: string; name: string }>;
}

export async function listOrganizationUsage(): Promise<OrganizationUsageRow[]>;
export async function listOrganizationUsage(input: ListUsageInput): Promise<PaginatedUsageResult>;
export async function listOrganizationUsage(input?: ListUsageInput): Promise<OrganizationUsageRow[] | PaginatedUsageResult> {
  await authorizePlatform(PLATFORM_PERMISSIONS.usageView);

  const filters: SQL[] = [];
  const q = input?.query?.trim();
  if (q) {
    const queryFilter = or(
      ilike(organizations.name, `%${q}%`),
      ilike(organizations.slug, `%${q}%`),
      ilike(plans.name, `%${q}%`),
      ilike(plans.code, `%${q}%`)
    );
    if (queryFilter) filters.push(queryFilter);
  }

  if (input?.plan && input.plan !== "all") {
    const planFilter = or(
      eq(plans.id, input.plan),
      eq(plans.code, input.plan)
    );
    if (planFilter) filters.push(planFilter);
  }

  const { rows, counts, allSubscribedPlans } = await withPlatformTransaction(async (tx) => {
    const rows = await tx
      .select({ organization: organizations, plan: plans, subscription: subscriptions })
      .from(organizations)
      .leftJoin(subscriptions, eq(subscriptions.organizationId, organizations.id))
      .leftJoin(plans, eq(subscriptions.planId, plans.id))
      .where(filters.length ? and(...filters) : undefined)
      .orderBy(desc(organizations.createdAt));

    const counts = await tx
      .select({ organizationId: employees.organizationId, value: count() })
      .from(employees)
      .where(eq(employees.status, "active"))
      .groupBy(employees.organizationId);

    const planRows = await tx
      .selectDistinct({ id: plans.id, code: plans.code, name: plans.name })
      .from(subscriptions)
      .innerJoin(plans, eq(subscriptions.planId, plans.id));

    return { rows, counts, allSubscribedPlans: planRows };
  });

  const countByOrg = new Map(counts.map((item) => [item.organizationId, item.value]));

  const mappedRows: OrganizationUsageRow[] = rows.map((row) => {
    const activeEmployees = countByOrg.get(row.organization.id) ?? 0;
    const employeeLimit = row.plan?.maxUsers ?? null;
    const statusInfo = calculateUsageStatus(activeEmployees, employeeLimit);

    return {
      ...row,
      activeEmployees,
      employeeLimit,
      remaining: statusInfo.remaining,
      overLimit: statusInfo.overLimit,
      nearLimit: statusInfo.nearLimit,
      limitReached: statusInfo.limitReached,
      status: statusInfo.status,
      statusLabel: statusInfo.statusLabel,
    };
  });

  // If no input parameters, return array directly (backwards compatibility for dashboard)
  if (!input) {
    return mappedRows;
  }

  // Filter by status if requested
  let statusFiltered = mappedRows;
  if (input.status && input.status !== "all") {
    const normalized = input.status.toLowerCase().replace(/\s+/g, "_");
    statusFiltered = mappedRows.filter((r) => {
      if (normalized === "within_limit") return r.status === "within_limit";
      if (normalized === "near_limit") return r.status === "near_limit";
      if (normalized === "limit_reached") return r.status === "limit_reached";
      if (normalized === "over_limit") return r.status === "over_limit";
      return true;
    });
  }

  const page = Math.max(1, input.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, input.pageSize ?? 10));
  const total = statusFiltered.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const paginatedRows = statusFiltered.slice((page - 1) * pageSize, page * pageSize);

  return {
    rows: paginatedRows,
    total,
    page,
    pageSize,
    pageCount,
    availablePlans: allSubscribedPlans,
  };
}

export async function commercialDashboard() {
  await authorizePlatform(PLATFORM_PERMISSIONS.subscriptionView);
  const [total, active, trialing, pastDue, distribution, usageResult] = await Promise.all([
    withPlatformTransaction((tx) => tx.select({ value: count() }).from(subscriptions)),
    withPlatformTransaction((tx) => tx.select({ value: count() }).from(subscriptions).where(eq(subscriptions.status, "active"))),
    withPlatformTransaction((tx) => tx.select({ value: count() }).from(subscriptions).where(eq(subscriptions.billingStatus, "trialing"))),
    withPlatformTransaction((tx) => tx.select({ value: count() }).from(subscriptions).where(eq(subscriptions.billingStatus, "past_due"))),
    withPlatformTransaction((tx) => tx.select({ planId: subscriptions.planId, plan: plans.name, value: count() }).from(subscriptions).innerJoin(plans, eq(subscriptions.planId, plans.id)).groupBy(subscriptions.planId, plans.name)),
    listOrganizationUsage(),
  ]);
  const usage = usageResult;
  return {
    total: total[0].value,
    active: active[0].value,
    trialing: trialing[0].value,
    pastDue: pastDue[0].value,
    distribution,
    overLimit: usage.filter((item) => item.overLimit).length,
    approachingLimit: usage.filter((item) => item.nearLimit).length,
    providerConfigured: billingProviderConfigured(),
  };
}
