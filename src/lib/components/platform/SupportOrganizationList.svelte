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
interface SupportOrgRow {
  id: string;
  name: string;
  slug: string;
  status: string;
}
interface SupportOrganizationListProps {
  initialRows: SupportOrgRow[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
  initialQuery?: string;
}
const statusBadgeMap: Record<string, { bg: string; text: string; dot: string; border: string }> = {
  active: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", border: "border-emerald-200" },
  pending: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500", border: "border-amber-200" },
  suspended: { bg: "bg-rose-50", text: "text-rose-700", dot: "bg-rose-500", border: "border-rose-200" },
  rejected: { bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400", border: "border-slate-200" },
};
let {
  initialRows,
  total,
  page,
  pageSize,
  pageCount,
  initialQuery = "",
}:SupportOrganizationListProps=$props();
const router={push:goto,replace:(href:string)=>goto(href,{replaceState:true}),refresh:invalidateAll,back:()=>history.back()};
const searchParams=$derived(routePage.url.searchParams);
const isPending=$derived(navigating.to!==null);const startTransition=(action:()=>unknown)=>{action();};
let searchInput=$state(untrack(()=>(initialQuery)));
const setSearchInput=(next:typeof searchInput|((previous:typeof searchInput)=>typeof searchInput))=>{searchInput=typeof next==="function"?(next as (previous:typeof searchInput)=>typeof searchInput)(searchInput):next;};
let rows=$state<SupportOrgRow[]>(untrack(()=>(initialRows)));
const setRows=(next:typeof rows|((previous:typeof rows)=>typeof rows))=>{rows=typeof next==="function"?(next as (previous:typeof rows)=>typeof rows)(rows):next;};
$effect(()=>{initialRows;return untrack(() => {
    setRows(initialRows);
  });});
$effect(()=>{searchParams;return untrack(() => {
    const currentParam = searchParams.get("q") ?? searchParams.get("query") ?? "";
    setSearchInput(currentParam);
  });});
function navigateTo(targetQuery: string, targetPage: number) {
    const params = new URLSearchParams();
    const trimmed = targetQuery.trim();
    if (trimmed) {
      params.set("q", trimmed);
    }
    if (targetPage > 1) {
      params.set("page", String(targetPage));
    }
    const qs = params.toString();
    startTransition(() => {
      router.push(`/platform/support${qs ? `?${qs}` : ""}`);
    });
  }
$effect(()=>{searchInput;return untrack(() => {
    const currentParam = searchParams.get("q") ?? searchParams.get("query") ?? "";
    if (searchInput === currentParam) return;

    const timer = setTimeout(() => {
      navigateTo(searchInput, 1);
    }, 350);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  });});
function handlePrevPage() {
    if (page > 1) {
      navigateTo(searchInput, page - 1);
    }
  }
function handleNextPage() {
    if (page < pageCount) {
      navigateTo(searchInput, page + 1);
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
            Tenant Troubleshooting Directory
          </CardTitle>
          <p class="text-xs text-muted">
            Locate organizations for operational diagnosis and platform annotation
          </p>
        </div>
        <div class="relative w-full sm:w-72">
          <SvgIcon name="Search" class="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted pointer-events-none" />
          <Input type="search" placeholder="Search organizations…" value={searchInput} oninput={(e) => setSearchInput(e.currentTarget.value)} aria-label="Search organizations" class="pl-8 bg-slate-50/50 text-sm focus:bg-white" />
        </div>
      </CardHeader>
      <CardContent class="space-y-4 pt-4">
        {#if isPending}<div class="text-xs text-muted animate-pulse">Updating directory results…</div>{/if}
        <div class="space-y-2.5">
          {#each rows as organization}{@const theme = statusBadgeMap[organization.status] || statusBadgeMap.active}<a href={`/platform/organizations/${organization.id}`} class="group flex items-center justify-between rounded-xl border border-border/70 bg-slate-50/40 p-4 transition-all hover:border-primary/30 hover:bg-slate-50 hover:shadow-xs">
                <div class="flex items-center gap-3.5 min-w-0">
                  <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-sm group-hover:bg-primary group-hover:text-white transition-colors">
                    {organization.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div class="min-w-0 space-y-0.5">
                    <span class="block font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                      {organization.name}
                    </span>
                    <div class="flex items-center gap-2 text-xs text-muted">
                      <span class="font-mono text-slate-500">{organization.slug}</span>
                      <span>·</span>
                      <span class="font-mono text-[11px] text-slate-400 select-all">
                        {organization.id.slice(0, 8)}…
                      </span>
                    </div>
                  </div>
                </div>

                <div class="flex items-center gap-3 shrink-0">
                  <span class={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold border ${theme.bg} ${theme.text} ${theme.border}`}>
                    <span class={`h-1.5 w-1.5 rounded-full ${theme.dot}`}></span>
                    {organization.status.toUpperCase()}
                  </span>
                  <SvgIcon name="ChevronRight" class="h-4 w-4 text-slate-400 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                </div>
              </a>{/each}
        </div>
        {#if !rows.length}<div class="rounded-xl border border-dashed border-border/80 p-8 text-center">
            <SvgIcon name="Building2" class="h-8 w-8 text-slate-400 mx-auto mb-2" />
            <p class="text-sm font-semibold text-foreground">No organizations found</p>
            <p class="mt-1 text-xs text-muted">
              Try adjusting your search criteria or clear filters.
            </p>
          </div>{/if}

        
        <div class="flex flex-col items-center justify-between gap-3 border-t border-border/50 bg-slate-50/60 rounded-xl px-4 py-3 sm:flex-row">
          <div class="text-xs text-muted">
            Showing <span class="font-semibold text-foreground">{startRecord}</span> to{" "}
            <span class="font-semibold text-foreground">{endRecord}</span> of{" "}
            <span class="font-semibold text-foreground">{total}</span> organizations
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
