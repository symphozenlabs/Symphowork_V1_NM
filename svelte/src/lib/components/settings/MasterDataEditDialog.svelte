<script lang="ts">
import SvgIcon from "$lib/components/ui/Icon.svelte";
import DialogFrame from "$lib/components/ui/DialogFrame.svelte";
import Input from "$lib/components/ui/Input.svelte";
import Button from "$lib/components/ui/Button.svelte";

import {untrack} from "svelte";
import {page as routePage,navigating} from "$app/state";
import {goto,invalidateAll} from "$app/navigation";
import {notify} from "$lib/client/toast";
export interface MasterDataItem {
  id: string;
  name?: string;
  code?: string;
  holidayDate?: string;
  holiday_date?: string;
  dayOfWeek?: number;
  day_of_week?: number;
  isWorkingDay?: boolean;
  is_working_day?: boolean;
  description?: string;
  status?: string;
}
interface MasterDataEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resource: string;
  label: string;
  item: MasterDataItem | null;
  onSuccess: () => void;
}
const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
let {
  open,
  onOpenChange,
  resource,
  label,
  item,
  onSuccess,
}:MasterDataEditDialogProps=$props();
let name=$state(untrack(()=>(item?.name ?? "")));
const setName=(next:typeof name|((previous:typeof name)=>typeof name))=>{name=typeof next==="function"?(next as (previous:typeof name)=>typeof name)(name):next;};
let code=$state(untrack(()=>(item?.code ?? "")));
const setCode=(next:typeof code|((previous:typeof code)=>typeof code))=>{code=typeof next==="function"?(next as (previous:typeof code)=>typeof code)(code):next;};
let holidayDate=$state(untrack(()=>(item?.holidayDate || item?.holiday_date || "")));
const setHolidayDate=(next:typeof holidayDate|((previous:typeof holidayDate)=>typeof holidayDate))=>{holidayDate=typeof next==="function"?(next as (previous:typeof holidayDate)=>typeof holidayDate)(holidayDate):next;};
let isWorkingDay=$state(untrack(()=>(item?.isWorkingDay !== undefined
      ? Boolean(item.isWorkingDay)
      : item?.is_working_day !== undefined
        ? Boolean(item.is_working_day)
        : true)));
const setIsWorkingDay=(next:typeof isWorkingDay|((previous:typeof isWorkingDay)=>typeof isWorkingDay))=>{isWorkingDay=typeof next==="function"?(next as (previous:typeof isWorkingDay)=>typeof isWorkingDay)(isWorkingDay):next;};
let description=$state(untrack(()=>(item?.description ?? "")));
const setDescription=(next:typeof description|((previous:typeof description)=>typeof description))=>{description=typeof next==="function"?(next as (previous:typeof description)=>typeof description)(description):next;};
let error=$state<string | null>(untrack(()=>(null)));
const setError=(next:typeof error|((previous:typeof error)=>typeof error))=>{error=typeof next==="function"?(next as (previous:typeof error)=>typeof error)(error):next;};
let isLoading=$state(untrack(()=>(false)));
const setIsLoading=(next:typeof isLoading|((previous:typeof isLoading)=>typeof isLoading))=>{isLoading=typeof next==="function"?(next as (previous:typeof isLoading)=>typeof isLoading)(isLoading):next;};
$effect(()=>{open;item;return untrack(() => {
    if (open && item) {
      setName(item.name ?? "");
      setCode(item.code ?? "");
      setHolidayDate(item.holidayDate || item.holiday_date || "");
      setIsWorkingDay(
        item.isWorkingDay !== undefined
          ? Boolean(item.isWorkingDay)
          : item.is_working_day !== undefined
            ? Boolean(item.is_working_day)
            : true
      );
      setDescription(item.description ?? "");
      setError(null);
    }
  });});
const handleClose = () => {
    if (isLoading) return;
    setError(null);
    onOpenChange(false);
  };
const handleSubmit = async (e: SubmitEvent) => {
    e.preventDefault();
    if (!item) return;

    setError(null);

    let payload: Record<string, unknown> = {};

    if (resource === "workingDays") {
      payload = {
        is_working_day: isWorkingDay,
        isWorkingDay: isWorkingDay,
      };
    } else if (resource === "holidays") {
      const cleanName = name.trim();
      if (!cleanName) {
        setError("Holiday name is required.");
        return;
      }
      if (!holidayDate) {
        setError("Holiday date is required.");
        return;
      }
      payload = {
        name: cleanName,
        holiday_date: holidayDate,
        holidayDate: holidayDate,
      };
    } else {
      const cleanName = name.trim();
      const cleanCode = code.trim().toUpperCase();
      if (!cleanName) {
        setError(`${label} name is required.`);
        return;
      }
      if (!cleanCode) {
        setError(`${label} code is required.`);
        return;
      }
      payload = {
        name: cleanName,
        code: cleanCode,
        ...(description ? { description: description.trim() } : {}),
      };
    }

    setIsLoading(true);

    try {
      const res = await fetch(`/api/app/master-data/${resource}/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.success) {
        throw new Error(body.error?.message || `Unable to update this ${label}.`);
      }

      onSuccess();
      onOpenChange(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : `Failed to update ${label}.`);
    } finally {
      setIsLoading(false);
    }
  };
const dayIndex=$derived(item?.dayOfWeek ?? item?.day_of_week);
const dayName=$derived(dayIndex !== undefined ? DAY_NAMES[dayIndex] : undefined);
</script>
{#if item}<DialogFrame open={open} onOpenChange={(nextOpen) => {
        if (isLoading) return;
        if (!nextOpen) handleClose();
      }}>
      
        
        <div class="fixed left-1/2 top-1/2 z-[100] w-[92vw] max-w-[480px] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          
          <div class="flex items-start justify-between border-b border-slate-100 pb-3.5">
            <div class="flex items-center gap-2.5">
              <div class="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <SvgIcon name="Edit2" class="size-4.5" />
              </div>
              <div>
                <h2 class="text-base font-bold text-slate-900">
                  Edit {label}
                </h2>
                <p class="text-xs text-slate-500 mt-0.5">
                  Update configuration details for this master data record.
                </p>
              </div>
            </div>
            
              <button type="button" disabled={isLoading} onclick={handleClose} class="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" aria-label="Close dialog">
                <SvgIcon name="X" class="size-4" aria-hidden="true" />
              </button>
            
          </div>

          
          {#if error}<div role="alert" class="mt-3.5 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
              <SvgIcon name="AlertCircle" class="size-4 shrink-0 text-rose-600 mt-0.5" />
              <p class="font-medium leading-relaxed">{error}</p>
            </div>{/if}

          
          <form onsubmit={handleSubmit} class="mt-4 space-y-4">
            {#if resource === "workingDays"}<div class="space-y-3">
                <div class="space-y-1.5">
                  <p class="text-xs font-semibold text-slate-800">Day of the Week</p>
                  <p class="font-bold text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                    {dayName ?? "Day"}
                  </p>
                </div>
                <div class="space-y-1.5">
                  <label class="text-xs font-semibold text-slate-800" for="working-status">
                    Schedule Status
                  </label>
                  <select id="working-status" value={String(isWorkingDay)} onchange={(e) => setIsWorkingDay(e.currentTarget.value === "true")} disabled={isLoading} class="w-full h-10 rounded-lg border border-slate-200 bg-surface px-3 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                    <option value="true">Working Day</option>
                    <option value="false">Non-working Day (Weekend / Off)</option>
                  </select>
                </div>
              </div>{:else}{#if resource === "holidays"}<div class="space-y-3">
                <div class="space-y-1.5">
                  <label class="text-xs font-semibold text-slate-800" for="holiday-name">
                    Holiday Name <span class="text-rose-500">*</span>
                  </label>
                  <Input id="holiday-name" value={name} onchange={(e) => setName(e.currentTarget.value)} placeholder="e.g. Independence Day, New Year's Day" required disabled={isLoading} />
                </div>
                <div class="space-y-1.5">
                  <label class="text-xs font-semibold text-slate-800" for="holiday-date">
                    Holiday Date <span class="text-rose-500">*</span>
                  </label>
                  <Input id="holiday-date" type="date" value={holidayDate} onchange={(e) => setHolidayDate(e.currentTarget.value)} required disabled={isLoading} />
                </div>
              </div>{:else}<div class="space-y-3">
                <div class="space-y-1.5">
                  <label class="text-xs font-semibold text-slate-800" for="item-name">
                    Name <span class="text-rose-500">*</span>
                  </label>
                  <Input id="item-name" value={name} onchange={(e) => setName(e.currentTarget.value)} placeholder={`e.g. ${label} Name`} required disabled={isLoading} />
                </div>
                <div class="space-y-1.5">
                  <label class="text-xs font-semibold text-slate-800" for="item-code">
                    Code <span class="text-rose-500">*</span>
                  </label>
                  <Input id="item-code" value={code} onchange={(e) => setCode(e.currentTarget.value.toUpperCase())} placeholder="e.g. CODE-01" required disabled={isLoading} />
                </div>
                <div class="space-y-1.5">
                  <label class="text-xs font-semibold text-slate-800" for="item-desc">
                    Description <span class="text-xs text-muted font-normal">(optional)</span>
                  </label>
                  <textarea id="item-desc" value={description} onchange={(e) => setDescription(e.currentTarget.value)} rows={2} placeholder="Optional details or operational scope..." disabled={isLoading} class="w-full rounded-lg border border-slate-200 bg-surface px-3 py-2 text-xs text-foreground placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"></textarea>
                </div>
              </div>{/if}{/if}

            <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end pt-3 border-t border-slate-100">
              <Button type="button" variant="outline" size="sm" disabled={isLoading} onclick={handleClose} class="w-full sm:w-auto font-medium">
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" disabled={isLoading} class="w-full sm:w-auto font-semibold shadow-xs">
                {#if isLoading}
                    <SvgIcon name="Loader2" class="size-3.5 animate-spin mr-1.5" />
                    <span>Saving...</span>
                  {:else}{"Save Changes"}{/if}
              </Button>
            </div>
          </form>
        </div>
      
    </DialogFrame>{/if}
