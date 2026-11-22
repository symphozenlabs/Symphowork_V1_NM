<script lang="ts">
import SvgIcon from "$lib/components/ui/Icon.svelte";
import OrganizationStatusActions from "$lib/components/platform/OrganizationStatusActions.svelte";
import Card from "$lib/components/ui/Card.svelte";
import CardContent from "$lib/components/ui/CardContent.svelte";
import CardHeader from "$lib/components/ui/CardHeader.svelte";
import CardTitle from "$lib/components/ui/CardTitle.svelte";
import Badge from "$lib/components/ui/Badge.svelte";
import OrganizationInvitationActions from "$lib/components/platform/OrganizationInvitationActions.svelte";
import OrganizationSupportNotes from "$lib/components/platform/OrganizationSupportNotes.svelte";
import type { PageProps } from './$types';
let { data }: PageProps = $props();
type OrganizationDetails = { id: string; name: string; status: string; slug: string; legalName: string | null; contactEmail: string | null; contactPhone: string | null; createdAt: string };
type AuditEvent = { action: string; resource: string | null; resourceId: string | null; createdAt: string };
const organization = $derived(data.organization as OrganizationDetails);
const job = $derived(data.job as { status: string; currentStep: string } | null);
const invitation = $derived(data.invitation as { id: string; status: string; expiresAt: string } | null);
const subscription = $derived(data.subscription as { status: string } | null);
const employeeCount = $derived(data.employeeCount);
const activeEmployeeCount = $derived(data.activeEmployeeCount);
const activity = $derived(data.activity as AuditEvent[]);
const statusColorMap: Record<string, { bg: string; text: string; dot: string; border: string }> = {
  active: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', border: 'border-emerald-200' },
  pending: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500', border: 'border-amber-200' },
  suspended: { bg: 'bg-rose-50', text: 'text-rose-700', dot: 'bg-rose-500', border: 'border-rose-200' },
  rejected: { bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400', border: 'border-slate-200' },
};
const currentTheme = $derived(statusColorMap[organization.status] || statusColorMap.active);
</script>
<div class="space-y-6">
      
      <div>
        <a href="/platform/organizations" class="inline-flex items-center gap-1.5 text-xs font-medium text-muted transition-colors hover:text-foreground">
          <SvgIcon name="ArrowLeft" class="h-3.5 w-3.5" />
          <span>Back to Organizations</span>
        </a>
      </div>

      
      <div class="rounded-2xl border border-border/80 bg-surface p-6 shadow-xs">
        <div class="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div class="flex items-start gap-4">
            <div class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-white shadow-md font-bold text-xl">
              {organization.name.slice(0, 2).toUpperCase()}
            </div>
            <div class="space-y-1.5">
              <div class="flex flex-wrap items-center gap-2.5">
                <h1 class="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  {organization.name}
                </h1>
                <span class={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium border ${currentTheme.bg} ${currentTheme.text} ${currentTheme.border}`}>
                  <span class={`h-1.5 w-1.5 rounded-full ${currentTheme.dot}`}></span>
                  {organization.status.toUpperCase()}
                </span>
                <span class="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 font-mono text-xs text-slate-600">
                  {organization.slug}
                </span>
              </div>
              <p class="text-sm text-muted">
                {organization.legalName} · Registered tenant in Platform Multi-Tenant Cluster
              </p>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-3">
            <OrganizationStatusActions organizationId={organization.id} status={organization.status} />
          </div>
        </div>
      </div>

      
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        
        <Card class="border-border/80 bg-surface shadow-xs">
          <CardContent class="p-5">
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold uppercase tracking-wider text-muted">
                Workforce Scale
              </span>
              <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <SvgIcon name="Users" class="h-4 w-4" />
              </div>
            </div>
            <div class="mt-3">
              <div class="text-2xl font-bold text-foreground">{employeeCount}</div>
              <div class="mt-1 flex items-center gap-2 text-xs text-muted">
                <span class="inline-block h-2 w-2 rounded-full bg-emerald-500"></span>
                <span>{activeEmployeeCount} active employees</span>
              </div>
            </div>
          </CardContent>
        </Card>

        
        <Card class="border-border/80 bg-surface shadow-xs">
          <CardContent class="p-5">
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold uppercase tracking-wider text-muted">
                Provisioning Status
              </span>
              <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <SvgIcon name="Layers" class="h-4 w-4" />
              </div>
            </div>
            <div class="mt-3">
              <div class="flex items-center gap-2 text-base font-bold capitalize text-foreground">
                {#if job?.status === "completed"}<SvgIcon name="CheckCircle2" class="h-4 w-4 text-emerald-600" />{/if}
                {#if job?.status === "running"}<SvgIcon name="Clock" class="h-4 w-4 text-amber-600" />{/if}
                {#if job?.status === "failed"}<SvgIcon name="AlertTriangle" class="h-4 w-4 text-rose-600" />{/if}
                <span>{job?.status ?? "Not created"}</span>
              </div>
              <div class="mt-1 text-xs text-muted font-mono truncate">
                Step: {job?.currentStep ?? "System idle"}
              </div>
            </div>
          </CardContent>
        </Card>

        
        <Card class="border-border/80 bg-surface shadow-xs">
          <CardContent class="p-5">
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold uppercase tracking-wider text-muted">
                Commercial Contract
              </span>
              <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <SvgIcon name="CreditCard" class="h-4 w-4" />
              </div>
            </div>
            <div class="mt-3">
              <div class="text-base font-bold capitalize text-foreground">
                {subscription?.status ?? "Not provisioned"}
              </div>
              <div class="mt-1 text-xs text-muted">
                Platform Enterprise Agreement
              </div>
            </div>
          </CardContent>
        </Card>

        
        <Card class="border-border/80 bg-surface shadow-xs">
          <CardContent class="p-5">
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold uppercase tracking-wider text-muted">
                Primary Contact
              </span>
              <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <SvgIcon name="Mail" class="h-4 w-4" />
              </div>
            </div>
            <div class="mt-3">
              <div class="truncate text-sm font-semibold text-foreground" title={organization.contactEmail ?? "Not provided"}>
                {organization.contactEmail ?? "Not provided"}
              </div>
              <div class="mt-1 text-xs text-muted">
                {organization.contactPhone ?? "No phone on record"}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      
      <div class="grid gap-6 lg:grid-cols-12">
        
        <div class="space-y-6 lg:col-span-7">
          
          <Card class="border-border/80 bg-surface shadow-xs">
            <CardHeader class="flex flex-row items-center justify-between border-b border-border/50 pb-4">
              <div class="flex items-center gap-2.5">
                <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <SvgIcon name="KeyRound" class="h-4 w-4" />
                </div>
                <div>
                  <CardTitle class="text-base font-semibold text-foreground">
                    Tenant Owner Invitation & Onboarding Access
                  </CardTitle>
                  <p class="text-xs text-muted">
                    Secure credentials delegation for initial administrative setup
                  </p>
                </div>
              </div>
              {#if invitation}<Badge variant={invitation.status === "accepted" ? "success" : "neutral"}>
                  {invitation.status}
                </Badge>{/if}
            </CardHeader>
            <CardContent class="pt-5">
              <OrganizationInvitationActions organizationId={organization.id} invitation={invitation
                    ? {
                        id: invitation.id,
                        status: invitation.status,
                        expiresAt: invitation.expiresAt,
                      }
                    : null} />
            </CardContent>
          </Card>

          
          <OrganizationSupportNotes organizationId={organization.id} />
        </div>

        
        <div class="space-y-6 lg:col-span-5">
          
          <Card class="border-border/80 bg-surface shadow-xs">
            <CardHeader class="border-b border-border/50 pb-3">
              <div class="flex items-center gap-2">
                <SvgIcon name="ShieldCheck" class="h-4 w-4 text-primary" />
                <CardTitle class="text-sm font-semibold text-foreground">
                  Tenant Identity & Boundary
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent class="space-y-3 pt-4 text-xs">
              <div class="flex items-center justify-between border-b border-slate-100 pb-2">
                <span class="text-muted">Organization ID</span>
                <span class="font-mono text-slate-700 select-all">{organization.id}</span>
              </div>
              <div class="flex items-center justify-between border-b border-slate-100 pb-2">
                <span class="text-muted">Subdomain Slug</span>
                <span class="font-mono font-medium text-primary">{organization.slug}</span>
              </div>
              <div class="flex items-center justify-between border-b border-slate-100 pb-2">
                <span class="text-muted">Legal Entity Name</span>
                <span class="font-medium text-slate-800">{organization.legalName}</span>
              </div>
              <div class="flex items-center justify-between border-b border-slate-100 pb-2">
                <span class="text-muted">Tenant Isolation</span>
                <span class="rounded-md bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700">
                  Postgres RLS Enforced
                </span>
              </div>
              <div class="flex items-center justify-between pt-1">
                <span class="text-muted">Created Date</span>
                <span class="text-slate-700">
                  {new Date(organization.createdAt).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
            </CardContent>
          </Card>

          
          <Card class="border-border/80 bg-surface shadow-xs">
            <CardHeader class="border-b border-border/50 pb-3">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <SvgIcon name="History" class="h-4 w-4 text-primary" />
                  <CardTitle class="text-sm font-semibold text-foreground">
                    Tenant Audit Activity
                  </CardTitle>
                </div>
                <span class="text-xs text-muted">{activity.length} events</span>
              </div>
            </CardHeader>
            <CardContent class="pt-4">
              {#if activity.length}<div class="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                  {#each activity as event}<div class="flex items-start justify-between gap-3 rounded-lg border border-border/50 bg-slate-50/50 p-2.5 text-xs transition-colors hover:bg-slate-50">
                      <div class="space-y-0.5 min-w-0">
                        <p class="font-medium text-slate-800 truncate">{event.action}</p>
                        <p class="text-[11px] text-muted font-mono truncate">
                          {event.resource ?? "system"} {#if event.resourceId}{`· ${event.resourceId.slice(0, 8)}`}{:else}{""}{/if}
                        </p>
                      </div>
                      <span class="shrink-0 text-[11px] text-muted">
                        {new Date(event.createdAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>{/each}
                </div>{:else}<div class="rounded-lg border border-dashed border-border/70 p-4 text-center">
                  <p class="text-xs text-muted">No operational activity recorded yet.</p>
                </div>{/if}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>

