<script lang="ts">
  import { untrack } from "svelte";
  import { page as routePage } from "$app/state";
  import { pushState, replaceState } from "$app/navigation";
  import Button from "$lib/components/ui/Button.svelte";
  import Modal from "$lib/components/ui/Modal.svelte";
  import { getSeatCapacityDisplay, getSubscriptionExpiryDisplay, formatDateInOrganizationTimezone } from "@/modules/platform/subscriptions-usage";

  export interface SerializedSubscriptionUsageRow {
    organization: { id: string; name: string; slug: string; status: string; timezone?: string; dateFormat?: string };
    plan: { id: string; code: string; name: string; maxUsers: number | null; trialDays?: number | null; billingInterval?: string } | null;
    subscription: {
      id: string;
      status: string;
      billingStatus: string;
      billingCycle: string;
      startsAt: string | null;
      renewalAt: string | null;
      endsAt: string | null;
      providerCustomerId: string | null;
      providerSubscriptionId: string | null;
      createdAt: string;
      updatedAt: string;
    } | null;
    activeEmployees: number;
    employeeLimit: number | null;
    remaining: number | null;
    overLimit: boolean;
    nearLimit: boolean;
    limitReached: boolean;
    status: "within_limit" | "near_limit" | "limit_reached" | "over_limit";
    statusLabel: string;
    subscriptionStatus: "active" | "trialing" | "attention_required" | "suspended" | "inactive";
    subscriptionStatusLabel: string;
  }

  interface PlanOption { id: string; code: string; name: string }
  interface Props {
    initialRows: SerializedSubscriptionUsageRow[];
    total: number;
    page: number;
    pageSize: number;
    pageCount: number;
    availablePlans: PlanOption[];
    initialQuery?: string;
    initialStatus?: string;
    initialPlan?: string;
    initialBilling?: string;
  }

  let {
    initialRows, total: initialTotal, page: initialPage, pageSize, pageCount: initialPageCount, availablePlans: initialPlans,
    initialQuery = "", initialStatus = "all", initialPlan = "all", initialBilling = "all",
  }: Props = $props();

  let rows = $state(untrack(() => initialRows));
  let total = $state(untrack(() => initialTotal));
  let page = $state(untrack(() => initialPage));
  let pageCount = $state(untrack(() => initialPageCount));
  let availablePlans = $state(untrack(() => initialPlans));
  let searchInput = $state(untrack(() => initialQuery));
  let statusFilter = $state(untrack(() => initialStatus));
  let planFilter = $state(untrack(() => initialPlan));
  let billingFilter = $state(untrack(() => initialBilling));
  let isLoading = $state(false);
  let loadError = $state("");
  let selectedRow = $state<SerializedSubscriptionUsageRow | null>(null);
  let detailsOpen = $state(false);
  let lastRequestedSearch = routePage.url.search;
  let requestSequence = 0;

  async function loadRows(search: string) {
    const sequence = ++requestSequence;
    isLoading = true;
    loadError = "";
    try {
      const response = await fetch(`/api/platform/subscriptions-usage${search}`, {
        headers: { accept: "application/json" },
        credentials: "same-origin",
      });
      if (!response.ok) throw new Error(`Unable to load subscriptions and usage (${response.status}).`);
      const result = await response.json();
      if (sequence !== requestSequence) return;
      if (!result?.success || !Array.isArray(result.rows)) throw new Error("The subscriptions and usage response was invalid.");
      rows = result.rows;
      total = Number(result.total) || 0;
      page = Number(result.page) || 1;
      pageCount = Number(result.pageCount) || 1;
      availablePlans = Array.isArray(result.availablePlans) ? result.availablePlans : initialPlans;
    } catch (error) {
      if (sequence === requestSequence) loadError = error instanceof Error ? error.message : "Unable to load subscriptions and usage.";
    } finally {
      if (sequence === requestSequence) isLoading = false;
    }
  }

  $effect(() => {
    const search = routePage.url.search;
    return untrack(() => {
      if (search === lastRequestedSearch) return;
      lastRequestedSearch = search;
      searchInput = routePage.url.searchParams.get("q") ?? routePage.url.searchParams.get("query") ?? "";
      statusFilter = routePage.url.searchParams.get("status") ?? "all";
      planFilter = routePage.url.searchParams.get("plan") ?? "all";
      billingFilter = routePage.url.searchParams.get("billing") ?? "all";
      void loadRows(search);
    });
  });

  function navigate(updates: { query?: string; status?: string; plan?: string; billing?: string; page?: number }, history: "push" | "replace" = "push") {
    const query = updates.query !== undefined ? updates.query : searchInput;
    const status = updates.status !== undefined ? updates.status : statusFilter;
    const plan = updates.plan !== undefined ? updates.plan : planFilter;
    const billing = updates.billing !== undefined ? updates.billing : billingFilter;
    const nextPage = updates.page ?? 1;
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (status !== "all") params.set("status", status);
    if (plan !== "all") params.set("plan", plan);
    if (billing !== "all") params.set("billing", billing);
    if (nextPage > 1) params.set("page", String(nextPage));
    const search = params.size ? `?${params.toString()}` : "";
    const url = `/platform/subscriptions${search}`;
    const nextSearch = search;
    if (routePage.url.pathname === "/platform/subscriptions" && routePage.url.search === nextSearch) return;
    lastRequestedSearch = nextSearch;
    if (history === "replace") replaceState(url, {});
    else pushState(url, {});
    void loadRows(nextSearch);
  }

  $effect(() => {
    searchInput;
    return untrack(() => {
      const current = routePage.url.searchParams.get("q") ?? routePage.url.searchParams.get("query") ?? "";
      if (searchInput === current) return;
      const timer = setTimeout(() => navigate({ query: searchInput }, "replace"), 300);
      return () => clearTimeout(timer);
    });
  });

  function clearFilters() {
    searchInput = "";
    statusFilter = "all";
    planFilter = "all";
    billingFilter = "all";
    navigate({ query: "", status: "all", plan: "all", billing: "all", page: 1 });
  }
  function statusClass(status: SerializedSubscriptionUsageRow["subscriptionStatus"]) {
    if (status === "active") return "bg-emerald-500";
    if (status === "trialing" || status === "attention_required") return "bg-amber-500";
    return "bg-rose-500";
  }
  function openDetails(row: SerializedSubscriptionUsageRow) { selectedRow = row; detailsOpen = true; }
  const hasActiveFilters = $derived(Boolean(searchInput.trim() || statusFilter !== "all" || planFilter !== "all" || billingFilter !== "all"));
  const startRecord = $derived(total === 0 ? 0 : (page - 1) * pageSize + 1);
  const endRecord = $derived(Math.min(total, page * pageSize));
  const selectedCapacity = $derived(selectedRow ? getSeatCapacityDisplay(selectedRow) : null);
  const selectedExpiry = $derived(selectedRow ? getSubscriptionExpiryDisplay({
    storedEndDate: selectedRow.subscription?.endsAt,
    startsAt: selectedRow.subscription?.startsAt,
    billingCycle: selectedRow.subscription?.billingCycle,
    timezone: selectedRow.organization.timezone,
    dateFormat: selectedRow.organization.dateFormat,
  }) : null);
</script>

<div class="space-y-4">
  <div class="flex flex-col gap-3 rounded-xl border bg-surface p-4 lg:flex-row lg:items-center lg:justify-between">
    <div class="grid min-w-0 flex-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <div class="relative sm:col-span-2 xl:col-span-1">
        <input type="search" bind:value={searchInput} placeholder="Search organization, slug, plan..." aria-label="Search organizations and plans" class="w-full rounded-lg border bg-surface px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/20" />
      </div>
      <select aria-label="Filter by subscription or usage status" bind:value={statusFilter} onchange={() => navigate({ status: statusFilter })} class="w-full rounded-lg border bg-surface px-3 py-2 text-sm">
        <option value="all">All statuses</option>
        <optgroup label="Subscription status"><option value="active">Active</option><option value="trialing">Trial</option><option value="attention_required">Attention required</option><option value="suspended">Suspended</option><option value="inactive">Inactive / no subscription</option></optgroup>
        <optgroup label="Seat usage"><option value="within_limit">Within limit</option><option value="near_limit">Near limit</option><option value="limit_reached">Limit reached</option><option value="over_limit">Over limit</option></optgroup>
      </select>
      <select aria-label="Filter by plan" bind:value={planFilter} onchange={() => navigate({ plan: planFilter })} class="w-full rounded-lg border bg-surface px-3 py-2 text-sm">
        <option value="all">All plans</option>
        {#each availablePlans as plan}<option value={plan.code}>{plan.name} ({plan.code})</option>{/each}
      </select>
      <select aria-label="Filter by billing cadence" bind:value={billingFilter} onchange={() => navigate({ billing: billingFilter })} class="w-full rounded-lg border bg-surface px-3 py-2 text-sm">
        <option value="all">All billing cadences</option><option value="monthly">Monthly</option><option value="annual">Annual</option>
      </select>
    </div>
    {#if hasActiveFilters}<Button type="button" variant="secondary" size="sm" onclick={clearFilters} disabled={isLoading}>Reset filters</Button>{/if}
  </div>

  <div class="relative overflow-hidden rounded-xl border bg-surface" aria-busy={isLoading}>
    {#if isLoading}<div class="absolute inset-0 z-10 flex items-center justify-center bg-surface/50 backdrop-blur-[1px]" aria-live="polite"><div class="rounded-lg border bg-surface px-4 py-2 text-xs font-medium text-muted shadow-sm">Loading subscriptions and usage…</div></div>{/if}
    <div class="overflow-x-auto">
      <table class="w-full min-w-[850px] text-left text-sm">
        <thead class="border-b bg-surface-muted/30 text-xs uppercase tracking-wide text-muted"><tr><th scope="col" class="w-24 px-4 py-3 font-semibold">Status</th><th scope="col" class="min-w-52 px-4 py-3 font-semibold">Organization</th><th scope="col" class="min-w-48 px-4 py-3 font-semibold">Plan</th><th scope="col" class="px-4 py-3 font-semibold">Billing</th><th scope="col" class="whitespace-nowrap px-4 py-3 text-right font-semibold">Total Emp.</th><th scope="col" class="min-w-40 px-4 py-3 text-right font-semibold">Remaining / Allowed</th></tr></thead>
        <tbody class="divide-y">
          {#each rows as row (row.organization.id)}
            {@const capacity = getSeatCapacityDisplay(row)}
            <tr class="transition-colors hover:bg-surface-muted/20">
              <td class="px-4 py-3.5"><span class="inline-flex items-center gap-2" title={row.subscriptionStatusLabel}><span class={`size-2.5 shrink-0 rounded-full ${statusClass(row.subscriptionStatus)}`} aria-hidden="true"></span><span class="sr-only">{row.subscriptionStatusLabel}</span><span class="text-xs text-muted">{row.subscriptionStatusLabel}</span></span></td>
              <td class="px-4 py-3.5"><div class="flex items-start justify-between gap-2"><div class="min-w-0"><div class="truncate font-semibold text-foreground">{row.organization.name}</div><div class="truncate font-mono text-xs text-muted">{row.organization.slug}</div></div><button type="button" class="shrink-0 text-xs font-medium text-primary hover:underline" aria-haspopup="dialog" onclick={() => openDetails(row)}>Details</button></div></td>
              <td class="px-4 py-3.5">{#if row.plan}<div class="flex flex-wrap items-center gap-2"><span class="font-medium text-foreground">{row.plan.name}</span><span class="rounded-md border bg-muted/60 px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase text-muted">{row.plan.code}</span></div>{:else}<span class="text-muted">No plan</span>{/if}</td>
              <td class="px-4 py-3.5 capitalize text-foreground">{row.subscription?.billingCycle ?? "—"}</td>
              <td class="px-4 py-3.5 text-right font-medium tabular-nums text-foreground">{row.activeEmployees}</td>
              <td class="px-4 py-3.5 text-right font-medium tabular-nums text-foreground"><span class={capacity.kind === "missing" ? "text-muted" : ""}>{capacity.display}</span>{#if capacity.overBy > 0}<span class="mt-0.5 block text-xs font-medium text-rose-600">Over by {capacity.overBy}</span>{/if}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    {#if loadError}<div class="p-8 text-center" role="alert"><p class="text-sm font-medium text-rose-600">{loadError}</p><Button type="button" class="mt-3" variant="secondary" size="sm" onclick={() => loadRows(routePage.url.search)}>Retry</Button></div>
    {:else if rows.length === 0}<div class="p-10 text-center"><p class="text-base font-semibold text-foreground">No organizations found</p><p class="mt-1 text-sm text-muted">{hasActiveFilters ? "No organizations match these search and filter settings." : "No organizations are available yet."}</p>{#if hasActiveFilters}<div class="mt-4"><Button type="button" variant="secondary" size="sm" onclick={clearFilters}>Clear filters</Button></div>{/if}</div>{/if}

    {#if total > 0}<div class="flex flex-col items-center justify-between gap-3 border-t bg-surface-muted/10 px-4 py-3 sm:flex-row"><div class="text-xs text-muted">Showing <span class="font-semibold text-foreground">{startRecord}</span> to <span class="font-semibold text-foreground">{endRecord}</span> of <span class="font-semibold text-foreground">{total}</span> organizations</div><div class="flex items-center gap-3"><span class="text-xs text-muted">Page <span class="font-semibold text-foreground">{page}</span> of <span class="font-semibold text-foreground">{pageCount}</span></span><div class="flex items-center gap-1.5"><Button type="button" variant="secondary" size="sm" onclick={() => navigate({ page: page - 1 })} disabled={page <= 1 || isLoading}>Previous</Button><Button type="button" variant="secondary" size="sm" onclick={() => navigate({ page: page + 1 })} disabled={page >= pageCount || isLoading}>Next</Button></div></div></div>{/if}
  </div>

  <Modal bind:open={detailsOpen} title="Organization Subscription Details" lockScroll class="max-w-2xl">
    {#if selectedRow && selectedExpiry && selectedCapacity}
      <div class="grid gap-4 sm:grid-cols-2">
        <div><p class="text-xs font-semibold uppercase tracking-wide text-muted">Organization</p><p class="mt-1 font-medium">{selectedRow.organization.name}</p></div>
        <div><p class="text-xs font-semibold uppercase tracking-wide text-muted">Plan</p><p class="mt-1 font-medium">{selectedRow.plan?.name ?? "Not configured"}</p>{#if selectedRow.plan}<span class="mt-1 inline-flex rounded-md border bg-muted/60 px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase text-muted">{selectedRow.plan.code}</span>{/if}</div>
        <div><p class="text-xs font-semibold uppercase tracking-wide text-muted">Status</p><p class="mt-1 font-medium capitalize">{selectedRow.subscription?.status ?? selectedRow.organization.status}{#if selectedRow.subscription?.billingStatus && selectedRow.subscription.billingStatus !== selectedRow.subscription.status}<span class="text-muted"> · {selectedRow.subscription.billingStatus}</span>{/if}</p></div>
        <div><p class="text-xs font-semibold uppercase tracking-wide text-muted">Billing</p><p class="mt-1 font-medium capitalize">{selectedRow.subscription?.billingCycle ?? "Not configured"}</p></div>
        <div><p class="text-xs font-semibold uppercase tracking-wide text-muted">Total Employees</p><p class="mt-1 font-medium tabular-nums">{selectedRow.activeEmployees}</p></div>
        <div><p class="text-xs font-semibold uppercase tracking-wide text-muted">Allowed Seats</p><p class="mt-1 font-medium tabular-nums">{selectedRow.employeeLimit === null ? "Unlimited" : selectedRow.employeeLimit}</p></div>
        <div><p class="text-xs font-semibold uppercase tracking-wide text-muted">Subscription Start Date</p><p class="mt-1 font-medium">{formatDateInOrganizationTimezone(selectedRow.subscription?.startsAt, selectedRow.organization.timezone, selectedRow.organization.dateFormat)}</p></div>
        <div><p class="text-xs font-semibold uppercase tracking-wide text-muted">Subscription End Date</p><p class="mt-1 font-medium">{selectedExpiry.formattedDate}</p>{#if selectedExpiry.state === "active"}<span class="mt-1 inline-flex rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-700">Active Period</span>{:else if selectedExpiry.state === "passed"}<span class="mt-1 inline-flex rounded-full bg-rose-500/10 px-2 py-0.5 text-xs font-medium text-rose-700">End Date Passed</span>{/if}</div>
        <div><p class="text-xs font-semibold uppercase tracking-wide text-muted">Remaining Days</p><p class="mt-1 font-medium tabular-nums">{selectedExpiry.remainingDays === null ? "Not configured" : `${selectedExpiry.remainingDays} days`}</p></div>
      </div>
    {/if}
  </Modal>
</div>
