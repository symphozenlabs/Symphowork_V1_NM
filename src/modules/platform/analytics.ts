import { count, desc, eq, gte, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { auditLogs, organizations, plans, provisioningJobs, subscriptions } from "@/db/schema";
import { authorizePlatform, PLATFORM_PERMISSIONS } from "@/modules/platform/authorization";
import { listOrganizationUsage } from "@/modules/platform/commercial";

export type AnalyticsWindow = 1 | 7 | 30 | 90;
export async function getPlatformAnalytics(days: AnalyticsWindow = 30) {
  await authorizePlatform(PLATFORM_PERMISSIONS.analyticsView);
  const since = new Date(Date.now() - days * 86_400_000);
  const [total, active, suspended, newOrganizations, provisioning, failedProvisioning, subscriptionsTotal, activeSubscriptions, trialSubscriptions, pastDueSubscriptions, cancelledSubscriptions, planDistribution, activity, usage] = await Promise.all([
    db.select({ value: count() }).from(organizations),
    db.select({ value: count() }).from(organizations).where(eq(organizations.status, "active")),
    db.select({ value: count() }).from(organizations).where(eq(organizations.status, "suspended")),
    db.select({ value: count() }).from(organizations).where(gte(organizations.createdAt, since)),
    db.select({ value: count() }).from(provisioningJobs).where(sql`${provisioningJobs.status} in ('pending', 'running', 'retrying')`),
    db.select({ value: count() }).from(provisioningJobs).where(eq(provisioningJobs.status, "failed")),
    db.select({ value: count() }).from(subscriptions),
    db.select({ value: count() }).from(subscriptions).where(eq(subscriptions.status, "active")),
    db.select({ value: count() }).from(subscriptions).where(eq(subscriptions.billingStatus, "trialing")),
    db.select({ value: count() }).from(subscriptions).where(eq(subscriptions.billingStatus, "past_due")),
    db.select({ value: count() }).from(subscriptions).where(eq(subscriptions.status, "cancelled")),
    db.select({ plan: plans.name, code: plans.code, value: count() }).from(subscriptions).innerJoin(plans, eq(subscriptions.planId, plans.id)).groupBy(plans.name, plans.code),
    db.select({ action: auditLogs.action, value: count() }).from(auditLogs).where(gte(auditLogs.createdAt, since)).groupBy(auditLogs.action).orderBy(desc(count())),
    listOrganizationUsage(),
  ]);
  const activeOrganizations = active[0].value;
  const totalActiveEmployees = usage.reduce((sum, row) => sum + row.activeEmployees, 0);
  return { days, totals: { organizations: total[0].value, activeOrganizations, suspendedOrganizations: suspended[0].value, newOrganizations: newOrganizations[0].value, provisioning: provisioning[0].value, failedProvisioning: failedProvisioning[0].value, subscriptions: subscriptionsTotal[0].value, activeSubscriptions: activeSubscriptions[0].value, trialSubscriptions: trialSubscriptions[0].value, pastDueSubscriptions: pastDueSubscriptions[0].value, cancelledSubscriptions: cancelledSubscriptions[0].value, activeEmployees: totalActiveEmployees, averageActiveEmployees: activeOrganizations ? Number((totalActiveEmployees / activeOrganizations).toFixed(1)) : 0 }, planDistribution, activity, limitUsage: usage.filter((row) => row.employeeLimit !== null && row.activeEmployees >= row.employeeLimit * 0.8).sort((a, b) => b.activeEmployees - a.activeEmployees).slice(0, 50), trend: await organizationCreationTrend(since) };
}
async function organizationCreationTrend(since: Date) { const day = sql<string>`date_trunc('day', ${organizations.createdAt})`; return db.select({ day, value: count() }).from(organizations).where(gte(organizations.createdAt, since)).groupBy(day).orderBy(day); }
