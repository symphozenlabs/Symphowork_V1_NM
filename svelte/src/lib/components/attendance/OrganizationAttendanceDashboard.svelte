<script lang="ts">
import SvgIcon from "$lib/components/ui/Icon.svelte";
import Button from "$lib/components/ui/Button.svelte";
import type { OrganizationAttendanceRow, OrganizationAttendanceSummary } from "$lib/domain/attendance/dashboard-types";

import {untrack} from "svelte";
import {page as routePage,navigating} from "$app/state";
import {goto,invalidateAll} from "$app/navigation";
import {notify} from "$lib/client/toast";
let {
  userRoleKey,
}:{
  userRoleKey?: string;
}=$props();
const showToast=(toast:{type:"success"|"error"|"info";title?:string;message?:string})=>notify(toast.message??toast.title??"",toast.type);
let loading=$state(untrack(()=>(true)));
const setLoading=(next:typeof loading|((previous:typeof loading)=>typeof loading))=>{loading=typeof next==="function"?(next as (previous:typeof loading)=>typeof loading)(loading):next;};
let error=$state<string | null>(untrack(()=>(null)));
const setError=(next:typeof error|((previous:typeof error)=>typeof error))=>{error=typeof next==="function"?(next as (previous:typeof error)=>typeof error)(error):next;};
let date=$state<string>(untrack(()=>("")));
const setDate=(next:typeof date|((previous:typeof date)=>typeof date))=>{date=typeof next==="function"?(next as (previous:typeof date)=>typeof date)(date):next;};
let search=$state<string>(untrack(()=>("")));
const setSearch=(next:typeof search|((previous:typeof search)=>typeof search))=>{search=typeof next==="function"?(next as (previous:typeof search)=>typeof search)(search):next;};
let departmentId=$state<string>(untrack(()=>("all")));
const setDepartmentId=(next:typeof departmentId|((previous:typeof departmentId)=>typeof departmentId))=>{departmentId=typeof next==="function"?(next as (previous:typeof departmentId)=>typeof departmentId)(departmentId):next;};
let shiftId=$state<string>(untrack(()=>("all")));
const setShiftId=(next:typeof shiftId|((previous:typeof shiftId)=>typeof shiftId))=>{shiftId=typeof next==="function"?(next as (previous:typeof shiftId)=>typeof shiftId)(shiftId):next;};
let statusFilter=$state<string>(untrack(()=>("all")));
const setStatusFilter=(next:typeof statusFilter|((previous:typeof statusFilter)=>typeof statusFilter))=>{statusFilter=typeof next==="function"?(next as (previous:typeof statusFilter)=>typeof statusFilter)(statusFilter):next;};
let page=$state<number>(untrack(()=>(1)));
const setPage=(next:typeof page|((previous:typeof page)=>typeof page))=>{page=typeof next==="function"?(next as (previous:typeof page)=>typeof page)(page):next;};
const pageSize=$derived(20);
let summary=$state<OrganizationAttendanceSummary | null>(untrack(()=>(null)));
const setSummary=(next:typeof summary|((previous:typeof summary)=>typeof summary))=>{summary=typeof next==="function"?(next as (previous:typeof summary)=>typeof summary)(summary):next;};
let employees=$state<OrganizationAttendanceRow[]>(untrack(()=>([])));
const setEmployees=(next:typeof employees|((previous:typeof employees)=>typeof employees))=>{employees=typeof next==="function"?(next as (previous:typeof employees)=>typeof employees)(employees):next;};
let shifts=$state<Array<{
      id: string;
      name: string;
      code: string;
      startTime: string;
      endTime: string;
      overnight: boolean;
      breakMinutes: number;
      graceMinutes: number;
    }>>(untrack(()=>([])));
const setShifts=(next:typeof shifts|((previous:typeof shifts)=>typeof shifts))=>{shifts=typeof next==="function"?(next as (previous:typeof shifts)=>typeof shifts)(shifts):next;};
let departments=$state<Array<{ id: string; name: string; code: string }>>(untrack(()=>([])));
const setDepartments=(next:typeof departments|((previous:typeof departments)=>typeof departments))=>{departments=typeof next==="function"?(next as (previous:typeof departments)=>typeof departments)(departments):next;};
let pagination=$state<{
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  }>(untrack(()=>({ page: 1, pageSize: 20, total: 0, totalPages: 1 })));
const setPagination=(next:typeof pagination|((previous:typeof pagination)=>typeof pagination))=>{pagination=typeof next==="function"?(next as (previous:typeof pagination)=>typeof pagination)(pagination):next;};
let timezone=$state<string>(untrack(()=>("UTC")));
const setTimezone=(next:typeof timezone|((previous:typeof timezone)=>typeof timezone))=>{timezone=typeof next==="function"?(next as (previous:typeof timezone)=>typeof timezone)(timezone):next;};
let userPermissions=$state<{
    canManageAttendance: boolean;
    canApproveRegularization: boolean;
    role: string;
  }>(untrack(()=>({
    canManageAttendance: false,
    canApproveRegularization: false,
    role: userRoleKey || "",
  })));
const setUserPermissions=(next:typeof userPermissions|((previous:typeof userPermissions)=>typeof userPermissions))=>{userPermissions=typeof next==="function"?(next as (previous:typeof userPermissions)=>typeof userPermissions)(userPermissions):next;};
let selectedRow=$state<OrganizationAttendanceRow | null>(untrack(()=>(null)));
const setSelectedRow=(next:typeof selectedRow|((previous:typeof selectedRow)=>typeof selectedRow))=>{selectedRow=typeof next==="function"?(next as (previous:typeof selectedRow)=>typeof selectedRow)(selectedRow):next;};
let showConfirmAbsences=$state(untrack(()=>(false)));
const setShowConfirmAbsences=(next:typeof showConfirmAbsences|((previous:typeof showConfirmAbsences)=>typeof showConfirmAbsences))=>{showConfirmAbsences=typeof next==="function"?(next as (previous:typeof showConfirmAbsences)=>typeof showConfirmAbsences)(showConfirmAbsences):next;};
let processingAbsences=$state(untrack(()=>(false)));
const setProcessingAbsences=(next:typeof processingAbsences|((previous:typeof processingAbsences)=>typeof processingAbsences))=>{processingAbsences=typeof next==="function"?(next as (previous:typeof processingAbsences)=>typeof processingAbsences)(processingAbsences):next;};
let exportingCsv=$state(untrack(()=>(false)));
const setExportingCsv=(next:typeof exportingCsv|((previous:typeof exportingCsv)=>typeof exportingCsv))=>{exportingCsv=typeof next==="function"?(next as (previous:typeof exportingCsv)=>typeof exportingCsv)(exportingCsv):next;};
const fetchData=$derived.by(()=>{date;search;departmentId;shiftId;statusFilter;page;showToast;return async (overrideDate?: string) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        const targetDate = overrideDate !== undefined ? overrideDate : date;
        if (targetDate) params.set("date", targetDate);
        if (search.trim()) params.set("search", search.trim());
        if (departmentId && departmentId !== "all") params.set("departmentId", departmentId);
        if (shiftId && shiftId !== "all") params.set("shiftId", shiftId);
        if (statusFilter && statusFilter !== "all") params.set("status", statusFilter);
        params.set("page", String(page));
        params.set("pageSize", String(pageSize));

        const res = await fetch(`/api/app/attendance/organization?${params.toString()}`);
        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.error?.message || "Failed to load organization attendance records.");
        }

        setSummary(data.summary);
        setEmployees(data.employees || []);
        setShifts(data.shifts || []);
        setDepartments(data.departments || []);
        setPagination(data.pagination);
        setTimezone(data.timezone || "UTC");
        if (data.date && !date) {
          setDate(data.date);
        }
        if (data.userPermissions) {
          setUserPermissions(data.userPermissions);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Error loading dashboard";
        setError(msg);
        showToast({ type: "error", title: "Attendance Dashboard", message: msg });
      } finally {
        setLoading(false);
      }
    };});
$effect(()=>{fetchData;return untrack(() => {
    void fetchData();
  });});
const handleProcessAbsences = async () => {
    if (!userPermissions.canManageAttendance) {
      showToast({
        type: "error",
        title: "Access Denied",
        message: "Attendance administration privileges are required to process shift absences.",
      });
      return;
    }

    setProcessingAbsences(true);
    try {
      const res = await fetch("/api/app/attendance/process-absent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: date || undefined }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || "Failed to process shift absences.");
      }

      showToast({
        type: "success",
        title: "Absence Processing Completed",
        message:
          data.status === "skipped_weekend" || data.status === "skipped_holiday"
            ? data.message
            : `Evaluated ${data.totalChecked} employees: ${data.absentCount} marked absent, ${data.missingPunchCount ?? 0} missing punches updated.`,
      });

      setShowConfirmAbsences(false);
      await fetchData();
    } catch (err) {
      showToast({
        type: "error",
        title: "Processing Failed",
        message: err instanceof Error ? err.message : "Error executing absence processing.",
      });
    } finally {
      setProcessingAbsences(false);
    }
  };
const handleExportCsv = async () => {
    setExportingCsv(true);
    try {
      const params = new URLSearchParams();
      if (date) params.set("date", date);
      if (search.trim()) params.set("search", search.trim());
      if (departmentId && departmentId !== "all") params.set("departmentId", departmentId);
      if (shiftId && shiftId !== "all") params.set("shiftId", shiftId);
      if (statusFilter && statusFilter !== "all") params.set("status", statusFilter);
      params.set("format", "csv");

      const res = await fetch(`/api/app/attendance/organization?${params.toString()}`);
      if (!res.ok) {
        throw new Error("CSV export request was rejected by server.");
      }

      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.setAttribute("download", `attendance-organization-${date || "today"}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);

      showToast({
        type: "success",
        title: "Export Ready",
        message: "Organization attendance data exported to CSV successfully.",
      });
    } catch (err) {
      showToast({
        type: "error",
        title: "Export Failed",
        message: err instanceof Error ? err.message : "Could not export attendance CSV.",
      });
    } finally {
      setExportingCsv(false);
    }
  };
const handleQuickFilter = (status: string) => {
    setStatusFilter(status);
    setPage(1);
  };
const handleResetFilters = () => {
    setSearch("");
    setDepartmentId("all");
    setShiftId("all");
    setStatusFilter("all");
    setPage(1);
  };
const isFiltered=$derived(Boolean(
    search.trim() || departmentId !== "all" || shiftId !== "all" || statusFilter !== "all"
  ));
const formatDuration = (minutes: number) => {
    if (!minutes || minutes <= 0) return "0m";
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h}h`;
    return `${m}m`;
  };
</script>
<div class="space-y-6">
      
      <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs">
        <div class="space-y-1.5">
          <div class="flex flex-wrap items-center gap-2.5">
            <span class="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 border border-indigo-200/80">
              <SvgIcon name="ShieldCheck" class="size-3.5" />
              {#if userPermissions.role === "ORGANIZATION_OWNER"}{"Organization Owner Monitoring"}{:else}{#if userPermissions.role === "HR_ADMIN"}{"HR Admin Workforce Control"}{:else}{"HR Executive Attendance Audit"}{/if}{/if}
            </span>
            <span class="inline-flex items-center gap-1 text-xs font-medium text-slate-500 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-200">
              <SvgIcon name="Clock" class="size-3 text-slate-400" />
              <span>Timezone:</span>
              <strong class="text-slate-700">{timezone}</strong>
            </span>
          </div>

          <h2 class="text-2xl font-bold tracking-tight text-slate-900">
            Organization-Wide Attendance Dashboard
          </h2>
          <p class="text-xs sm:text-sm text-slate-500 max-w-3xl">
            Live real-time visibility into workforce attendance, punctuality, active breaks, and shift adherence across all organizational units.
          </p>
        </div>

        
        <div class="flex flex-wrap items-center gap-2.5 shrink-0">
          <Button variant="secondary" size="sm" onclick={handleExportCsv} disabled={exportingCsv || loading} class="h-9 gap-2 text-xs font-semibold border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs">
            <SvgIcon name="Download" class="size-3.5 text-slate-500" />
            <span>{#if exportingCsv}{"Exporting…"}{:else}{"Export CSV"}{/if}</span>
          </Button>

          {#if userPermissions.canManageAttendance}<Button variant="primary" size="sm" onclick={() => setShowConfirmAbsences(true)} disabled={processingAbsences || loading} class="h-9 gap-2 text-xs font-semibold shadow-xs">
              <SvgIcon name="ShieldCheck" class="size-3.5" />
              <span>Process Shift Absences</span>
            </Button>{:else}<div title="Attendance administration permissions required" class="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-400 cursor-not-allowed h-9">
              <SvgIcon name="ShieldAlert" class="size-3.5 text-slate-400" />
              <span>Process Absences (Admin Only)</span>
            </div>{/if}

          <Button variant="ghost" size="sm" onclick={() => void fetchData()} disabled={loading} class="h-9 w-9 p-0 text-slate-600 hover:bg-slate-100 hover:text-slate-900" title="Refresh Attendance Data">
            <SvgIcon name="RefreshCw" class={`size-4 ${loading ? "animate-spin" : ""}`} />
            <span class="sr-only">Refresh</span>
          </Button>
        </div>
      </div>

      
      <div class="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div role="button" tabindex={0} onclick={() => handleQuickFilter("all")} onkeydown={(e) => e.key === "Enter" && handleQuickFilter("all")} class={`group rounded-2xl border p-4.5 transition-all shadow-2xs cursor-pointer ${
            statusFilter === "all"
              ? "border-slate-900 bg-slate-900 text-white ring-2 ring-slate-900/20"
              : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs"
          }`}>
          <div class="flex items-center justify-between">
            <span class={`text-xs font-semibold uppercase tracking-wider ${
                statusFilter === "all" ? "text-slate-300" : "text-slate-500"
              }`}>
              Total Active
            </span>
            <SvgIcon name="Users" class={`size-4 ${
                statusFilter === "all" ? "text-slate-300" : "text-slate-400"
              }`} />
          </div>
          <div class="mt-2.5 flex items-baseline justify-between">
            <span class="text-3xl font-extrabold tracking-tight">
              {summary?.totalActive ?? "—"}
            </span>
            <span class={`text-[11px] font-medium ${
                statusFilter === "all" ? "text-slate-400" : "text-slate-500"
              }`}>
              Total roster
            </span>
          </div>
        </div>

        
        <div role="button" tabindex={0} onclick={() => handleQuickFilter("present")} onkeydown={(e) => e.key === "Enter" && handleQuickFilter("present")} class={`group rounded-2xl border p-4.5 transition-all shadow-2xs cursor-pointer ${
            statusFilter === "present"
              ? "border-emerald-700 bg-emerald-700 text-white ring-2 ring-emerald-700/20"
              : "border-emerald-200/80 bg-emerald-50/50 hover:border-emerald-300 hover:bg-emerald-50/80"
          }`}>
          <div class="flex items-center justify-between">
            <span class={`text-xs font-semibold uppercase tracking-wider ${
                statusFilter === "present" ? "text-emerald-100" : "text-emerald-800"
              }`}>
              Present
            </span>
            <SvgIcon name="UserCheck" class={`size-4 ${
                statusFilter === "present" ? "text-emerald-100" : "text-emerald-600"
              }`} />
          </div>
          <div class="mt-2.5 flex items-baseline justify-between">
            <span class={`text-3xl font-extrabold tracking-tight ${
                statusFilter === "present" ? "text-white" : "text-emerald-950"
              }`}>
              {summary?.present ?? "—"}
            </span>
            <span class={`text-[11px] font-medium ${
                statusFilter === "present" ? "text-emerald-200" : "text-emerald-700"
              }`}>
              On-time / active
            </span>
          </div>
        </div>

        
        <div role="button" tabindex={0} onclick={() => handleQuickFilter("late")} onkeydown={(e) => e.key === "Enter" && handleQuickFilter("late")} class={`group rounded-2xl border p-4.5 transition-all shadow-2xs cursor-pointer ${
            statusFilter === "late"
              ? "border-amber-600 bg-amber-600 text-white ring-2 ring-amber-600/20"
              : "border-amber-200 bg-amber-50/50 hover:border-amber-300 hover:bg-amber-50/80"
          }`}>
          <div class="flex items-center justify-between">
            <span class={`text-xs font-semibold uppercase tracking-wider ${
                statusFilter === "late" ? "text-amber-100" : "text-amber-800"
              }`}>
              Late
            </span>
            <SvgIcon name="AlertCircle" class={`size-4 ${
                statusFilter === "late" ? "text-amber-100" : "text-amber-600"
              }`} />
          </div>
          <div class="mt-2.5 flex items-baseline justify-between">
            <span class={`text-3xl font-extrabold tracking-tight ${
                statusFilter === "late" ? "text-white" : "text-amber-950"
              }`}>
              {summary?.late ?? "—"}
            </span>
            <span class={`text-[11px] font-medium ${
                statusFilter === "late" ? "text-amber-200" : "text-amber-700"
              }`}>
              &gt;15m grace limit
            </span>
          </div>
        </div>

        
        <div role="button" tabindex={0} onclick={() => handleQuickFilter("absent")} onkeydown={(e) => e.key === "Enter" && handleQuickFilter("absent")} class={`group rounded-2xl border p-4.5 transition-all shadow-2xs cursor-pointer ${
            statusFilter === "absent"
              ? "border-rose-600 bg-rose-600 text-white ring-2 ring-rose-600/20"
              : "border-rose-200 bg-rose-50/50 hover:border-rose-300 hover:bg-rose-50/80"
          }`}>
          <div class="flex items-center justify-between">
            <span class={`text-xs font-semibold uppercase tracking-wider ${
                statusFilter === "absent" ? "text-rose-100" : "text-rose-800"
              }`}>
              Absent
            </span>
            <SvgIcon name="UserX" class={`size-4 ${
                statusFilter === "absent" ? "text-rose-100" : "text-rose-600"
              }`} />
          </div>
          <div class="mt-2.5 flex items-baseline justify-between">
            <span class={`text-3xl font-extrabold tracking-tight ${
                statusFilter === "absent" ? "text-white" : "text-rose-950"
              }`}>
              {summary?.absent ?? "—"}
            </span>
            <span class={`text-[11px] font-medium ${
                statusFilter === "absent" ? "text-rose-200" : "text-rose-700"
              }`}>
              Shift ended / no-show
            </span>
          </div>
        </div>

        
        <div role="button" tabindex={0} onclick={() => handleQuickFilter("on_leave")} onkeydown={(e) => e.key === "Enter" && handleQuickFilter("on_leave")} class={`group rounded-2xl border p-4.5 transition-all shadow-2xs cursor-pointer ${
            statusFilter === "on_leave"
              ? "border-sky-600 bg-sky-600 text-white ring-2 ring-sky-600/20"
              : "border-sky-200 bg-sky-50/50 hover:border-sky-300 hover:bg-sky-50/80"
          }`}>
          <div class="flex items-center justify-between">
            <span class={`text-xs font-semibold uppercase tracking-wider ${
                statusFilter === "on_leave" ? "text-sky-100" : "text-sky-800"
              }`}>
              On Leave
            </span>
            <SvgIcon name="Calendar" class={`size-4 ${
                statusFilter === "on_leave" ? "text-sky-100" : "text-sky-600"
              }`} />
          </div>
          <div class="mt-2.5 flex items-baseline justify-between">
            <span class={`text-3xl font-extrabold tracking-tight ${
                statusFilter === "on_leave" ? "text-white" : "text-sky-950"
              }`}>
              {summary?.onLeave ?? "—"}
            </span>
            <span class={`text-[11px] font-medium ${
                statusFilter === "on_leave" ? "text-sky-200" : "text-sky-700"
              }`}>
              Approved leaves
            </span>
          </div>
        </div>

        
        <div role="button" tabindex={0} onclick={() => handleQuickFilter("on_break")} onkeydown={(e) => e.key === "Enter" && handleQuickFilter("on_break")} class={`group rounded-2xl border p-4.5 transition-all shadow-2xs cursor-pointer ${
            statusFilter === "on_break"
              ? "border-amber-500 bg-amber-500 text-white ring-2 ring-amber-500/20"
              : "border-amber-300 bg-amber-100/40 hover:border-amber-400 hover:bg-amber-100/70"
          }`}>
          <div class="flex items-center justify-between">
            <span class={`text-xs font-semibold uppercase tracking-wider ${
                statusFilter === "on_break" ? "text-amber-100" : "text-amber-900"
              }`}>
              On Break
            </span>
            <div class="flex items-center gap-1.5">
              <span class="size-2 rounded-full bg-amber-500 animate-pulse"></span>
              <SvgIcon name="Coffee" class={`size-4 ${
                  statusFilter === "on_break" ? "text-amber-100" : "text-amber-700"
                }`} />
            </div>
          </div>
          <div class="mt-2.5 flex items-baseline justify-between">
            <span class={`text-3xl font-extrabold tracking-tight ${
                statusFilter === "on_break" ? "text-white" : "text-amber-950"
              }`}>
              {summary?.onBreak ?? "—"}
            </span>
            <span class={`text-[11px] font-medium ${
                statusFilter === "on_break" ? "text-amber-100" : "text-amber-800"
              }`}>
              Active break live
            </span>
          </div>
        </div>

        
        <div role="button" tabindex={0} onclick={() => handleQuickFilter("missing_punch")} onkeydown={(e) => e.key === "Enter" && handleQuickFilter("missing_punch")} class={`group rounded-2xl border p-4.5 transition-all shadow-2xs cursor-pointer ${
            statusFilter === "missing_punch"
              ? "border-purple-600 bg-purple-600 text-white ring-2 ring-purple-600/20"
              : "border-purple-200 bg-purple-50/50 hover:border-purple-300 hover:bg-purple-50/80"
          }`}>
          <div class="flex items-center justify-between">
            <span class={`text-xs font-semibold uppercase tracking-wider ${
                statusFilter === "missing_punch" ? "text-purple-100" : "text-purple-800"
              }`}>
              Missing Punch
            </span>
            <SvgIcon name="Clock" class={`size-4 ${
                statusFilter === "missing_punch" ? "text-purple-100" : "text-purple-600"
              }`} />
          </div>
          <div class="mt-2.5 flex items-baseline justify-between">
            <span class={`text-3xl font-extrabold tracking-tight ${
                statusFilter === "missing_punch" ? "text-white" : "text-purple-950"
              }`}>
              {summary?.missingPunch ?? "—"}
            </span>
            <span class={`text-[11px] font-medium ${
                statusFilter === "missing_punch" ? "text-purple-200" : "text-purple-700"
              }`}>
              Shift ended unclosed
            </span>
          </div>
        </div>

        
        <div role="button" tabindex={0} onclick={() => {
            setShiftId("unassigned");
            setPage(1);
          }} onkeydown={(e) => {
            if (e.key === "Enter") {
              setShiftId("unassigned");
              setPage(1);
            }
          }} class={`group rounded-2xl border p-4.5 transition-all shadow-2xs cursor-pointer ${
            shiftId === "unassigned"
              ? "border-slate-800 bg-slate-800 text-white ring-2 ring-slate-800/20"
              : "border-slate-200 bg-slate-50/80 hover:border-slate-300 hover:bg-slate-100/80"
          }`}>
          <div class="flex items-center justify-between">
            <span class={`text-xs font-semibold uppercase tracking-wider ${
                shiftId === "unassigned" ? "text-slate-300" : "text-slate-600"
              }`}>
              Unassigned Shift
            </span>
            <SvgIcon name="UserMinus" class={`size-4 ${
                shiftId === "unassigned" ? "text-slate-300" : "text-slate-400"
              }`} />
          </div>
          <div class="mt-2.5 flex items-baseline justify-between">
            <span class={`text-3xl font-extrabold tracking-tight ${
                shiftId === "unassigned" ? "text-white" : "text-slate-800"
              }`}>
              {summary?.unassignedShift ?? "—"}
            </span>
            <span class={`text-[11px] font-medium ${
                shiftId === "unassigned" ? "text-slate-400" : "text-slate-500"
              }`}>
              Needs assignment
            </span>
          </div>
        </div>
      </div>

      
      {#if summary && (!summary.isWorkingDay || summary.isHoliday)}<div class="flex items-center gap-3 rounded-2xl border border-blue-200 bg-blue-50/80 p-4 text-xs text-blue-900 shadow-2xs">
          <SvgIcon name="Calendar" class="size-5 text-blue-700 shrink-0" />
          <div>
            <p class="font-semibold text-blue-950">
              {#if summary.isHoliday}{`Organization Holiday (${summary.holidayName})`}{:else}{"Scheduled Weekly Off / Non-Working Day"}{/if}
            </p>
            <p class="text-blue-800 mt-0.5">
              Normal absence evaluation is paused for {date}. Shift punches recorded on this date are logged as unscheduled working attendance.
            </p>
          </div>
        </div>{/if}

      
      <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
        
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          
          <div class="relative flex-1">
            <SvgIcon name="Search" class="size-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input id="dashboard-search" type="text" placeholder="Search personnel by name or employee ID (e.g. Amit Patel, EMP-1001)…" value={search} oninput={(e) => {
                setSearch(e.currentTarget.value);
                setPage(1);
              }} class="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-9 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all" />
            {#if search}<button type="button" onclick={() => setSearch("")} class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5" title="Clear search">
                <SvgIcon name="X" class="size-3.5" />
              </button>{/if}
          </div>

          
          <div class="flex items-center gap-2 shrink-0">
            <div class="relative">
              <input id="dashboard-date" type="date" value={date} onchange={(e) => {
                  setDate(e.currentTarget.value);
                  setPage(1);
                }} class="h-10 rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs sm:text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all" />
            </div>

            {#if isFiltered}<Button variant="ghost" size="sm" onclick={handleResetFilters} class="h-10 px-3 text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 gap-1.5 shrink-0">
                <SvgIcon name="RotateCcw" class="size-3.5" />
                <span>Reset Filters</span>
              </Button>{/if}
          </div>
        </div>

        
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t border-slate-100">
          
          <div>
            <label for="dashboard-dept" class="block text-[11px] font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
              Department
            </label>
            <select id="dashboard-dept" value={departmentId} onchange={(e) => {
                setDepartmentId(e.currentTarget.value);
                setPage(1);
              }} class="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary transition-all">
              <option value="all">All Departments</option>
              {#each departments as d}<option value={d.id}>
                  {d.name} ({d.code})
                </option>{/each}
            </select>
          </div>

          
          <div>
            <label for="dashboard-shift" class="block text-[11px] font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
              Shift Schedule
            </label>
            <select id="dashboard-shift" value={shiftId} onchange={(e) => {
                setShiftId(e.currentTarget.value);
                setPage(1);
              }} class="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary transition-all">
              <option value="all">All Shifts</option>
              {#each shifts as s}<option value={s.id}>
                  {s.name} ({s.startTime.slice(0, 5)}–{s.endTime.slice(0, 5)}
                  {#if s.overnight}{" Overnight"}{:else}{""}{/if})
                </option>{/each}
              <option value="unassigned">⚠️ Unassigned Shift</option>
            </select>
          </div>

          
          <div>
            <label for="dashboard-status" class="block text-[11px] font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
              Attendance Status
            </label>
            <select id="dashboard-status" value={statusFilter} onchange={(e) => {
                setStatusFilter(e.currentTarget.value);
                setPage(1);
              }} class="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary transition-all">
              <option value="all">All Statuses</option>
              <option value="present">Present (On Time)</option>
              <option value="late">Late Arrival (&gt;15m)</option>
              <option value="absent">Absent</option>
              <option value="on_leave">On Approved Leave</option>
              <option value="on_break">Currently On Break</option>
              <option value="missing_punch">Missing Punch</option>
              <option value="scheduled">Scheduled / Shift Upcoming</option>
            </select>
          </div>
        </div>

        
        <div class="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          <span class="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5 mr-1">
            <SvgIcon name="Filter" class="size-3 text-slate-400" />
            Quick Views:
          </span>
          <button type="button" onclick={() => handleQuickFilter("all")} class={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
              statusFilter === "all"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}>
            All ({summary?.totalActive ?? 0})
          </button>
          <button type="button" onclick={() => handleQuickFilter("late")} class={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
              statusFilter === "late"
                ? "bg-amber-600 text-white shadow-xs"
                : "bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200"
            }`}>
            Late ({summary?.late ?? 0})
          </button>
          <button type="button" onclick={() => handleQuickFilter("absent")} class={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
              statusFilter === "absent"
                ? "bg-rose-600 text-white shadow-xs"
                : "bg-rose-50 text-rose-900 hover:bg-rose-100 border border-rose-200"
            }`}>
            Absent ({summary?.absent ?? 0})
          </button>
          <button type="button" onclick={() => handleQuickFilter("missing_punch")} class={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
              statusFilter === "missing_punch"
                ? "bg-purple-600 text-white shadow-xs"
                : "bg-purple-50 text-purple-900 hover:bg-purple-100 border border-purple-200"
            }`}>
            Missing Punch ({summary?.missingPunch ?? 0})
          </button>
          <button type="button" onclick={() => handleQuickFilter("on_break")} class={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
              statusFilter === "on_break"
                ? "bg-amber-500 text-white shadow-xs"
                : "bg-amber-100 text-amber-950 hover:bg-amber-200 border border-amber-300"
            }`}>
            On Break ({summary?.onBreak ?? 0})
          </button>
          <button type="button" onclick={() => handleQuickFilter("on_leave")} class={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
              statusFilter === "on_leave"
                ? "bg-sky-600 text-white shadow-xs"
                : "bg-sky-50 text-sky-900 hover:bg-sky-100 border border-sky-200"
            }`}>
            On Leave ({summary?.onLeave ?? 0})
          </button>
        </div>
      </div>

      
      <div class="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {#if loading}<div class="py-16 text-center space-y-3">
            <SvgIcon name="RefreshCw" class="size-7 text-primary animate-spin mx-auto text-indigo-600" />
            <p class="text-sm font-medium text-slate-600">Loading organization attendance records…</p>
            <p class="text-xs text-slate-400">Synchronizing punches and shift allocations in {timezone}</p>
          </div>{:else}{#if error}<div class="py-16 text-center text-rose-600 space-y-2 px-4">
            <SvgIcon name="AlertCircle" class="size-8 mx-auto text-rose-500" />
            <p class="text-base font-semibold">{error}</p>
            <Button variant="secondary" size="sm" onclick={() => void fetchData()} class="mt-3 text-xs">
              Retry
            </Button>
          </div>{:else}{#if employees.length === 0}<div class="py-16 text-center text-slate-500 space-y-2 px-4">
            <SvgIcon name="Users" class="size-10 mx-auto text-slate-300" />
            <p class="text-base font-semibold text-slate-800">No attendance records match your criteria</p>
            <p class="text-xs text-slate-500 max-w-md mx-auto">
              Try adjusting your date, department, shift, or quick-view status filters to see more results.
            </p>
            {#if isFiltered}<Button variant="secondary" size="sm" onclick={handleResetFilters} class="mt-3 text-xs">
                Reset All Filters
              </Button>{/if}
          </div>{:else}<div class="overflow-x-auto">
            <table class="w-full min-w-[1200px] text-left border-collapse text-xs">
              <thead>
                <tr class="sticky top-0 z-10 border-b border-slate-200 bg-slate-50/95 backdrop-blur-xs text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th class="py-3.5 px-4">Employee</th>
                  <th class="py-3.5 px-3">Dept & Role</th>
                  <th class="py-3.5 px-3">Assigned Shift</th>
                  <th class="py-3.5 px-3">Clock-In</th>
                  <th class="py-3.5 px-3">Clock-Out</th>
                  <th class="py-3.5 px-3">Status</th>
                  <th class="py-3.5 px-3">Break Status</th>
                  <th class="py-3.5 px-3 text-right">Break Used</th>
                  <th class="py-3.5 px-3 text-right">Remaining</th>
                  <th class="py-3.5 px-3 text-right">Net Work</th>
                  <th class="py-3.5 px-3 text-center">Punctuality</th>
                  <th class="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                {#each employees as row}<tr class="hover:bg-slate-50/80 transition-colors">
                    
                    <td class="py-3.5 px-4">
                      <div class="flex items-center gap-3">
                        <div class="flex size-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 font-bold text-indigo-700 text-xs">
                          {row.employee.firstName[0]}
                          {row.employee.lastName[0]}
                        </div>
                        <div>
                          <div class="font-semibold text-slate-900 text-xs leading-tight">
                            {row.employee.displayName}
                          </div>
                          <span class="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded mt-0.5 inline-block">
                            {row.employee.employeeId}
                          </span>
                        </div>
                      </div>
                    </td>

                    
                    <td class="py-3.5 px-3">
                      <div class="text-slate-800 font-medium leading-tight">
                        {row.department?.name || "—"}
                      </div>
                      <div class="text-[11px] text-slate-500 mt-0.5">
                        {row.designation?.name || "—"}
                      </div>
                    </td>

                    
                    <td class="py-3.5 px-3">
                      {#if row.shift}<div>
                          <div class="font-semibold text-slate-800 flex items-center gap-1.5">
                            <span>{row.shift.name}</span>
                            {#if row.shift.overnight}<span title="Overnight Shift: crosses midnight" class="inline-flex items-center gap-0.5 rounded bg-indigo-50 px-1 py-0.5 text-[9px] font-bold text-indigo-700 border border-indigo-200">
                                <SvgIcon name="Moon" class="size-2.5" />
                                <span>Night</span>
                              </span>{/if}
                          </div>
                          <span class="font-mono text-[11px] text-slate-500">
                            {row.shift.startTime.slice(0, 5)}–{row.shift.endTime.slice(0, 5)}
                          </span>
                        </div>{:else}<span class="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-200">
                          Unassigned Shift
                        </span>{/if}
                    </td>

                    
                    <td class="py-3.5 px-3 font-mono">
                      {#if row.clockInTimeFormatted}<span class="font-semibold text-slate-800">
                          {row.clockInTimeFormatted}
                        </span>{:else}<span class="text-slate-400 font-sans">—</span>{/if}
                    </td>

                    
                    <td class="py-3.5 px-3">
                      {#if row.clockOutTimeFormatted}<span class="font-mono font-semibold text-slate-800">
                          {row.clockOutTimeFormatted}
                        </span>{:else}{#if row.isClockOutPending}<span class="inline-flex items-center gap-1.5 text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <span class="size-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          In Progress
                        </span>{:else}<span class="text-slate-400 font-sans">—</span>{/if}{/if}
                    </td>

                    
                    <td class="py-3.5 px-3">
                      <span class={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold capitalize ${
                          row.status === "present"
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : row.status === "late"
                            ? "bg-amber-50 text-amber-900 border border-amber-200"
                            : row.status === "absent"
                            ? "bg-rose-50 text-rose-800 border border-rose-200"
                            : row.status === "on_leave"
                            ? "bg-sky-50 text-sky-800 border border-sky-200"
                            : row.status === "missing_punch"
                            ? "bg-purple-50 text-purple-800 border border-purple-200"
                            : "bg-slate-100 text-slate-700 border border-slate-200"
                        }`}>
                        {#if row.status === "present"}<SvgIcon name="CheckCircle2" class="size-3 text-emerald-600" />{/if}
                        {#if row.status === "late"}<SvgIcon name="AlertCircle" class="size-3 text-amber-600" />{/if}
                        {row.status.replaceAll("_", " ")}
                      </span>
                    </td>

                    
                    <td class="py-3.5 px-3">
                      {#if row.breakStatus === "on_break"}<span class="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-950 border border-amber-300">
                          <span class="size-1.5 rounded-full bg-amber-600 animate-pulse"></span>
                          On Break
                        </span>{:else}{#if row.breakStatus === "completed"}<span class="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                          Completed
                        </span>{:else}<span class="text-[10px] text-slate-400">Not Started</span>{/if}{/if}
                    </td>

                    
                    <td class="py-3.5 px-3 text-right font-mono font-medium text-slate-800">
                      {row.totalBreakMinutes}m
                    </td>

                    
                    <td class="py-3.5 px-3 text-right font-mono font-semibold">
                      <span class={row.isBreakExceeded ? "text-rose-600" : "text-slate-800"}>
                        {row.remainingBreakMinutes}m
                      </span>
                    </td>

                    
                    <td class="py-3.5 px-3 text-right font-mono font-bold text-slate-900">
                      <div>{formatDuration(row.netWorkMinutes)}</div>
                      {#if row.potentialOvertimeMinutes > 0}<div class="text-[10px] font-semibold text-amber-700">
                          +{row.potentialOvertimeMinutes}m OT
                        </div>{/if}
                    </td>

                    
                    <td class="py-3.5 px-3 text-center">
                      {#if row.lateMinutes > 0}<span class="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700 border border-rose-200">
                          +{row.lateMinutes}m late
                        </span>{:else}{#if row.earlyDepartureMinutes > 0}<span class="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-200">
                          -{row.earlyDepartureMinutes}m early
                        </span>{:else}{#if row.clockInTimeFormatted}<span class="text-emerald-700 font-semibold text-[10px]">On Time</span>{:else}<span class="text-slate-400 text-[10px]">—</span>{/if}{/if}{/if}
                    </td>

                    
                    <td class="py-3.5 px-4 text-right">
                      <Button variant="secondary" size="sm" onclick={() => setSelectedRow(row)} class="h-7 px-2.5 text-[11px] font-semibold gap-1.5 text-slate-700 border-slate-200 hover:bg-slate-100 shadow-2xs">
                        <SvgIcon name="Eye" class="size-3 text-slate-500" />
                        Details
                      </Button>
                    </td>
                  </tr>{/each}
              </tbody>
            </table>
          </div>{/if}{/if}{/if}

        
        {#if pagination.totalPages > 1}<div class="flex flex-col sm:flex-row items-center justify-between border-t border-slate-200 bg-slate-50/75 px-5 py-3.5 text-xs text-slate-600 gap-3">
            <div>
              Showing{" "}
              <strong>
                {(pagination.page - 1) * pagination.pageSize + 1}–
                {Math.min(pagination.page * pagination.pageSize, pagination.total)}
              </strong>{" "}
              of <strong>{pagination.total}</strong> employees
            </div>
            <div class="flex items-center gap-2">
              <Button variant="secondary" size="sm" onclick={() => setPage((p) => Math.max(1, p - 1))} disabled={pagination.page <= 1} class="h-8 px-3 text-xs border-slate-200 bg-white gap-1">
                <SvgIcon name="ChevronLeft" class="size-3" />
                Previous
              </Button>
              <span class="px-2 font-medium">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <Button variant="secondary" size="sm" onclick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))} disabled={pagination.page >= pagination.totalPages} class="h-8 px-3 text-xs border-slate-200 bg-white gap-1">
                Next
                <SvgIcon name="ChevronRight" class="size-3" />
              </Button>
            </div>
          </div>{/if}
      </div>

      
      {#if showConfirmAbsences}<div role="dialog" aria-modal="true" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div class="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl space-y-4">
            <div class="flex items-center gap-3">
              <div class="size-10 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center shrink-0">
                <SvgIcon name="ShieldCheck" class="size-5 text-indigo-700" />
              </div>
              <div>
                <h3 class="text-base font-bold text-slate-900">
                  Process Shift Absences
                </h3>
                <p class="text-xs text-slate-500">
                  Target Work Date: <strong>{date || "Today"}</strong>
                </p>
              </div>
            </div>

            <p class="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              This action will evaluate all employees whose scheduled shifts have completely finished on <strong>{date || "the target date"}</strong>. Employees with no punches and no approved leaves will be recorded as <strong>Absent</strong>. Shifts missing clock-out punches will be updated.
            </p>

            <div class="flex items-center justify-end gap-2.5 pt-2">
              <Button variant="secondary" size="sm" onclick={() => setShowConfirmAbsences(false)} disabled={processingAbsences} class="text-xs">
                Cancel
              </Button>
              <Button variant="primary" size="sm" onclick={handleProcessAbsences} disabled={processingAbsences} class="text-xs gap-1.5">
                {#if processingAbsences}
                    <SvgIcon name="RefreshCw" class="size-3.5 animate-spin" />
                    <span>Processing…</span>
                  {:else}<span>Confirm & Run</span>{/if}
              </Button>
            </div>
          </div>
        </div>{/if}

      
      {#if selectedRow}<div role="dialog" aria-modal="true" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div class="relative w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-xl space-y-5 max-h-[90vh] overflow-y-auto">
            
            <div class="flex items-start justify-between border-b border-slate-100 pb-3.5">
              <div>
                <div class="flex items-center gap-2.5">
                  <h3 class="text-lg font-bold text-slate-900">
                    {selectedRow.employee.displayName}
                  </h3>
                  <span class="font-mono text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                    {selectedRow.employee.employeeId}
                  </span>
                </div>
                <p class="text-xs text-slate-500 mt-1">
                  Attendance Details for <strong>{selectedRow.attendanceDate}</strong> · Organization Timezone: <strong>{timezone}</strong>
                </p>
              </div>
              <button type="button" onclick={() => setSelectedRow(null)} class="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors" title="Close modal">
                <SvgIcon name="X" class="size-4" />
              </button>
            </div>

            
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-xl bg-slate-50/80 p-3.5 text-xs border border-slate-100">
              <div>
                <span class="text-slate-500 text-[10px] font-semibold uppercase tracking-wider">Department</span>
                <p class="font-bold text-slate-900 mt-0.5">{selectedRow.department?.name || "—"}</p>
              </div>
              <div>
                <span class="text-slate-500 text-[10px] font-semibold uppercase tracking-wider">Designation</span>
                <p class="font-bold text-slate-900 mt-0.5">{selectedRow.designation?.name || "—"}</p>
              </div>
              <div>
                <span class="text-slate-500 text-[10px] font-semibold uppercase tracking-wider">Assigned Shift</span>
                <p class="font-bold text-slate-900 mt-0.5">
                  {selectedRow.shift?.name || "Unassigned"}
                </p>
              </div>
              <div>
                <span class="text-slate-500 text-[10px] font-semibold uppercase tracking-wider">Shift Timing</span>
                <p class="font-bold text-slate-900 mt-0.5">
                  {#if selectedRow.shift}{`${selectedRow.shift.startTime.slice(0, 5)} - ${selectedRow.shift.endTime.slice(0, 5)}`}{:else}{"—"}{/if}
                </p>
              </div>
            </div>

            
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div class="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                <span class="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Clock In / Out</span>
                <p class="font-mono text-xs font-bold text-slate-900 mt-1">
                  {selectedRow.clockInTimeFormatted || "—"} / {selectedRow.clockOutTimeFormatted || (selectedRow.isClockOutPending ? "In Progress" : "—")}
                </p>
              </div>

              <div class="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                <span class="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Net Work Duration</span>
                <p class="font-mono text-xs font-bold text-indigo-700 mt-1">
                  {formatDuration(selectedRow.netWorkMinutes)}
                </p>
              </div>

              <div class="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                <span class="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Break Used / Left</span>
                <p class="font-mono text-xs font-bold text-slate-900 mt-1">
                  {selectedRow.totalBreakMinutes}m / {selectedRow.remainingBreakMinutes}m
                </p>
              </div>

              <div class="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                <span class="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Lateness / Early</span>
                <p class="font-mono text-xs font-bold text-rose-700 mt-1">
                  +{selectedRow.lateMinutes}m / -{selectedRow.earlyDepartureMinutes}m
                </p>
              </div>
            </div>

            
            {#if selectedRow.potentialOvertimeMinutes > 0}<div class="rounded-xl border border-amber-200 bg-amber-50/80 p-3.5 text-xs text-amber-950 flex items-center justify-between">
                <div>
                  <span class="font-bold">Potential Overtime (Pending Approval)</span>
                  <p class="text-amber-800 text-[11px] mt-0.5">
                    Employee worked beyond scheduled shift end time ({selectedRow.shift?.endTime.slice(0, 5) || "end"}). Unapproved overtime is informational and not converted to payroll earnings until approved.
                  </p>
                </div>
                <span class="font-mono text-sm font-extrabold text-amber-900 bg-amber-100/80 px-2.5 py-1 rounded-lg border border-amber-300 shrink-0 ml-3">
                  +{selectedRow.potentialOvertimeMinutes}m
                </span>
              </div>{/if}

            
            <div class="space-y-2">
              <h4 class="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Persisted Punches ({selectedRow.punches.length})
              </h4>
              {#if selectedRow.punches.length === 0}<p class="text-xs text-slate-500 italic bg-slate-50 p-3 rounded-xl border border-slate-100">
                  No punches recorded on this work date.
                </p>{:else}<div class="rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-100 text-xs">
                  {#each selectedRow.punches as p, idx}<div class="flex items-center justify-between px-4 py-2.5 bg-white">
                      <div class="flex items-center gap-2.5">
                        <span class="size-5 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-[10px]">
                          {idx + 1}
                        </span>
                        <span class="font-semibold text-slate-800 capitalize">
                          {p.punchType.replaceAll("_", " ")}
                        </span>
                      </div>
                      <span class="font-mono text-slate-700">{p.punchedAtFormatted}</span>
                    </div>{/each}
                </div>{/if}
            </div>

            
            {#if selectedRow.breakIntervals.length > 0}<div class="space-y-2">
                <h4 class="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Break Intervals ({selectedRow.breakIntervals.length})
                </h4>
                <div class="rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-100 text-xs">
                  {#each selectedRow.breakIntervals as iv, idx}<div class="flex items-center justify-between px-4 py-2.5 bg-white">
                      <span class="font-medium text-slate-700">Break #{idx + 1}</span>
                      <span class="font-mono font-semibold text-slate-900">
                        {iv.durationMinutes} min {#if iv.end}{""}{:else}{"(In Progress)"}{/if}
                      </span>
                    </div>{/each}
                </div>
              </div>{/if}

            
            {#if selectedRow.regularization}<div class="rounded-xl border border-indigo-100 bg-indigo-50/70 p-3.5 text-xs">
                <span class="font-bold text-indigo-950">Attendance Regularization Request</span>
                <p class="text-indigo-900 mt-0.5">
                  Status: <strong class="capitalize">{selectedRow.regularization.status}</strong> · Reason: {selectedRow.regularization.reason}
                </p>
              </div>{/if}

            
            <div class="flex justify-end pt-2 border-t border-slate-100">
              <Button variant="secondary" size="sm" onclick={() => setSelectedRow(null)} class="text-xs px-4">
                Close
              </Button>
            </div>
          </div>
        </div>{/if}
    </div>
