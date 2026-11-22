<script lang="ts">
import SvgIcon from "$lib/components/ui/Icon.svelte";
import Button from "$lib/components/ui/Button.svelte";

import {untrack} from "svelte";
import {page as routePage,navigating} from "$app/state";
import {goto,invalidateAll} from "$app/navigation";
import {notify} from "$lib/client/toast";
export interface SerializedSubscriptionRow {
  subscription: {
    id: string;
    organizationId: string;
    planId: string;
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
  };
  organization: {
    id: string;
    name: string;
    slug: string;
  };
  plan: {
    id: string;
    code: string;
    name: string;
    currency: string;
    billingInterval: string;
    monthlyPriceCents: number | null;
    annualPriceCents: number | null;
    active: boolean;
  };
}
interface SubscriptionManagementProps {
  initialRows: SerializedSubscriptionRow[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
  initialQuery?: string;
  initialStatus?: string;
  initialBilling?: string;
}
let {
  initialRows,
  total,
  page,
  pageSize,
  pageCount,
  initialQuery = "",
  initialStatus = "all",
  initialBilling = "all",
}:SubscriptionManagementProps=$props();
const router={push:goto,replace:(href:string,options?:{scroll?:boolean})=>goto(href,{replaceState:true,noScroll:options?.scroll===false}),refresh:invalidateAll,back:()=>history.back()};
const searchParams=$derived(routePage.url.searchParams);
const isPending=$derived(navigating.to!==null);const startTransition=(action:()=>unknown)=>{action();};
let searchInput=$state(untrack(()=>(initialQuery)));
const setSearchInput=(next:typeof searchInput|((previous:typeof searchInput)=>typeof searchInput))=>{searchInput=typeof next==="function"?(next as (previous:typeof searchInput)=>typeof searchInput)(searchInput):next;};
let statusFilter=$state(untrack(()=>(initialStatus)));
const setStatusFilter=(next:typeof statusFilter|((previous:typeof statusFilter)=>typeof statusFilter))=>{statusFilter=typeof next==="function"?(next as (previous:typeof statusFilter)=>typeof statusFilter)(statusFilter):next;};
let billingFilter=$state(untrack(()=>(initialBilling)));
const setBillingFilter=(next:typeof billingFilter|((previous:typeof billingFilter)=>typeof billingFilter))=>{billingFilter=typeof next==="function"?(next as (previous:typeof billingFilter)=>typeof billingFilter)(billingFilter):next;};
$effect(()=>{searchParams;return untrack(() => {
    setSearchInput(searchParams.get("q") ?? searchParams.get("query") ?? "");
    setStatusFilter(searchParams.get("status") ?? "all");
    setBillingFilter(
      searchParams.get("billing") ??
        searchParams.get("billingInterval") ??
        searchParams.get("billingCycle") ??
        "all"
    );
  });});
function applyFilters(updates: {
    query?: string;
    status?: string;
    billing?: string;
    page?: number;
  }) {
    const q = updates.query !== undefined ? updates.query : searchInput;
    const st = updates.status !== undefined ? updates.status : statusFilter;
    const bl = updates.billing !== undefined ? updates.billing : billingFilter;
    const p = updates.page !== undefined ? updates.page : 1;

    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (st && st !== "all") params.set("status", st);
    if (bl && bl !== "all") params.set("billing", bl);
    if (p > 1) params.set("page", String(p));

    const qs = params.toString();
    startTransition(() => {
      router.push(`/platform/subscriptions${qs ? `?${qs}` : ""}`);
    });
  }
$effect(()=>{searchInput;return untrack(() => {
    const currentParam = searchParams.get("q") ?? searchParams.get("query") ?? "";
    if (searchInput === currentParam) return;

    const timer = setTimeout(() => {
      applyFilters({ query: searchInput, page: 1 });
    }, 350);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  });});
function handleStatusChange(newStatus: string) {
    setStatusFilter(newStatus);
    applyFilters({ status: newStatus, page: 1 });
  }
function handleBillingChange(newBilling: string) {
    setBillingFilter(newBilling);
    applyFilters({ billing: newBilling, page: 1 });
  }
function handleClearFilters() {
    setSearchInput("");
    setStatusFilter("all");
    setBillingFilter("all");
    startTransition(() => {
      router.push("/platform/subscriptions");
    });
  }
function handlePrevPage() {
    if (page > 1) {
      applyFilters({ page: page - 1 });
    }
  }
function handleNextPage() {
    if (page < pageCount) {
      applyFilters({ page: page + 1 });
    }
  }
const hasActiveFilters=$derived(Boolean(
    searchInput.trim() || statusFilter !== "all" || billingFilter !== "all"
  ));
const startRecord=$derived(total === 0 ? 0 : (page - 1) * pageSize + 1);
const endRecord=$derived(Math.min(total, page * pageSize));
</script>
<div class="space-y-4">
      
      <div class="flex flex-col gap-3 rounded-xl border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          
          <div class="relative flex-1">
            <input type="text" value={searchInput} oninput={(e) => setSearchInput(e.currentTarget.value)} placeholder="Search organization, slug, plan name, plan code..." class="w-full rounded-lg border bg-surface px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/20" />
            {#if searchInput}<button type="button" onclick={() => setSearchInput("")} class="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-foreground text-xs" aria-label="Clear search">
                ✕
              </button>{/if}
          </div>

          
          <div class="w-full sm:w-44">
            <select value={statusFilter} onchange={(e) => handleStatusChange(e.currentTarget.value)} class="w-full rounded-lg border bg-surface px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/20">
              <option value="all">Status: All</option>
              <option value="active">Status: Active</option>
              <option value="inactive">Status: Inactive</option>
            </select>
          </div>

          
          <div class="w-full sm:w-44">
            <select value={billingFilter} onchange={(e) => handleBillingChange(e.currentTarget.value)} class="w-full rounded-lg border bg-surface px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/20">
              <option value="all">Billing: All</option>
              <option value="monthly">Billing: Monthly</option>
              <option value="annual">Billing: Annual</option>
            </select>
          </div>
        </div>

        
        {#if hasActiveFilters}<div class="flex items-center justify-end">
            <Button type="button" variant="secondary" size="sm" onclick={handleClearFilters} disabled={isPending}>
              Reset
            </Button>
          </div>{/if}
      </div>

      
      <div class="relative overflow-hidden rounded-xl border bg-surface">
        
        {#if isPending}<div class="absolute inset-0 z-10 flex items-center justify-center bg-surface/50 backdrop-blur-[1px]">
            <div class="rounded-lg bg-surface border px-4 py-2 text-xs font-medium text-muted shadow-sm">
              Loading subscriptions…
            </div>
          </div>{/if}

        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="border-b bg-surface-muted/30 text-xs uppercase tracking-wide text-muted">
              <tr>
                <th class="px-4 py-3 font-semibold">Organization</th>
                <th class="px-4 py-3 font-semibold">Plan</th>
                <th class="px-4 py-3 font-semibold">Status</th>
                <th class="px-4 py-3 font-semibold">Billing</th>
                <th class="px-4 py-3 font-semibold">Renewal</th>
                <th class="px-4 py-3 font-semibold">Provider State</th>
              </tr>
            </thead>
            <tbody class="divide-y">
              {#each initialRows as { subscription, organization, plan }}{@const isStatusActive = subscription.status === "active"}{@const isStatusPending = subscription.status === "pending"}<tr class="transition-colors hover:bg-surface-muted/20">
                    <td class="px-4 py-3.5">
                      <div class="font-semibold text-foreground">{organization.name}</div>
                      <div class="text-xs text-muted font-mono">{organization.slug}</div>
                    </td>

                    <td class="px-4 py-3.5">
                      <div class="flex items-center gap-2">
                        <span class="font-medium text-foreground">{plan.name}</span>
                        <span class="rounded-md border bg-muted/60 px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase text-muted">
                          {plan.code}
                        </span>
                      </div>
                    </td>

                    <td class="px-4 py-3.5">
                      <span class={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold border ${
                          isStatusActive
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : isStatusPending
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-rose-50 text-rose-700 border-rose-200"
                        }`}>
                        {subscription.status}
                      </span>
                    </td>

                    <td class="px-4 py-3.5">
                      <span class="capitalize text-foreground">
                        {subscription.billingCycle}
                      </span>
                    </td>

                    <td class="px-4 py-3.5 text-muted">
                      {#if subscription.renewalAt}{new Date(subscription.renewalAt).toLocaleDateString()}{:else}{"—"}{/if}
                    </td>

                    <td class="px-4 py-3.5">
                      <span class={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          subscription.providerSubscriptionId
                            ? "bg-primary/10 text-primary border border-primary/20"
                            : "text-muted"
                        }`}>
                        {#if subscription.providerSubscriptionId}{"Linked"}{:else}{"Not linked"}{/if}
                      </span>
                    </td>
                  </tr>{/each}
            </tbody>
          </table>
        </div>

        
        {#if initialRows.length === 0}<div class="p-12 text-center">
            <p class="text-base font-semibold text-foreground">No subscriptions found</p>
            {#if hasActiveFilters}<p class="mt-1 text-sm text-muted">
                No organization subscriptions matched your current search and filter settings.
              </p>{:else}<p class="mt-1 text-sm text-muted">No organization subscriptions exist yet.</p>{/if}
            {#if hasActiveFilters}<div class="mt-4">
                <Button type="button" variant="secondary" size="sm" onclick={handleClearFilters}>
                  Clear filters
                </Button>
              </div>{/if}
          </div>{/if}

        
        {#if total > 0}<div class="flex flex-col items-center justify-between gap-3 border-t bg-surface-muted/10 px-4 py-3 sm:flex-row">
            <div class="text-xs text-muted">
              Showing <span class="font-semibold text-foreground">{startRecord}</span> to{" "}
              <span class="font-semibold text-foreground">{endRecord}</span> of{" "}
              <span class="font-semibold text-foreground">{total}</span> subscriptions
            </div>

            <div class="flex items-center gap-3">
              <span class="text-xs text-muted">
                Page <span class="font-semibold text-foreground">{page}</span> of{" "}
                <span class="font-semibold text-foreground">{pageCount}</span>
              </span>

              <div class="flex items-center gap-1.5">
                <Button type="button" variant="secondary" size="sm" onclick={handlePrevPage} disabled={page <= 1 || isPending}>
                  Previous
                </Button>
                <Button type="button" variant="secondary" size="sm" onclick={handleNextPage} disabled={page >= pageCount || isPending}>
                  Next
                </Button>
              </div>
            </div>
          </div>{/if}
      </div>
    </div>
