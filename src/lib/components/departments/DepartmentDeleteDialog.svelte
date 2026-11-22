<script lang="ts">
let dialog=$state<HTMLDialogElement>();$effect(()=>{if(open&&dialog&&!dialog.open)dialog.showModal();});
import type{DepartmentDetails,DepartmentManagerSummary,DepartmentTeamItem,DepartmentRosterMember,DepartmentTeamLeadSummary,DepartmentDeletionSafety}from'$lib/domain/departments/types';
import SvgIcon from "$lib/components/ui/Icon.svelte";
import Button from "$lib/components/ui/Button.svelte";
import Input from "$lib/components/ui/Input.svelte";

import {untrack} from "svelte";
import {page as routePage,navigating} from "$app/state";
import {goto,invalidateAll} from "$app/navigation";
import {notify} from "$lib/client/toast";
interface DepartmentDeleteDialogProps {
  open: boolean;
  departmentId: string;
  departmentName: string;
  departmentCode: string;
  onClose: () => void;
  onDeleted: () => void;
}
let {
  open,
  departmentId,
  departmentName,
  departmentCode,
  onClose,
  onDeleted,
}:DepartmentDeleteDialogProps=$props();
let safety=$state<DepartmentDeletionSafety | null>(untrack(()=>(null)));
const setSafety=(next:typeof safety|((previous:typeof safety)=>typeof safety))=>{safety=typeof next==="function"?(next as (previous:typeof safety)=>typeof safety)(safety):next;};
let isLoading=$state(untrack(()=>(true)));
const setIsLoading=(next:typeof isLoading|((previous:typeof isLoading)=>typeof isLoading))=>{isLoading=typeof next==="function"?(next as (previous:typeof isLoading)=>typeof isLoading)(isLoading):next;};
let isDeleting=$state(untrack(()=>(false)));
const setIsDeleting=(next:typeof isDeleting|((previous:typeof isDeleting)=>typeof isDeleting))=>{isDeleting=typeof next==="function"?(next as (previous:typeof isDeleting)=>typeof isDeleting)(isDeleting):next;};
let error=$state<string | null>(untrack(()=>(null)));
const setError=(next:typeof error|((previous:typeof error)=>typeof error))=>{error=typeof next==="function"?(next as (previous:typeof error)=>typeof error)(error):next;};
let confirmInput=$state(untrack(()=>("")));
const setConfirmInput=(next:typeof confirmInput|((previous:typeof confirmInput)=>typeof confirmInput))=>{confirmInput=typeof next==="function"?(next as (previous:typeof confirmInput)=>typeof confirmInput)(confirmInput):next;};
$effect(()=>{open;departmentId;return untrack(() => {
    if (!open) {
      setSafety(null);
      setIsLoading(true);
      setError(null);
      setConfirmInput("");
      return;
    }

    let cancelled=false;
    setSafety(null);
    setConfirmInput("");
    async function checkSafety() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/app/departments/${departmentId}/deletion-check`);
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error?.message || "Failed to inspect department dependencies.");
        }
        if(!cancelled)setSafety(data);
      } catch (err: unknown) {
        if(!cancelled)setError(err instanceof Error ? err.message : "Unable to verify deletion safety.");
      } finally {
        if(!cancelled)setIsLoading(false);
      }
    }

    void checkSafety();
    return ()=>{cancelled=true;};
  });});
async function handleDelete(forceSoft = false) {
    if(isDeleting || isLoading || !safety || (!forceSoft && (!safety.safe || !isConfirmed)))return;
    setIsDeleting(true);
    setError(null);
    try {
      const url = `/api/app/departments/${departmentId}${forceSoft ? "?mode=soft" : ""}`;
      const res = await fetch(url, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || "Failed to execute department deletion.");
      }
      onDeleted();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete department.");
    } finally {
      setIsDeleting(false);
    }
  }
const isConfirmed=$derived(confirmInput.trim().toUpperCase() === departmentCode.toUpperCase());
</script>
{#if !open}{:else}<dialog bind:this={dialog} oncancel={e=>{if(isDeleting)e.preventDefault();else onClose();}} onclose={onClose} aria-labelledby="delete-dialog-title" class="fixed inset-0 z-50 m-0 h-full w-full max-h-none max-w-none flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div class="relative w-full max-w-lg rounded-2xl border border-rose-200 bg-surface p-6 shadow-2xl sm:p-7 space-y-5">
        <div class="flex items-start justify-between border-b border-rose-100 pb-4">
          <div class="flex items-center gap-2.5">
            <div class="flex size-9 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
              <SvgIcon name="Trash2" class="size-5" />
            </div>
            <div>
              <h2 id="delete-dialog-title" class="text-base font-bold text-foreground">
                Delete Department
              </h2>
              <p class="text-xs text-muted">
                {departmentName} ({departmentCode})
              </p>
            </div>
          </div>
          <button type="button" onclick={onClose} class="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="Close dialog">
            <SvgIcon name="X" class="size-4" />
          </button>
        </div>

        {#if isLoading}<div class="flex flex-col items-center justify-center py-8 text-center space-y-3">
            <SvgIcon name="Loader2" class="size-6 animate-spin text-primary" />
            <p class="text-xs text-muted">Checking workforce assignments and workflow dependencies…</p>
          </div>{:else}<div class="space-y-4">
            {#if error}<div role="alert" class="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800">
                <SvgIcon name="AlertTriangle" class="size-4 shrink-0 text-rose-600 mt-0.5" />
                <p class="font-medium">{error}</p>
              </div>{/if}

            {#if safety && !safety.safe}<div class="space-y-3.5">
                <div class="rounded-xl border border-amber-200 bg-amber-50/80 p-4 text-xs text-amber-900 space-y-2">
                  <div class="flex items-center gap-2 font-bold text-amber-950">
                    <SvgIcon name="ShieldAlert" class="size-4 text-amber-700" />
                    <span>Permanent Deletion Blocked</span>
                  </div>
                  <p class="leading-relaxed">
                    This department cannot be permanently deleted because active organizational records depend on it:
                  </p>
                  <ul class="list-disc pl-4 space-y-1 font-medium text-amber-800">
                    {#each safety.reasons as reason, idx}<li>{reason}</li>{/each}
                  </ul>
                  <p class="text-[11px] text-amber-700 pt-1">
                    To maintain data integrity, you must either reassign these resources in the Workforce Directory first, or archive/deactivate this department instead.
                  </p>
                </div>

                <div class="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                  <Button type="button" variant="outline" onclick={onClose} disabled={isDeleting}>
                    Cancel
                  </Button>
                  <Button type="button" variant="primary" onclick={() => void handleDelete(true)} disabled={isDeleting} class="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white">
                    <SvgIcon name="Archive" class="size-4 mr-1.5" />
                    {#if isDeleting}{"Deactivating…"}{:else}{"Deactivate (Safe Archive)"}{/if}
                  </Button>
                </div>
              </div>{:else if safety?.safe}<div class="space-y-3.5">
                <div class="rounded-xl border border-rose-200 bg-rose-50/70 p-4 text-xs text-rose-900 space-y-2">
                  <div class="flex items-center gap-2 font-bold text-rose-950">
                    <SvgIcon name="AlertTriangle" class="size-4 text-rose-600" />
                    <span>Warning: Destructive Action</span>
                  </div>
                  <p class="leading-relaxed">
                    This department currently has no assigned active employees or open requisitions. Permanently deleting it will remove the department record from your workspace.
                  </p>
                </div>

                <div class="space-y-2">
                  <label for="departmentdeletedialog-field-1" class="text-xs font-semibold text-foreground">
                    Type <span class="font-mono font-bold text-rose-600">{departmentCode}</span> to confirm deletion:
                  </label>
                  <Input id="departmentdeletedialog-field-1" value={confirmInput} oninput={(e) => setConfirmInput(e.currentTarget.value)} placeholder={`Type ${departmentCode} here`} class="font-mono text-xs border-rose-300 focus:border-rose-500" />
                </div>

                <div class="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                  <Button type="button" variant="outline" onclick={onClose} disabled={isDeleting}>
                    Cancel
                  </Button>
                  <Button type="button" variant="destructive" onclick={() => void handleDelete(false)} disabled={isDeleting || !isConfirmed}>
                    {#if isDeleting}{"Deleting…"}{:else}{"Permanently Delete Department"}{/if}
                  </Button>
                </div>
              </div>{/if}
          </div>{/if}
      </div>
    </dialog>{/if}
