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
interface SerializedPlatformUserRow {
  id: string;
  email: string;
  fullName: string;
  status: string;
  platformRole: string;
  roleLabel: string;
  createdAt: string;
}
interface PlatformUserListProps {
  initialRows: SerializedPlatformUserRow[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
  initialQuery?: string;
}
const roleBadgeMap: Record<string, { bg: string; text: string; border: string }> = {
  PLATFORM_OWNER: { bg: "bg-primary/10", text: "text-primary", border: "border-primary/20" },
  PLATFORM_ADMIN: { bg: "bg-slate-100", text: "text-slate-800", border: "border-slate-200" },
  PLATFORM_SUPPORT: { bg: "bg-sky-50", text: "text-sky-800", border: "border-sky-200" },
  PLATFORM_AUDITOR: { bg: "bg-amber-50", text: "text-amber-800", border: "border-amber-200" },
};
let {
  initialRows,
  total,
  page,
  pageSize,
  pageCount,
  initialQuery = "",
}:PlatformUserListProps=$props();
const router={push:goto,replace:(href:string)=>goto(href,{replaceState:true}),refresh:invalidateAll,back:()=>history.back()};
const searchParams=$derived(routePage.url.searchParams);
const isPending=$derived(navigating.to!==null);const startTransition=(action:()=>unknown)=>{action();};
let searchInput=$state(untrack(()=>(initialQuery)));
const setSearchInput=(next:typeof searchInput|((previous:typeof searchInput)=>typeof searchInput))=>{searchInput=typeof next==="function"?(next as (previous:typeof searchInput)=>typeof searchInput)(searchInput):next;};
let rows=$state<SerializedPlatformUserRow[]>(untrack(()=>(initialRows)));
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
      router.push(`/platform/users${qs ? `?${qs}` : ""}`);
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
            Platform Operator Directory
          </CardTitle>
          <p class="text-xs text-muted">
            Privileged platform administrators and governance accounts
          </p>
        </div>
        <div class="relative w-full sm:w-72">
          <SvgIcon name="Search" class="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted pointer-events-none" />
          <Input type="search" placeholder="Search platform users…" value={searchInput} oninput={(e) => setSearchInput(e.currentTarget.value)} aria-label="Search platform users" class="pl-8 bg-slate-50/50 text-sm focus:bg-white" />
        </div>
      </CardHeader>
      <CardContent class="space-y-4 pt-4">
        {#if isPending}<div class="text-xs text-muted animate-pulse">Updating user directory…</div>{/if}
        <div class="overflow-x-auto rounded-xl border border-border/70">
          <table class="w-full text-left text-sm">
            <thead class="bg-slate-50/70 border-b border-border/70 text-xs font-semibold text-muted uppercase tracking-wider">
              <tr>
                <th class="px-4 py-3">Platform User</th>
                <th class="px-4 py-3">Privilege Tier</th>
                <th class="px-4 py-3">Status</th>
                <th class="px-4 py-3">Granted Date</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border/50">
              {#each rows as row}{@const roleTheme = roleBadgeMap[row.platformRole] || roleBadgeMap.PLATFORM_ADMIN}{@const isActive = row.status === "active"}<tr class="hover:bg-slate-50/70 transition-colors">
                    <td class="px-4 py-3.5">
                      <div class="flex items-center gap-3">
                        <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-xs">
                          {row.fullName.slice(0, 2).toUpperCase()}
                        </div>
                        <div class="min-w-0">
                          <span class="block font-semibold text-foreground text-sm">
                            {row.fullName}
                          </span>
                          <span class="text-xs text-muted font-mono">{row.email}</span>
                        </div>
                      </div>
                    </td>
                    <td class="px-4 py-3.5">
                      <span class={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-0.5 text-xs font-medium border ${roleTheme.bg} ${roleTheme.text} ${roleTheme.border}`}>
                        <SvgIcon name="Shield" class="h-3 w-3" />
                        {row.roleLabel}
                      </span>
                    </td>
                    <td class="px-4 py-3.5">
                      <span class={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium border ${
                          isActive
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-slate-100 text-slate-600 border-slate-200"
                        }`}>
                        <span class={`h-1.5 w-1.5 rounded-full ${
                            isActive ? "bg-emerald-500" : "bg-slate-400"
                          }`}></span>
                        {row.status.toUpperCase()}
                      </span>
                    </td>
                    <td class="px-4 py-3.5 text-xs text-muted">
                      {row.createdAt}
                    </td>
                  </tr>{/each}
            </tbody>
          </table>
          {#if !rows.length}<div class="p-8 text-center">
              <SvgIcon name="Users" class="h-8 w-8 text-slate-400 mx-auto mb-2" />
              <p class="text-sm font-semibold text-foreground">No platform users found</p>
              <p class="mt-1 text-xs text-muted">
                No platform operator accounts match the current filter query.
              </p>
            </div>{/if}
        </div>

        
        <div class="flex flex-col items-center justify-between gap-3 border-t border-border/50 bg-slate-50/60 rounded-xl px-4 py-3 sm:flex-row">
          <div class="text-xs text-muted">
            Showing <span class="font-semibold text-foreground">{startRecord}</span> to{" "}
            <span class="font-semibold text-foreground">{endRecord}</span> of{" "}
            <span class="font-semibold text-foreground">{total}</span> users
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
