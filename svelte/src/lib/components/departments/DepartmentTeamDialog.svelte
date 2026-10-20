<script lang="ts">
let dialog=$state<HTMLDialogElement>();$effect(()=>{if(open&&dialog&&!dialog.open)dialog.showModal();});
import type{DepartmentDetails,DepartmentManagerSummary,DepartmentTeamItem,DepartmentRosterMember,DepartmentTeamLeadSummary,DepartmentDeletionSafety}from'$lib/domain/departments/types';
import SvgIcon from "$lib/components/ui/Icon.svelte";
import Input from "$lib/components/ui/Input.svelte";
import CustomSelect from "$lib/components/ui/CustomSelect.svelte";
import Button from "$lib/components/ui/Button.svelte";

import {untrack} from "svelte";
import {page as routePage,navigating} from "$app/state";
import {goto,invalidateAll} from "$app/navigation";
import {notify} from "$lib/client/toast";
interface DepartmentTeamDialogProps {
  open: boolean;
  mode: "create" | "edit";
  departmentId: string;
  departmentName: string;
  initialTeam?: DepartmentTeamItem | null;
  roster?: DepartmentRosterMember[];
  eligibleTeamLeads?: DepartmentTeamLeadSummary[];
  onClose: () => void;
  onSaved: () => void;
}
let {
  open,
  mode,
  departmentId,
  departmentName,
  initialTeam,
  eligibleTeamLeads: propEligibleLeads,
  onClose,
  onSaved,
}:DepartmentTeamDialogProps=$props();
let name=$state(untrack(()=>(mode === "edit" && initialTeam ? initialTeam.name : "")));
const setName=(next:typeof name|((previous:typeof name)=>typeof name))=>{name=typeof next==="function"?(next as (previous:typeof name)=>typeof name)(name):next;};
let code=$state(untrack(()=>(mode === "edit" && initialTeam ? initialTeam.code : "")));
const setCode=(next:typeof code|((previous:typeof code)=>typeof code))=>{code=typeof next==="function"?(next as (previous:typeof code)=>typeof code)(code):next;};
let description=$state(untrack(()=>(mode === "edit" && initialTeam ? initialTeam.description || "" : "")));
const setDescription=(next:typeof description|((previous:typeof description)=>typeof description))=>{description=typeof next==="function"?(next as (previous:typeof description)=>typeof description)(description):next;};
let teamLeadEmployeeId=$state<string>(untrack(()=>(mode === "edit" && initialTeam ? initialTeam.teamLeadEmployeeId || "" : "")));
const setTeamLeadEmployeeId=(next:typeof teamLeadEmployeeId|((previous:typeof teamLeadEmployeeId)=>typeof teamLeadEmployeeId))=>{teamLeadEmployeeId=typeof next==="function"?(next as (previous:typeof teamLeadEmployeeId)=>typeof teamLeadEmployeeId)(teamLeadEmployeeId):next;};
let status=$state<"active" | "inactive">(untrack(()=>(mode === "edit" && initialTeam ? initialTeam.status : "active")));
const setStatus=(next:typeof status|((previous:typeof status)=>typeof status))=>{status=typeof next==="function"?(next as (previous:typeof status)=>typeof status)(status):next;};
let eligibleTeamLeads=$state<DepartmentTeamLeadSummary[]>(untrack(()=>(propEligibleLeads || [])));
const setEligibleTeamLeads=(next:typeof eligibleTeamLeads|((previous:typeof eligibleTeamLeads)=>typeof eligibleTeamLeads))=>{eligibleTeamLeads=typeof next==="function"?(next as (previous:typeof eligibleTeamLeads)=>typeof eligibleTeamLeads)(eligibleTeamLeads):next;};
let isLoadingLeads=$state(untrack(()=>(false)));
const setIsLoadingLeads=(next:typeof isLoadingLeads|((previous:typeof isLoadingLeads)=>typeof isLoadingLeads))=>{isLoadingLeads=typeof next==="function"?(next as (previous:typeof isLoadingLeads)=>typeof isLoadingLeads)(isLoadingLeads):next;};
let isSubmitting=$state(untrack(()=>(false)));
const setIsSubmitting=(next:typeof isSubmitting|((previous:typeof isSubmitting)=>typeof isSubmitting))=>{isSubmitting=typeof next==="function"?(next as (previous:typeof isSubmitting)=>typeof isSubmitting)(isSubmitting):next;};
let error=$state<string | null>(untrack(()=>(null)));
const setError=(next:typeof error|((previous:typeof error)=>typeof error))=>{error=typeof next==="function"?(next as (previous:typeof error)=>typeof error)(error):next;};
$effect(()=>{open;mode;initialTeam;departmentId;propEligibleLeads;return untrack(() => {
    if (!open) {
      setName("");
      setCode("");
      setDescription("");
      setTeamLeadEmployeeId("");
      setStatus("active");
      setError(null);
      return;
    }

    if (mode === "edit" && initialTeam) {
      setName(initialTeam.name);
      setCode(initialTeam.code);
      setDescription(initialTeam.description || "");
      setTeamLeadEmployeeId(initialTeam.teamLeadEmployeeId || "");
      setStatus(initialTeam.status);
    } else {
      setName("");
      setCode("");
      setDescription("");
      setTeamLeadEmployeeId("");
      setStatus("active");
    }
    setError(null);

    if (propEligibleLeads !== undefined) {
      setEligibleTeamLeads(propEligibleLeads);
    } else {
      setIsLoadingLeads(true);
      fetch(
        `/api/app/departments/eligible-team-leads?departmentId=${encodeURIComponent(departmentId)}`
      )
        .then((r) => r.json())
        .then((d) => {
          if (d.success && Array.isArray(d.teamLeads || d.leads)) {
            setEligibleTeamLeads(d.teamLeads || d.leads);
          }
        })
        .catch(() => {
          // Fall back gracefully
        })
        .finally(() => setIsLoadingLeads(false));
    }
  });});
const leadOptions=$derived.by(()=>{const leadOptions=eligibleTeamLeads.map((m) => ({
    value: m.id,
    label: `${m.displayName} (${m.roleTitle || "Team Lead"}) - ${m.employeeId}`,
  }));if (
    mode === "edit" &&
    initialTeam?.teamLeadEmployeeId &&
    !leadOptions.some((opt) => opt.value === initialTeam.teamLeadEmployeeId)
  ) {
    leadOptions.unshift({
      value: initialTeam.teamLeadEmployeeId,
      label: `${initialTeam.teamLeadName || "Current Team Lead"} (Current Assignment)`,
    });
  };return leadOptions;});
const selectOptions=$derived(isLoadingLeads
    ? [{ value: "", label: "Loading team leads…" }]
    : leadOptions.length === 0
      ? [
          {
            value: "",
            label: "None (No eligible Team Leads available)",
          },
        ]
      : [
          { value: "", label: "None (Unassigned)" },
          ...leadOptions,
        ]);
async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    if(isSubmitting)return;
    setError(null);

    const cleanName = name.trim();
    const cleanCode = code.trim().toUpperCase();

    if (!cleanName) {
      setError("Team name is required.");
      return;
    }
    if (!cleanCode) {
      setError("Team code is required.");
      return;
    }
    if (!/^[A-Za-z0-9_-]+$/.test(cleanCode)) {
      setError("Team code can only contain letters, numbers, hyphens, and underscores.");
      return;
    }

    setIsSubmitting(true);
    try {
      const url =
        mode === "create"
          ? `/api/app/departments/${departmentId}/teams`
          : `/api/app/departments/${departmentId}/teams/${initialTeam!.id}`;

      const method = mode === "create" ? "POST" : "PATCH";

      const bodyPayload = {
        name: cleanName,
        code: cleanCode,
        description: description.trim() || undefined,
        teamLeadEmployeeId: teamLeadEmployeeId || null,
        ...(mode === "edit" ? { status } : {}),
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyPayload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || `Failed to ${mode} team.`);
      }

      onSaved();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : `Failed to ${mode} team.`);
    } finally {
      setIsSubmitting(false);
    }
  }
</script>
{#if !open}{:else}<dialog bind:this={dialog} oncancel={e=>{if(isSubmitting)e.preventDefault();else onClose();}} onclose={onClose} aria-labelledby="team-dialog-title" class="fixed inset-0 z-50 m-0 h-full w-full max-h-none max-w-none flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
      <div class="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl space-y-5">
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <div class="flex items-center gap-2.5">
            <div class="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <SvgIcon name="Layers" class="size-4.5" />
            </div>
            <div>
              <h2 id="team-dialog-title" class="text-base font-bold text-foreground">
                {#if mode === "create"}{"Create New Team / Squad"}{:else}{"Edit Team Details"}{/if}
              </h2>
              <p class="text-xs text-muted">
                Scoped to <span class="font-semibold text-foreground">{departmentName}</span>
              </p>
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

        <form onsubmit={handleSubmit} class="space-y-4">
          <div class="grid gap-4 sm:grid-cols-2">
            <div class="space-y-1.5">
              <label for="team-name" class="text-xs font-semibold text-foreground">
                Team Name <span class="text-rose-500">*</span>
              </label>
              <Input id="team-name" value={name} oninput={(e) => setName(e.currentTarget.value)} placeholder="e.g. Talent Operations Squad" required maxlength={120} />
            </div>

            <div class="space-y-1.5">
              <label for="team-code" class="text-xs font-semibold text-foreground">
                Team Code <span class="text-rose-500">*</span>
              </label>
              <Input id="team-code" value={code} oninput={(e) => setCode(e.currentTarget.value.toUpperCase())} placeholder="e.g. HR-OPS" required maxlength={40} />
            </div>
          </div>

          <div class="space-y-1.5">
            <label for="departmentteamdialog-field-1" class="text-xs font-semibold text-foreground">
              Team Lead (Optional)
            </label>
            <CustomSelect id="departmentteamdialog-field-1" value={teamLeadEmployeeId} onChange={(val) => setTeamLeadEmployeeId(val)} options={selectOptions} placeholder={isLoadingLeads
                  ? "Loading team leads…"
                  : leadOptions.length === 0
                    ? "No eligible Team Leads available"
                    : "Select a team lead…"} searchable={leadOptions.length > 5} searchPlaceholder="Search eligible team leads…" emptyMessage="No eligible Team Leads available in this organization." />
            {#if leadOptions.length === 0 && !isLoadingLeads}<div role="status" data-testid="team-lead-empty-state" class="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/90 p-2.5 text-xs text-amber-800 mt-1">
                <SvgIcon name="AlertCircle" class="size-4 shrink-0 text-amber-600 mt-0.5" />
                <p class="leading-relaxed">
                  No eligible Team Leads are available in this organization. Employees must have the active Team Lead (<span class="font-semibold">TEAM_LEAD</span>) role to be assigned.
                </p>
              </div>{/if}
            {#if eligibleTeamLeads.length > 0}<ul class="sr-only" data-testid="eligible-team-leads-list" aria-label="Eligible Team Leads">
                {#each eligibleTeamLeads as lead}<li data-employee-id={lead.employeeId}>
                    {lead.displayName} ({lead.roleTitle || "Team Lead"}) - {lead.employeeId}
                  </li>{/each}
              </ul>{/if}
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            {#if mode === "edit"}<div class="space-y-1.5">
                <label for="departmentteamdialog-field-2" class="text-xs font-semibold text-foreground">Status</label>
                <CustomSelect id="departmentteamdialog-field-2" value={status} onChange={(val) => setStatus(val as "active" | "inactive")} options={[
                    { value: "active", label: "Active" },
                    { value: "inactive", label: "Inactive" },
                  ]} />
              </div>{:else}<div class="space-y-1.5">
                <p class="text-xs font-semibold text-foreground">Status</p>
                <div class="h-9 px-3 flex items-center rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-600 font-medium">
                  Active (Default)
                </div>
              </div>{/if}
          </div>

          <div class="space-y-1.5">
            <label for="team-desc" class="text-xs font-semibold text-foreground">
              Description (Optional)
            </label>
            <textarea id="team-desc" value={description} onchange={(e) => setDescription(e.currentTarget.value)} rows={2} maxlength={500} placeholder="Primary responsibilities and mandate of this squad…" class="w-full rounded-lg border border-input bg-surface px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"></textarea>
          </div>

          <div class="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onclick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {#if isSubmitting}{#if mode === "create"}{"Creating…"}{:else}{"Saving…"}{/if}{:else}{#if mode === "create"}{"Create Team"}{:else}{"Save Changes"}{/if}{/if}
            </Button>
          </div>
        </form>
      </div>
    </dialog>{/if}
