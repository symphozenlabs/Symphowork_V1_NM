<script lang="ts">
let dialog=$state<HTMLDialogElement>();$effect(()=>{if(open&&dialog&&!dialog.open)dialog.showModal();});
import type{DepartmentDetails,DepartmentManagerSummary,DepartmentTeamItem,DepartmentRosterMember,DepartmentTeamLeadSummary,DepartmentDeletionSafety}from'$lib/domain/departments/types';
import SvgIcon from "$lib/components/ui/Icon.svelte";
import Button from "$lib/components/ui/Button.svelte";

import {untrack} from "svelte";
import {page as routePage,navigating} from "$app/state";
import {goto,invalidateAll} from "$app/navigation";
import {notify} from "$lib/client/toast";
interface DepartmentTeamDeleteDialogProps {
  open: boolean;
  departmentId: string;
  team: DepartmentTeamItem | null;
  onClose: () => void;
  onDeleted: () => void;
}
let {
  open,
  departmentId,
  team,
  onClose,
  onDeleted,
}:DepartmentTeamDeleteDialogProps=$props();
let isDeleting=$state(untrack(()=>(false)));
const setIsDeleting=(next:typeof isDeleting|((previous:typeof isDeleting)=>typeof isDeleting))=>{isDeleting=typeof next==="function"?(next as (previous:typeof isDeleting)=>typeof isDeleting)(isDeleting):next;};
let error=$state<string | null>(untrack(()=>(null)));
const setError=(next:typeof error|((previous:typeof error)=>typeof error))=>{error=typeof next==="function"?(next as (previous:typeof error)=>typeof error)(error):next;};
$effect(()=>{open;return untrack(() => {
    if (!open) {
      setError(null);
      setIsDeleting(false);
    }
  });});
async function handleDelete() {
    if (!team) return;
    setError(null);
    if(isDeleting)return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/app/departments/${departmentId}/teams/${team.id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || "Failed to deactivate team.");
      }

      onDeleted();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to deactivate team.");
    } finally {
      setIsDeleting(false);
    }
  }
</script>
{#if !open || !team}{:else}<dialog bind:this={dialog} oncancel={e=>{if(isDeleting)e.preventDefault();else onClose();}} onclose={onClose} aria-labelledby="team-delete-dialog-title" class="fixed inset-0 z-50 m-0 h-full w-full max-h-none max-w-none flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
      <div class="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl space-y-4">
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <div class="flex items-center gap-2.5">
            <div class="flex size-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
              <SvgIcon name="Trash2" class="size-4.5" />
            </div>
            <div>
              <h2 id="team-delete-dialog-title" class="text-base font-bold text-foreground">
                Deactivate Team
              </h2>
              <p class="text-xs text-muted">Archive functional squad</p>
            </div>
          </div>
          <button type="button" onclick={onClose} class="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors" aria-label="Close dialog">
            <SvgIcon name="X" class="size-4" />
          </button>
        </div>

        {#if error}<div role="alert" class="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
            <SvgIcon name="AlertTriangle" class="size-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>{/if}

        <div class="space-y-2 text-xs text-slate-600 leading-relaxed">
          <p>
            Are you sure you want to deactivate <span class="font-bold text-foreground">{team.name}</span> ({team.code})?
          </p>
          <p class="rounded-lg bg-amber-50 p-2.5 text-amber-800 border border-amber-200">
            Deactivating marks this team as inactive. Employees assigned to this squad will retain their historical records.
          </p>
        </div>

        <div class="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" onclick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" onclick={handleDelete} disabled={isDeleting}>
            {#if isDeleting}{"Deactivating…"}{:else}{"Deactivate Team"}{/if}
          </Button>
        </div>
      </div>
    </dialog>{/if}
