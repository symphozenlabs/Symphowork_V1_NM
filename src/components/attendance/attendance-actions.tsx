"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { CheckCircle2, Clock, Coffee, Moon, ShieldCheck, Timer, User, Users } from "lucide-react";
import { calculateBreakSummary } from "@/modules/attendance/calculator";

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

export function AttendanceActions({
  canViewOthers = false,
  initialEmployeeId = "",
  initialDate = "",
}: {
  canViewOthers?: boolean;
  initialEmployeeId?: string;
  initialDate?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const queryEmpId = canViewOthers ? (searchParams.get("employeeId") || initialEmployeeId || "") : "";
  const queryDate = searchParams.get("date") || initialDate || "";

  const [records, setRecords] = useState<RecordRow[]>([]);
  const [punches, setPunches] = useState<Punch[]>([]);
  const [hasShift, setHasShift] = useState<boolean | null>(null);
  const [assignedShift, setAssignedShift] = useState<Shift | null>(null);
  const [viewedEmployee, setViewedEmployee] = useState<{ id: string; displayName: string; employeeId: string; isSelf?: boolean } | null>(null);
  const [timezone, setTimezone] = useState<string>("UTC");
  const [now, setNow] = useState<Date>(() => new Date());

  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(queryEmpId);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [date, setDate] = useState(queryDate);
  const { showToast } = useToast();

  // Synchronize state if URL query params change externally
  useEffect(() => {
    if (canViewOthers) {
      const urlEmp = searchParams.get("employeeId") || initialEmployeeId || "";
      if (urlEmp !== selectedEmployeeId) {
        setSelectedEmployeeId(urlEmp);
      }
    }
  }, [searchParams, initialEmployeeId, canViewOthers, selectedEmployeeId]);

  useEffect(() => {
    const urlDate = searchParams.get("date") || initialDate || "";
    if (urlDate !== date) {
      setDate(urlDate);
    }
  }, [searchParams, initialDate, date]);

  const updateUrl = useCallback(
    (empId: string, dt: string) => {
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
    },
    [searchParams, pathname, router]
  );

  const handleEmployeeChange = (newEmpId: string) => {
    setSelectedEmployeeId(newEmpId);
    updateUrl(newEmpId, date);
  };

  const handleDateChange = (newDate: string) => {
    setDate(newDate);
    updateUrl(selectedEmployeeId, newDate);
  };

  // Load employee list for HR attendance viewing
  useEffect(() => {
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
  }, [canViewOthers]);

  const load = useCallback(async () => {
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
  }, [date, selectedEmployeeId]);

  useEffect(() => {
    void load();
  }, [load]);

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

  const current = records[0];
  const isViewingOther = Boolean(selectedEmployeeId && viewedEmployee && !viewedEmployee.isSelf);
  const [processingAbsences, setProcessingAbsences] = useState(false);

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

  // Authoritative break summary calculation from persisted punches
  const breakSummary = calculateBreakSummary({
    punches,
    allowedBreakMinutes: assignedShift?.breakMinutes ?? 0,
    now,
  });

  const hasActiveBreak = breakSummary.status === "on_break";

  // Live timer tick when break is actively running
  useEffect(() => {
    if (!hasActiveBreak) return;
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, [hasActiveBreak]);

  // Authoritative punch state derivation
  const isClockedIn = Boolean(current?.actualFirstIn);
  const isClockedOut = Boolean(current?.actualLastOut);

  const canClockIn = !busy && hasShift !== false && !isClockedIn;
  const canClockOut = !busy && isClockedIn && !isClockedOut && !hasActiveBreak;
  const canStartBreak = !busy && isClockedIn && !isClockedOut && !hasActiveBreak;
  const canEndBreak = !busy && isClockedIn && !isClockedOut && hasActiveBreak;

  return (
    <div className="space-y-5">
      {/* HR Employee Selector */}
      {canViewOthers && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-indigo-100 bg-indigo-50/50 p-3.5">
          <div className="flex items-center gap-2">
            <Users className="size-4 text-indigo-700" />
            <div>
              <span className="text-xs font-bold text-indigo-950">HR Attendance Audit View</span>
              <p className="text-[11px] text-indigo-700">Inspect attendance logs and time punches across organization personnel.</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleProcessAbsences}
              disabled={processingAbsences || busy}
              className="h-9 gap-1.5 text-xs font-semibold border-indigo-200 bg-white hover:bg-indigo-50 text-indigo-900"
            >
              <ShieldCheck className="size-3.5 text-indigo-600" />
              <span>{processingAbsences ? "Processing…" : "Process Shift Absences"}</span>
            </Button>
            <select
              aria-label="Filter employee attendance"
              value={selectedEmployeeId}
              onChange={(e) => handleEmployeeChange(e.target.value)}
              className="h-9 rounded-lg border border-indigo-200 bg-white px-3 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">My Personal Attendance</option>
              {viewedEmployee && !viewedEmployee.isSelf && !employees.some((e) => e.id === viewedEmployee.id) && (
                <option value={viewedEmployee.id}>
                  {viewedEmployee.displayName} ({viewedEmployee.employeeId})
                </option>
              )}
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.displayName} ({emp.employeeId})
                </option>
              ))}
            </select>
            {Boolean(selectedEmployeeId) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEmployeeChange("")}
                className="h-9 text-xs text-indigo-700 hover:bg-indigo-100"
              >
                Reset
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Viewing Other Notice */}
      {isViewingOther && viewedEmployee && (
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
          <div className="flex items-center gap-2">
            <User className="size-4 text-primary" />
            <span>
              Viewing attendance for: <strong className="text-slate-900">{viewedEmployee.displayName}</strong> ({viewedEmployee.employeeId})
            </span>
          </div>
          <span className="text-[11px] font-semibold text-muted bg-white px-2 py-0.5 rounded border border-slate-200">
            Audit Mode (Punches Disabled)
          </span>
        </div>
      )}

      {/* Shift Banner */}
      {assignedShift ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5 text-xs text-emerald-900">
          <div className="flex items-center gap-2">
            <Clock className="size-4 text-emerald-700" />
            <span>
              Assigned Shift: <strong className="font-bold text-emerald-950">{assignedShift.name}</strong> ({assignedShift.code})
            </span>
            <span className="font-mono font-semibold bg-white/80 px-2 py-0.5 rounded border border-emerald-300/60 text-emerald-800">
              {assignedShift.startTime.slice(0, 5)} – {assignedShift.endTime.slice(0, 5)}
            </span>
            {assignedShift.overnight && (
              <span className="inline-flex items-center gap-1 rounded bg-indigo-100 text-indigo-800 px-1.5 py-0.5 text-[10px] font-bold">
                <Moon className="size-3" />
                Overnight
              </span>
            )}
          </div>
          <span className="text-[11px] text-emerald-800">
            Break: {assignedShift.breakMinutes}m · Grace: {assignedShift.graceMinutes}m
          </span>
        </div>
      ) : hasShift === false ? (
        <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <p className="font-semibold text-amber-900">No Work Shift Assigned</p>
          <p className="mt-0.5 text-xs text-amber-700 leading-relaxed">
            An organization administrator must configure and assign a work shift in Settings &gt; Master Data before attendance can be recorded.
          </p>
        </div>
      ) : null}

      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {/* Today Status Card */}
      <div className="rounded-xl border border-slate-200 p-4 bg-surface shadow-xs">
        <p className="text-xs font-semibold text-muted uppercase tracking-wider">Current Attendance Status</p>
        <p className="mt-1 text-2xl font-bold text-primary capitalize">
          {loading ? "Loading…" : current?.status ? current.status.replaceAll("_", " ") : "No attendance today"}
        </p>
        <p className="mt-1 text-xs text-muted">
          {current?.actualFirstIn ? `First In: ${formatTimestampInTz(current.actualFirstIn, timezone)}` : "Not clocked in"}
          {current?.actualLastOut ? ` · Last Out: ${formatTimestampInTz(current.actualLastOut, timezone)}` : ""}
          {hasActiveBreak ? " · Currently on break" : ""}
          {Boolean(current?.potentialOvertimeMinutes && current.potentialOvertimeMinutes > 0) && (
            <span className="font-semibold text-amber-700">
              {` · Potential Overtime / Pending Approval: ${current!.potentialOvertimeMinutes}m`}
            </span>
          )}
        </p>
      </div>

      {/* Break Summary Section */}
      <div className="rounded-xl border border-slate-200 p-4 bg-surface shadow-xs space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Coffee className="size-4 text-primary" />
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Break Summary</h3>
          </div>
          <div>
            {breakSummary.status === "on_break" ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-900 border border-amber-300">
                <span className="size-1.5 rounded-full bg-amber-600 animate-pulse" />
                On Break
              </span>
            ) : breakSummary.status === "completed" ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 border border-emerald-200">
                <CheckCircle2 className="size-3 text-emerald-600" />
                Completed
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 border border-slate-200">
                Not Started
              </span>
            )}
          </div>
        </div>

        {/* Live Break in Progress Banner */}
        {breakSummary.status === "on_break" && (
          <div className="rounded-lg border border-amber-200 bg-amber-50/80 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-amber-950">
            <div className="flex items-center gap-2">
              <Timer className="size-4 text-amber-700 shrink-0" />
              <div>
                <span className="font-semibold text-amber-950">Active Break in Progress</span>
                <p className="text-[11px] text-amber-800">
                  Started at {formatTimestampInTz(breakSummary.activeBreakStart, timezone)} ({timezone})
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 font-mono">
              <span className="text-[11px] font-sans text-amber-800">Elapsed:</span>
              <span className="bg-white px-2.5 py-0.5 rounded border border-amber-300 font-bold text-amber-900 text-sm shadow-2xs">
                {formatElapsed(breakSummary.activeElapsedSeconds)}
              </span>
            </div>
          </div>
        )}

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Allowed Break */}
          <div className="rounded-lg bg-slate-50/80 p-3 border border-slate-100">
            <p className="text-[11px] font-semibold text-muted uppercase tracking-wide">Allowed Break</p>
            <p className="mt-1 text-xl font-bold text-foreground">
              {breakSummary.allowedMinutes} <span className="text-xs font-normal text-muted">min</span>
            </p>
            <p className="text-[10px] text-muted mt-0.5">
              {assignedShift ? `${assignedShift.name} shift allowance` : "Shift allowance"}
            </p>
          </div>

          {/* Break Used */}
          <div className="rounded-lg bg-slate-50/80 p-3 border border-slate-100">
            <p className="text-[11px] font-semibold text-muted uppercase tracking-wide">Break Used</p>
            <p className="mt-1 text-xl font-bold text-primary">
              {breakSummary.totalUsedMinutes} <span className="text-xs font-normal text-muted">min</span>
            </p>
            <p className="text-[10px] text-muted mt-0.5">
              {breakSummary.status === "on_break"
                ? `${breakSummary.completedMinutes}m completed + ${breakSummary.activeMinutes}m active`
                : `${breakSummary.intervals.length} break${breakSummary.intervals.length === 1 ? "" : "s"} taken`}
            </p>
          </div>

          {/* Remaining Break */}
          <div className={`rounded-lg p-3 border ${breakSummary.isExceeded ? "bg-red-50/70 border-red-200" : "bg-slate-50/80 border-slate-100"}`}>
            <p className={`text-[11px] font-semibold uppercase tracking-wide ${breakSummary.isExceeded ? "text-red-700" : "text-muted"}`}>
              Remaining Break
            </p>
            <p className={`mt-1 text-xl font-bold ${breakSummary.isExceeded ? "text-red-700" : "text-foreground"}`}>
              {breakSummary.remainingMinutes} <span className="text-xs font-normal text-muted">min</span>
            </p>
            <p className={`text-[10px] mt-0.5 ${breakSummary.isExceeded ? "text-red-600 font-medium" : "text-muted"}`}>
              {breakSummary.isExceeded
                ? `Allowance exceeded by ${breakSummary.exceededMinutes} min`
                : `${breakSummary.remainingMinutes} min available`}
            </p>
          </div>
        </div>

        {/* Break intervals list */}
        {breakSummary.intervals.length > 0 && (
          <div className="pt-2 border-t border-slate-100 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-muted font-medium">
              <span>Today&apos;s Break Intervals ({breakSummary.intervals.length})</span>
              <span className="text-[10px]">Timezone: {timezone}</span>
            </div>
            <div className="space-y-1">
              {breakSummary.intervals.map((iv, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between text-[11px] rounded bg-white px-2.5 py-1.5 border border-slate-100"
                >
                  <span className="font-medium text-slate-700">
                    Break #{idx + 1}: {formatTimestampInTz(iv.start, timezone)}
                    {iv.end ? ` – ${formatTimestampInTz(iv.end, timezone)}` : " – In progress"}
                  </span>
                  <span className={`font-mono font-semibold ${iv.end ? "text-slate-600" : "text-amber-700"}`}>
                    {iv.end ? `${iv.durationMinutes} min` : `${formatElapsed(breakSummary.activeElapsedSeconds)} elapsed`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Punch Action Buttons (Disabled in Audit Mode) */}
      {!isViewingOther ? (
        <div className="grid gap-2 sm:grid-cols-2">
          <Button
            disabled={!canClockIn}
            onClick={() => void punch("clock_in")}
            className="font-bold shadow-xs"
          >
            Clock in
          </Button>
          <Button
            variant="secondary"
            disabled={!canClockOut}
            onClick={() => void punch("clock_out")}
            className="font-bold"
          >
            Clock out
          </Button>
          <Button
            variant="secondary"
            disabled={!canStartBreak}
            onClick={() => void punch("break_start")}
          >
            Start break
          </Button>
          <Button
            variant="secondary"
            disabled={!canEndBreak}
            onClick={() => void punch("break_end")}
          >
            End break
          </Button>
        </div>
      ) : (
        <p className="text-xs text-muted text-center italic py-1">
          Punch actions are self-service only and disabled while reviewing other team members.
        </p>
      )}

      {message && <p aria-live="polite" className="text-sm text-green-700 font-medium">{message}</p>}

      {/* Attendance History Section */}
      <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-4 text-primary" />
          <h2 className="font-bold text-foreground text-sm">Attendance History & Punches</h2>
        </div>
        <input
          aria-label="Filter attendance date"
          type="date"
          className="h-9 rounded-lg border border-slate-200 bg-surface px-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary"
          value={date}
          onChange={(e) => handleDateChange(e.target.value)}
        />
      </div>

      {loading ? (
        <p className="text-xs text-muted py-4">Loading attendance records…</p>
      ) : records.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-200 p-5 text-center text-xs text-muted">
          No attendance records found for this date.
        </p>
      ) : (
        <div className="space-y-2.5">
          {records.map((record) => (
            <div key={record.id} className="rounded-xl border border-slate-200 p-3.5 text-xs bg-surface shadow-2xs space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="font-bold text-foreground">{record.attendanceDate}</span>
                <span className="rounded-md bg-slate-100 px-2 py-0.5 font-semibold text-slate-700 capitalize text-[11px]">
                  {record.status.replaceAll("_", " ")}
                </span>
              </div>
              <p className="text-muted">
                {record.netWorkMinutes} net work minutes · {record.lateMinutes}m late · {record.earlyDepartureMinutes}m early departure
                {Boolean(record.potentialOvertimeMinutes && record.potentialOvertimeMinutes > 0) && (
                  <span className="font-semibold text-amber-700">
                    {` · Potential Overtime / Pending Approval: ${record.potentialOvertimeMinutes}m`}
                  </span>
                )}
              </p>
              {record.id === current?.id && punches.length > 0 && (
                <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-2 text-[11px]">
                  <span className="font-semibold text-slate-700">Punches:</span>
                  {punches.map((p) => (
                    <span key={p.id} className="rounded bg-slate-50 border border-slate-200 px-1.5 py-0.5 text-slate-700">
                      {p.punchType.replaceAll("_", " ")} {formatTimestampInTz(p.punchedAt, timezone)}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
