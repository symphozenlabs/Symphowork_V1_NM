<script lang="ts">
let{data}=$props();const result=$derived(data.result);const query=$derived(data.query);const serializedRows=$derived(data.serializedRows);const status=$derived(data.status);const billing=$derived(data.billing);
import SvgIcon from "$lib/components/ui/Icon.svelte";
import Card from "$lib/components/ui/Card.svelte";
import CardHeader from "$lib/components/ui/CardHeader.svelte";
import CardTitle from "$lib/components/ui/CardTitle.svelte";
import CardContent from "$lib/components/ui/CardContent.svelte";
import SubscriptionManagement from "$lib/components/platform/SubscriptionManagement.svelte";

</script>
<div class="space-y-6">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div class="flex items-center gap-2">
            <span class="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              Commercial Operations
            </span>
            <span class="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600 font-medium">
              {result.total} {#if result.total === 1}{"subscription"}{:else}{"subscriptions"}{/if}
            </span>
          </div>
          <h1 class="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Organization Subscriptions
          </h1>
          <p class="mt-1 text-sm text-muted">
            Administrative subscription lifecycles, billing intervals, tier assignments, and external provider customer links.
          </p>
        </div>
      </div>

      <Card class="border-border/80 bg-surface shadow-xs">
        <CardHeader class="border-b border-border/50 pb-4">
          <CardTitle class="text-base font-semibold text-foreground">
            Active Subscription Registry
          </CardTitle>
          <p class="text-xs text-muted">
            Search by tenant name, filter by status or billing cadence, and manage tier allocations
          </p>
        </CardHeader>
        <CardContent class="pt-6">
          <SubscriptionManagement initialRows={serializedRows} total={result.total} page={result.page} pageSize={result.pageSize} pageCount={result.pageCount} initialQuery={query} initialStatus={status} initialBilling={billing} />
        </CardContent>
      </Card>
    </div>
