<script lang="ts">
  import Card from "$lib/components/ui/Card.svelte";
  import CardContent from "$lib/components/ui/CardContent.svelte";
  import CardHeader from "$lib/components/ui/CardHeader.svelte";
  import CardTitle from "$lib/components/ui/CardTitle.svelte";
  import SubscriptionUsageManagement from "$lib/components/platform/SubscriptionUsageManagement.svelte";

  let { data } = $props();
</script>

<div class="space-y-6">
  <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <div class="flex items-center gap-2">
        <span class="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
          Commercial Operations
        </span>
      </div>
      <h1 class="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Subscriptions &amp; Usage</h1>
      <p class="mt-1 max-w-3xl text-sm text-muted">
        Manage organization subscriptions, billing cycles, plans, and workforce seat utilization in one place.
      </p>
    </div>
  </div>

  <Card class="border-border/80 bg-surface shadow-xs">
    <CardHeader class="border-b border-border/50 pb-4">
      <CardTitle class="text-base font-semibold text-foreground">Organization Subscription &amp; Workforce Registry</CardTitle>
      <p class="text-xs text-muted">Search organizations and plans, review billing, and monitor active employee capacity.</p>
    </CardHeader>
    <CardContent class="pt-6">
      <SubscriptionUsageManagement
        initialRows={data.result.rows}
        total={data.result.total}
        page={data.result.page}
        pageSize={data.result.pageSize}
        pageCount={data.result.pageCount}
        availablePlans={data.result.availablePlans}
        initialQuery={data.query}
        initialStatus={data.status}
        initialPlan={data.plan}
        initialBilling={data.billing}
      />
    </CardContent>
  </Card>
</div>
