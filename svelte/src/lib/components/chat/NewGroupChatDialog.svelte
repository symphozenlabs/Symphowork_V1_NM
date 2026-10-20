<script lang="ts">
import SvgIcon from "$lib/components/ui/Icon.svelte";
import DialogFrame from "$lib/components/ui/DialogFrame.svelte";
import Input from "$lib/components/ui/Input.svelte";
import Button from "$lib/components/ui/Button.svelte";

import {untrack} from "svelte";
import {page as routePage,navigating} from "$app/state";
import {goto,invalidateAll} from "$app/navigation";
import {notify} from "$lib/client/toast";
interface NewGroupChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateGroup: (name: string, employeeIds: string[]) => Promise<void>;
}
let {
  open,
  onOpenChange,
  onCreateGroup,
}:NewGroupChatDialogProps=$props();
let name=$state(untrack(()=>("")));
const setName=(next:typeof name|((previous:typeof name)=>typeof name))=>{name=typeof next==="function"?(next as (previous:typeof name)=>typeof name)(name):next;};
let search=$state(untrack(()=>("")));
const setSearch=(next:typeof search|((previous:typeof search)=>typeof search))=>{search=typeof next==="function"?(next as (previous:typeof search)=>typeof search)(search):next;};
let recipients=$state<ChatRecipient[]>(untrack(()=>([])));
const setRecipients=(next:typeof recipients|((previous:typeof recipients)=>typeof recipients))=>{recipients=typeof next==="function"?(next as (previous:typeof recipients)=>typeof recipients)(recipients):next;};
let selectedIds=$state<string[]>(untrack(()=>([])));
const setSelectedIds=(next:typeof selectedIds|((previous:typeof selectedIds)=>typeof selectedIds))=>{selectedIds=typeof next==="function"?(next as (previous:typeof selectedIds)=>typeof selectedIds)(selectedIds):next;};
let loading=$state(untrack(()=>(false)));
const setLoading=(next:typeof loading|((previous:typeof loading)=>typeof loading))=>{loading=typeof next==="function"?(next as (previous:typeof loading)=>typeof loading)(loading):next;};
let submitting=$state(untrack(()=>(false)));
const setSubmitting=(next:typeof submitting|((previous:typeof submitting)=>typeof submitting))=>{submitting=typeof next==="function"?(next as (previous:typeof submitting)=>typeof submitting)(submitting):next;};
let error=$state<string | null>(untrack(()=>(null)));
const setError=(next:typeof error|((previous:typeof error)=>typeof error))=>{error=typeof next==="function"?(next as (previous:typeof error)=>typeof error)(error):next;};
$effect(()=>{open;search;return untrack(() => {
    if (!open) {
      setName("");
      setSearch("");
      setSelectedIds([]);
      setError(null);
      return;
    }

    let isCancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const queryParam = search.trim() ? `?search=${encodeURIComponent(search.trim())}` : "";
        const res = await fetch(`/api/app/chat/recipients${queryParam}`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data?.error?.message ?? "Failed to load team members.");
        }
        if (!isCancelled) {
          setRecipients(data.recipients ?? []);
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err instanceof Error ? err.message : "Failed to load team members.");
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }, 200);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  });});
function toggleRecipient(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }
function removeSelected(id: string) {
    setSelectedIds((prev) => prev.filter((item) => item !== id));
  }
async function handleCreate(event: SubmitEvent) {
    event.preventDefault();
    if (!name.trim()) {
      setError("Please provide a group name.");
      return;
    }
    if (selectedIds.length === 0) {
      setError("Please select at least one colleague for this group.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await onCreateGroup(name.trim(), selectedIds);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create group conversation.");
    } finally {
      setSubmitting(false);
    }
  }

import { cn } from '$lib/utils';
import type { ChatRecipient } from '$lib/components/chat/types';
import { getInitials, getAvatarColorClass } from '$lib/components/chat/utils';</script>
<DialogFrame open={open} onOpenChange={onOpenChange}>
      
        
        <div class="fixed left-1/2 top-1/2 z-[100] w-[92vw] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl focus:outline-none">
          
          <div class="flex items-center justify-between border-b border-slate-100 pb-4">
            <div class="flex items-center gap-2.5">
              <div class="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <SvgIcon name="Users" class="size-5" />
              </div>
              <div>
                <h2 class="text-base font-bold text-slate-900">
                  New Group Channel
                </h2>
                <p class="text-xs text-slate-500">
                  Create a team channel for group collaboration and task coordination.
                </p>
              </div>
            </div>

            
              <button type="button" onclick={() => onOpenChange(false)} class="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors" aria-label="Close dialog">
                <SvgIcon name="X" class="size-4" />
              </button>
            
          </div>

          <form onsubmit={handleCreate} class="mt-4 space-y-4">
            
            <div>
              <label for="group-name" class="block text-xs font-semibold text-slate-700 mb-1">
                Channel Name *
              </label>
              <Input id="group-name" required maxlength={180} placeholder="e.g. Engineering Core, Product Launch 2026, Operations…" value={name} onchange={(e) => setName(e.currentTarget.value)} class="text-xs h-10" />
            </div>

            
            {#if selectedIds.length > 0}<div>
                <span class="block text-[11px] font-semibold text-slate-600 mb-1.5">
                  Selected Members ({selectedIds.length})
                </span>
                <div class="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto p-1 bg-slate-50 rounded-lg border border-slate-200">
                  {#each selectedIds as id}{@const rec = recipients.find((r) => r.id === id)}{@const label = rec?.displayName || "Member"}<span class="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-xs font-semibold text-primary">
                        <span>{label}</span>
                        <button type="button" onclick={() => removeSelected(id)} class="hover:text-primary/70 transition-colors" aria-label={`Remove ${label}`}>
                          <SvgIcon name="X" class="size-3" />
                        </button>
                      </span>{/each}
                </div>
              </div>{/if}

            
            <div>
              <label for="search-group-members" class="block text-xs font-semibold text-slate-700 mb-1">
                Add Members
              </label>
              <div class="relative">
                <SvgIcon name="Search" class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted pointer-events-none" />
                <Input id="search-group-members" type="text" placeholder="Filter colleagues by name or department…" value={search} onchange={(e) => setSearch(e.currentTarget.value)} class="pl-9 h-9 text-xs bg-slate-50/70" />
              </div>
            </div>

            
            {#if error}<div class="flex items-center gap-2 rounded-lg border border-danger/30 bg-danger/5 p-2.5 text-xs text-danger">
                <SvgIcon name="AlertCircle" class="size-4 shrink-0" />
                <span>{error}</span>
              </div>{/if}

            
            <div class="max-h-48 overflow-y-auto space-y-1 pr-1 border border-slate-200 rounded-xl p-1 bg-slate-50/40">
              {#if loading}<div class="flex items-center justify-center py-6">
                  <SvgIcon name="Loader2" class="size-5 animate-spin text-primary" />
                </div>{:else}{#if recipients.length === 0}<div class="py-6 text-center text-xs text-muted">
                  No coworkers found.
                </div>{:else}{#each recipients as rec}{@const isChecked = selectedIds.includes(rec.id)}{@const initials = getInitials(rec.displayName)}{@const colorClass = getAvatarColorClass(rec.displayName)}{@const subtitle = [rec.designationTitle, rec.departmentName]
                    .filter(Boolean)
                    .join(" • ") || "Colleague"}<button type="button" onclick={() => toggleRecipient(rec.id)} class={cn(
                        "flex w-full items-center justify-between rounded-lg p-2 text-left transition-colors cursor-pointer",
                        isChecked ? "bg-primary/10 border border-primary/20" : "hover:bg-slate-100"
                      )}>
                      <div class="flex items-center gap-2.5 min-w-0">
                        <div class={cn(
                            "flex size-8 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold",
                            colorClass
                          )}>
                          {initials}
                        </div>
                        <div class="min-w-0 flex-1">
                          <p class="truncate text-xs font-semibold text-slate-800">
                            {rec.displayName}
                          </p>
                          <p class="truncate text-[11px] text-muted">
                            {subtitle}
                          </p>
                        </div>
                      </div>

                      <div class={cn(
                          "flex size-5 shrink-0 items-center justify-center rounded border transition-colors",
                          isChecked
                            ? "border-primary bg-primary text-white"
                            : "border-slate-300 bg-white"
                        )}>
                        {#if isChecked}<SvgIcon name="Check" class="size-3.5 stroke-[3]" />{/if}
                      </div>
                    </button>{/each}{/if}{/if}
            </div>

            
            <div class="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
              <Button type="button" variant="outline" size="sm" onclick={() => onOpenChange(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" disabled={submitting || !name.trim() || selectedIds.length === 0} class="gap-1.5">
                {#if submitting}
                    <SvgIcon name="Loader2" class="size-3.5 animate-spin" />
                    <span>Creating Group…</span>
                  {:else}<span>Create Channel</span>{/if}
              </Button>
            </div>
          </form>
        </div>
      
    </DialogFrame>
