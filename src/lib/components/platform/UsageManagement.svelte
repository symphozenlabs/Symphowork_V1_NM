<script lang="ts">
import SvgIcon from "$lib/components/ui/Icon.svelte";
import Button from "$lib/components/ui/Button.svelte";

import {untrack} from "svelte";
import {page as routePage,navigating} from "$app/state";
import {goto,invalidateAll} from "$app/navigation";
import {notify} from "$lib/client/toast";
export interface SerializedUsageRow {
  organization: {
    id: string;
    name: string;
    slug: string;
  };
  plan: {
    id: string;
    code: string;
    name: string;
    maxUsers: number | null;
  } | null;
  activeEmployees: number;
  employeeLimit: number | null;
  remaining: number | null;
  overLimit: boolean;
  nearLimit: boolean;
  limitReached: boolean;
  status: "within_limit" | "near_limit" | "limit_reached" | "over_limit";
  statusLabel: "Within limit" | "Near limit" | "Limit reached" | "Over limit";
}
interface AvailablePlanItem {
  id: string;
  code: string;
  name: string;
}
interface UsageManagementProps {
  initialRows: SerializedUsageRow[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
  availablePlans: AvailablePlanItem[];
  initialQuery?: string;
  initialStatus?: string;
  initialPlan?: string;
}
let {
  initialRows,
  total,
  page,
  pageSize,
  pageCount,
  availablePlans,
  initialQuery = "",
  initialStatus = "all",
  initialPlan = "all",
}:UsageManagementProps=$props();
const router={push:goto,replace:(href:string,options?:{scroll?:boolean})=>goto(href,{replaceState:true,noScroll:options?.scroll===false}),refresh:invalidateAll,back:()=>history.back()};
const searchParams=$derived(routePage.url.searchParams);
const isPending=$derived(navigating.to!==null);const startTransition=(action:()=>unknown)=>{action();};
let searchInput=$state(untrack(()=>(initialQuery)));
const setSearchInput=(next:typeof searchInput|((previous:typeof searchInput)=>typeof searchInput))=>{searchInput=typeof next==="function"?(next as (previous:typeof searchInput)=>typeof searchInput)(searchInput):next;};
let statusFilter=$state(untrack(()=>(initialStatus)));
const setStatusFilter=(next:typeof statusFilter|((previous:typeof statusFilter)=>typeof statusFilter))=>{statusFilter=typeof next==="function"?(next as (previous:typeof statusFilter)=>typeof statusFilter)(statusFilter):next;};
let planFilter=$state(untrack(()=>(initialPlan)));
const setPlanFilter=(next:typeof planFilter|((previous:typeof planFilter)=>typeof planFilter))=>{planFilter=typeof next==="function"?(next as (previous:typeof planFilter)=>typeof planFilter)(planFilter):next;};
$effect(()=>{searchParams;return untrack(() => {
    setSearchInput(searchParams.get("q") ?? searchParams.get("query") ?? "");
    setStatusFilter(searchParams.get("status") ?? "all");
    setPlanFilter(searchParams.get("plan") ?? "all");
  });});
function applyFilters(updates: {
    query?: string;
    status?: string;
    plan?: string;
    page?: number;
  }) {
    const q = updates.query !== undefined ? updates.query : searchInput;
    const st = updates.status !== undefined ? updates.status : statusFilter;
    const pl = updates.plan !== undefined ? updates.plan : planFilter;
    const p = updates.page !== undefined ? updates.page : 1;

    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (st && st !== "all") params.set("status", st);
    if (pl && pl !== "all") params.set("plan", pl);
    if (p > 1) params.set("page", String(p));

    const qs = params.toString();
    startTransition(() => {
      router.push(`/platform/usage${qs ? `?${qs}` : ""}`);
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
function handlePlanChange(newPlan: string) {
    setPlanFilter(newPlan);
    applyFilters({ plan: newPlan, page: 1 });
  }
function handleClearFilters() {
    setSearchInput("");
    setStatusFilter("all");
    setPlanFilter("all");
    startTransition(() => {
      router.push("/platform/usage");
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
    searchInput.trim() || statusFilter !== "all" || planFilter !== "all"
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
              <option value="within_limit">Status: Within limit</option>
              <option value="near_limit">Status: Near limit</option>
              <option value="limit_reached">Status: Limit reached</option>
              <option value="over_limit">Status: Over limit</option>
            </select>
          </div>

          
          <div class="w-full sm:w-48">
            <select value={planFilter} onchange={(e) => handlePlanChange(e.currentTarget.value)} class="w-full rounded-lg border bg-surface px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/20">
              <option value="all">Plan: All plans</option>
              {#each availablePlans as p}<option value={p.code}>
                  {p.name} ({p.code})
                </option>{/each}
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
              Loading usage data…
            </div>
          </div>{/if}

        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="border-b bg-surface-muted/30 text-xs uppercase tracking-wide text-muted">
              <tr>
                <th class="px-4 py-3 font-semibold">Organization</th>
                <th class="px-4 py-3 font-semibold">Plan</th>
                <th class="px-4 py-3 font-semibold">Active Employees</th>
                <th class="px-4 py-3 font-semibold">Allowed</th>
                <th class="px-4 py-3 font-semibold">Remaining</th>
                <th class="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y">
              {#each initialRows as { organization, plan, activeEmployees, employeeLimit, remaining, status, statusLabel }}<tr class="transition-colors hover:bg-surface-muted/20">
                    <td class="px-4 py-3.5">
                      <div class="font-semibold text-foreground">{organization.name}</div>
                      <div class="text-xs text-muted font-mono">{organization.slug}</div>
                    </td>

                    <td class="px-4 py-3.5">
                      {#if plan}<div class="flex items-center gap-2">
                          <span class="font-medium text-foreground">{plan.name}</span>
                          <span class="rounded-md border bg-muted/60 px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase text-muted">
                            {plan.code}
                          </span>
                        </div>{:else}<span class="text-muted">No plan</span>{/if}
                    </td>

                    <td class="px-4 py-3.5 font-medium text-foreground">
                      {activeEmployees}
                    </td>

                    <td class="px-4 py-3.5 text-foreground">
                      {#if employeeLimit !== null}{employeeLimit}{:else}{"Unlimited"}{/if}
                    </td>

                    <td class="px-4 py-3.5">
                      {#if remaining === null}<span class="text-foreground">Unlimited</span>{:else}{#if remaining < 0}<span class="font-semibold text-rose-600">{remaining}</span>{:else}{#if remaining === 0}<span class="font-semibold text-amber-600">0</span>{:else}<span class="font-medium text-foreground">{remaining}</span>{/if}{/if}{/if}
                    </td>

                    <td class="px-4 py-3.5">
                      <span class={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
                          status === "within_limit"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : status === "near_limit"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : status === "limit_reached"
                            ? "bg-orange-50 text-orange-700 border-orange-200"
                            : "bg-rose-50 text-rose-700 border-rose-200"
                        }`}>
                        {statusLabel}
                      </span>
                    </td>
                  </tr>{/each}
            </tbody>
          </table>
        </div>

        
        {#if initialRows.length === 0}<div class="p-12 text-center">
            <p class="text-base font-semibold text-foreground">No organization usage found</p>
            {#if hasActiveFilters}<p class="mt-1 text-sm text-muted">
                No organizations matched your current search and filter settings.
              </p>{:else}<p class="mt-1 text-sm text-muted">No organization records exist yet.</p>{/if}
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
              <span class="font-semibold text-foreground">{total}</span> organizations
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
