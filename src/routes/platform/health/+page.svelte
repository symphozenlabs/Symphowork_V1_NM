<script lang="ts">
type HealthStatus='healthy'|'degraded'|'unavailable'|'not_configured'|'unknown';
let{data:pageData}=$props();const data=$derived(pageData.health);
  const statusThemes: Record<
    HealthStatus,
    { badgeBg: string; badgeText: string; dot: string; icon: string }
  > = {
    healthy: {
      badgeBg: "bg-emerald-50 border-emerald-200 text-emerald-700",
      badgeText: "Operational",
      dot: "bg-emerald-500",
      icon: "CheckCircle2",
    },
    degraded: {
      badgeBg: "bg-amber-50 border-amber-200 text-amber-700",
      badgeText: "Degraded",
      dot: "bg-amber-500",
      icon: "AlertTriangle",
    },
    unavailable: {
      badgeBg: "bg-rose-50 border-rose-200 text-rose-700",
      badgeText: "Unavailable",
      dot: "bg-rose-500",
      icon: "XCircle",
    },
    not_configured: {
      badgeBg: "bg-slate-100 border-slate-200 text-slate-600",
      badgeText: "Not Configured",
      dot: "bg-slate-400",
      icon: "HelpCircle",
    },
    unknown: {
      badgeBg: "bg-slate-100 border-slate-200 text-slate-600",
      badgeText: "Unknown",
      dot: "bg-slate-400",
      icon: "HelpCircle",
    },
  };

  const componentIcons: Record<string, string> = {
    application: "Server",
    database: "Database",
    storage: "HardDrive",
    email: "Mail",
    ai: "Cpu",
    billing: "CreditCard",
    realtime: "Radio",
    backgroundJobs: "Workflow",
  };

  const componentLabels: Record<string, string> = {
    application: "Application Runtime",
    database: "Postgres Database",
    storage: "Object Storage (S3 / Blob)",
    email: "Email Dispatcher",
    ai: "AI & Inference Gateway",
    billing: "Commercial Billing Adapter",
    realtime: "Real-time Gateway",
    backgroundJobs: "Background Job Queue",
  };

const entries=$derived(Object.entries(data.components));const operationalCount=$derived(entries.filter(([,c])=>c.status==='healthy').length);
import SvgIcon from "$lib/components/ui/Icon.svelte";
import Card from "$lib/components/ui/Card.svelte";
import CardHeader from "$lib/components/ui/CardHeader.svelte";
import CardTitle from "$lib/components/ui/CardTitle.svelte";
import CardContent from "$lib/components/ui/CardContent.svelte";

</script>
<div class="space-y-6">
      
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div class="flex items-center gap-2">
            <span class="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              Platform Health
            </span>
            <span class="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600 font-medium">
              {operationalCount} of {entries.length} services operational
            </span>
          </div>
          <h1 class="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            System Health & Infrastructure Probes
          </h1>
          <p class="mt-1 text-sm text-muted">
            Continuous health telemetry and subsystem probe status across core platform services.
          </p>
        </div>

        <div class="flex items-center gap-2 text-xs text-muted">
          <SvgIcon name="Clock" class="h-3.5 w-3.5 text-slate-400" />
          <span>Last probe: {new Date(data.checkedAt).toLocaleTimeString()}</span>
        </div>
      </div>

      
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {#each entries as [name, component]}{@const status = component.status as HealthStatus}{@const theme = statusThemes[status] || statusThemes.unknown}{@const Icon = componentIcons[name] || "Activity"}{@const StatusIcon = theme.icon}{@const label = componentLabels[name] || name}{@const detail = "detail" in component && component.detail
              ? component.detail
              : status === "not_configured"
              ? "Service provider not configured in runtime environment."
              : "Status probe passed."}<Card class="border-border/80 bg-surface shadow-xs transition-shadow hover:shadow-sm">
              <CardHeader class="p-4 pb-3">
                <div class="flex items-start justify-between gap-2">
                  <div class="flex items-center gap-2.5">
                    <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <SvgIcon name={Icon} class="h-4.5 w-4.5" />
                    </div>
                    <div class="min-w-0">
                      <CardTitle class="text-sm font-semibold text-foreground truncate">
                        {label}
                      </CardTitle>
                      <p class="text-[11px] font-mono text-muted uppercase tracking-wider">
                        {name}
                      </p>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent class="p-4 pt-0 space-y-3">
                <div class="flex items-center justify-between">
                  <span class={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${theme.badgeBg}`}>
                    <span class={`h-1.5 w-1.5 rounded-full ${theme.dot}`}></span>
                    {theme.badgeText}
                  </span>
                  <SvgIcon name={StatusIcon} class="h-4 w-4 text-slate-400" />
                </div>

                <p class="text-xs text-muted leading-relaxed line-clamp-2">
                  {detail}
                </p>
              </CardContent>
            </Card>{/each}
      </div>

      
      <Card class="border-border/80 bg-surface shadow-xs">
        <CardContent class="p-4">
          <div class="flex items-start gap-3">
            <SvgIcon name="ShieldCheck" class="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div class="text-xs text-muted leading-relaxed">
              <strong class="text-foreground">Probe Governance:</strong> Subsystem probes execute non-destructive checks against local and connected cloud providers. Simple environment variable presence is distinguished from live active provider connectivity.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
