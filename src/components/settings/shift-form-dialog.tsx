"use client";

import React, { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { AlertCircle, Clock, Loader2, Moon, Sun, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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

export interface ShiftFormDialogProps {
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

export function ShiftFormDialog({
  open,
  onOpenChange,
  shift,
  onSuccess,
}: ShiftFormDialogProps) {
  const isEditing = Boolean(shift?.id);

  const [name, setName] = useState(shift?.name ?? "");
  const [code, setCode] = useState(shift?.code ?? "");
  const [startTime, setStartTime] = useState(normalizeTime(shift?.startTime || shift?.start_time) || "09:00");
  const [endTime, setEndTime] = useState(normalizeTime(shift?.endTime || shift?.end_time) || "18:00");
  const [breakMinutes, setBreakMinutes] = useState<number | string>(shift?.breakMinutes ?? shift?.break_minutes ?? 60);
  const [graceMinutes, setGraceMinutes] = useState<number | string>(shift?.graceMinutes ?? shift?.grace_minutes ?? 15);
  const [overnight, setOvernight] = useState(Boolean(shift?.overnight));

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
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
  }, [open, shift]);

  const handleClose = () => {
    if (isLoading) return;
    setError(null);
    onOpenChange(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
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

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (isLoading) return;
        if (!nextOpen) handleClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay
          className="fixed inset-0 z-[90] bg-slate-900/60 backdrop-blur-xs transition-opacity data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
          onPointerDown={(e) => e.stopPropagation()}
        />
        <Dialog.Content
          onPointerDownOutside={(e) => {
            if (isLoading) e.preventDefault();
          }}
          onEscapeKeyDown={(e) => {
            if (isLoading) e.preventDefault();
          }}
          className="fixed left-1/2 top-1/2 z-[100] w-[92vw] max-w-[540px] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
        >
          {/* Dialog Header */}
          <div className="flex items-start justify-between border-b border-slate-100 pb-3.5">
            <div className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Clock className="size-5" />
              </div>
              <div>
                <Dialog.Title className="text-base font-bold text-slate-900">
                  {isEditing ? "Edit Work Shift" : "Create Work Shift"}
                </Dialog.Title>
                <Dialog.Description className="text-xs text-slate-500 mt-0.5">
                  Configure shift schedule timings, break allotments, and overnight rules.
                </Dialog.Description>
              </div>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                disabled={isLoading}
                onClick={handleClose}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label="Close dialog"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </Dialog.Close>
          </div>

          {/* Error Banner */}
          {error && (
            <div
              role="alert"
              className="mt-3.5 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800"
            >
              <AlertCircle className="size-4 shrink-0 text-rose-600 mt-0.5" />
              <p className="font-medium leading-relaxed">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-800" htmlFor="shift-name">
                  Shift Name <span className="text-rose-500">*</span>
                </label>
                <Input
                  id="shift-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Regular Day Shift"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-800" htmlFor="shift-code">
                  Shift Code <span className="text-rose-500">*</span>
                </label>
                <Input
                  id="shift-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. DAY-01, NIGHT"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-800" htmlFor="shift-start">
                  Start Time <span className="text-rose-500">*</span>
                </label>
                <Input
                  id="shift-start"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-800" htmlFor="shift-end">
                  End Time <span className="text-rose-500">*</span>
                </label>
                <Input
                  id="shift-end"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Overnight Toggle */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-2">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={overnight}
                  onChange={(e) => setOvernight(e.target.checked)}
                  disabled={isLoading}
                  className="size-4 rounded border-slate-300 text-primary focus:ring-primary"
                />
                <div className="flex items-center gap-1.5 font-semibold text-xs text-slate-900">
                  {overnight ? (
                    <Moon className="size-3.5 text-indigo-600" />
                  ) : (
                    <Sun className="size-3.5 text-amber-600" />
                  )}
                  <span>Overnight Shift (Spans Past Midnight)</span>
                </div>
              </label>
              <p className="text-[11px] text-slate-500 pl-6 leading-relaxed">
                Enable this if this shift starts on one calendar day and ends on the following morning (e.g., 22:00 to 06:00). Attendance tracking will automatically bridge the calendar day.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-800" htmlFor="shift-break">
                  Break Duration (Minutes)
                </label>
                <Input
                  id="shift-break"
                  type="number"
                  min="0"
                  max="480"
                  step="5"
                  value={breakMinutes}
                  onChange={(e) => setBreakMinutes(e.target.value)}
                  disabled={isLoading}
                />
                <p className="text-[10px] text-slate-500">Scheduled unpaid/paid break deduction.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-800" htmlFor="shift-grace">
                  Grace Period (Minutes)
                </label>
                <Input
                  id="shift-grace"
                  type="number"
                  min="0"
                  max="120"
                  step="1"
                  value={graceMinutes}
                  onChange={(e) => setGraceMinutes(e.target.value)}
                  disabled={isLoading}
                />
                <p className="text-[10px] text-slate-500">Allowed late arrival window before penalty.</p>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isLoading}
                onClick={handleClose}
                className="w-full sm:w-auto font-medium"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={isLoading}
                className="w-full sm:w-auto font-semibold shadow-xs"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin mr-1.5" />
                    <span>Saving Shift...</span>
                  </>
                ) : isEditing ? (
                  "Update Shift"
                ) : (
                  "Create Shift"
                )}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
