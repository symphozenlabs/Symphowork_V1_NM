<script lang="ts">
import SvgIcon from "$lib/components/ui/Icon.svelte";
import Card from "$lib/components/ui/Card.svelte";
import CardHeader from "$lib/components/ui/CardHeader.svelte";
import CardTitle from "$lib/components/ui/CardTitle.svelte";
import Input from "$lib/components/ui/Input.svelte";
import CardContent from "$lib/components/ui/CardContent.svelte";
import Button from "$lib/components/ui/Button.svelte";

import {untrack} from "svelte";
import {page as routePage,navigating} from "$app/state";
import {goto,invalidateAll} from "$app/navigation";
import {notify} from "$lib/client/toast";
interface SerializedAuditRow {
  audit: {
    id: string;
    action: string;
    resource: string;
    organizationId: string | null;
    createdAt: string;
  };
  actor: {
    name: string | null;
  } | null;
  organization?: {
    name: string | null;
  } | null;
}
interface PlatformAuditListProps {
  initialRows: SerializedAuditRow[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
  initialQuery?: string;
}
let {
  initialRows,
  total,
  page,
  pageSize,
  pageCount,
  initialQuery = "",
}:PlatformAuditListProps=$props();
const router={push:goto,replace:(href:string)=>goto(href,{replaceState:true}),refresh:invalidateAll,back:()=>history.back()};
const searchParams=$derived(routePage.url.searchParams);
const isPending=$derived(navigating.to!==null);const startTransition=(action:()=>unknown)=>{action();};
let searchInput=$state(untrack(()=>(initialQuery)));
const setSearchInput=(next:typeof searchInput|((previous:typeof searchInput)=>typeof searchInput))=>{searchInput=typeof next==="function"?(next as (previous:typeof searchInput)=>typeof searchInput)(searchInput):next;};
let rows=$state<SerializedAuditRow[]>(untrack(()=>(initialRows)));
const setRows=(next:typeof rows|((previous:typeof rows)=>typeof rows))=>{rows=typeof next==="function"?(next as (previous:typeof rows)=>typeof rows)(rows):next;};
$effect(()=>{initialRows;return untrack(() => {
    setRows(initialRows);
  });});
$effect(()=>{searchParams;return untrack(() => {
    const currentParam = searchParams.get("query") ?? searchParams.get("q") ?? "";
    setSearchInput(currentParam);
  });});
function navigateTo(targetQuery: string, targetPage: number, targetPageSize: number) {
    const params = new URLSearchParams();
    const trimmed = targetQuery.trim();
    if (trimmed) {
      params.set("query", trimmed);
    }
    if (targetPage > 1) {
      params.set("page", String(targetPage));
    }
    if (targetPageSize !== 10) {
      params.set("pageSize", String(targetPageSize));
    }
    const qs = params.toString();
    startTransition(() => {
      router.push(`/platform/audit${qs ? `?${qs}` : ""}`);
    });
  }
$effect(()=>{searchInput;pageSize;return untrack(() => {
    const currentParam = searchParams.get("query") ?? searchParams.get("q") ?? "";
    if (searchInput === currentParam) return;

    const timer = setTimeout(() => {
      navigateTo(searchInput, 1, pageSize);
    }, 350);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  });});
function handlePageSizeChange(newPageSize: number) {
    navigateTo(searchInput, 1, newPageSize);
  }
function handlePrevPage() {
    if (page > 1) {
      navigateTo(searchInput, page - 1, pageSize);
    }
  }
function handleNextPage() {
    if (page < pageCount) {
      navigateTo(searchInput, page + 1, pageSize);
    }
  }
const startRecord = $derived(total === 0 ? 0 : (page - 1) * pageSize + 1);
const endRecord = $derived(Math.min(total, page * pageSize));
const totalPages = $derived(Math.max(1, pageCount));
</script>
<Card class="border-border/80 bg-surface shadow-xs">
      <CardHeader class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/50 pb-4">
        <div>
          <CardTitle class="text-base font-semibold text-foreground">
            Governance Ledger Events
          </CardTitle>
          <p class="text-xs text-muted">
            Chronological audit stream recording security, authorization, and tenant lifecycle activity
          </p>
        </div>
        <div class="relative w-full sm:w-72">
          <SvgIcon name="Search" class="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted pointer-events-none" />
          <Input type="search" placeholder="Search audit events…" value={searchInput} oninput={(e) => setSearchInput(e.currentTarget.value)} aria-label="Search audit events" class="pl-8 bg-slate-50/50 text-sm focus:bg-white" />
        </div>
      </CardHeader>
      <CardContent class="space-y-4 pt-4">
        {#if isPending}<div class="text-xs text-muted animate-pulse">Updating audit stream…</div>{/if}
        <div class="overflow-x-auto rounded-xl border border-border/70">
          <table class="w-full text-left text-sm">
            <thead class="bg-slate-50/70 border-b border-border/70 text-xs font-semibold text-muted uppercase tracking-wider">
              <tr>
                <th class="px-4 py-3">Timestamp</th>
                <th class="px-4 py-3">Actor</th>
                <th class="px-4 py-3">Action Event</th>
                <th class="px-4 py-3">Resource</th>
                <th class="px-4 py-3">Scope / Tenant</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border/50">
              {#each rows as { audit, actor, organization }}<tr class="hover:bg-slate-50/70 transition-colors">
                  <td class="px-4 py-3 text-xs text-muted whitespace-nowrap">
                    <div class="flex items-center gap-1.5">
                      <SvgIcon name="Clock" class="h-3 w-3 text-slate-400" />
                      <span>{audit.createdAt}</span>
                    </div>
                  </td>
                  <td class="px-4 py-3">
                    <span class="font-semibold text-xs text-foreground">
                      {actor?.name ?? "Platform System"}
                    </span>
                  </td>
                  <td class="px-4 py-3">
                    <span class="inline-block rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-700">
                      {audit.action}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-xs text-muted font-mono">
                    {audit.resource}
                  </td>
                  <td class="px-4 py-3 text-xs">
                    {#if organization?.name}<span class="font-medium text-slate-800">{organization.name}</span>{:else}{#if audit.organizationId}<span class="font-mono text-slate-500">{audit.organizationId.slice(0, 8)}…</span>{:else}<span class="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                        Global Platform
                      </span>{/if}{/if}
                  </td>
                </tr>{/each}
            </tbody>
          </table>
          {#if !rows.length}<div class="p-8 text-center">
              <SvgIcon name="History" class="h-8 w-8 text-slate-400 mx-auto mb-2" />
              <p class="text-sm font-semibold text-foreground">No audit events recorded</p>
              <p class="mt-1 text-xs text-muted">
                No events matched your search query.
              </p>
            </div>{/if}
        </div>

        
        <div class="flex flex-col items-center justify-between gap-4 border-t border-border/50 bg-slate-50/60 rounded-xl px-4 py-3 sm:flex-row">
          <div class="flex flex-wrap items-center gap-4 text-xs text-muted">
            <div>
              Showing <span class="font-semibold text-foreground">{startRecord}</span> to{" "}
              <span class="font-semibold text-foreground">{endRecord}</span> of{" "}
              <span class="font-semibold text-foreground">{total}</span> events
            </div>

            <div class="flex items-center gap-2">
              <label for="rows-per-page" class="text-xs text-muted whitespace-nowrap">
                Rows per page
              </label>
              <select id="rows-per-page" value={pageSize} onchange={(e) => handlePageSizeChange(Number(e.currentTarget.value))} class="rounded-lg border border-border/80 bg-surface px-2 py-1 text-xs focus:outline-hidden focus:ring-2 focus:ring-primary/20">
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <span class="text-xs text-muted">
              Page <span class="font-semibold text-foreground">{page}</span> of{" "}
              <span class="font-semibold text-foreground">{totalPages}</span>
            </span>

            <div class="flex items-center gap-2">
              <Button type="button" variant="secondary" size="sm" onclick={handlePrevPage} disabled={page <= 1 || isPending}>
                Previous
              </Button>
              <Button type="button" variant="secondary" size="sm" onclick={handleNextPage} disabled={page >= totalPages || isPending}>
                Next
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
