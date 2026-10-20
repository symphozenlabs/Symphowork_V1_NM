<script lang="ts">
import SvgIcon from "$lib/components/ui/Icon.svelte";
import DialogFrame from "$lib/components/ui/DialogFrame.svelte";
import Input from "$lib/components/ui/Input.svelte";
import Button from "$lib/components/ui/Button.svelte";
import type { ChatRecipient } from "$lib/components/chat/types";
import { cn } from "$lib/utils";
import { getAvatarColorClass, getInitials } from "$lib/components/chat/utils";

import {untrack} from "svelte";
import {page as routePage,navigating} from "$app/state";
import {goto,invalidateAll} from "$app/navigation";
import {notify} from "$lib/client/toast";
interface NewDirectChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectRecipient: (recipientId: string) => Promise<void>;
}
let {
  open,
  onOpenChange,
  onSelectRecipient,
}:NewDirectChatDialogProps=$props();
let search=$state(untrack(()=>("")));
const setSearch=(next:typeof search|((previous:typeof search)=>typeof search))=>{search=typeof next==="function"?(next as (previous:typeof search)=>typeof search)(search):next;};
let recipients=$state<ChatRecipient[]>(untrack(()=>([])));
const setRecipients=(next:typeof recipients|((previous:typeof recipients)=>typeof recipients))=>{recipients=typeof next==="function"?(next as (previous:typeof recipients)=>typeof recipients)(recipients):next;};
let loading=$state(untrack(()=>(false)));
const setLoading=(next:typeof loading|((previous:typeof loading)=>typeof loading))=>{loading=typeof next==="function"?(next as (previous:typeof loading)=>typeof loading)(loading):next;};
let submitting=$state(untrack(()=>(false)));
const setSubmitting=(next:typeof submitting|((previous:typeof submitting)=>typeof submitting))=>{submitting=typeof next==="function"?(next as (previous:typeof submitting)=>typeof submitting)(submitting):next;};
let error=$state<string | null>(untrack(()=>(null)));
const setError=(next:typeof error|((previous:typeof error)=>typeof error))=>{error=typeof next==="function"?(next as (previous:typeof error)=>typeof error)(error):next;};
$effect(()=>{open;search;return untrack(() => {
    if (!open) {
      setSearch("");
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
    }, 250);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  });});
async function handleSelect(recipientId: string) {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await onSelectRecipient(recipientId);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start direct conversation.");
    } finally {
      setSubmitting(false);
    }
  }
</script>
<DialogFrame open={open} onOpenChange={onOpenChange}>
      
        
        <div class="fixed left-1/2 top-1/2 z-[100] w-[92vw] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl focus:outline-none">
          
          <div class="flex items-center justify-between border-b border-slate-100 pb-4">
            <div class="flex items-center gap-2.5">
              <div class="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <SvgIcon name="UserPlus" class="size-5" />
              </div>
              <div>
                <h2 class="text-base font-bold text-slate-900">
                  New Direct Chat
                </h2>
                <p class="text-xs text-slate-500">
                  Select a coworker from your organization to start messaging.
                </p>
              </div>
            </div>

            
              <button type="button" onclick={() => onOpenChange(false)} class="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors" aria-label="Close dialog">
                <SvgIcon name="X" class="size-4" />
              </button>
            
          </div>

          
          <div class="mt-4">
            <div class="relative">
              <SvgIcon name="Search" class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted pointer-events-none" />
              <Input type="text" placeholder="Search by name, department, or role…" value={search} oninput={(e) => setSearch(e.currentTarget.value)} class="pl-9 h-10 text-xs bg-slate-50/70" aria-label="Search recipients" autofocus />
            </div>
          </div>

          
          {#if error}<div class="mt-3 flex items-center gap-2 rounded-lg border border-danger/30 bg-danger/5 p-2.5 text-xs text-danger">
              <SvgIcon name="AlertCircle" class="size-4 shrink-0" />
              <span>{error}</span>
            </div>{/if}

          
          <div class="mt-4 max-h-64 overflow-y-auto space-y-1 pr-1">
            {#if loading}<div class="flex items-center justify-center py-8">
                <SvgIcon name="Loader2" class="size-6 animate-spin text-primary" />
              </div>{:else}{#if recipients.length === 0}<div class="py-8 text-center">
                <p class="text-xs font-semibold text-slate-700">
                  {#if search}{"No colleagues found matching your query."}{:else}{"No team members available."}{/if}
                </p>
                <p class="mt-1 text-[11px] text-muted">
                  {#if search}{"Try searching by a different name or department."}{:else}{"Check directory or organization membership."}{/if}
                </p>
              </div>{:else}{#each recipients as rec}{@const initials = getInitials(rec.displayName)}{@const colorClass = getAvatarColorClass(rec.displayName)}{@const subDetails = [rec.designationTitle, rec.departmentName]
                  .filter(Boolean)
                  .join(" • ") || "Colleague"}<button type="button" disabled={submitting} onclick={() => handleSelect(rec.id)} class="flex w-full items-center gap-3 rounded-xl p-2.5 text-left hover:bg-slate-50 focus:bg-primary/5 transition-colors cursor-pointer disabled:opacity-50">
                    <div class={cn(
                        "flex size-10 shrink-0 items-center justify-center rounded-full border text-xs font-bold",
                        colorClass
                      )}>
                      {initials}
                    </div>

                    <div class="min-w-0 flex-1">
                      <p class="truncate text-sm font-semibold text-slate-800">
                        {rec.displayName}
                      </p>
                      <p class="truncate text-xs text-muted">
                        {subDetails}
                      </p>
                    </div>

                    <span class="shrink-0 text-xs font-semibold text-primary">
                      Chat
                    </span>
                  </button>{/each}{/if}{/if}
          </div>

          
          <div class="mt-5 flex justify-end border-t border-slate-100 pt-3">
            <Button type="button" variant="outline" size="sm" onclick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </div>
      
    </DialogFrame>
