<script lang="ts">
let{data}=$props();const totalCount=$derived(data.totalCount);const activeCount=$derived(data.activeCount);const pendingCount=$derived(data.pendingCount);const suspendedCount=$derived(data.suspendedCount);const activePercentage=$derived(totalCount>0?Math.round(activeCount/totalCount*100):0);const recent=$derived(data.recent);const jobs=$derived(data.jobs);const activity=$derived(data.activity);const commercial=$derived(data.commercial);
import SvgIcon from "$lib/components/ui/Icon.svelte";
import Badge from "$lib/components/ui/Badge.svelte";
import LinkButton from "$lib/components/ui/LinkButton.svelte";
import Card from "$lib/components/ui/Card.svelte";
import CardContent from "$lib/components/ui/CardContent.svelte";
import CardHeader from "$lib/components/ui/CardHeader.svelte";
import CardTitle from "$lib/components/ui/CardTitle.svelte";
import CardDescription from "$lib/components/ui/CardDescription.svelte";

</script>
<div class="space-y-8">
      
      <div class="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div class="flex items-center gap-2">
            <Badge variant="neutral" class="bg-sidebar-active text-sidebar-active-text border border-primary/10">
              Platform Console
            </Badge>
            <span class="text-xs font-semibold uppercase tracking-wider text-muted">
              Executive Cockpit
            </span>
          </div>
          <h1 class="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Operational Overview
          </h1>
          <p class="mt-2 text-sm leading-relaxed text-muted">
            Global tenant lifecycle, provisioning pipelines, and commercial entitlements.
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <LinkButton variant="outline" size="sm" href="/platform/organizations">View all organizations</LinkButton>
          <LinkButton size="sm" class="gap-1.5 shadow-xs" href="/platform/organizations?create=true">
              <SvgIcon name="Plus" class="size-4" aria-hidden="true" />
              <span>Create organization</span>
            </LinkButton>
        </div>
      </div>

      
      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card class="hover:border-primary/30 transition-colors">
          <CardContent class="p-6">
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium text-muted">Total Organizations</span>
              <div class="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">
                <SvgIcon name="Building2" class="size-4" aria-hidden="true" />
              </div>
            </div>
            <div class="mt-3 flex items-baseline justify-between">
              <p class="text-3xl font-bold tracking-tight text-foreground">{totalCount}</p>
              <span class="rounded-full bg-sidebar-active px-2 py-0.5 text-xs font-semibold text-sidebar-active-text">
                {activePercentage}% active
              </span>
            </div>
          </CardContent>
        </Card>

        <Card class="hover:border-primary/30 transition-colors">
          <CardContent class="p-6">
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium text-muted">Active Tenants</span>
              <div class="grid size-9 place-items-center rounded-lg bg-success-bg text-success">
                <SvgIcon name="CheckCircle2" class="size-4" aria-hidden="true" />
              </div>
            </div>
            <div class="mt-3 flex items-baseline justify-between">
              <p class="text-3xl font-bold tracking-tight text-foreground">{activeCount}</p>
              <Badge variant="success">Operational</Badge>
            </div>
          </CardContent>
        </Card>

        <Card class="hover:border-primary/30 transition-colors">
          <CardContent class="p-6">
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium text-muted">Onboarding / Pending</span>
              <div class="grid size-9 place-items-center rounded-lg bg-amber-50 text-amber-700">
                <SvgIcon name="Clock" class="size-4" aria-hidden="true" />
              </div>
            </div>
            <div class="mt-3 flex items-baseline justify-between">
              <p class="text-3xl font-bold tracking-tight text-foreground">{pendingCount}</p>
              {#if pendingCount > 0}<Badge variant="warning">Awaiting Approval</Badge>{:else}<span class="text-xs text-muted">No backlog</span>{/if}
            </div>
          </CardContent>
        </Card>

        <Card class="hover:border-primary/30 transition-colors">
          <CardContent class="p-6">
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium text-muted">Suspended</span>
              <div class="grid size-9 place-items-center rounded-lg bg-danger-bg text-destructive">
                <SvgIcon name="AlertTriangle" class="size-4" aria-hidden="true" />
              </div>
            </div>
            <div class="mt-3 flex items-baseline justify-between">
              <p class="text-3xl font-bold tracking-tight text-foreground">{suspendedCount}</p>
              {#if suspendedCount > 0}<Badge variant="danger">Action Required</Badge>{:else}<Badge variant="neutral">Clear</Badge>{/if}
            </div>
          </CardContent>
        </Card>
      </div>

      
      {#if commercial}<Card class="border-border">
          <CardHeader class="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle class="text-base font-bold text-foreground">
                Commercial & Subscription Infrastructure
              </CardTitle>
              <CardDescription>
                Live licensing allocations and payment provider connectivity
              </CardDescription>
            </div>
            <LinkButton variant="ghost" size="sm" href="/platform/subscriptions" class="gap-1 text-xs font-semibold text-primary">
                <span>Manage subscriptions</span>
                <SvgIcon name="ArrowRight" class="size-3.5" aria-hidden="true" />
              </LinkButton>
          </CardHeader>
          <CardContent>
            <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 pt-2">
              <div class="space-y-1">
                <p class="text-xs font-medium text-muted">Total Subscriptions</p>
                <p class="text-2xl font-bold text-foreground">{commercial.total}</p>
                <p class="text-xs text-muted">Allocated across organizations</p>
              </div>

              <div class="space-y-1">
                <p class="text-xs font-medium text-muted">Active Subscriptions</p>
                <p class="text-2xl font-bold text-foreground">{commercial.active}</p>
                <div class="flex items-center gap-1.5 pt-0.5">
                  <span class="size-2 rounded-full bg-primary"></span>
                  <span class="text-xs text-muted">In good standing</span>
                </div>
              </div>

              <div class="space-y-1">
                <p class="text-xs font-medium text-muted">Over Employee Limit</p>
                <p class="text-2xl font-bold text-foreground">{commercial.overLimit}</p>
                <p class="text-xs text-muted">
                  {#if commercial.overLimit > 0}{"Exceeds tier quota"}{:else}{"Within licensed capacity"}{/if}
                </p>
              </div>

              <div class="space-y-1">
                <p class="text-xs font-medium text-muted">Billing Provider Status</p>
                <div class="pt-1">
                  {#if commercial.providerConfigured}<Badge variant="success">Provider Connected</Badge>{:else}<Badge variant="neutral">Manual / Mock Provider</Badge>{/if}
                </div>
                <p class="text-xs text-muted pt-1">Automated recurring billing</p>
              </div>
            </div>
          </CardContent>
        </Card>{/if}

      
      <div class="grid gap-6 xl:grid-cols-3">
        
        <Card class="flex flex-col">
          <CardHeader class="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle class="text-base font-bold text-foreground">Recent Organizations</CardTitle>
              <CardDescription>Latest tenant registrations</CardDescription>
            </div>
            <a href="/platform/organizations" class="text-xs font-semibold text-primary hover:underline">
              All ({totalCount})
            </a>
          </CardHeader>
          <CardContent class="flex-1">
            {#if recent.length}<div class="space-y-2.5">
                {#each recent as row}{@const statusVariant = row.status === "active"
                      ? "success"
                      : row.status === "pending"
                      ? "warning"
                      : row.status === "suspended"
                      ? "danger"
                      : "neutral"}<a href={`/platform/organizations/${row.id}`} class="group flex items-center justify-between rounded-xl border border-border p-3 transition-colors hover:border-primary/40 hover:bg-slate-50/70">
                      <div class="flex items-center gap-3 min-w-0">
                        <div class="grid size-9 shrink-0 place-items-center rounded-lg bg-sidebar-active text-xs font-bold text-sidebar-active-text border border-primary/10">
                          {row.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div class="min-w-0 truncate">
                          <p class="truncate font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                            {row.name}
                          </p>
                          <p class="truncate text-xs text-muted">{row.slug}</p>
                        </div>
                      </div>
                      <Badge variant={statusVariant} class="shrink-0 ml-2">
                        {row.status}
                      </Badge>
                    </a>{/each}
              </div>{:else}<div class="flex h-36 items-center justify-center text-center text-sm text-muted">
                No organizations registered yet.
              </div>{/if}
          </CardContent>
        </Card>

        
        <Card class="flex flex-col">
          <CardHeader class="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle class="text-base font-bold text-foreground">Provisioning Pipeline</CardTitle>
              <CardDescription>Tenant setup and role jobs</CardDescription>
            </div>
            <a href="/platform/provisioning" class="text-xs font-semibold text-primary hover:underline">
              Monitor jobs
            </a>
          </CardHeader>
          <CardContent class="flex-1">
            {#if jobs.length}<div class="space-y-2.5">
                {#each jobs as job}{@const isSuccess = job.status === "completed"}{@const isRunning = job.status === "running" || job.status === "retrying"}{@const statusVariant = isSuccess
                    ? "success"
                    : isRunning
                    ? "warning"
                    : job.status === "failed"
                    ? "danger"
                    : "neutral"}<div class="flex items-center justify-between rounded-xl border border-border p-3">
                      <div class="flex items-center gap-3 min-w-0">
                        <div class="grid size-9 shrink-0 place-items-center rounded-lg bg-background text-muted border border-border">
                          <SvgIcon name="Gauge" class="size-4" aria-hidden="true" />
                        </div>
                        <div class="min-w-0">
                          <p class="truncate text-sm font-semibold text-foreground">
                            {job.jobType}
                          </p>
                          <p class="truncate text-xs text-muted">
                            Step: {job.currentStep ?? "Initiated"}
                          </p>
                        </div>
                      </div>
                      <Badge variant={statusVariant} class="shrink-0 ml-2">
                        {job.status}
                      </Badge>
                    </div>{/each}
              </div>{:else}<div class="flex h-36 items-center justify-center text-center text-sm text-muted">
                No provisioning operations recorded.
              </div>{/if}
          </CardContent>
        </Card>

        
        <Card class="flex flex-col">
          <CardHeader class="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle class="text-base font-bold text-foreground">Governance Stream</CardTitle>
              <CardDescription>Security and administrative audit</CardDescription>
            </div>
            <a href="/platform/audit" class="text-xs font-semibold text-primary hover:underline">
              Audit log
            </a>
          </CardHeader>
          <CardContent class="flex-1">
            {#if activity.length}<div class="space-y-2.5">
                {#each activity as event}<div class="flex items-start gap-3 rounded-xl border border-border p-3">
                    <div class="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary mt-0.5">
                      <SvgIcon name="ShieldCheck" class="size-4" aria-hidden="true" />
                    </div>
                    <div class="min-w-0 flex-1">
                      <p class="truncate text-sm font-semibold text-foreground">
                        {event.action}
                      </p>
                      <p class="truncate text-xs text-muted">
                        {event.resource} · {new Date(event.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>{/each}
              </div>{:else}<div class="flex h-36 items-center justify-center text-center text-sm text-muted">
                No audit events recorded.
              </div>{/if}
          </CardContent>
        </Card>
      </div>
    </div>
