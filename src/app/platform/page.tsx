import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { count, desc, eq } from "drizzle-orm";
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock,
  Gauge,
  Plus,
  ShieldCheck,
} from "lucide-react";
import { withPlatformTransaction } from "@/db/client";
import { auditLogs, organizations, provisioningJobs } from "@/db/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { authorizePlatform, PLATFORM_PERMISSIONS } from "@/modules/platform/authorization";
import { commercialDashboard } from "@/modules/platform/commercial";

export default async function PlatformOverviewPage() {
  try {
    await authorizePlatform(PLATFORM_PERMISSIONS.organizationView);
  } catch {
    redirect("/platform/login");
  }

  const [total, active, pending, suspended, recent, jobs, activity] = await withPlatformTransaction(
    (tx) =>
      Promise.all([
        tx.select({ value: count() }).from(organizations),
        tx.select({ value: count() }).from(organizations).where(eq(organizations.status, "active")),
        tx.select({ value: count() }).from(organizations).where(eq(organizations.status, "pending")),
        tx.select({ value: count() }).from(organizations).where(eq(organizations.status, "suspended")),
        tx.select().from(organizations).orderBy(desc(organizations.createdAt)).limit(5),
        tx.select().from(provisioningJobs).orderBy(desc(provisioningJobs.createdAt)).limit(5),
        tx.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(5),
      ])
  );

  let commercial = null;
  try {
    commercial = await commercialDashboard();
  } catch {
    commercial = null;
  }

  const totalCount = total[0]?.value ?? 0;
  const activeCount = active[0]?.value ?? 0;
  const pendingCount = pending[0]?.value ?? 0;
  const suspendedCount = suspended[0]?.value ?? 0;
  const activePercentage = totalCount > 0 ? Math.round((activeCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* Page Header with Action Bar */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="neutral" className="bg-sidebar-active text-sidebar-active-text border border-primary/10">
              Platform Console
            </Badge>
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">
              Executive Cockpit
            </span>
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Operational Overview
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Global tenant lifecycle, provisioning pipelines, and commercial entitlements.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" size="sm" asChild>
            <Link href="/platform/organizations">View all organizations</Link>
          </Button>
          <Button size="sm" asChild className="gap-1.5 shadow-xs">
            <Link href="/platform/organizations/new">
              <Plus className="size-4" aria-hidden="true" />
              <span>Create organization</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="hover:border-primary/30 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted">Total Organizations</span>
              <div className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">
                <Building2 className="size-4" aria-hidden="true" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <p className="text-3xl font-bold tracking-tight text-foreground">{totalCount}</p>
              <span className="rounded-full bg-sidebar-active px-2 py-0.5 text-xs font-semibold text-sidebar-active-text">
                {activePercentage}% active
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/30 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted">Active Tenants</span>
              <div className="grid size-9 place-items-center rounded-lg bg-success-bg text-success">
                <CheckCircle2 className="size-4" aria-hidden="true" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <p className="text-3xl font-bold tracking-tight text-foreground">{activeCount}</p>
              <Badge variant="success">Operational</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/30 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted">Onboarding / Pending</span>
              <div className="grid size-9 place-items-center rounded-lg bg-amber-50 text-amber-700">
                <Clock className="size-4" aria-hidden="true" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <p className="text-3xl font-bold tracking-tight text-foreground">{pendingCount}</p>
              {pendingCount > 0 ? (
                <Badge variant="warning">Awaiting Approval</Badge>
              ) : (
                <span className="text-xs text-muted">No backlog</span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/30 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted">Suspended</span>
              <div className="grid size-9 place-items-center rounded-lg bg-danger-bg text-destructive">
                <AlertTriangle className="size-4" aria-hidden="true" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <p className="text-3xl font-bold tracking-tight text-foreground">{suspendedCount}</p>
              {suspendedCount > 0 ? (
                <Badge variant="danger">Action Required</Badge>
              ) : (
                <Badge variant="neutral">Clear</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Commercial Summary Card */}
      {commercial && (
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base font-bold text-foreground">
                Commercial & Subscription Infrastructure
              </CardTitle>
              <CardDescription>
                Live licensing allocations and payment provider connectivity
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/platform/subscriptions" className="gap-1 text-xs font-semibold text-primary">
                <span>Manage subscriptions</span>
                <ArrowRight className="size-3.5" aria-hidden="true" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 pt-2">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted">Total Subscriptions</p>
                <p className="text-2xl font-bold text-foreground">{commercial.total}</p>
                <p className="text-xs text-muted">Allocated across organizations</p>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-medium text-muted">Active Subscriptions</p>
                <p className="text-2xl font-bold text-foreground">{commercial.active}</p>
                <div className="flex items-center gap-1.5 pt-0.5">
                  <span className="size-2 rounded-full bg-primary" />
                  <span className="text-xs text-muted">In good standing</span>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-medium text-muted">Over Employee Limit</p>
                <p className="text-2xl font-bold text-foreground">{commercial.overLimit}</p>
                <p className="text-xs text-muted">
                  {commercial.overLimit > 0 ? "Exceeds tier quota" : "Within licensed capacity"}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-medium text-muted">Billing Provider Status</p>
                <div className="pt-1">
                  {commercial.providerConfigured ? (
                    <Badge variant="success">Provider Connected</Badge>
                  ) : (
                    <Badge variant="neutral">Manual / Mock Provider</Badge>
                  )}
                </div>
                <p className="text-xs text-muted pt-1">Automated recurring billing</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 3-Column Operational Feeds */}
      <div className="grid gap-6 xl:grid-cols-3">
        {/* Column 1: Recent Organizations */}
        <Card className="flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-bold text-foreground">Recent Organizations</CardTitle>
              <CardDescription>Latest tenant registrations</CardDescription>
            </div>
            <Link
              href="/platform/organizations"
              className="text-xs font-semibold text-primary hover:underline"
            >
              All ({totalCount})
            </Link>
          </CardHeader>
          <CardContent className="flex-1">
            {recent.length ? (
              <div className="space-y-2.5">
                {recent.map((row) => {
                  const statusVariant =
                    row.status === "active"
                      ? "success"
                      : row.status === "pending"
                      ? "warning"
                      : row.status === "suspended"
                      ? "danger"
                      : "neutral";
                  return (
                    <Link
                      key={row.id}
                      href={`/platform/organizations/${row.id}`}
                      className="group flex items-center justify-between rounded-xl border border-border p-3 transition-colors hover:border-primary/40 hover:bg-slate-50/70"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-sidebar-active text-xs font-bold text-sidebar-active-text border border-primary/10">
                          {row.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0 truncate">
                          <p className="truncate font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                            {row.name}
                          </p>
                          <p className="truncate text-xs text-muted">{row.slug}</p>
                        </div>
                      </div>
                      <Badge variant={statusVariant} className="shrink-0 ml-2">
                        {row.status}
                      </Badge>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="flex h-36 items-center justify-center text-center text-sm text-muted">
                No organizations registered yet.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Column 2: Provisioning Pipeline */}
        <Card className="flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-bold text-foreground">Provisioning Pipeline</CardTitle>
              <CardDescription>Tenant setup and role jobs</CardDescription>
            </div>
            <Link
              href="/platform/provisioning"
              className="text-xs font-semibold text-primary hover:underline"
            >
              Monitor jobs
            </Link>
          </CardHeader>
          <CardContent className="flex-1">
            {jobs.length ? (
              <div className="space-y-2.5">
                {jobs.map((job) => {
                  const isSuccess = job.status === "completed";
                  const isRunning = job.status === "running" || job.status === "retrying";
                  const statusVariant = isSuccess
                    ? "success"
                    : isRunning
                    ? "warning"
                    : job.status === "failed"
                    ? "danger"
                    : "neutral";

                  return (
                    <div
                      key={job.id}
                      className="flex items-center justify-between rounded-xl border border-border p-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-background text-muted border border-border">
                          <Gauge className="size-4" aria-hidden="true" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-foreground">
                            {job.jobType}
                          </p>
                          <p className="truncate text-xs text-muted">
                            Step: {job.currentStep ?? "Initiated"}
                          </p>
                        </div>
                      </div>
                      <Badge variant={statusVariant} className="shrink-0 ml-2">
                        {job.status}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex h-36 items-center justify-center text-center text-sm text-muted">
                No provisioning operations recorded.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Column 3: Platform Governance & Audit */}
        <Card className="flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-bold text-foreground">Governance Stream</CardTitle>
              <CardDescription>Security and administrative audit</CardDescription>
            </div>
            <Link
              href="/platform/audit"
              className="text-xs font-semibold text-primary hover:underline"
            >
              Audit log
            </Link>
          </CardHeader>
          <CardContent className="flex-1">
            {activity.length ? (
              <div className="space-y-2.5">
                {activity.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-start gap-3 rounded-xl border border-border p-3"
                  >
                    <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary mt-0.5">
                      <ShieldCheck className="size-4" aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {event.action}
                      </p>
                      <p className="truncate text-xs text-muted">
                        {event.resource} · {new Date(event.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-36 items-center justify-center text-center text-sm text-muted">
                No audit events recorded.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
