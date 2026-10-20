<script lang="ts">
import type{ShiftData}from'./ShiftFormDialog.svelte';import type{MasterDataItem}from'./MasterDataEditDialog.svelte';
import SvgIcon from "$lib/components/ui/Icon.svelte";
import Button from "$lib/components/ui/Button.svelte";
import Input from "$lib/components/ui/Input.svelte";
import ShiftFormDialog from "$lib/components/settings/ShiftFormDialog.svelte";
import MasterDataEditDialog from "$lib/components/settings/MasterDataEditDialog.svelte";
import ConfirmDialog from "$lib/components/ui/ConfirmDialog.svelte";

import {untrack} from "svelte";
import {page as routePage,navigating} from "$app/state";
import {goto,invalidateAll} from "$app/navigation";
import {notify} from "$lib/client/toast";
const configs = [
  ["Departments", "departments", "departments", "Name", "Code"],
  ["Designations", "designations", "designations", "Name", "Code"],
  ["Locations", "locations", "locations", "Name", "Code"],
  ["Teams", "teams", "teams", "Name", "Code"],
  ["Employment types", "employment-types", "employmentTypes", "Name", "Code"],
  ["Shifts", "shifts", "shifts", "Name", "Code"],
  ["Holidays", "holidays", "holidays", "Name", "Date (YYYY-MM-DD)"],
  ["Working days", "working-days", "workingDays", "Day (0 Sunday – 6 Saturday)", "Working?"],
] as const;
type Item = MasterDataItem & ShiftData;
const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
let items=$state<Record<string, Item[]>>(untrack(()=>({})));
const setItems=(next:typeof items|((previous:typeof items)=>typeof items))=>{items=typeof next==="function"?(next as (previous:typeof items)=>typeof items)(items):next;};
let drafts=$state<Record<string, { first: string; second: string }>>(untrack(()=>({})));
const setDrafts=(next:typeof drafts|((previous:typeof drafts)=>typeof drafts))=>{drafts=typeof next==="function"?(next as (previous:typeof drafts)=>typeof drafts)(drafts):next;};
let busy=$state<string|undefined>(untrack(()=>(undefined)));
const setBusy=(next:typeof busy|((previous:typeof busy)=>typeof busy))=>{busy=typeof next==="function"?(next as (previous:typeof busy)=>typeof busy)(busy):next;};
let error=$state<string|undefined>(untrack(()=>(undefined)));
const setError=(next:typeof error|((previous:typeof error)=>typeof error))=>{error=typeof next==="function"?(next as (previous:typeof error)=>typeof error)(error):next;};
let shiftModalOpen=$state(untrack(()=>(false)));
const setShiftModalOpen=(next:typeof shiftModalOpen|((previous:typeof shiftModalOpen)=>typeof shiftModalOpen))=>{shiftModalOpen=typeof next==="function"?(next as (previous:typeof shiftModalOpen)=>typeof shiftModalOpen)(shiftModalOpen):next;};
let editingShift=$state<ShiftData | null>(untrack(()=>(null)));
const setEditingShift=(next:typeof editingShift|((previous:typeof editingShift)=>typeof editingShift))=>{editingShift=typeof next==="function"?(next as (previous:typeof editingShift)=>typeof editingShift)(editingShift):next;};
let editModalOpen=$state(untrack(()=>(false)));
const setEditModalOpen=(next:typeof editModalOpen|((previous:typeof editModalOpen)=>typeof editModalOpen))=>{editModalOpen=typeof next==="function"?(next as (previous:typeof editModalOpen)=>typeof editModalOpen)(editModalOpen):next;};
let editingItem=$state<{
    resource: string;
    label: string;
    item: MasterDataItem;
  } | null>(untrack(()=>(null)));
const setEditingItem=(next:typeof editingItem|((previous:typeof editingItem)=>typeof editingItem))=>{editingItem=typeof next==="function"?(next as (previous:typeof editingItem)=>typeof editingItem)(editingItem):next;};
let deactivateConfirmOpen=$state(untrack(()=>(false)));
const setDeactivateConfirmOpen=(next:typeof deactivateConfirmOpen|((previous:typeof deactivateConfirmOpen)=>typeof deactivateConfirmOpen))=>{deactivateConfirmOpen=typeof next==="function"?(next as (previous:typeof deactivateConfirmOpen)=>typeof deactivateConfirmOpen)(deactivateConfirmOpen):next;};
let deactivatingItem=$state<{
    resource: string;
    endpoint: string;
    item: Item;
  } | null>(untrack(()=>(null)));
const setDeactivatingItem=(next:typeof deactivatingItem|((previous:typeof deactivatingItem)=>typeof deactivatingItem))=>{deactivatingItem=typeof next==="function"?(next as (previous:typeof deactivatingItem)=>typeof deactivatingItem)(deactivatingItem):next;};
let isDeactivating=$state(untrack(()=>(false)));
const setIsDeactivating=(next:typeof isDeactivating|((previous:typeof isDeactivating)=>typeof isDeactivating))=>{isDeactivating=typeof next==="function"?(next as (previous:typeof isDeactivating)=>typeof isDeactivating)(isDeactivating):next;};
const showToast=(toast:{type:"success"|"error"|"info";title?:string;message?:string})=>notify(toast.message??toast.title??"",toast.type);
const load=$derived.by(()=>{return async () => {
    try {
      const responses = await Promise.all(
        configs.map(([, endpoint]) => fetch(`/api/app/master-data/${endpoint}`))
      );
      const values = await Promise.all(responses.map((r) => r.json()));
      setItems(
        Object.fromEntries(
          configs.map(([, endpoint], index) => [endpoint, values[index].items ?? []])
        )
      );
    } catch {
      setError("Unable to load organization master data settings.");
    }
  };});
$effect(()=>{load;return untrack(() => {
    void load();
  });});
async function create(endpoint: string, resource: string) {
    const draft = drafts[endpoint] ?? { first: "", second: "" };
    let payload: Record<string, unknown> = {};

    if (resource === "workingDays") {
      payload = {
        dayOfWeek: Number(draft.first),
        isWorkingDay: draft.second !== "false",
      };
    } else if (resource === "holidays") {
      payload = {
        name: draft.first.trim(),
        holidayDate: draft.second.trim(),
      };
    } else {
      payload = {
        name: draft.first.trim(),
        code: draft.second.trim().toUpperCase(),
      };
    }

    setBusy(endpoint);
    setError(undefined);

    try {
      const response = await fetch(`/api/app/master-data/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const body = await response.json().catch(() => ({}));
      if (!response.ok || !body.success) {
        const msg = body.error?.message ?? `Unable to create ${endpoint}.`;
        setError(msg);
        showToast({ type: "error", title: "Creation failed", message: msg });
      } else {
        setDrafts({ ...drafts, [endpoint]: { first: "", second: "" } });
        showToast({
          type: "success",
          title: "Created successfully",
          message: `Added new item to ${endpoint}.`,
        });
        await load();
      }
    } catch {
      const msg = `Network error creating ${endpoint}.`;
      setError(msg);
      showToast({ type: "error", title: "Network error", message: msg });
    } finally {
      setBusy(undefined);
    }
  }
function handleOpenDeactivate(resource: string, endpoint: string, item: Item) {
    setDeactivatingItem({ resource, endpoint, item });
    setDeactivateConfirmOpen(true);
  }
async function executeDeactivate() {
    if (!deactivatingItem) return;
    const { resource, item } = deactivatingItem;

    setIsDeactivating(true);
    setError(undefined);

    try {
      const response = await fetch(`/api/app/master-data/${resource}/${item.id}`, {
        method: "DELETE",
      });

      const body = await response.json().catch(() => ({}));
      if (!response.ok || !body.success) {
        const msg = body.error?.message ?? "Unable to deactivate this item.";
        setError(msg);
        showToast({ type: "error", title: "Deactivation failed", message: msg });
      } else {
        showToast({
          type: "success",
          title: "Item deactivated",
          message: "The master data record has been deactivated safely.",
        });
        await load();
        setDeactivateConfirmOpen(false);
      }
    } catch {
      const msg = "Network error during deactivation.";
      setError(msg);
      showToast({ type: "error", title: "Network error", message: msg });
    } finally {
      setIsDeactivating(false);
    }
  }
function handleOpenEdit(resource: string, label: string, item: Item) {
    if (resource === "shifts") {
      setEditingShift(item);
      setShiftModalOpen(true);
    } else {
      setEditingItem({ resource, label, item });
      setEditModalOpen(true);
    }
  }
function handleOpenCreateShift() {
    setEditingShift(null);
    setShiftModalOpen(true);
  }
</script>
<div class="space-y-6">
      {#if error}<div role="alert" class="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800">
          <SvgIcon name="AlertCircle" class="size-4 shrink-0 text-rose-600 mt-0.5" />
          <p class="font-medium">{error}</p>
        </div>{/if}

      {#each configs as [label, endpoint, resource, firstLabel, secondLabel]}{@const rows = items[endpoint] ?? []}{@const isShiftsSection = resource === "shifts"}{@const draft = drafts[endpoint] ?? { first: "", second: "" }}<section class="rounded-2xl border border-border/80 bg-surface p-5 shadow-xs">
            
            <div class="flex flex-col justify-between gap-3 sm:flex-row sm:items-center border-b border-slate-100 pb-4">
              <div>
                <div class="flex items-center gap-2">
                  <h2 class="text-base font-bold text-foreground">{label}</h2>
                  <span class="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
                    {rows.length} configured
                  </span>
                </div>
                <p class="text-xs text-muted mt-0.5">
                  {#if isShiftsSection}{"Configure operational work hours, break parameters, and overnight schedules."}{:else}{`Manage ${label.toLowerCase()} available across your organization.`}{/if}
                </p>
              </div>

              {#if isShiftsSection}<Button onclick={handleOpenCreateShift} size="sm" class="gap-1.5 font-semibold shrink-0">
                  <SvgIcon name="Plus" class="size-4" />
                  <span>Create Shift</span>
                </Button>{:else}<div class="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                  {#if resource === "workingDays"}
                      <select aria-label="Select day of week" value={draft.first} onchange={(e) =>
                          setDrafts({
                            ...drafts,
                            [endpoint]: { ...draft, first: e.currentTarget.value },
                          })} class="h-9 rounded-lg border border-border bg-surface px-3 text-xs">
                        <option value="">Select day</option>
                        {#each DAY_NAMES as name, idx}<option value={String(idx)}>
                            {name}
                          </option>{/each}
                      </select>
                      <select aria-label="Is working day" value={draft.second} onchange={(e) =>
                          setDrafts({
                            ...drafts,
                            [endpoint]: { ...draft, second: e.currentTarget.value },
                          })} class="h-9 rounded-lg border border-border bg-surface px-3 text-xs">
                        <option value="true">Working Day</option>
                        <option value="false">Non-working Day</option>
                      </select>
                    {:else}{#if resource === "holidays"}
                      <Input aria-label={`${label} ${firstLabel}`} placeholder={firstLabel} value={draft.first} onchange={(e) =>
                          setDrafts({
                            ...drafts,
                            [endpoint]: { ...draft, first: e.currentTarget.value },
                          })} class="h-9 text-xs" />
                      <Input aria-label={`${label} ${secondLabel}`} type="date" value={draft.second} onchange={(e) =>
                          setDrafts({
                            ...drafts,
                            [endpoint]: { ...draft, second: e.currentTarget.value },
                          })} class="h-9 text-xs" />
                    {:else}
                      <Input aria-label={`${label} ${firstLabel}`} placeholder={firstLabel} value={draft.first} onchange={(e) =>
                          setDrafts({
                            ...drafts,
                            [endpoint]: { ...draft, first: e.currentTarget.value },
                          })} class="h-9 text-xs" />
                      <Input aria-label={`${label} ${secondLabel}`} placeholder={secondLabel} value={draft.second} onchange={(e) =>
                          setDrafts({
                            ...drafts,
                            [endpoint]: {
                              ...draft,
                              second: e.currentTarget.value.toUpperCase(),
                            },
                          })} class="h-9 text-xs" />
                    {/if}{/if}
                  <Button size="sm" disabled={busy === endpoint || !draft.first || !draft.second} onclick={() => void create(endpoint, resource)} class="shrink-0">
                    Add
                  </Button>
                </div>{/if}
            </div>

            
            <div class="mt-4 space-y-2">
              {#if rows.length === 0}<p class="rounded-xl border border-dashed border-slate-200 p-5 text-center text-xs text-muted">
                  No {label.toLowerCase()} configured yet.
                </p>{:else}{#each rows as item}{@const isInactive = item.status === "inactive"}{@const start = item.startTime || item.start_time}{@const end = item.endTime || item.end_time}{@const displaySchedule = start && end ? `${start.slice(0, 5)} – ${end.slice(0, 5)}` : null}<div class={`flex flex-col gap-2 rounded-xl border p-3 text-xs sm:flex-row sm:items-center sm:justify-between transition-colors ${
                        isInactive
                          ? "border-slate-200/60 bg-slate-50/50 opacity-60"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}>
                      
                      <div class="flex flex-wrap items-center gap-2">
                        {#if isShiftsSection}<div class="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <SvgIcon name="Clock" class="size-3.5" />
                          </div>{/if}

                        <span class="font-semibold text-foreground text-sm">
                          {item.name ??
                            (item.dayOfWeek !== undefined
                              ? DAY_NAMES[item.dayOfWeek]
                              : item.holidayDate || item.holiday_date)}
                        </span>

                        {#if item.code}<span class="rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-700">
                            {item.code}
                          </span>{/if}

                        
                        {#if isShiftsSection && displaySchedule}<span class="inline-flex items-center gap-1 rounded-md bg-emerald-50 border border-emerald-200/70 px-2 py-0.5 font-semibold text-emerald-800 text-[11px]">
                            <span>🕒</span>
                            <span>{displaySchedule}</span>
                          </span>{/if}

                        {#if isShiftsSection && item.overnight}<span class="inline-flex items-center gap-1 rounded-md bg-indigo-50 border border-indigo-200/70 px-2 py-0.5 font-semibold text-indigo-800 text-[11px]">
                            <SvgIcon name="Moon" class="size-3" />
                            <span>Overnight</span>
                          </span>{/if}

                        {#if isShiftsSection}<span class="text-[11px] text-muted">
                            Break: {item.breakMinutes ?? item.break_minutes ?? 60}m · Grace:{" "}
                            {item.graceMinutes ?? item.grace_minutes ?? 15}m
                          </span>{/if}

                        {#if item.isWorkingDay !== undefined}<span class={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                              item.isWorkingDay
                                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                : "bg-slate-100 text-slate-600 border border-slate-200"
                            }`}>
                            {#if item.isWorkingDay}{"Working day"}{:else}{"Non-working day"}{/if}
                          </span>{/if}

                        {#if isInactive}<span class="rounded-md bg-rose-50 border border-rose-200 px-1.5 py-0.5 font-semibold text-rose-700 text-[10px]">
                            Inactive
                          </span>{/if}
                      </div>

                      
                      <div class="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                        {#if !isInactive}<Button aria-label={`Edit ${label} item`} variant="ghost" size="sm" class="h-8 text-xs font-semibold text-slate-700 hover:text-foreground" disabled={busy === item.id} onclick={() => handleOpenEdit(resource, label, item)}>
                            Edit
                          </Button>{/if}

                        {#if resource !== "workingDays" && !isInactive}<Button aria-label={`Deactivate ${label} item`} variant="ghost" size="sm" class="h-8 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50" disabled={busy === item.id} onclick={() =>
                              handleOpenDeactivate(resource, endpoint, item)}>
                            Deactivate
                          </Button>{/if}
                      </div>
                    </div>{/each}{/if}
            </div>
          </section>{/each}

      
      <ShiftFormDialog open={shiftModalOpen} onOpenChange={setShiftModalOpen} shift={editingShift} onSuccess={() => {
          showToast({
            type: "success",
            title: editingShift ? "Shift updated" : "Shift created",
            message: editingShift
              ? `Updated shift "${editingShift.name}".`
              : "New work shift added successfully.",
          });
          void load();
        }} />

      
      <MasterDataEditDialog open={editModalOpen} onOpenChange={setEditModalOpen} resource={editingItem?.resource ?? ""} label={editingItem?.label ?? "Item"} item={editingItem?.item ?? null} onSuccess={() => {
          showToast({
            type: "success",
            title: "Updated",
            message: `Updated ${editingItem?.label ?? "item"} successfully.`,
          });
          void load();
        }} />

      
      <ConfirmDialog open={deactivateConfirmOpen} onOpenChange={setDeactivateConfirmOpen} title={`Deactivate ${deactivatingItem?.item.name || deactivatingItem?.item.code || "Item"}?`} confirmText="Deactivate Item" cancelText="Cancel" variant="destructive" isLoading={isDeactivating} onConfirm={executeDeactivate}>{#snippet description()}<div class="space-y-1.5">
            <p>
              Are you sure you want to deactivate{" "}
              <strong class="text-slate-900">
                {deactivatingItem?.item.name || deactivatingItem?.item.code}
              </strong>
              ?
            </p>
            <p class="text-amber-800 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
              Existing employee profiles and attendance history will preserve their references, but this item will no longer be offered for new assignments.
            </p>
          </div>{/snippet}</ConfirmDialog>
    </div>
