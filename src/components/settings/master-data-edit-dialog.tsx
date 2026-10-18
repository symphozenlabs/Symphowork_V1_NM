"use client";

import React, { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { AlertCircle, Edit2, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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

export interface MasterDataEditDialogProps {
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

export function MasterDataEditDialog({
  open,
  onOpenChange,
  resource,
  label,
  item,
  onSuccess,
}: MasterDataEditDialogProps) {
  const [name, setName] = useState(item?.name ?? "");
  const [code, setCode] = useState(item?.code ?? "");
  const [holidayDate, setHolidayDate] = useState(item?.holidayDate || item?.holiday_date || "");
  const [isWorkingDay, setIsWorkingDay] = useState(
    item?.isWorkingDay !== undefined
      ? Boolean(item.isWorkingDay)
      : item?.is_working_day !== undefined
        ? Boolean(item.is_working_day)
        : true
  );
  const [description, setDescription] = useState(item?.description ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
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
  }, [open, item]);

  const handleClose = () => {
    if (isLoading) return;
    setError(null);
    onOpenChange(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
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

  if (!item) return null;

  const dayIndex = item.dayOfWeek ?? item.day_of_week;
  const dayName = dayIndex !== undefined ? DAY_NAMES[dayIndex] : undefined;

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
          className="fixed left-1/2 top-1/2 z-[100] w-[92vw] max-w-[480px] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
        >
          {/* Dialog Header */}
          <div className="flex items-start justify-between border-b border-slate-100 pb-3.5">
            <div className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Edit2 className="size-4.5" />
              </div>
              <div>
                <Dialog.Title className="text-base font-bold text-slate-900">
                  Edit {label}
                </Dialog.Title>
                <Dialog.Description className="text-xs text-slate-500 mt-0.5">
                  Update configuration details for this master data record.
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
            {resource === "workingDays" ? (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-800">Day of the Week</label>
                  <p className="font-bold text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                    {dayName ?? "Day"}
                  </p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-800" htmlFor="working-status">
                    Schedule Status
                  </label>
                  <select
                    id="working-status"
                    value={String(isWorkingDay)}
                    onChange={(e) => setIsWorkingDay(e.target.value === "true")}
                    disabled={isLoading}
                    className="w-full h-10 rounded-lg border border-slate-200 bg-surface px-3 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <option value="true">Working Day</option>
                    <option value="false">Non-working Day (Weekend / Off)</option>
                  </select>
                </div>
              </div>
            ) : resource === "holidays" ? (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-800" htmlFor="holiday-name">
                    Holiday Name <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    id="holiday-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Independence Day, New Year's Day"
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-800" htmlFor="holiday-date">
                    Holiday Date <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    id="holiday-date"
                    type="date"
                    value={holidayDate}
                    onChange={(e) => setHolidayDate(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-800" htmlFor="item-name">
                    Name <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    id="item-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={`e.g. ${label} Name`}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-800" htmlFor="item-code">
                    Code <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    id="item-code"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="e.g. CODE-01"
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-800" htmlFor="item-desc">
                    Description <span className="text-xs text-muted font-normal">(optional)</span>
                  </label>
                  <textarea
                    id="item-desc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    placeholder="Optional details or operational scope..."
                    disabled={isLoading}
                    className="w-full rounded-lg border border-slate-200 bg-surface px-3 py-2 text-xs text-foreground placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
                  />
                </div>
              </div>
            )}

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
                    <span>Saving...</span>
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
