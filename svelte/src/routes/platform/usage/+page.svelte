<script lang="ts">
let{data}=$props();const result=$derived(data.result);const query=$derived(data.query);const serializedRows=$derived(data.serializedRows);const status=$derived(data.status);const plan=$derived(data.plan);
import SvgIcon from "$lib/components/ui/Icon.svelte";
import Card from "$lib/components/ui/Card.svelte";
import CardHeader from "$lib/components/ui/CardHeader.svelte";
import CardTitle from "$lib/components/ui/CardTitle.svelte";
import CardContent from "$lib/components/ui/CardContent.svelte";
import UsageManagement from "$lib/components/platform/UsageManagement.svelte";

</script>
<div class="space-y-6">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div class="flex items-center gap-2">
            <span class="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              Workforce Licensing
            </span>
            <span class="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600 font-medium">
              {result.total} {#if result.total === 1}{"organization"}{:else}{"organizations"}{/if} monitored
            </span>
          </div>
          <h1 class="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Usage & Seat Allocation
          </h1>
          <p class="mt-1 text-sm text-muted">
            Live tenant workforce telemetry compared against contractual plan employee limits. Active employees derive strictly from the core workforce model.
          </p>
        </div>
      </div>

      <Card class="border-border/80 bg-surface shadow-xs">
        <CardHeader class="border-b border-border/50 pb-4">
          <CardTitle class="text-base font-semibold text-foreground">
            Tenant Capacity Registry
          </CardTitle>
          <p class="text-xs text-muted">
            Track seat utilization ratios, identify over-limit tenants, and review licensing headroom
          </p>
        </CardHeader>
        <CardContent class="pt-6">
          <UsageManagement initialRows={serializedRows} total={result.total} page={result.page} pageSize={result.pageSize} pageCount={result.pageCount} availablePlans={result.availablePlans} initialQuery={query} initialStatus={status} initialPlan={plan} />
        </CardContent>
      </Card>
    </div>
