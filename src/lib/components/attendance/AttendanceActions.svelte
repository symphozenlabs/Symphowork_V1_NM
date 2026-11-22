<script lang="ts">
import{calculateBreakSummary}from'$lib/domain/attendance/calculator';
import SvgIcon from "$lib/components/ui/Icon.svelte";
import Button from "$lib/components/ui/Button.svelte";

import {untrack} from "svelte";
import {page as routePage,navigating} from "$app/state";
import {goto,invalidateAll} from "$app/navigation";
import {notify} from "$lib/client/toast";
function formatElapsed(seconds: number): string {
  if (seconds < 0) return "00:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
  }
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
function formatTimestampInTz(date: Date | string | null | undefined, timezone: string): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";
  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: timezone || "UTC",
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    }).format(d);
  } catch {
    return d.toLocaleTimeString();
  }
}
type RecordRow = {
  id: string;
  attendanceDate: string;
  status: string;
  netWorkMinutes: number;
  lateMinutes: number;
  earlyDepartureMinutes: number;
  actualFirstIn?: string | null;
  actualLastOut?: string | null;
  scheduledDurationMinutes?: number;
  potentialOvertimeMinutes?: number;
};
type Punch = {
  id: string;
  punchType: string;
  punchedAt: string;
};
type Shift = {
  id: string;
  name: string;
  code: string;
  startTime: string;
  endTime: string;
  overnight: boolean;
  breakMinutes: number;
  graceMinutes: number;
};
type EmployeeOption = {
  id: string;
  displayName: string;
  employeeId: string;
};
let {
  canViewOthers = false,
  initialEmployeeId = "",
  initialDate = "",
}:{
  canViewOthers?: boolean;
  initialEmployeeId?: string;
  initialDate?: string;
}=$props();
const router={push:goto,replace:(href:string,options?:{scroll?:boolean})=>goto(href,{replaceState:true,noScroll:options?.scroll===false}),refresh:invalidateAll,back:()=>history.back()};
const pathname=$derived(routePage.url.pathname);
const searchParams=$derived(routePage.url.searchParams);
const queryEmpId=$derived(canViewOthers ? (searchParams.get("employeeId") || initialEmployeeId || "") : "");
const queryDate=$derived(searchParams.get("date") || initialDate || "");
let records=$state<RecordRow[]>(untrack(()=>([])));
const setRecords=(next:typeof records|((previous:typeof records)=>typeof records))=>{records=typeof next==="function"?(next as (previous:typeof records)=>typeof records)(records):next;};
let punches=$state<Punch[]>(untrack(()=>([])));
const setPunches=(next:typeof punches|((previous:typeof punches)=>typeof punches))=>{punches=typeof next==="function"?(next as (previous:typeof punches)=>typeof punches)(punches):next;};
let hasShift=$state<boolean | null>(untrack(()=>(null)));
const setHasShift=(next:typeof hasShift|((previous:typeof hasShift)=>typeof hasShift))=>{hasShift=typeof next==="function"?(next as (previous:typeof hasShift)=>typeof hasShift)(hasShift):next;};
let assignedShift=$state<Shift | null>(untrack(()=>(null)));
const setAssignedShift=(next:typeof assignedShift|((previous:typeof assignedShift)=>typeof assignedShift))=>{assignedShift=typeof next==="function"?(next as (previous:typeof assignedShift)=>typeof assignedShift)(assignedShift):next;};
let viewedEmployee=$state<{ id: string; displayName: string; employeeId: string; isSelf?: boolean } | null>(untrack(()=>(null)));
const setViewedEmployee=(next:typeof viewedEmployee|((previous:typeof viewedEmployee)=>typeof viewedEmployee))=>{viewedEmployee=typeof next==="function"?(next as (previous:typeof viewedEmployee)=>typeof viewedEmployee)(viewedEmployee):next;};
let timezone=$state<string>(untrack(()=>("UTC")));
const setTimezone=(next:typeof timezone|((previous:typeof timezone)=>typeof timezone))=>{timezone=typeof next==="function"?(next as (previous:typeof timezone)=>typeof timezone)(timezone):next;};
let now=$state<Date>(untrack(()=>((() => new Date())())));
const setNow=(next:typeof now|((previous:typeof now)=>typeof now))=>{now=typeof next==="function"?(next as (previous:typeof now)=>typeof now)(now):next;};
let employees=$state<EmployeeOption[]>(untrack(()=>([])));
const setEmployees=(next:typeof employees|((previous:typeof employees)=>typeof employees))=>{employees=typeof next==="function"?(next as (previous:typeof employees)=>typeof employees)(employees):next;};
let selectedEmployeeId=$state<string>(untrack(()=>(queryEmpId)));
const setSelectedEmployeeId=(next:typeof selectedEmployeeId|((previous:typeof selectedEmployeeId)=>typeof selectedEmployeeId))=>{selectedEmployeeId=typeof next==="function"?(next as (previous:typeof selectedEmployeeId)=>typeof selectedEmployeeId)(selectedEmployeeId):next;};
let message=$state(untrack(()=>("")));
const setMessage=(next:typeof message|((previous:typeof message)=>typeof message))=>{message=typeof next==="function"?(next as (previous:typeof message)=>typeof message)(message):next;};
let error=$state(untrack(()=>("")));
const setError=(next:typeof error|((previous:typeof error)=>typeof error))=>{error=typeof next==="function"?(next as (previous:typeof error)=>typeof error)(error):next;};
let loading=$state(untrack(()=>(true)));
const setLoading=(next:typeof loading|((previous:typeof loading)=>typeof loading))=>{loading=typeof next==="function"?(next as (previous:typeof loading)=>typeof loading)(loading):next;};
let busy=$state(untrack(()=>(false)));
const setBusy=(next:typeof busy|((previous:typeof busy)=>typeof busy))=>{busy=typeof next==="function"?(next as (previous:typeof busy)=>typeof busy)(busy):next;};
let date=$state(untrack(()=>(queryDate)));
const setDate=(next:typeof date|((previous:typeof date)=>typeof date))=>{date=typeof next==="function"?(next as (previous:typeof date)=>typeof date)(date):next;};
const showToast=(toast:{type:"success"|"error"|"info";title?:string;message?:string})=>notify(toast.message??toast.title??"",toast.type);
$effect(()=>{searchParams;initialEmployeeId;canViewOthers;selectedEmployeeId;return untrack(() => {
    if (canViewOthers) {
      const urlEmp = searchParams.get("employeeId") || initialEmployeeId || "";
      if (urlEmp !== selectedEmployeeId) {
        setSelectedEmployeeId(urlEmp);
      }
    }
  });});
$effect(()=>{searchParams;initialDate;date;return untrack(() => {
    const urlDate = searchParams.get("date") || initialDate || "";
    if (urlDate !== date) {
      setDate(urlDate);
    }
  });});
const updateUrl=$derived.by(()=>{searchParams;pathname;router;return (empId: string, dt: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (empId) {
        params.set("employeeId", empId);
      } else {
        params.delete("employeeId");
      }
      if (dt) {
        params.set("date", dt);
      } else {
        params.delete("date");
      }
      const nextQuery = params.toString() ? `?${params.toString()}` : "";
      router.replace(`${pathname}${nextQuery}`, { scroll: false });
    };});
const handleEmployeeChange = (newEmpId: string) => {
    setSelectedEmployeeId(newEmpId);
    updateUrl(newEmpId, date);
  };
const handleDateChange = (newDate: string) => {
    setDate(newDate);
    updateUrl(selectedEmployeeId, newDate);
  };
$effect(()=>{canViewOthers;return untrack(() => {
    if (!canViewOthers) return;
    let isMounted = true;
    async function fetchEmployees() {
      try {
        const res = await fetch("/api/app/employees?pageSize=100");
        const data = await res.json();
        if (isMounted && data.success && Array.isArray(data.rows)) {
          setEmployees(
            data.rows.map((e: { id: string; displayName: string; employeeId: string }) => ({
              id: e.id,
              displayName: e.displayName,
              employeeId: e.employeeId,
            }))
          );
        }
      } catch {
        // Fall back gracefully
      }
    }
    void fetchEmployees();
    return () => {
      isMounted = false;
    };
  });});
const load=$derived.by(()=>{date;selectedEmployeeId;return async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (date) params.set("date", date);
    if (selectedEmployeeId) params.set("employeeId", selectedEmployeeId);

    const queryString = params.toString() ? `?${params.toString()}` : "";
    const response = await fetch(`/api/app/attendance${queryString}`);
    const body = await response.json().catch(() => ({}));

    if (!response.ok) {
      setError(body.error?.message ?? "Unable to load attendance.");
    } else {
      setRecords(body.records ?? []);
      setPunches(body.punches ?? []);
      if (typeof body.hasShift === "boolean") {
        setHasShift(body.hasShift);
      }
      setAssignedShift(body.shift ?? null);
      if (body.employee) {
        setViewedEmployee(body.employee);
      }
      if (body.timezone) {
        setTimezone(body.timezone);
      }
      setError("");
    }
    setLoading(false);
  };});
$effect(()=>{load;return untrack(() => {
    void load();
  });});
async function punch(type: "clock_in" | "clock_out" | "break_start" | "break_end") {
    setBusy(true);
    setMessage("");
    const response = await fetch("/api/app/attendance/punch", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ type }),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      const errMsg = body.error?.message ?? "Unable to save punch.";
      setError(errMsg);
      showToast({ type: "error", title: "Punch failed", message: errMsg });
    } else {
      const typeLabel = type.replaceAll("_", " ");
      const succMsg = `Punch recorded: ${typeLabel}.`;
      setMessage(succMsg);
      showToast({ type: "success", title: "Attendance recorded", message: succMsg });
      await load();
    }
    setBusy(false);
  }
const current=$derived(records[0]);
const isViewingOther=$derived(Boolean(selectedEmployeeId && viewedEmployee && !viewedEmployee.isSelf));
let processingAbsences=$state(untrack(()=>(false)));
const setProcessingAbsences=(next:typeof processingAbsences|((previous:typeof processingAbsences)=>typeof processingAbsences))=>{processingAbsences=typeof next==="function"?(next as (previous:typeof processingAbsences)=>typeof processingAbsences)(processingAbsences):next;};
const handleProcessAbsences = async () => {
    setProcessingAbsences(true);
    try {
      const res = await fetch("/api/app/attendance/process-absent", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ date: date || undefined }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message ?? "Failed to process absences.");
      }
      showToast({
        type: "success",
        title: "Absence processing complete",
        message:
          data.status === "skipped_weekend" || data.status === "skipped_holiday"
            ? data.message
            : `Absence processing complete: ${data.absentCount} marked absent, ${data.missingPunchCount ?? 0} missing punch.`,
      });
      await load();
    } catch (err) {
      showToast({
        type: "error",
        title: "Absence processing failed",
        message: err instanceof Error ? err.message : "Error processing absences",
      });
    } finally {
      setProcessingAbsences(false);
    }
  };
const breakSummary=$derived(calculateBreakSummary({
    punches,
    allowedBreakMinutes: assignedShift?.breakMinutes ?? 0,
    now,
  }));
const hasActiveBreak=$derived(breakSummary.status === "on_break");
$effect(()=>{hasActiveBreak;return untrack(() => {
    if (!hasActiveBreak) return;
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(interval);
  });});
const isClockedIn=$derived(Boolean(current?.actualFirstIn));
const isClockedOut=$derived(Boolean(current?.actualLastOut));
const canClockIn=$derived(!busy && hasShift !== false && !isClockedIn);
const canClockOut=$derived(!busy && isClockedIn && !isClockedOut && !hasActiveBreak);
const canStartBreak=$derived(!busy && isClockedIn && !isClockedOut && !hasActiveBreak);
const canEndBreak=$derived(!busy && isClockedIn && !isClockedOut && hasActiveBreak);
</script>
<div class="space-y-5">
      
      {#if canViewOthers}<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-indigo-100 bg-indigo-50/50 p-3.5">
          <div class="flex items-center gap-2">
            <SvgIcon name="Users" class="size-4 text-indigo-700" />
            <div>
              <span class="text-xs font-bold text-indigo-950">HR Attendance Audit View</span>
              <p class="text-[11px] text-indigo-700">Inspect attendance logs and time punches across organization personnel.</p>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <Button variant="secondary" size="sm" onclick={handleProcessAbsences} disabled={processingAbsences || busy} class="h-9 gap-1.5 text-xs font-semibold border-indigo-200 bg-white hover:bg-indigo-50 text-indigo-900">
              <SvgIcon name="ShieldCheck" class="size-3.5 text-indigo-600" />
              <span>{#if processingAbsences}{"Processing…"}{:else}{"Process Shift Absences"}{/if}</span>
            </Button>
            <select aria-label="Filter employee attendance" value={selectedEmployeeId} onchange={(e) => handleEmployeeChange(e.currentTarget.value)} class="h-9 rounded-lg border border-indigo-200 bg-white px-3 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">My Personal Attendance</option>
              {#if viewedEmployee && !viewedEmployee.isSelf && !employees.some((e) => e.id === viewedEmployee?.id)}<option value={viewedEmployee.id}>
                  {viewedEmployee.displayName} ({viewedEmployee.employeeId})
                </option>{/if}
              {#each employees as emp}<option value={emp.id}>
                  {emp.displayName} ({emp.employeeId})
                </option>{/each}
            </select>
            {#if Boolean(selectedEmployeeId)}<Button variant="ghost" size="sm" onclick={() => handleEmployeeChange("")} class="h-9 text-xs text-indigo-700 hover:bg-indigo-100">
                Reset
              </Button>{/if}
          </div>
        </div>{/if}

      
      {#if isViewingOther && viewedEmployee}<div class="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
          <div class="flex items-center gap-2">
            <SvgIcon name="User" class="size-4 text-primary" />
            <span>
              Viewing attendance for: <strong class="text-slate-900">{viewedEmployee.displayName}</strong> ({viewedEmployee.employeeId})
            </span>
          </div>
          <span class="text-[11px] font-semibold text-muted bg-white px-2 py-0.5 rounded border border-slate-200">
            Audit Mode (Punches Disabled)
          </span>
        </div>{/if}

      
      {#if assignedShift}<div class="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5 text-xs text-emerald-900">
          <div class="flex items-center gap-2">
            <SvgIcon name="Clock" class="size-4 text-emerald-700" />
            <span>
              Assigned Shift: <strong class="font-bold text-emerald-950">{assignedShift.name}</strong> ({assignedShift.code})
            </span>
            <span class="font-mono font-semibold bg-white/80 px-2 py-0.5 rounded border border-emerald-300/60 text-emerald-800">
              {assignedShift.startTime.slice(0, 5)} – {assignedShift.endTime.slice(0, 5)}
            </span>
            {#if assignedShift.overnight}<span class="inline-flex items-center gap-1 rounded bg-indigo-100 text-indigo-800 px-1.5 py-0.5 text-[10px] font-bold">
                <SvgIcon name="Moon" class="size-3" />
                Overnight
              </span>{/if}
          </div>
          <span class="text-[11px] text-emerald-800">
            Break: {assignedShift.breakMinutes}m · Grace: {assignedShift.graceMinutes}m
          </span>
        </div>{:else}{#if hasShift === false}<div role="alert" class="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <p class="font-semibold text-amber-900">No Work Shift Assigned</p>
          <p class="mt-0.5 text-xs text-amber-700 leading-relaxed">
            An organization administrator must configure and assign a work shift in Settings &gt; Master Data before attendance can be recorded.
          </p>
        </div>{:else}{/if}{/if}

      {#if error}<p role="alert" class="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>{/if}

      
      <div class="rounded-xl border border-slate-200 p-4 bg-surface shadow-xs">
        <p class="text-xs font-semibold text-muted uppercase tracking-wider">Current Attendance Status</p>
        <p class="mt-1 text-2xl font-bold text-primary capitalize">
          {#if loading}{"Loading…"}{:else}{#if current?.status}{current.status.replaceAll("_", " ")}{:else}{"No attendance today"}{/if}{/if}
        </p>
        <p class="mt-1 text-xs text-muted">
          {#if current?.actualFirstIn}{`First In: ${formatTimestampInTz(current.actualFirstIn, timezone)}`}{:else}{"Not clocked in"}{/if}
          {#if current?.actualLastOut}{` · Last Out: ${formatTimestampInTz(current.actualLastOut, timezone)}`}{:else}{""}{/if}
          {#if hasActiveBreak}{" · Currently on break"}{:else}{""}{/if}
          {#if Boolean(current?.potentialOvertimeMinutes && current.potentialOvertimeMinutes > 0)}<span class="font-semibold text-amber-700">
              {` · Potential Overtime / Pending Approval: ${current!.potentialOvertimeMinutes}m`}
            </span>{/if}
        </p>
      </div>

      
      <div class="rounded-xl border border-slate-200 p-4 bg-surface shadow-xs space-y-3.5">
        <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div class="flex items-center gap-2">
            <SvgIcon name="Coffee" class="size-4 text-primary" />
            <h3 class="text-xs font-bold text-foreground uppercase tracking-wider">Break Summary</h3>
          </div>
          <div>
            {#if breakSummary.status === "on_break"}<span class="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-900 border border-amber-300">
                <span class="size-1.5 rounded-full bg-amber-600 animate-pulse"></span>
                On Break
              </span>{:else}{#if breakSummary.status === "completed"}<span class="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 border border-emerald-200">
                <SvgIcon name="CheckCircle2" class="size-3 text-emerald-600" />
                Completed
              </span>{:else}<span class="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 border border-slate-200">
                Not Started
              </span>{/if}{/if}
          </div>
        </div>

        
        {#if breakSummary.status === "on_break"}<div class="rounded-lg border border-amber-200 bg-amber-50/80 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-amber-950">
            <div class="flex items-center gap-2">
              <SvgIcon name="Timer" class="size-4 text-amber-700 shrink-0" />
              <div>
                <span class="font-semibold text-amber-950">Active Break in Progress</span>
                <p class="text-[11px] text-amber-800">
                  Started at {formatTimestampInTz(breakSummary.activeBreakStart, timezone)} ({timezone})
                </p>
              </div>
            </div>
            <div class="flex items-center gap-2 font-mono">
              <span class="text-[11px] font-sans text-amber-800">Elapsed:</span>
              <span class="bg-white px-2.5 py-0.5 rounded border border-amber-300 font-bold text-amber-900 text-sm shadow-2xs">
                {formatElapsed(breakSummary.activeElapsedSeconds)}
              </span>
            </div>
          </div>{/if}

        
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          
          <div class="rounded-lg bg-slate-50/80 p-3 border border-slate-100">
            <p class="text-[11px] font-semibold text-muted uppercase tracking-wide">Allowed Break</p>
            <p class="mt-1 text-xl font-bold text-foreground">
              {breakSummary.allowedMinutes} <span class="text-xs font-normal text-muted">min</span>
            </p>
            <p class="text-[10px] text-muted mt-0.5">
              {#if assignedShift}{`${assignedShift.name} shift allowance`}{:else}{"Shift allowance"}{/if}
            </p>
          </div>

          
          <div class="rounded-lg bg-slate-50/80 p-3 border border-slate-100">
            <p class="text-[11px] font-semibold text-muted uppercase tracking-wide">Break Used</p>
            <p class="mt-1 text-xl font-bold text-primary">
              {breakSummary.totalUsedMinutes} <span class="text-xs font-normal text-muted">min</span>
            </p>
            <p class="text-[10px] text-muted mt-0.5">
              {#if breakSummary.status === "on_break"}{`${breakSummary.completedMinutes}m completed + ${breakSummary.activeMinutes}m active`}{:else}{`${breakSummary.intervals.length} break${breakSummary.intervals.length === 1 ? "" : "s"} taken`}{/if}
            </p>
          </div>

          
          <div class={`rounded-lg p-3 border ${breakSummary.isExceeded ? "bg-red-50/70 border-red-200" : "bg-slate-50/80 border-slate-100"}`}>
            <p class={`text-[11px] font-semibold uppercase tracking-wide ${breakSummary.isExceeded ? "text-red-700" : "text-muted"}`}>
              Remaining Break
            </p>
            <p class={`mt-1 text-xl font-bold ${breakSummary.isExceeded ? "text-red-700" : "text-foreground"}`}>
              {breakSummary.remainingMinutes} <span class="text-xs font-normal text-muted">min</span>
            </p>
            <p class={`text-[10px] mt-0.5 ${breakSummary.isExceeded ? "text-red-600 font-medium" : "text-muted"}`}>
              {#if breakSummary.isExceeded}{`Allowance exceeded by ${breakSummary.exceededMinutes} min`}{:else}{`${breakSummary.remainingMinutes} min available`}{/if}
            </p>
          </div>
        </div>

        
        {#if breakSummary.intervals.length > 0}<div class="pt-2 border-t border-slate-100 space-y-1.5">
            <div class="flex items-center justify-between text-[11px] text-muted font-medium">
              <span>Today&apos;s Break Intervals ({breakSummary.intervals.length})</span>
              <span class="text-[10px]">Timezone: {timezone}</span>
            </div>
            <div class="space-y-1">
              {#each breakSummary.intervals as iv, idx}<div class="flex items-center justify-between text-[11px] rounded bg-white px-2.5 py-1.5 border border-slate-100">
                  <span class="font-medium text-slate-700">
                    Break #{idx + 1}: {formatTimestampInTz(iv.start, timezone)}
                    {#if iv.end}{` – ${formatTimestampInTz(iv.end, timezone)}`}{:else}{" – In progress"}{/if}
                  </span>
                  <span class={`font-mono font-semibold ${iv.end ? "text-slate-600" : "text-amber-700"}`}>
                    {#if iv.end}{`${iv.durationMinutes} min`}{:else}{`${formatElapsed(breakSummary.activeElapsedSeconds)} elapsed`}{/if}
                  </span>
                </div>{/each}
            </div>
          </div>{/if}
      </div>

      
      {#if !isViewingOther}<div class="grid gap-2 sm:grid-cols-2">
          <Button disabled={!canClockIn} onclick={() => void punch("clock_in")} class="font-bold shadow-xs">
            Clock in
          </Button>
          <Button variant="secondary" disabled={!canClockOut} onclick={() => void punch("clock_out")} class="font-bold">
            Clock out
          </Button>
          <Button variant="secondary" disabled={!canStartBreak} onclick={() => void punch("break_start")}>
            Start break
          </Button>
          <Button variant="secondary" disabled={!canEndBreak} onclick={() => void punch("break_end")}>
            End break
          </Button>
        </div>{:else}<p class="text-xs text-muted text-center italic py-1">
          Punch actions are self-service only and disabled while reviewing other team members.
        </p>{/if}

      {#if message}<p aria-live="polite" class="text-sm text-green-700 font-medium">{message}</p>{/if}

      
      <div class="flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <div class="flex items-center gap-2">
          <SvgIcon name="ShieldCheck" class="size-4 text-primary" />
          <h2 class="font-bold text-foreground text-sm">Attendance History & Punches</h2>
        </div>
        <input aria-label="Filter attendance date" type="date" class="h-9 rounded-lg border border-slate-200 bg-surface px-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary" value={date} onchange={(e) => handleDateChange(e.currentTarget.value)} />
      </div>

      {#if loading}<p class="text-xs text-muted py-4">Loading attendance records…</p>{:else}{#if records.length === 0}<p class="rounded-xl border border-dashed border-slate-200 p-5 text-center text-xs text-muted">
          No attendance records found for this date.
        </p>{:else}<div class="space-y-2.5">
          {#each records as record}<div class="rounded-xl border border-slate-200 p-3.5 text-xs bg-surface shadow-2xs space-y-1.5">
              <div class="flex justify-between items-center">
                <span class="font-bold text-foreground">{record.attendanceDate}</span>
                <span class="rounded-md bg-slate-100 px-2 py-0.5 font-semibold text-slate-700 capitalize text-[11px]">
                  {record.status.replaceAll("_", " ")}
                </span>
              </div>
              <p class="text-muted">
                {record.netWorkMinutes} net work minutes · {record.lateMinutes}m late · {record.earlyDepartureMinutes}m early departure
                {#if Boolean(record.potentialOvertimeMinutes && record.potentialOvertimeMinutes > 0)}<span class="font-semibold text-amber-700">
                    {` · Potential Overtime / Pending Approval: ${record.potentialOvertimeMinutes}m`}
                  </span>{/if}
              </p>
              {#if record.id === current?.id && punches.length > 0}<div class="pt-2 border-t border-slate-100 flex flex-wrap gap-2 text-[11px]">
                  <span class="font-semibold text-slate-700">Punches:</span>
                  {#each punches as p}<span class="rounded bg-slate-50 border border-slate-200 px-1.5 py-0.5 text-slate-700">
                      {p.punchType.replaceAll("_", " ")} {formatTimestampInTz(p.punchedAt, timezone)}
                    </span>{/each}
                </div>{/if}
            </div>{/each}
        </div>{/if}{/if}
    </div>
