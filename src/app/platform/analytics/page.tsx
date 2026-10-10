import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { authorizePlatform, PLATFORM_PERMISSIONS } from "@/modules/platform/authorization";
import { getPlatformAnalytics } from "@/modules/platform/analytics";
import {
  Building2,
  Users,
  CreditCard,
  AlertTriangle,
  TrendingUp,
  PieChart,
  ShieldAlert,
  Calendar,
  CheckCircle2,
} from "lucide-react";

export default async function PlatformAnalyticsPage() {
  try {
    await authorizePlatform(PLATFORM_PERMISSIONS.analyticsView);
  } catch {
    redirect("/platform/login");
  }

  const data = await getPlatformAnalytics(30);

  const totalPlanOrgs = data.planDistribution.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <div className="space-y-6">
      {/* Executive Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              Platform Intelligence
            </span>
            <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600 font-medium">
              Rolling 30-Day Window
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Operational Analytics
          </h1>
          <p className="mt-1 text-sm text-muted">
            Real-time telemetry and database-backed metrics across multi-tenant clusters, commercial plans, and workforce volume.
          </p>
        </div>
      </div>

      {/* Primary 4 KPI Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Organizations */}
        <Card className="border-border/80 bg-surface shadow-xs">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                Total Tenants
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Building2 className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-foreground">
                {data.totals.organizations}
              </div>
              <div className="mt-1 flex items-center gap-1.5 text-xs text-muted">
                <span className="font-semibold text-emerald-600">
                  {data.totals.activeOrganizations} active
                </span>
                <span>·</span>
                <span>+{data.totals.newOrganizations} in 30d</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Employees */}
        <Card className="border-border/80 bg-surface shadow-xs">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                Workforce Footprint
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-foreground">
                {data.totals.activeEmployees.toLocaleString()}
              </div>
              <div className="mt-1 text-xs text-muted">
                Active employee records across all organizations
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subscriptions */}
        <Card className="border-border/80 bg-surface shadow-xs">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                Active Subscriptions
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <CreditCard className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-foreground">
                {data.totals.activeSubscriptions}
              </div>
              <div className="mt-1 text-xs text-muted">
                {data.totals.subscriptions} total subscription records
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Provisioning Health */}
        <Card className="border-border/80 bg-surface shadow-xs">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                Provisioning Health
              </span>
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                  data.totals.failedProvisioning > 0
                    ? "bg-rose-50 text-rose-600"
                    : "bg-emerald-50 text-emerald-600"
                }`}
              >
                {data.totals.failedProvisioning > 0 ? (
                  <AlertTriangle className="h-4 w-4" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-foreground">
                {data.totals.failedProvisioning === 0
                  ? "100%"
                  : `${data.totals.failedProvisioning} Failed`}
              </div>
              <div className="mt-1 text-xs text-muted">
                {data.totals.failedProvisioning === 0
                  ? "Zero pipeline errors recorded"
                  : "Attention required on failed pipeline jobs"}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grid: Plan Distribution & Capacity Limits */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Plan Distribution (6 cols) */}
        <div className="lg:col-span-6">
          <Card className="h-full border-border/80 bg-surface shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <PieChart className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold text-foreground">
                    Plan Tier Distribution
                  </CardTitle>
                  <p className="text-xs text-muted">
                    Active subscription allocation across defined plan tiers
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                {totalPlanOrgs} assigned
              </span>
            </CardHeader>
            <CardContent className="space-y-4 pt-5">
              {data.planDistribution.length ? (
                data.planDistribution.map((item) => {
                  const percentage =
                    totalPlanOrgs > 0 ? Math.round((item.value / totalPlanOrgs) * 100) : 0;
                  return (
                    <div key={item.code} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-foreground">
                          {item.plan} <span className="font-mono text-muted">({item.code})</span>
                        </span>
                        <span className="font-medium text-slate-700">
                          {item.value} {item.value === 1 ? "org" : "orgs"} ({percentage}%)
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-primary transition-all duration-500"
                          style={{ width: `${Math.max(percentage, item.value > 0 ? 5 : 0)}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-xl border border-dashed border-border/80 p-6 text-center">
                  <p className="text-sm font-medium text-slate-600">No plan assignments recorded</p>
                  <p className="mt-1 text-xs text-muted">
                    Assign subscriptions to see distribution breakdown.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Capacity & Limit Warning (6 cols) */}
        <div className="lg:col-span-6">
          <Card className="h-full border-border/80 bg-surface shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <ShieldAlert className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold text-foreground">
                    Capacity & Limit Alerts
                  </CardTitle>
                  <p className="text-xs text-muted">
                    Tenants approaching or exceeding contract employee caps
                  </p>
                </div>
              </div>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  data.limitUsage.length > 0
                    ? "bg-amber-100 text-amber-800"
                    : "bg-emerald-100 text-emerald-800"
                }`}
              >
                {data.limitUsage.length} {data.limitUsage.length === 1 ? "alert" : "alerts"}
              </span>
            </CardHeader>
            <CardContent className="pt-5">
              {data.limitUsage.length ? (
                <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
                  {data.limitUsage.map((item) => {
                    const isOver =
                      item.employeeLimit !== null && item.activeEmployees > item.employeeLimit;
                    return (
                      <div
                        key={item.organization.id}
                        className="flex items-center justify-between rounded-xl border border-border/70 bg-slate-50/50 p-3 text-xs transition-colors hover:bg-slate-50"
                      >
                        <div className="min-w-0 space-y-0.5">
                          <p className="font-semibold text-foreground truncate">
                            {item.organization.name}
                          </p>
                          <p className="text-muted">
                            Plan: {item.plan?.name ?? "No plan configured"}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-medium text-slate-800">
                            {item.activeEmployees} / {item.employeeLimit ?? "∞"}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 font-semibold text-[11px] ${
                              isOver
                                ? "bg-rose-100 text-rose-700"
                                : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {isOver ? "Over Limit" : "Near Limit"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/80 p-8 text-center">
                  <CheckCircle2 className="h-8 w-8 text-emerald-600 mb-2" />
                  <p className="text-sm font-semibold text-foreground">All tenants within capacity</p>
                  <p className="mt-1 text-xs text-muted max-w-sm">
                    No organizations are currently over or approaching their licensed employee quotas.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Organization Creation Trend (Full Width) */}
      <Card className="border-border/80 bg-surface shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <TrendingUp className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold text-foreground">
                Organization Creation Velocity
              </CardTitle>
              <p className="text-xs text-muted">
                Daily tenant onboarding events across the last 30 days
              </p>
            </div>
          </div>
          <span className="text-xs font-medium text-muted">
            {data.trend.reduce((acc, curr) => acc + curr.value, 0)} total created in window
          </span>
        </CardHeader>
        <CardContent className="pt-5">
          {data.trend.length ? (
            <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {data.trend.map((item) => (
                <div
                  key={String(item.day)}
                  className="flex items-center justify-between rounded-lg border border-border/60 bg-slate-50/50 p-2.5 text-xs transition-colors hover:bg-slate-50"
                >
                  <span className="text-muted flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    {new Date(item.day).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  <span className="font-semibold text-foreground">
                    +{item.value} {item.value === 1 ? "org" : "orgs"}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border/80 p-6 text-center">
              <p className="text-sm font-medium text-slate-600">No onboarding events</p>
              <p className="mt-1 text-xs text-muted">
                No organizations were created in this 30-day window.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
