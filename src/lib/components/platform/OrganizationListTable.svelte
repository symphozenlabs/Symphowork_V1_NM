<script lang="ts">
import SvgIcon from "$lib/components/ui/Icon.svelte";
import Input from "$lib/components/ui/Input.svelte";
import DialogFrame from "$lib/components/ui/DialogFrame.svelte";
import Badge from "$lib/components/ui/Badge.svelte";
import LinkButton from "$lib/components/ui/LinkButton.svelte";
import Button from "$lib/components/ui/Button.svelte";

import {untrack} from "svelte";
import {page as routePage,navigating} from "$app/state";
import {goto,invalidateAll} from "$app/navigation";
import {notify} from "$lib/client/toast";
interface PlatformOrgRow {
  id: string;
  name: string;
  slug: string;
  status: string;
  createdAt: string;
  provisioningStatus?: string | null;
}
interface OrganizationListTableProps {
  initialRows: PlatformOrgRow[];
}
let { initialRows }:OrganizationListTableProps=$props();
const router={push:goto,replace:(href:string,options?:{scroll?:boolean})=>goto(href,{replaceState:true,noScroll:options?.scroll===false}),refresh:invalidateAll,back:()=>history.back()};
let rows=$state<PlatformOrgRow[]>(untrack(()=>(initialRows)));
const setRows=(next:typeof rows|((previous:typeof rows)=>typeof rows))=>{rows=typeof next==="function"?(next as (previous:typeof rows)=>typeof rows)(rows):next;};
let searchQuery=$state(untrack(()=>("")));
const setSearchQuery=(next:typeof searchQuery|((previous:typeof searchQuery)=>typeof searchQuery))=>{searchQuery=typeof next==="function"?(next as (previous:typeof searchQuery)=>typeof searchQuery)(searchQuery):next;};
let statusFilter=$state<string>(untrack(()=>("all")));
const setStatusFilter=(next:typeof statusFilter|((previous:typeof statusFilter)=>typeof statusFilter))=>{statusFilter=typeof next==="function"?(next as (previous:typeof statusFilter)=>typeof statusFilter)(statusFilter):next;};
let orgToDelete=$state<PlatformOrgRow | null>(untrack(()=>(null)));
const setOrgToDelete=(next:typeof orgToDelete|((previous:typeof orgToDelete)=>typeof orgToDelete))=>{orgToDelete=typeof next==="function"?(next as (previous:typeof orgToDelete)=>typeof orgToDelete)(orgToDelete):next;};
let isDeleting=$state(untrack(()=>(false)));
const setIsDeleting=(next:typeof isDeleting|((previous:typeof isDeleting)=>typeof isDeleting))=>{isDeleting=typeof next==="function"?(next as (previous:typeof isDeleting)=>typeof isDeleting)(isDeleting):next;};
let deleteError=$state(untrack(()=>("")));
const setDeleteError=(next:typeof deleteError|((previous:typeof deleteError)=>typeof deleteError))=>{deleteError=typeof next==="function"?(next as (previous:typeof deleteError)=>typeof deleteError)(deleteError):next;};
let successToast=$state<{ title: string; message?: string } | null>(untrack(()=>(null)));
const setSuccessToast=(next:typeof successToast|((previous:typeof successToast)=>typeof successToast))=>{successToast=typeof next==="function"?(next as (previous:typeof successToast)=>typeof successToast)(successToast):next;};
$effect(()=>{initialRows;return untrack(() => {
    setRows(initialRows);
  });});
$effect(()=>{successToast;return untrack(() => {
    if (!successToast) return;
    const timer = setTimeout(() => {
      setSuccessToast(null);
    }, 5000);
    return () => clearTimeout(timer);
  });});
const filteredRows=$derived.by(() => {
    return rows.filter((row) => {
      const matchesSearch =
        searchQuery.trim() === "" ||
        row.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.slug.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || row.status.toLowerCase() === statusFilter.toLowerCase();
      return matchesSearch && matchesStatus;
    });
  });
function openDeleteModal(org: PlatformOrgRow) {
    setDeleteError("");
    setOrgToDelete(org);
  }
function closeDeleteModal() {
    if (isDeleting) return;
    setOrgToDelete(null);
    setDeleteError("");
  }
async function confirmDelete() {
    if (!orgToDelete || isDeleting) return;

    setIsDeleting(true);
    setDeleteError("");

    try {
      const response = await fetch(`/api/platform/organizations/${orgToDelete.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        setDeleteError(body.error?.message ?? "Unable to delete organization. Please try again.");
        setIsDeleting(false);
        return;
      }

      const deletedName = orgToDelete.name;
      const deletedId = orgToDelete.id;

      setOrgToDelete(null);
      setIsDeleting(false);
      setDeleteError("");
      setRows((prev) => prev.filter((r) => r.id !== deletedId));
      setSuccessToast({
        title: "Organization deleted successfully.",
        message: `\u201c${deletedName}\u201d has been removed from the platform.`,
      });

      router.refresh();
    } catch {
      setDeleteError("The organization could not be deleted. Check your connection and try again.");
      setIsDeleting(false);
    }
  }
</script>
<div class="space-y-4">
      
      {#if successToast}<div role="status" aria-live="polite" class="fixed top-5 right-5 z-50 flex items-center gap-3 rounded-xl border border-success-border bg-surface p-4 shadow-xl transition-all">
          <div class="grid size-7 place-items-center rounded-full bg-success-bg text-sm font-bold text-success">
            <SvgIcon name="CheckCircle2" class="size-4" aria-hidden="true" />
          </div>
          <div class="pr-2">
            <p class="font-semibold text-foreground text-sm">{successToast.title}</p>
            {#if successToast.message}<p class="text-xs text-muted">{successToast.message}</p>{/if}
          </div>
          <button type="button" onclick={() => setSuccessToast(null)} class="ml-2 cursor-pointer text-muted transition-colors hover:text-foreground" aria-label="Dismiss notification">
            <SvgIcon name="X" class="size-4" aria-hidden="true" />
          </button>
        </div>{/if}

      
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-2">
        <div class="relative flex-1 max-w-sm">
          <SvgIcon name="Search" class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted" aria-hidden="true" />
          <Input placeholder="Search by name or slug…" value={searchQuery} onchange={(e) => setSearchQuery(e.currentTarget.value)} class="pl-9 h-9 text-sm" />
        </div>

        <div class="flex items-center gap-2">
          <span class="text-xs font-medium text-muted">Status:</span>
          <div class="inline-flex rounded-lg border border-border bg-background p-0.5 text-xs">
            {#each ["all", "active", "pending", "suspended"] as st}<button type="button" onclick={() => setStatusFilter(st)} class={`rounded-md px-2.5 py-1 font-medium capitalize transition-colors ${
                  statusFilter === st
                    ? "bg-surface text-foreground shadow-xs font-semibold"
                    : "text-muted hover:text-foreground"
                }`}>
                {st}
              </button>{/each}
          </div>
        </div>
      </div>

      
      <DialogFrame open={Boolean(orgToDelete)} onOpenChange={(open) => {
          if (!open && !isDeleting) {
            closeDeleteModal();
          }
        }}>
        
          
          <div class="fixed top-1/2 left-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-surface p-6 shadow-2xl focus:outline-hidden">
            <div class="flex items-start gap-3">
              <div class="grid size-10 shrink-0 place-items-center rounded-xl bg-danger-bg text-destructive border border-danger-border">
                <SvgIcon name="Trash2" class="size-5" aria-hidden="true" />
              </div>
              <div>
                <h2 class="text-lg font-bold text-foreground">
                  Delete organization?
                </h2>
                <p class="mt-1.5 text-sm leading-relaxed text-muted">
                  You are about to permanently delete &ldquo;{orgToDelete?.name}&rdquo; ({orgToDelete?.slug}). This action cannot be reversed.
                </p>
              </div>
            </div>

            {#if deleteError}<div role="alert" class="mt-4 flex items-start gap-2.5 rounded-lg border border-danger-border bg-danger-bg p-3 text-sm text-destructive">
                <SvgIcon name="AlertCircle" class="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <span>{deleteError}</span>
              </div>{/if}

            <div class="mt-6 flex items-center justify-end gap-3 border-t border-border pt-4">
              <Button type="button" variant="secondary" disabled={isDeleting} onclick={closeDeleteModal}>
                Cancel
              </Button>
              <Button type="button" variant="destructive" disabled={isDeleting} onclick={confirmDelete}>
                {#if isDeleting}{"Deleting…"}{:else}{"Delete organization"}{/if}
              </Button>
            </div>
          </div>
        
      </DialogFrame>

      
      <div class="overflow-hidden rounded-xl border border-border bg-surface">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="border-b border-border bg-slate-50/70 text-xs font-semibold uppercase tracking-wider text-muted">
              <tr>
                <th class="px-4 py-3.5">Organization</th>
                <th class="px-4 py-3.5">Identifier</th>
                <th class="px-4 py-3.5">Lifecycle Status</th>
                <th class="px-4 py-3.5">Registered</th>
                <th class="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border">
              {#each filteredRows as row}{@const statusVariant = row.status === "active"
                    ? "success"
                    : row.status === "pending"
                    ? "warning"
                    : row.status === "suspended"
                    ? "danger"
                    : "neutral"}<tr class="group transition-colors hover:bg-slate-50/70">
                    <td class="px-4 py-3.5 font-semibold">
                      <div class="flex items-center gap-3">
                        <div class="grid size-8 shrink-0 place-items-center rounded-lg bg-sidebar-active text-xs font-bold text-sidebar-active-text border border-primary/10">
                          {row.name.slice(0, 2).toUpperCase()}
                        </div>
                        <a class="font-semibold text-foreground hover:text-primary transition-colors flex items-center gap-1.5" href={`/platform/organizations/${row.id}`}>
                          <span>{row.name}</span>
                          <SvgIcon name="ExternalLink" class="size-3 opacity-0 group-hover:opacity-60 transition-opacity" aria-hidden="true" />
                        </a>
                      </div>
                    </td>
                    <td class="px-4 py-3.5 text-muted font-mono text-xs">{row.slug}</td>
                    <td class="px-4 py-3.5">
                      <div class="flex flex-wrap items-center gap-2">
                        <Badge variant={statusVariant}>{row.status}</Badge>
                        {#if row.provisioningStatus === "running"}<span class="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 border border-amber-200">
                            <span class="size-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                            Provisioning
                          </span>{/if}
                      </div>
                    </td>
                    <td class="px-4 py-3.5 text-muted text-xs">
                      {new Date(row.createdAt).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td class="px-4 py-3.5 text-right">
                      <div class="flex items-center justify-end gap-2">
                        <LinkButton variant="ghost" size="sm" class="text-xs h-8" href={`/platform/organizations/${row.id}`}>
                            Details
                          </LinkButton>
                        <Button type="button" variant="ghost" size="sm" class="text-xs h-8 text-destructive hover:bg-danger-bg hover:text-destructive" onclick={() => openDeleteModal(row)}>
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>{/each}
            </tbody>
          </table>
          {#if !filteredRows.length}<div class="p-12 text-center text-sm text-muted">
              <SvgIcon name="Building2" class="mx-auto size-8 text-muted/50 mb-2" aria-hidden="true" />
              <p class="font-semibold text-foreground">No organizations found</p>
              <p class="text-xs text-muted mt-1">
                {#if searchQuery || statusFilter !== "all"}{"Try adjusting your search query or status filter."}{:else}{"No organizations are currently provisioned in this environment."}{/if}
              </p>
            </div>{/if}
        </div>
      </div>
    </div>
