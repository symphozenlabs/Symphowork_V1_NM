<script lang="ts">
let dialog=$state<HTMLDialogElement>();$effect(()=>{if(open&&dialog&&!dialog.open)dialog.showModal();});
import type{DepartmentDateContext,DepartmentListItem,DepartmentManagerSummary}from'$lib/domain/departments/types';
import SvgIcon from "$lib/components/ui/Icon.svelte";
import Input from "$lib/components/ui/Input.svelte";
import CustomSelect from "$lib/components/ui/CustomSelect.svelte";
import Button from "$lib/components/ui/Button.svelte";

import {untrack} from "svelte";
import {page as routePage,navigating} from "$app/state";
import {goto,invalidateAll} from "$app/navigation";
import {notify} from "$lib/client/toast";
interface DepartmentCreateDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}
let {
  open,
  onClose,
  onCreated,
}:DepartmentCreateDialogProps=$props();
let name=$state(untrack(()=>("")));
const setName=(next:typeof name|((previous:typeof name)=>typeof name))=>{name=typeof next==="function"?(next as (previous:typeof name)=>typeof name)(name):next;};
let code=$state(untrack(()=>("")));
const setCode=(next:typeof code|((previous:typeof code)=>typeof code))=>{code=typeof next==="function"?(next as (previous:typeof code)=>typeof code)(code):next;};
let description=$state(untrack(()=>("")));
const setDescription=(next:typeof description|((previous:typeof description)=>typeof description))=>{description=typeof next==="function"?(next as (previous:typeof description)=>typeof description)(description):next;};
let headEmployeeId=$state<string>(untrack(()=>("")));
const setHeadEmployeeId=(next:typeof headEmployeeId|((previous:typeof headEmployeeId)=>typeof headEmployeeId))=>{headEmployeeId=typeof next==="function"?(next as (previous:typeof headEmployeeId)=>typeof headEmployeeId)(headEmployeeId):next;};
let eligibleManagers=$state<DepartmentManagerSummary[]>(untrack(()=>([])));
const setEligibleManagers=(next:typeof eligibleManagers|((previous:typeof eligibleManagers)=>typeof eligibleManagers))=>{eligibleManagers=typeof next==="function"?(next as (previous:typeof eligibleManagers)=>typeof eligibleManagers)(eligibleManagers):next;};
let isLoadingManagers=$state(untrack(()=>(false)));
const setIsLoadingManagers=(next:typeof isLoadingManagers|((previous:typeof isLoadingManagers)=>typeof isLoadingManagers))=>{isLoadingManagers=typeof next==="function"?(next as (previous:typeof isLoadingManagers)=>typeof isLoadingManagers)(isLoadingManagers):next;};
let isSubmitting=$state(untrack(()=>(false)));
const setIsSubmitting=(next:typeof isSubmitting|((previous:typeof isSubmitting)=>typeof isSubmitting))=>{isSubmitting=typeof next==="function"?(next as (previous:typeof isSubmitting)=>typeof isSubmitting)(isSubmitting):next;};
let error=$state<string | null>(untrack(()=>(null)));
const setError=(next:typeof error|((previous:typeof error)=>typeof error))=>{error=typeof next==="function"?(next as (previous:typeof error)=>typeof error)(error):next;};
$effect(()=>{open;return untrack(() => {
    if (!open) {
      setName("");
      setCode("");
      setDescription("");
      setHeadEmployeeId("");
      setError(null);
      return;
    }

    async function loadManagers() {
      setIsLoadingManagers(true);
      try {
        const res = await fetch("/api/app/departments/eligible-managers");
        const data = await res.json();
        if (data.success && Array.isArray(data.managers)) {
          setEligibleManagers(data.managers);
        }
      } catch {
        // Fall back gracefully
      } finally {
        setIsLoadingManagers(false);
      }
    }

    void loadManagers();
  });});
async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    if(isSubmitting)return;
    setError(null);

    const cleanName = name.trim();
    const cleanCode = code.trim().toUpperCase();

    if (!cleanName) {
      setError("Department name is required.");
      return;
    }
    if (!cleanCode) {
      setError("Department code is required.");
      return;
    }
    if (!/^[A-Za-z0-9_-]+$/.test(cleanCode)) {
      setError("Department code can only contain letters, numbers, hyphens, and underscores.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/app/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: cleanName,
          code: cleanCode,
          description: description.trim() || undefined,
          headEmployeeId: headEmployeeId || null,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || "Failed to create department.");
      }

      onCreated();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create department.");
    } finally {
      setIsSubmitting(false);
    }
  }
</script>
{#if !open}{:else}<dialog bind:this={dialog} oncancel={e=>{if(isSubmitting)e.preventDefault();else onClose();}} onclose={onClose} aria-labelledby="create-dept-title" class="fixed inset-0 z-50 m-0 h-full w-full max-h-none max-w-none flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div class="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-surface p-6 shadow-xl sm:p-7 space-y-5">
        <div class="flex items-start justify-between border-b border-slate-100 pb-4">
          <div class="flex items-center gap-2.5">
            <div class="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <SvgIcon name="Building2" class="size-5" />
            </div>
            <div>
              <h2 id="create-dept-title" class="text-base font-bold text-foreground">
                Create Department
              </h2>
              <p class="text-xs text-muted">
                Add a new operational department to your company hierarchy.
              </p>
            </div>
          </div>
          <button type="button" onclick={onClose} class="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="Close dialog">
            <SvgIcon name="X" class="size-4" />
          </button>
        </div>

        {#if error}<div role="alert" class="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800">
            <SvgIcon name="AlertTriangle" class="size-4 shrink-0 text-rose-600 mt-0.5" />
            <p class="font-medium">{error}</p>
          </div>{/if}

        <form onsubmit={handleSubmit} class="space-y-4">
          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-foreground" for="dept-name">
              Department Name <span class="text-rose-500">*</span>
            </label>
            <Input id="dept-name" value={name} oninput={(e) => setName(e.currentTarget.value)} placeholder="e.g. Engineering, Sales, Human Resources" required />
          </div>

          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-foreground" for="dept-code">
              Department Code <span class="text-rose-500">*</span>
            </label>
            <Input id="dept-code" value={code} oninput={(e) => setCode(e.currentTarget.value.toUpperCase())} placeholder="e.g. ENG, SALES, HR, FIN" required />
            <p class="text-[11px] text-muted">
              Unique identifier used in employee IDs, expense policies, and team scopes.
            </p>
          </div>

          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-foreground" for="dept-manager">
              Department Manager <span class="text-xs font-normal text-muted">(optional)</span>
            </label>
            <CustomSelect value={headEmployeeId} onChange={(val) => setHeadEmployeeId(val)} options={[
                { value: "", label: "None (Unassigned)" },
                ...eligibleManagers.map((m) => ({
                  value: m.id,
                  label: `${m.displayName} (${m.roleTitle || "Manager"}) - ${m.employeeId}`,
                })),
              ]} placeholder={isLoadingManagers ? "Loading managers…" : "Select a department manager…"} searchable={eligibleManagers.length > 5} searchPlaceholder="Search active managers…" emptyMessage="No eligible managers found." />
          </div>

          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-foreground" for="dept-desc">
              Description <span class="text-xs font-normal text-muted">(optional)</span>
            </label>
            <textarea id="dept-desc" value={description} onchange={(e) => setDescription(e.currentTarget.value)} rows={3} placeholder="Brief description of the department's mandate and scope…" class="w-full rounded-lg border border-input bg-surface px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"></textarea>
          </div>

          <div class="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onclick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {#if isSubmitting}{"Creating…"}{:else}{"Create Department"}{/if}
            </Button>
          </div>
        </form>
      </div>
    </dialog>{/if}
