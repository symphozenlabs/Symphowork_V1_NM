<script lang="ts">
import SvgIcon from "$lib/components/ui/Icon.svelte";
import DialogFrame from "$lib/components/ui/DialogFrame.svelte";
import Input from "$lib/components/ui/Input.svelte";
import Button from "$lib/components/ui/Button.svelte";

import {untrack} from "svelte";
import {page as routePage,navigating} from "$app/state";
import {goto,invalidateAll} from "$app/navigation";
import {notify} from "$lib/client/toast";
export interface ShiftData {
  id?: string;
  name?: string;
  code?: string;
  startTime?: string;
  endTime?: string;
  start_time?: string;
  end_time?: string;
  breakMinutes?: number;
  break_minutes?: number;
  graceMinutes?: number;
  grace_minutes?: number;
  overnight?: boolean;
  status?: string;
}
interface ShiftFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shift?: ShiftData | null;
  onSuccess: () => void;
}
function normalizeTime(val?: string): string {
  if (!val) return "";
  // If time is HH:MM:SS, extract HH:MM
  const match = val.match(/^(\d{2}:\d{2})/);
  return match ? match[1] : val;
}
let {
  open,
  onOpenChange,
  shift,
  onSuccess,
}:ShiftFormDialogProps=$props();
const isEditing=$derived(Boolean(shift?.id));
let name=$state(untrack(()=>(shift?.name ?? "")));
const setName=(next:typeof name|((previous:typeof name)=>typeof name))=>{name=typeof next==="function"?(next as (previous:typeof name)=>typeof name)(name):next;};
let code=$state(untrack(()=>(shift?.code ?? "")));
const setCode=(next:typeof code|((previous:typeof code)=>typeof code))=>{code=typeof next==="function"?(next as (previous:typeof code)=>typeof code)(code):next;};
let startTime=$state(untrack(()=>(normalizeTime(shift?.startTime || shift?.start_time) || "09:00")));
const setStartTime=(next:typeof startTime|((previous:typeof startTime)=>typeof startTime))=>{startTime=typeof next==="function"?(next as (previous:typeof startTime)=>typeof startTime)(startTime):next;};
let endTime=$state(untrack(()=>(normalizeTime(shift?.endTime || shift?.end_time) || "18:00")));
const setEndTime=(next:typeof endTime|((previous:typeof endTime)=>typeof endTime))=>{endTime=typeof next==="function"?(next as (previous:typeof endTime)=>typeof endTime)(endTime):next;};
let breakMinutes=$state<number | string>(untrack(()=>(shift?.breakMinutes ?? shift?.break_minutes ?? 60)));
const setBreakMinutes=(next:typeof breakMinutes|((previous:typeof breakMinutes)=>typeof breakMinutes))=>{breakMinutes=typeof next==="function"?(next as (previous:typeof breakMinutes)=>typeof breakMinutes)(breakMinutes):next;};
let graceMinutes=$state<number | string>(untrack(()=>(shift?.graceMinutes ?? shift?.grace_minutes ?? 15)));
const setGraceMinutes=(next:typeof graceMinutes|((previous:typeof graceMinutes)=>typeof graceMinutes))=>{graceMinutes=typeof next==="function"?(next as (previous:typeof graceMinutes)=>typeof graceMinutes)(graceMinutes):next;};
let overnight=$state(untrack(()=>(Boolean(shift?.overnight))));
const setOvernight=(next:typeof overnight|((previous:typeof overnight)=>typeof overnight))=>{overnight=typeof next==="function"?(next as (previous:typeof overnight)=>typeof overnight)(overnight):next;};
let error=$state<string | null>(untrack(()=>(null)));
const setError=(next:typeof error|((previous:typeof error)=>typeof error))=>{error=typeof next==="function"?(next as (previous:typeof error)=>typeof error)(error):next;};
let isLoading=$state(untrack(()=>(false)));
const setIsLoading=(next:typeof isLoading|((previous:typeof isLoading)=>typeof isLoading))=>{isLoading=typeof next==="function"?(next as (previous:typeof isLoading)=>typeof isLoading)(isLoading):next;};
$effect(()=>{open;shift;return untrack(() => {
    if (open) {
      if (shift) {
        setName(shift.name ?? "");
        setCode(shift.code ?? "");
        setStartTime(normalizeTime(shift.startTime || shift.start_time) || "09:00");
        setEndTime(normalizeTime(shift.endTime || shift.end_time) || "18:00");
        setBreakMinutes(shift.breakMinutes ?? shift.break_minutes ?? 60);
        setGraceMinutes(shift.graceMinutes ?? shift.grace_minutes ?? 15);
        setOvernight(Boolean(shift.overnight));
      } else {
        setName("");
        setCode("");
        setStartTime("09:00");
        setEndTime("18:00");
        setBreakMinutes(60);
        setGraceMinutes(15);
        setOvernight(false);
      }
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
    setError(null);

    const cleanName = name.trim();
    const cleanCode = code.trim().toUpperCase();

    if (!cleanName || cleanName.length < 2) {
      setError("Shift name must be at least 2 characters.");
      return;
    }
    if (!cleanCode || cleanCode.length < 2) {
      setError("Shift code must be at least 2 characters.");
      return;
    }
    if (!startTime || !endTime) {
      setError("Both start time and end time are required.");
      return;
    }
    if (startTime === endTime) {
      setError("Start time and end time cannot be identical.");
      return;
    }
    if (!overnight && endTime < startTime) {
      setError(
        "End time is earlier than start time. For night shifts crossing midnight, please enable the Overnight Shift option."
      );
      return;
    }

    // Resolve grace period: default to 15 on create if omitted/empty; preserve explicit value on edit
    let resolvedGrace: number;
    const rawGrace = typeof graceMinutes === "string" ? graceMinutes.trim() : graceMinutes;
    if (rawGrace === "" || rawGrace === undefined || rawGrace === null) {
      resolvedGrace = isEditing ? (shift?.graceMinutes ?? shift?.grace_minutes ?? 15) : 15;
    } else {
      resolvedGrace = Number(rawGrace);
    }

    if (isNaN(resolvedGrace) || !Number.isInteger(resolvedGrace) || resolvedGrace < 0) {
      setError("Grace period must be a non-negative integer.");
      return;
    }

    let resolvedBreak: number;
    const rawBreak = typeof breakMinutes === "string" ? breakMinutes.trim() : breakMinutes;
    if (rawBreak === "" || rawBreak === undefined || rawBreak === null) {
      resolvedBreak = isEditing ? (shift?.breakMinutes ?? shift?.break_minutes ?? 60) : 60;
    } else {
      resolvedBreak = Number(rawBreak);
    }

    if (isNaN(resolvedBreak) || !Number.isInteger(resolvedBreak) || resolvedBreak < 0) {
      setError("Break duration must be a non-negative integer.");
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        name: cleanName,
        code: cleanCode,
        startTime,
        endTime,
        start_time: startTime,
        end_time: endTime,
        breakMinutes: resolvedBreak,
        break_minutes: resolvedBreak,
        graceMinutes: resolvedGrace,
        grace_minutes: resolvedGrace,
        overnight,
      };

      const url = isEditing
        ? `/api/app/master-data/shifts/${shift!.id}`
        : "/api/app/master-data/shifts";
      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.success) {
        throw new Error(
          body.error?.message ||
            `Failed to ${isEditing ? "update" : "create"} work shift.`
        );
      }

      onSuccess();
      onOpenChange(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save work shift.");
    } finally {
      setIsLoading(false);
    }
  };
</script>
<DialogFrame open={open} onOpenChange={(nextOpen) => {
        if (isLoading) return;
        if (!nextOpen) handleClose();
      }}>
      
        
        <div class="fixed left-1/2 top-1/2 z-[100] w-[92vw] max-w-[540px] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          
          <div class="flex items-start justify-between border-b border-slate-100 pb-3.5">
            <div class="flex items-center gap-2.5">
              <div class="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <SvgIcon name="Clock" class="size-5" />
              </div>
              <div>
                <h2 class="text-base font-bold text-slate-900">
                  {#if isEditing}{"Edit Work Shift"}{:else}{"Create Work Shift"}{/if}
                </h2>
                <p class="text-xs text-slate-500 mt-0.5">
                  Configure shift schedule timings, break allotments, and overnight rules.
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
            <div class="grid gap-3 sm:grid-cols-2">
              <div class="space-y-1.5">
                <label class="text-xs font-semibold text-slate-800" for="shift-name">
                  Shift Name <span class="text-rose-500">*</span>
                </label>
                <Input id="shift-name" value={name} onchange={(e) => setName(e.currentTarget.value)} placeholder="e.g. Regular Day Shift" required disabled={isLoading} />
              </div>

              <div class="space-y-1.5">
                <label class="text-xs font-semibold text-slate-800" for="shift-code">
                  Shift Code <span class="text-rose-500">*</span>
                </label>
                <Input id="shift-code" value={code} onchange={(e) => setCode(e.currentTarget.value.toUpperCase())} placeholder="e.g. DAY-01, NIGHT" required disabled={isLoading} />
              </div>
            </div>

            <div class="grid gap-3 sm:grid-cols-2">
              <div class="space-y-1.5">
                <label class="text-xs font-semibold text-slate-800" for="shift-start">
                  Start Time <span class="text-rose-500">*</span>
                </label>
                <Input id="shift-start" type="time" value={startTime} onchange={(e) => setStartTime(e.currentTarget.value)} required disabled={isLoading} />
              </div>

              <div class="space-y-1.5">
                <label class="text-xs font-semibold text-slate-800" for="shift-end">
                  End Time <span class="text-rose-500">*</span>
                </label>
                <Input id="shift-end" type="time" value={endTime} onchange={(e) => setEndTime(e.currentTarget.value)} required disabled={isLoading} />
              </div>
            </div>

            
            <div class="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-2">
              <label class="flex items-center gap-2.5 cursor-pointer select-none">
                <input type="checkbox" checked={overnight} onchange={(e) => setOvernight(e.currentTarget.checked)} disabled={isLoading} class="size-4 rounded border-slate-300 text-primary focus:ring-primary" />
                <div class="flex items-center gap-1.5 font-semibold text-xs text-slate-900">
                  {#if overnight}<SvgIcon name="Moon" class="size-3.5 text-indigo-600" />{:else}<SvgIcon name="Sun" class="size-3.5 text-amber-600" />{/if}
                  <span>Overnight Shift (Spans Past Midnight)</span>
                </div>
              </label>
              <p class="text-[11px] text-slate-500 pl-6 leading-relaxed">
                Enable this if this shift starts on one calendar day and ends on the following morning (e.g., 22:00 to 06:00). Attendance tracking will automatically bridge the calendar day.
              </p>
            </div>

            <div class="grid gap-3 sm:grid-cols-2">
              <div class="space-y-1.5">
                <label class="text-xs font-semibold text-slate-800" for="shift-break">
                  Break Duration (Minutes)
                </label>
                <Input id="shift-break" type="number" min="0" max="480" step="5" value={breakMinutes} onchange={(e) => setBreakMinutes(e.currentTarget.value)} disabled={isLoading} />
                <p class="text-[10px] text-slate-500">Scheduled unpaid/paid break deduction.</p>
              </div>

              <div class="space-y-1.5">
                <label class="text-xs font-semibold text-slate-800" for="shift-grace">
                  Grace Period (Minutes)
                </label>
                <Input id="shift-grace" type="number" min="0" max="120" step="1" value={graceMinutes} onchange={(e) => setGraceMinutes(e.currentTarget.value)} disabled={isLoading} />
                <p class="text-[10px] text-slate-500">Allowed late arrival window before penalty.</p>
              </div>
            </div>

            <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end pt-3 border-t border-slate-100">
              <Button type="button" variant="outline" size="sm" disabled={isLoading} onclick={handleClose} class="w-full sm:w-auto font-medium">
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" disabled={isLoading} class="w-full sm:w-auto font-semibold shadow-xs">
                {#if isLoading}
                    <SvgIcon name="Loader2" class="size-3.5 animate-spin mr-1.5" />
                    <span>Saving Shift...</span>
                  {:else}{#if isEditing}{"Update Shift"}{:else}{"Create Shift"}{/if}{/if}
              </Button>
            </div>
          </form>
        </div>
      
    </DialogFrame>
