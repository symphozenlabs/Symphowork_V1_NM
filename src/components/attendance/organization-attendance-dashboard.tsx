"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Coffee,
  Download,
  Eye,
  Filter,
  Moon,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  UserMinus,
  UserX,
  Users,
  X,
} from "lucide-react";
import type {
  OrganizationAttendanceRow,
  OrganizationAttendanceSummary,
} from "@/modules/attendance/organization-dashboard";

export function OrganizationAttendanceDashboard({
  userRoleKey,
}: {
  userRoleKey?: string;
}) {
  const { showToast } = useToast();

  // Filter & Search State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [date, setDate] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const [departmentId, setDepartmentId] = useState<string>("all");
  const [shiftId, setShiftId] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState<number>(1);
  const pageSize = 20;

  // Data from API
  const [summary, setSummary] = useState<OrganizationAttendanceSummary | null>(null);
  const [employees, setEmployees] = useState<OrganizationAttendanceRow[]>([]);
  const [shifts, setShifts] = useState<
    Array<{
      id: string;
      name: string;
      code: string;
      startTime: string;
      endTime: string;
      overnight: boolean;
      breakMinutes: number;
      graceMinutes: number;
    }>
  >([]);
  const [departments, setDepartments] = useState<
    Array<{ id: string; name: string; code: string }>
  >([]);
  const [pagination, setPagination] = useState<{
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  }>({ page: 1, pageSize: 20, total: 0, totalPages: 1 });
  const [timezone, setTimezone] = useState<string>("UTC");
  const [userPermissions, setUserPermissions] = useState<{
    canManageAttendance: boolean;
    canApproveRegularization: boolean;
    role: string;
  }>({
    canManageAttendance: false,
    canApproveRegularization: false,
    role: userRoleKey || "",
  });

  // Modals & Action States
  const [selectedRow, setSelectedRow] = useState<OrganizationAttendanceRow | null>(null);
  const [showConfirmAbsences, setShowConfirmAbsences] = useState(false);
  const [processingAbsences, setProcessingAbsences] = useState(false);
  const [exportingCsv, setExportingCsv] = useState(false);

  // Fetch Dashboard Data
  const fetchData = useCallback(
    async (overrideDate?: string) => {
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
    },
    [date, search, departmentId, shiftId, statusFilter, page, showToast]
  );

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  // Execute Shift Absence Processing
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

  // Execute CSV Export
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

  // Quick filter helper
  const handleQuickFilter = (status: string) => {
    setStatusFilter(status);
    setPage(1);
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearch("");
    setDepartmentId("all");
    setShiftId("all");
    setStatusFilter("all");
    setPage(1);
  };

  const isFiltered = Boolean(
    search.trim() || departmentId !== "all" || shiftId !== "all" || statusFilter !== "all"
  );

  // Format work duration into readable hours & minutes
  const formatDuration = (minutes: number) => {
    if (!minutes || minutes <= 0) return "0m";
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h}h`;
    return `${m}m`;
  };

  return (
    <div className="space-y-6">
      {/* ─── 1. Header & Quick Actions Bar ────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 border border-indigo-200/80">
              <ShieldCheck className="size-3.5" />
              {userPermissions.role === "ORGANIZATION_OWNER"
                ? "Organization Owner Monitoring"
                : userPermissions.role === "HR_ADMIN"
                ? "HR Admin Workforce Control"
                : "HR Executive Attendance Audit"}
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-200">
              <Clock className="size-3 text-slate-400" />
              <span>Timezone:</span>
              <strong className="text-slate-700">{timezone}</strong>
            </span>
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Organization-Wide Attendance Dashboard
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-3xl">
            Live real-time visibility into workforce attendance, punctuality, active breaks, and shift adherence across all organizational units.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleExportCsv}
            disabled={exportingCsv || loading}
            className="h-9 gap-2 text-xs font-semibold border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs"
          >
            <Download className="size-3.5 text-slate-500" />
            <span>{exportingCsv ? "Exporting…" : "Export CSV"}</span>
          </Button>

          {userPermissions.canManageAttendance ? (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowConfirmAbsences(true)}
              disabled={processingAbsences || loading}
              className="h-9 gap-2 text-xs font-semibold shadow-xs"
            >
              <ShieldCheck className="size-3.5" />
              <span>Process Shift Absences</span>
            </Button>
          ) : (
            <div
              title="Attendance administration permissions required"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-400 cursor-not-allowed h-9"
            >
              <ShieldAlert className="size-3.5 text-slate-400" />
              <span>Process Absences (Admin Only)</span>
            </div>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => void fetchData()}
            disabled={loading}
            className="h-9 w-9 p-0 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            title="Refresh Attendance Data"
          >
            <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
            <span className="sr-only">Refresh</span>
          </Button>
        </div>
      </div>

      {/* ─── 2. Balanced Summary Metrics Grid (4 columns × 2 rows on Desktop) ────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Active Personnel */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => handleQuickFilter("all")}
          onKeyDown={(e) => e.key === "Enter" && handleQuickFilter("all")}
          className={`group rounded-2xl border p-4.5 transition-all shadow-2xs cursor-pointer ${
            statusFilter === "all"
              ? "border-slate-900 bg-slate-900 text-white ring-2 ring-slate-900/20"
              : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-xs font-semibold uppercase tracking-wider ${
                statusFilter === "all" ? "text-slate-300" : "text-slate-500"
              }`}
            >
              Total Active
            </span>
            <Users
              className={`size-4 ${
                statusFilter === "all" ? "text-slate-300" : "text-slate-400"
              }`}
            />
          </div>
          <div className="mt-2.5 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold tracking-tight">
              {summary?.totalActive ?? "—"}
            </span>
            <span
              className={`text-[11px] font-medium ${
                statusFilter === "all" ? "text-slate-400" : "text-slate-500"
              }`}
            >
              Total roster
            </span>
          </div>
        </div>

        {/* Metric 2: Present Personnel (On-Time / Active) */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => handleQuickFilter("present")}
          onKeyDown={(e) => e.key === "Enter" && handleQuickFilter("present")}
          className={`group rounded-2xl border p-4.5 transition-all shadow-2xs cursor-pointer ${
            statusFilter === "present"
              ? "border-emerald-700 bg-emerald-700 text-white ring-2 ring-emerald-700/20"
              : "border-emerald-200/80 bg-emerald-50/50 hover:border-emerald-300 hover:bg-emerald-50/80"
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-xs font-semibold uppercase tracking-wider ${
                statusFilter === "present" ? "text-emerald-100" : "text-emerald-800"
              }`}
            >
              Present
            </span>
            <UserCheck
              className={`size-4 ${
                statusFilter === "present" ? "text-emerald-100" : "text-emerald-600"
              }`}
            />
          </div>
          <div className="mt-2.5 flex items-baseline justify-between">
            <span
              className={`text-3xl font-extrabold tracking-tight ${
                statusFilter === "present" ? "text-white" : "text-emerald-950"
              }`}
            >
              {summary?.present ?? "—"}
            </span>
            <span
              className={`text-[11px] font-medium ${
                statusFilter === "present" ? "text-emerald-200" : "text-emerald-700"
              }`}
            >
              On-time / active
            </span>
          </div>
        </div>

        {/* Metric 3: Late Arrivals */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => handleQuickFilter("late")}
          onKeyDown={(e) => e.key === "Enter" && handleQuickFilter("late")}
          className={`group rounded-2xl border p-4.5 transition-all shadow-2xs cursor-pointer ${
            statusFilter === "late"
              ? "border-amber-600 bg-amber-600 text-white ring-2 ring-amber-600/20"
              : "border-amber-200 bg-amber-50/50 hover:border-amber-300 hover:bg-amber-50/80"
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-xs font-semibold uppercase tracking-wider ${
                statusFilter === "late" ? "text-amber-100" : "text-amber-800"
              }`}
            >
              Late
            </span>
            <AlertCircle
              className={`size-4 ${
                statusFilter === "late" ? "text-amber-100" : "text-amber-600"
              }`}
            />
          </div>
          <div className="mt-2.5 flex items-baseline justify-between">
            <span
              className={`text-3xl font-extrabold tracking-tight ${
                statusFilter === "late" ? "text-white" : "text-amber-950"
              }`}
            >
              {summary?.late ?? "—"}
            </span>
            <span
              className={`text-[11px] font-medium ${
                statusFilter === "late" ? "text-amber-200" : "text-amber-700"
              }`}
            >
              &gt;15m grace limit
            </span>
          </div>
        </div>

        {/* Metric 4: Absent Personnel */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => handleQuickFilter("absent")}
          onKeyDown={(e) => e.key === "Enter" && handleQuickFilter("absent")}
          className={`group rounded-2xl border p-4.5 transition-all shadow-2xs cursor-pointer ${
            statusFilter === "absent"
              ? "border-rose-600 bg-rose-600 text-white ring-2 ring-rose-600/20"
              : "border-rose-200 bg-rose-50/50 hover:border-rose-300 hover:bg-rose-50/80"
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-xs font-semibold uppercase tracking-wider ${
                statusFilter === "absent" ? "text-rose-100" : "text-rose-800"
              }`}
            >
              Absent
            </span>
            <UserX
              className={`size-4 ${
                statusFilter === "absent" ? "text-rose-100" : "text-rose-600"
              }`}
            />
          </div>
          <div className="mt-2.5 flex items-baseline justify-between">
            <span
              className={`text-3xl font-extrabold tracking-tight ${
                statusFilter === "absent" ? "text-white" : "text-rose-950"
              }`}
            >
              {summary?.absent ?? "—"}
            </span>
            <span
              className={`text-[11px] font-medium ${
                statusFilter === "absent" ? "text-rose-200" : "text-rose-700"
              }`}
            >
              Shift ended / no-show
            </span>
          </div>
        </div>

        {/* Metric 5: On Approved Leave */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => handleQuickFilter("on_leave")}
          onKeyDown={(e) => e.key === "Enter" && handleQuickFilter("on_leave")}
          className={`group rounded-2xl border p-4.5 transition-all shadow-2xs cursor-pointer ${
            statusFilter === "on_leave"
              ? "border-sky-600 bg-sky-600 text-white ring-2 ring-sky-600/20"
              : "border-sky-200 bg-sky-50/50 hover:border-sky-300 hover:bg-sky-50/80"
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-xs font-semibold uppercase tracking-wider ${
                statusFilter === "on_leave" ? "text-sky-100" : "text-sky-800"
              }`}
            >
              On Leave
            </span>
            <Calendar
              className={`size-4 ${
                statusFilter === "on_leave" ? "text-sky-100" : "text-sky-600"
              }`}
            />
          </div>
          <div className="mt-2.5 flex items-baseline justify-between">
            <span
              className={`text-3xl font-extrabold tracking-tight ${
                statusFilter === "on_leave" ? "text-white" : "text-sky-950"
              }`}
            >
              {summary?.onLeave ?? "—"}
            </span>
            <span
              className={`text-[11px] font-medium ${
                statusFilter === "on_leave" ? "text-sky-200" : "text-sky-700"
              }`}
            >
              Approved leaves
            </span>
          </div>
        </div>

        {/* Metric 6: Currently On Break */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => handleQuickFilter("on_break")}
          onKeyDown={(e) => e.key === "Enter" && handleQuickFilter("on_break")}
          className={`group rounded-2xl border p-4.5 transition-all shadow-2xs cursor-pointer ${
            statusFilter === "on_break"
              ? "border-amber-500 bg-amber-500 text-white ring-2 ring-amber-500/20"
              : "border-amber-300 bg-amber-100/40 hover:border-amber-400 hover:bg-amber-100/70"
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-xs font-semibold uppercase tracking-wider ${
                statusFilter === "on_break" ? "text-amber-100" : "text-amber-900"
              }`}
            >
              On Break
            </span>
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-amber-500 animate-pulse" />
              <Coffee
                className={`size-4 ${
                  statusFilter === "on_break" ? "text-amber-100" : "text-amber-700"
                }`}
              />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline justify-between">
            <span
              className={`text-3xl font-extrabold tracking-tight ${
                statusFilter === "on_break" ? "text-white" : "text-amber-950"
              }`}
            >
              {summary?.onBreak ?? "—"}
            </span>
            <span
              className={`text-[11px] font-medium ${
                statusFilter === "on_break" ? "text-amber-100" : "text-amber-800"
              }`}
            >
              Active break live
            </span>
          </div>
        </div>

        {/* Metric 7: Missing Punch (Unclosed Shift) */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => handleQuickFilter("missing_punch")}
          onKeyDown={(e) => e.key === "Enter" && handleQuickFilter("missing_punch")}
          className={`group rounded-2xl border p-4.5 transition-all shadow-2xs cursor-pointer ${
            statusFilter === "missing_punch"
              ? "border-purple-600 bg-purple-600 text-white ring-2 ring-purple-600/20"
              : "border-purple-200 bg-purple-50/50 hover:border-purple-300 hover:bg-purple-50/80"
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-xs font-semibold uppercase tracking-wider ${
                statusFilter === "missing_punch" ? "text-purple-100" : "text-purple-800"
              }`}
            >
              Missing Punch
            </span>
            <Clock
              className={`size-4 ${
                statusFilter === "missing_punch" ? "text-purple-100" : "text-purple-600"
              }`}
            />
          </div>
          <div className="mt-2.5 flex items-baseline justify-between">
            <span
              className={`text-3xl font-extrabold tracking-tight ${
                statusFilter === "missing_punch" ? "text-white" : "text-purple-950"
              }`}
            >
              {summary?.missingPunch ?? "—"}
            </span>
            <span
              className={`text-[11px] font-medium ${
                statusFilter === "missing_punch" ? "text-purple-200" : "text-purple-700"
              }`}
            >
              Shift ended unclosed
            </span>
          </div>
        </div>

        {/* Metric 8: Unassigned Shift */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => {
            setShiftId("unassigned");
            setPage(1);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              setShiftId("unassigned");
              setPage(1);
            }
          }}
          className={`group rounded-2xl border p-4.5 transition-all shadow-2xs cursor-pointer ${
            shiftId === "unassigned"
              ? "border-slate-800 bg-slate-800 text-white ring-2 ring-slate-800/20"
              : "border-slate-200 bg-slate-50/80 hover:border-slate-300 hover:bg-slate-100/80"
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-xs font-semibold uppercase tracking-wider ${
                shiftId === "unassigned" ? "text-slate-300" : "text-slate-600"
              }`}
            >
              Unassigned Shift
            </span>
            <UserMinus
              className={`size-4 ${
                shiftId === "unassigned" ? "text-slate-300" : "text-slate-400"
              }`}
            />
          </div>
          <div className="mt-2.5 flex items-baseline justify-between">
            <span
              className={`text-3xl font-extrabold tracking-tight ${
                shiftId === "unassigned" ? "text-white" : "text-slate-800"
              }`}
            >
              {summary?.unassignedShift ?? "—"}
            </span>
            <span
              className={`text-[11px] font-medium ${
                shiftId === "unassigned" ? "text-slate-400" : "text-slate-500"
              }`}
            >
              Needs assignment
            </span>
          </div>
        </div>
      </div>

      {/* Calendar Notice Banner if Weekend or Holiday */}
      {summary && (!summary.isWorkingDay || summary.isHoliday) && (
        <div className="flex items-center gap-3 rounded-2xl border border-blue-200 bg-blue-50/80 p-4 text-xs text-blue-900 shadow-2xs">
          <Calendar className="size-5 text-blue-700 shrink-0" />
          <div>
            <p className="font-semibold text-blue-950">
              {summary.isHoliday
                ? `Organization Holiday (${summary.holidayName})`
                : "Scheduled Weekly Off / Non-Working Day"}
            </p>
            <p className="text-blue-800 mt-0.5">
              Normal absence evaluation is paused for {date}. Shift punches recorded on this date are logged as unscheduled working attendance.
            </p>
          </div>
        </div>
      )}

      {/* ─── 3. Search & Structured Filter Panel ─────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
        {/* Top Filter Controls: Generous Search Input + Date Picker + Reset */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Prominent Search Personnel Field */}
          <div className="relative flex-1">
            <Search className="size-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="dashboard-search"
              type="text"
              placeholder="Search personnel by name or employee ID (e.g. Amit Patel, EMP-1001)…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-9 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                title="Clear search"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* Work Date Selector */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="relative">
              <input
                id="dashboard-date"
                type="date"
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  setPage(1);
                }}
                className="h-10 rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs sm:text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>

            {isFiltered && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="h-10 px-3 text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 gap-1.5 shrink-0"
              >
                <RotateCcw className="size-3.5" />
                <span>Reset Filters</span>
              </Button>
            )}
          </div>
        </div>

        {/* Dropdown Filters Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t border-slate-100">
          {/* Department Filter */}
          <div>
            <label htmlFor="dashboard-dept" className="block text-[11px] font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
              Department
            </label>
            <select
              id="dashboard-dept"
              value={departmentId}
              onChange={(e) => {
                setDepartmentId(e.target.value);
                setPage(1);
              }}
              className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            >
              <option value="all">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
          </div>

          {/* Shift Filter */}
          <div>
            <label htmlFor="dashboard-shift" className="block text-[11px] font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
              Shift Schedule
            </label>
            <select
              id="dashboard-shift"
              value={shiftId}
              onChange={(e) => {
                setShiftId(e.target.value);
                setPage(1);
              }}
              className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            >
              <option value="all">All Shifts</option>
              {shifts.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.startTime.slice(0, 5)}–{s.endTime.slice(0, 5)}
                  {s.overnight ? " Overnight" : ""})
                </option>
              ))}
              <option value="unassigned">⚠️ Unassigned Shift</option>
            </select>
          </div>

          {/* Attendance Status Filter */}
          <div>
            <label htmlFor="dashboard-status" className="block text-[11px] font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
              Attendance Status
            </label>
            <select
              id="dashboard-status"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            >
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

        {/* Quick Filter Status Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5 mr-1">
            <Filter className="size-3 text-slate-400" />
            Quick Views:
          </span>
          <button
            type="button"
            onClick={() => handleQuickFilter("all")}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
              statusFilter === "all"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            All ({summary?.totalActive ?? 0})
          </button>
          <button
            type="button"
            onClick={() => handleQuickFilter("late")}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
              statusFilter === "late"
                ? "bg-amber-600 text-white shadow-xs"
                : "bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200"
            }`}
          >
            Late ({summary?.late ?? 0})
          </button>
          <button
            type="button"
            onClick={() => handleQuickFilter("absent")}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
              statusFilter === "absent"
                ? "bg-rose-600 text-white shadow-xs"
                : "bg-rose-50 text-rose-900 hover:bg-rose-100 border border-rose-200"
            }`}
          >
            Absent ({summary?.absent ?? 0})
          </button>
          <button
            type="button"
            onClick={() => handleQuickFilter("missing_punch")}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
              statusFilter === "missing_punch"
                ? "bg-purple-600 text-white shadow-xs"
                : "bg-purple-50 text-purple-900 hover:bg-purple-100 border border-purple-200"
            }`}
          >
            Missing Punch ({summary?.missingPunch ?? 0})
          </button>
          <button
            type="button"
            onClick={() => handleQuickFilter("on_break")}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
              statusFilter === "on_break"
                ? "bg-amber-500 text-white shadow-xs"
                : "bg-amber-100 text-amber-950 hover:bg-amber-200 border border-amber-300"
            }`}
          >
            On Break ({summary?.onBreak ?? 0})
          </button>
          <button
            type="button"
            onClick={() => handleQuickFilter("on_leave")}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
              statusFilter === "on_leave"
                ? "bg-sky-600 text-white shadow-xs"
                : "bg-sky-50 text-sky-900 hover:bg-sky-100 border border-sky-200"
            }`}
          >
            On Leave ({summary?.onLeave ?? 0})
          </button>
        </div>
      </div>

      {/* ─── 4. Main Workforce Attendance Table ─────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center space-y-3">
            <RefreshCw className="size-7 text-primary animate-spin mx-auto text-indigo-600" />
            <p className="text-sm font-medium text-slate-600">Loading organization attendance records…</p>
            <p className="text-xs text-slate-400">Synchronizing punches and shift allocations in {timezone}</p>
          </div>
        ) : error ? (
          <div className="py-16 text-center text-rose-600 space-y-2 px-4">
            <AlertCircle className="size-8 mx-auto text-rose-500" />
            <p className="text-base font-semibold">{error}</p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void fetchData()}
              className="mt-3 text-xs"
            >
              Retry
            </Button>
          </div>
        ) : employees.length === 0 ? (
          <div className="py-16 text-center text-slate-500 space-y-2 px-4">
            <Users className="size-10 mx-auto text-slate-300" />
            <p className="text-base font-semibold text-slate-800">No attendance records match your criteria</p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Try adjusting your date, department, shift, or quick-view status filters to see more results.
            </p>
            {isFiltered && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleResetFilters}
                className="mt-3 text-xs"
              >
                Reset All Filters
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px] text-left border-collapse text-xs">
              <thead>
                <tr className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50/95 backdrop-blur-xs text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Employee</th>
                  <th className="py-3.5 px-3">Dept & Role</th>
                  <th className="py-3.5 px-3">Assigned Shift</th>
                  <th className="py-3.5 px-3">Clock-In</th>
                  <th className="py-3.5 px-3">Clock-Out</th>
                  <th className="py-3.5 px-3">Status</th>
                  <th className="py-3.5 px-3">Break Status</th>
                  <th className="py-3.5 px-3 text-right">Break Used</th>
                  <th className="py-3.5 px-3 text-right">Remaining</th>
                  <th className="py-3.5 px-3 text-right">Net Work</th>
                  <th className="py-3.5 px-3 text-center">Punctuality</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employees.map((row) => (
                  <tr key={row.employee.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Column 1: Employee Name & ID */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 font-bold text-indigo-700 text-xs">
                          {row.employee.firstName[0]}
                          {row.employee.lastName[0]}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 text-xs leading-tight">
                            {row.employee.displayName}
                          </div>
                          <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded mt-0.5 inline-block">
                            {row.employee.employeeId}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Column 2: Department & Role */}
                    <td className="py-3.5 px-3">
                      <div className="text-slate-800 font-medium leading-tight">
                        {row.department?.name || "—"}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {row.designation?.name || "—"}
                      </div>
                    </td>

                    {/* Column 3: Shift Allocation */}
                    <td className="py-3.5 px-3">
                      {row.shift ? (
                        <div>
                          <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                            <span>{row.shift.name}</span>
                            {row.shift.overnight && (
                              <span
                                title="Overnight Shift: crosses midnight"
                                className="inline-flex items-center gap-0.5 rounded bg-indigo-50 px-1 py-0.5 text-[9px] font-bold text-indigo-700 border border-indigo-200"
                              >
                                <Moon className="size-2.5" />
                                <span>Night</span>
                              </span>
                            )}
                          </div>
                          <span className="font-mono text-[11px] text-slate-500">
                            {row.shift.startTime.slice(0, 5)}–{row.shift.endTime.slice(0, 5)}
                          </span>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-200">
                          Unassigned Shift
                        </span>
                      )}
                    </td>

                    {/* Column 4: Clock-In Timestamp */}
                    <td className="py-3.5 px-3 font-mono">
                      {row.clockInTimeFormatted ? (
                        <span className="font-semibold text-slate-800">
                          {row.clockInTimeFormatted}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-sans">—</span>
                      )}
                    </td>

                    {/* Column 5: Clock-Out Timestamp */}
                    <td className="py-3.5 px-3">
                      {row.clockOutTimeFormatted ? (
                        <span className="font-mono font-semibold text-slate-800">
                          {row.clockOutTimeFormatted}
                        </span>
                      ) : row.isClockOutPending ? (
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          In Progress
                        </span>
                      ) : (
                        <span className="text-slate-400 font-sans">—</span>
                      )}
                    </td>

                    {/* Column 6: Status Badge */}
                    <td className="py-3.5 px-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold capitalize ${
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
                        }`}
                      >
                        {row.status === "present" && <CheckCircle2 className="size-3 text-emerald-600" />}
                        {row.status === "late" && <AlertCircle className="size-3 text-amber-600" />}
                        {row.status.replaceAll("_", " ")}
                      </span>
                    </td>

                    {/* Column 7: Break Status */}
                    <td className="py-3.5 px-3">
                      {row.breakStatus === "on_break" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-950 border border-amber-300">
                          <span className="size-1.5 rounded-full bg-amber-600 animate-pulse" />
                          On Break
                        </span>
                      ) : row.breakStatus === "completed" ? (
                        <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                          Completed
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">Not Started</span>
                      )}
                    </td>

                    {/* Column 8: Break Used */}
                    <td className="py-3.5 px-3 text-right font-mono font-medium text-slate-800">
                      {row.totalBreakMinutes}m
                    </td>

                    {/* Column 9: Remaining Break */}
                    <td className="py-3.5 px-3 text-right font-mono font-semibold">
                      <span className={row.isBreakExceeded ? "text-rose-600" : "text-slate-800"}>
                        {row.remainingBreakMinutes}m
                      </span>
                    </td>

                    {/* Column 10: Net Work Time */}
                    <td className="py-3.5 px-3 text-right font-mono font-bold text-slate-900">
                      {formatDuration(row.netWorkMinutes)}
                    </td>

                    {/* Column 11: Punctuality */}
                    <td className="py-3.5 px-3 text-center">
                      {row.lateMinutes > 0 ? (
                        <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700 border border-rose-200">
                          +{row.lateMinutes}m late
                        </span>
                      ) : row.earlyDepartureMinutes > 0 ? (
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-200">
                          -{row.earlyDepartureMinutes}m early
                        </span>
                      ) : row.clockInTimeFormatted ? (
                        <span className="text-emerald-700 font-semibold text-[10px]">On Time</span>
                      ) : (
                        <span className="text-slate-400 text-[10px]">—</span>
                      )}
                    </td>

                    {/* Column 12: Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setSelectedRow(row)}
                        className="h-7 px-2.5 text-[11px] font-semibold gap-1.5 text-slate-700 border-slate-200 hover:bg-slate-100 shadow-2xs"
                      >
                        <Eye className="size-3 text-slate-500" />
                        Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {pagination.totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-200 bg-slate-50/75 px-5 py-3.5 text-xs text-slate-600 gap-3">
            <div>
              Showing{" "}
              <strong>
                {(pagination.page - 1) * pagination.pageSize + 1}–
                {Math.min(pagination.page * pagination.pageSize, pagination.total)}
              </strong>{" "}
              of <strong>{pagination.total}</strong> employees
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={pagination.page <= 1}
                className="h-8 px-3 text-xs border-slate-200 bg-white gap-1"
              >
                <ChevronLeft className="size-3" />
                Previous
              </Button>
              <span className="px-2 font-medium">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={pagination.page >= pagination.totalPages}
                className="h-8 px-3 text-xs border-slate-200 bg-white gap-1"
              >
                Next
                <ChevronRight className="size-3" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ─── 5. Confirmation Dialog: Process Shift Absences ─────────────────────────── */}
      {showConfirmAbsences && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs"
        >
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center shrink-0">
                <ShieldCheck className="size-5 text-indigo-700" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Process Shift Absences
                </h3>
                <p className="text-xs text-slate-500">
                  Target Work Date: <strong>{date || "Today"}</strong>
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              This action will evaluate all employees whose scheduled shifts have completely finished on <strong>{date || "the target date"}</strong>. Employees with no punches and no approved leaves will be recorded as <strong>Absent</strong>. Shifts missing clock-out punches will be updated.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowConfirmAbsences(false)}
                disabled={processingAbsences}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleProcessAbsences}
                disabled={processingAbsences}
                className="text-xs gap-1.5"
              >
                {processingAbsences ? (
                  <>
                    <RefreshCw className="size-3.5 animate-spin" />
                    <span>Processing…</span>
                  </>
                ) : (
                  <span>Confirm & Run</span>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── 6. Employee Attendance Details Drilldown Modal ──────────────────────────── */}
      {selectedRow && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs"
        >
          <div className="relative w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-xl space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-3.5">
              <div>
                <div className="flex items-center gap-2.5">
                  <h3 className="text-lg font-bold text-slate-900">
                    {selectedRow.employee.displayName}
                  </h3>
                  <span className="font-mono text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                    {selectedRow.employee.employeeId}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Attendance Details for <strong>{selectedRow.attendanceDate}</strong> · Organization Timezone: <strong>{timezone}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRow(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                title="Close modal"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Department & Shift Configuration Overview */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-xl bg-slate-50/80 p-3.5 text-xs border border-slate-100">
              <div>
                <span className="text-slate-500 text-[10px] font-semibold uppercase tracking-wider">Department</span>
                <p className="font-bold text-slate-900 mt-0.5">{selectedRow.department?.name || "—"}</p>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] font-semibold uppercase tracking-wider">Designation</span>
                <p className="font-bold text-slate-900 mt-0.5">{selectedRow.designation?.name || "—"}</p>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] font-semibold uppercase tracking-wider">Assigned Shift</span>
                <p className="font-bold text-slate-900 mt-0.5">
                  {selectedRow.shift?.name || "Unassigned"}
                </p>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] font-semibold uppercase tracking-wider">Shift Timing</span>
                <p className="font-bold text-slate-900 mt-0.5">
                  {selectedRow.shift
                    ? `${selectedRow.shift.startTime.slice(0, 5)} - ${selectedRow.shift.endTime.slice(0, 5)}`
                    : "—"}
                </p>
              </div>
            </div>

            {/* Metrics Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Clock In / Out</span>
                <p className="font-mono text-xs font-bold text-slate-900 mt-1">
                  {selectedRow.clockInTimeFormatted || "—"} / {selectedRow.clockOutTimeFormatted || (selectedRow.isClockOutPending ? "In Progress" : "—")}
                </p>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Net Work Duration</span>
                <p className="font-mono text-xs font-bold text-indigo-700 mt-1">
                  {formatDuration(selectedRow.netWorkMinutes)}
                </p>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Break Used / Left</span>
                <p className="font-mono text-xs font-bold text-slate-900 mt-1">
                  {selectedRow.totalBreakMinutes}m / {selectedRow.remainingBreakMinutes}m
                </p>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Lateness / Early</span>
                <p className="font-mono text-xs font-bold text-rose-700 mt-1">
                  +{selectedRow.lateMinutes}m / -{selectedRow.earlyDepartureMinutes}m
                </p>
              </div>
            </div>

            {/* Persisted Punches Timeline */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Persisted Punches ({selectedRow.punches.length})
              </h4>
              {selectedRow.punches.length === 0 ? (
                <p className="text-xs text-slate-500 italic bg-slate-50 p-3 rounded-xl border border-slate-100">
                  No punches recorded on this work date.
                </p>
              ) : (
                <div className="rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-100 text-xs">
                  {selectedRow.punches.map((p, idx) => (
                    <div key={p.id} className="flex items-center justify-between px-4 py-2.5 bg-white">
                      <div className="flex items-center gap-2.5">
                        <span className="size-5 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-[10px]">
                          {idx + 1}
                        </span>
                        <span className="font-semibold text-slate-800 capitalize">
                          {p.punchType.replaceAll("_", " ")}
                        </span>
                      </div>
                      <span className="font-mono text-slate-700">{p.punchedAtFormatted}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Completed Break Intervals */}
            {selectedRow.breakIntervals.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Break Intervals ({selectedRow.breakIntervals.length})
                </h4>
                <div className="rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-100 text-xs">
                  {selectedRow.breakIntervals.map((iv, idx) => (
                    <div key={idx} className="flex items-center justify-between px-4 py-2.5 bg-white">
                      <span className="font-medium text-slate-700">Break #{idx + 1}</span>
                      <span className="font-mono font-semibold text-slate-900">
                        {iv.durationMinutes} min {iv.end ? "" : "(In Progress)"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Attendance Regularization Notice */}
            {selectedRow.regularization && (
              <div className="rounded-xl border border-indigo-100 bg-indigo-50/70 p-3.5 text-xs">
                <span className="font-bold text-indigo-950">Attendance Regularization Request</span>
                <p className="text-indigo-900 mt-0.5">
                  Status: <strong className="capitalize">{selectedRow.regularization.status}</strong> · Reason: {selectedRow.regularization.reason}
                </p>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex justify-end pt-2 border-t border-slate-100">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelectedRow(null)}
                className="text-xs px-4"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
