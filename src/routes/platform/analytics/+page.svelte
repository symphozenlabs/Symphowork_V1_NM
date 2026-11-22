<script lang="ts">
let {data:pageData}=$props();const data=$derived(pageData.analytics);const totalPlanOrgs=$derived(data.planDistribution.reduce((acc,curr)=>acc+curr.value,0));
import SvgIcon from "$lib/components/ui/Icon.svelte";
import Card from "$lib/components/ui/Card.svelte";
import CardContent from "$lib/components/ui/CardContent.svelte";
import CardHeader from "$lib/components/ui/CardHeader.svelte";
import CardTitle from "$lib/components/ui/CardTitle.svelte";

</script>
<div class="space-y-6">
      
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div class="flex items-center gap-2">
            <span class="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              Platform Intelligence
            </span>
            <span class="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600 font-medium">
              Rolling 30-Day Window
            </span>
          </div>
          <h1 class="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Operational Analytics
          </h1>
          <p class="mt-1 text-sm text-muted">
            Real-time telemetry and database-backed metrics across multi-tenant clusters, commercial plans, and workforce volume.
          </p>
        </div>
      </div>

      
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        
        <Card class="border-border/80 bg-surface shadow-xs">
          <CardContent class="p-5">
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold uppercase tracking-wider text-muted">
                Total Tenants
              </span>
              <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <SvgIcon name="Building2" class="h-4 w-4" />
              </div>
            </div>
            <div class="mt-3">
              <div class="text-2xl font-bold text-foreground">
                {data.totals.organizations}
              </div>
              <div class="mt-1 flex items-center gap-1.5 text-xs text-muted">
                <span class="font-semibold text-emerald-600">
                  {data.totals.activeOrganizations} active
                </span>
                <span>·</span>
                <span>+{data.totals.newOrganizations} in 30d</span>
              </div>
            </div>
          </CardContent>
        </Card>

        
        <Card class="border-border/80 bg-surface shadow-xs">
          <CardContent class="p-5">
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold uppercase tracking-wider text-muted">
                Workforce Footprint
              </span>
              <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <SvgIcon name="Users" class="h-4 w-4" />
              </div>
            </div>
            <div class="mt-3">
              <div class="text-2xl font-bold text-foreground">
                {data.totals.activeEmployees.toLocaleString()}
              </div>
              <div class="mt-1 text-xs text-muted">
                Active employee records across all organizations
              </div>
            </div>
          </CardContent>
        </Card>

        
        <Card class="border-border/80 bg-surface shadow-xs">
          <CardContent class="p-5">
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold uppercase tracking-wider text-muted">
                Active Subscriptions
              </span>
              <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <SvgIcon name="CreditCard" class="h-4 w-4" />
              </div>
            </div>
            <div class="mt-3">
              <div class="text-2xl font-bold text-foreground">
                {data.totals.activeSubscriptions}
              </div>
              <div class="mt-1 text-xs text-muted">
                {data.totals.subscriptions} total subscription records
              </div>
            </div>
          </CardContent>
        </Card>

        
        <Card class="border-border/80 bg-surface shadow-xs">
          <CardContent class="p-5">
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold uppercase tracking-wider text-muted">
                Provisioning Health
              </span>
              <div class={`flex h-8 w-8 items-center justify-center rounded-lg ${
                  data.totals.failedProvisioning > 0
                    ? "bg-rose-50 text-rose-600"
                    : "bg-emerald-50 text-emerald-600"
                }`}>
                {#if data.totals.failedProvisioning > 0}<SvgIcon name="AlertTriangle" class="h-4 w-4" />{:else}<SvgIcon name="CheckCircle2" class="h-4 w-4" />{/if}
              </div>
            </div>
            <div class="mt-3">
              <div class="text-2xl font-bold text-foreground">
                {#if data.totals.failedProvisioning === 0}{"100%"}{:else}{`${data.totals.failedProvisioning} Failed`}{/if}
              </div>
              <div class="mt-1 text-xs text-muted">
                {#if data.totals.failedProvisioning === 0}{"Zero pipeline errors recorded"}{:else}{"Attention required on failed pipeline jobs"}{/if}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      
      <div class="grid gap-6 lg:grid-cols-12">
        
        <div class="lg:col-span-6">
          <Card class="h-full border-border/80 bg-surface shadow-xs">
            <CardHeader class="flex flex-row items-center justify-between border-b border-border/50 pb-4">
              <div class="flex items-center gap-2.5">
                <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <SvgIcon name="PieChart" class="h-4 w-4" />
                </div>
                <div>
                  <CardTitle class="text-base font-semibold text-foreground">
                    Plan Tier Distribution
                  </CardTitle>
                  <p class="text-xs text-muted">
                    Active subscription allocation across defined plan tiers
                  </p>
                </div>
              </div>
              <span class="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                {totalPlanOrgs} assigned
              </span>
            </CardHeader>
            <CardContent class="space-y-4 pt-5">
              {#if data.planDistribution.length}{#each data.planDistribution as item}{@const percentage = totalPlanOrgs > 0 ? Math.round((item.value / totalPlanOrgs) * 100) : 0}<div class="space-y-1.5">
                      <div class="flex items-center justify-between text-xs">
                        <span class="font-semibold text-foreground">
                          {item.plan} <span class="font-mono text-muted">({item.code})</span>
                        </span>
                        <span class="font-medium text-slate-700">
                          {item.value} {#if item.value === 1}{"org"}{:else}{"orgs"}{/if} ({percentage}%)
                        </span>
                      </div>
                      <div class="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                        <div class="h-full rounded-full bg-primary transition-all duration-500" style:width={`${Math.max(percentage, item.value > 0 ? 5 : 0)}%`}></div>
                      </div>
                    </div>{/each}{:else}<div class="rounded-xl border border-dashed border-border/80 p-6 text-center">
                  <p class="text-sm font-medium text-slate-600">No plan assignments recorded</p>
                  <p class="mt-1 text-xs text-muted">
                    Assign subscriptions to see distribution breakdown.
                  </p>
                </div>{/if}
            </CardContent>
          </Card>
        </div>

        
        <div class="lg:col-span-6">
          <Card class="h-full border-border/80 bg-surface shadow-xs">
            <CardHeader class="flex flex-row items-center justify-between border-b border-border/50 pb-4">
              <div class="flex items-center gap-2.5">
                <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <SvgIcon name="ShieldAlert" class="h-4 w-4" />
                </div>
                <div>
                  <CardTitle class="text-base font-semibold text-foreground">
                    Capacity & Limit Alerts
                  </CardTitle>
                  <p class="text-xs text-muted">
                    Tenants approaching or exceeding contract employee caps
                  </p>
                </div>
              </div>
              <span class={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  data.limitUsage.length > 0
                    ? "bg-amber-100 text-amber-800"
                    : "bg-emerald-100 text-emerald-800"
                }`}>
                {data.limitUsage.length} {#if data.limitUsage.length === 1}{"alert"}{:else}{"alerts"}{/if}
              </span>
            </CardHeader>
            <CardContent class="pt-5">
              {#if data.limitUsage.length}<div class="space-y-3 max-h-[280px] overflow-y-auto pr-1">
                  {#each data.limitUsage as item}{@const isOver = item.employeeLimit !== null && item.activeEmployees > item.employeeLimit}<div class="flex items-center justify-between rounded-xl border border-border/70 bg-slate-50/50 p-3 text-xs transition-colors hover:bg-slate-50">
                        <div class="min-w-0 space-y-0.5">
                          <p class="font-semibold text-foreground truncate">
                            {item.organization.name}
                          </p>
                          <p class="text-muted">
                            Plan: {item.plan?.name ?? "No plan configured"}
                          </p>
                        </div>
                        <div class="flex items-center gap-3">
                          <span class="font-mono font-medium text-slate-800">
                            {item.activeEmployees} / {item.employeeLimit ?? "∞"}
                          </span>
                          <span class={`rounded-full px-2 py-0.5 font-semibold text-[11px] ${
                              isOver
                                ? "bg-rose-100 text-rose-700"
                                : "bg-amber-100 text-amber-700"
                            }`}>
                            {#if isOver}{"Over Limit"}{:else}{"Near Limit"}{/if}
                          </span>
                        </div>
                      </div>{/each}
                </div>{:else}<div class="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/80 p-8 text-center">
                  <SvgIcon name="CheckCircle2" class="h-8 w-8 text-emerald-600 mb-2" />
                  <p class="text-sm font-semibold text-foreground">All tenants within capacity</p>
                  <p class="mt-1 text-xs text-muted max-w-sm">
                    No organizations are currently over or approaching their licensed employee quotas.
                  </p>
                </div>{/if}
            </CardContent>
          </Card>
        </div>
      </div>

      
      <Card class="border-border/80 bg-surface shadow-xs">
        <CardHeader class="flex flex-row items-center justify-between border-b border-border/50 pb-4">
          <div class="flex items-center gap-2.5">
            <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <SvgIcon name="TrendingUp" class="h-4 w-4" />
            </div>
            <div>
              <CardTitle class="text-base font-semibold text-foreground">
                Organization Creation Velocity
              </CardTitle>
              <p class="text-xs text-muted">
                Daily tenant onboarding events across the last 30 days
              </p>
            </div>
          </div>
          <span class="text-xs font-medium text-muted">
            {data.trend.reduce((acc, curr) => acc + curr.value, 0)} total created in window
          </span>
        </CardHeader>
        <CardContent class="pt-5">
          {#if data.trend.length}<div class="grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {#each data.trend as item}<div class="flex items-center justify-between rounded-lg border border-border/60 bg-slate-50/50 p-2.5 text-xs transition-colors hover:bg-slate-50">
                  <span class="text-muted flex items-center gap-1.5">
                    <SvgIcon name="Calendar" class="h-3.5 w-3.5 text-slate-400" />
                    {new Date(item.day).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  <span class="font-semibold text-foreground">
                    +{item.value} {#if item.value === 1}{"org"}{:else}{"orgs"}{/if}
                  </span>
                </div>{/each}
            </div>{:else}<div class="rounded-xl border border-dashed border-border/80 p-6 text-center">
              <p class="text-sm font-medium text-slate-600">No onboarding events</p>
              <p class="mt-1 text-xs text-muted">
                No organizations were created in this 30-day window.
              </p>
            </div>{/if}
        </CardContent>
      </Card>
    </div>
