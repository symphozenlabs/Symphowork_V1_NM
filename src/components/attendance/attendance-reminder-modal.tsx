"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Clock, Calendar, AlertCircle, X, ArrowRight } from "lucide-react";

interface ReminderData {
  eligible: boolean;
  completed?: boolean;
  required?: boolean;
  workDate?: string;
  shift?: {
    id: string;
    name: string;
    code: string;
    startTime: string;
    endTime: string;
    overnight: boolean;
  };
}

export function AttendanceReminderModal() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<ReminderData | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function checkReminder() {
      try {
        const res = await fetch("/api/app/attendance/reminder");
        const json = await res.json().catch(() => ({}));
        if (!isMounted || !json.success) return;

        if (json.eligible && json.required && !json.completed && json.workDate) {
          const dismissalKey = `sw_attendance_reminder_dismissed_${json.workDate}`;
          const isDismissed = localStorage.getItem(dismissalKey) === "dismissed";

          setData(json);
          if (!isDismissed) {
            setIsOpen(true);
          }
        }
      } catch {
        // Fail gracefully without interrupting workflow
      }
    }

    void checkReminder();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleDismiss = () => {
    if (data?.workDate) {
      const dismissalKey = `sw_attendance_reminder_dismissed_${data.workDate}`;
      localStorage.setItem(dismissalKey, "dismissed");
    }
    setIsOpen(false);
  };

  const handleNavigate = () => {
    handleDismiss();
    router.push("/app/attendance");
  };

  if (!isOpen || !data?.shift || !data?.workDate) {
    return null;
  }

  const shiftDisplay = `${data.shift.startTime.slice(0, 5)} – ${data.shift.endTime.slice(0, 5)}`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="attendance-reminder-title"
      aria-describedby="attendance-reminder-desc"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
        {/* Close Button in corner */}
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Close reminder modal"
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <X className="size-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-200/80">
            <Clock className="size-5" />
          </div>
          <div>
            <h2
              id="attendance-reminder-title"
              className="text-base font-bold text-slate-900"
            >
              Daily Attendance Reminder
            </h2>
            <p className="text-xs text-slate-500">Action Required for Today&apos;s Workday</p>
          </div>
        </div>

        {/* Modal Body */}
        <div className="space-y-3.5 text-xs text-slate-600">
          <p id="attendance-reminder-desc" className="leading-relaxed">
            You have not recorded attendance for your scheduled shift today. Please punch in to accurately capture your work hours and maintain compliance with organization attendance policies.
          </p>

          {/* Shift Details Box */}
          <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-3.5 space-y-2 text-indigo-950">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-600">Assigned Shift:</span>
              <span className="font-bold text-indigo-900">{data.shift.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-600">Shift Window:</span>
              <span className="font-mono font-bold text-indigo-950 bg-white/80 px-2 py-0.5 rounded border border-indigo-200 text-[11px]">
                {shiftDisplay}
                {data.shift.overnight ? " (Overnight)" : ""}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-600">Work Date:</span>
              <span className="font-medium text-slate-800 flex items-center gap-1">
                <Calendar className="size-3.5 text-indigo-600" />
                {data.workDate}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-amber-700 bg-amber-50/70 p-2.5 rounded-lg border border-amber-200/60">
            <AlertCircle className="size-4 shrink-0 text-amber-600" />
            <span>Closing this modal will not resolve the notification badge until you punch attendance.</span>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
          <Button
            type="button"
            variant="ghost"
            onClick={handleDismiss}
            className="w-full sm:w-auto text-xs text-slate-600 hover:bg-slate-100"
          >
            Close
          </Button>
          <Button
            type="button"
            onClick={handleNavigate}
            className="w-full sm:w-auto text-xs font-bold gap-1.5 shadow-xs"
          >
            Go to Attendance
            <ArrowRight className="size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
