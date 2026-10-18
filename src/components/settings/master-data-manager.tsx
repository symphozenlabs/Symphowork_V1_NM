"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ShiftFormDialog, type ShiftData } from "@/components/settings/shift-form-dialog";
import { MasterDataEditDialog, type MasterDataItem } from "@/components/settings/master-data-edit-dialog";
import { AlertCircle, Clock, Moon, Plus, Sun } from "lucide-react";

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

export function MasterDataManager() {
  const [items, setItems] = useState<Record<string, Item[]>>({});
  const [drafts, setDrafts] = useState<Record<string, { first: string; second: string }>>({});
  const [busy, setBusy] = useState<string>();
  const [error, setError] = useState<string>();

  // Modals state
  const [shiftModalOpen, setShiftModalOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<ShiftData | null>(null);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<{
    resource: string;
    label: string;
    item: MasterDataItem;
  } | null>(null);

  const [deactivateConfirmOpen, setDeactivateConfirmOpen] = useState(false);
  const [deactivatingItem, setDeactivatingItem] = useState<{
    resource: string;
    endpoint: string;
    item: Item;
  } | null>(null);
  const [isDeactivating, setIsDeactivating] = useState(false);

  const { showToast } = useToast();

  const load = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

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

  return (
    <div className="space-y-6">
      {error && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800"
        >
          <AlertCircle className="size-4 shrink-0 text-rose-600 mt-0.5" />
          <p className="font-medium">{error}</p>
        </div>
      )}

      {configs.map(([label, endpoint, resource, firstLabel, secondLabel]) => {
        const rows = items[endpoint] ?? [];
        const isShiftsSection = resource === "shifts";
        const draft = drafts[endpoint] ?? { first: "", second: "" };

        return (
          <section
            key={endpoint}
            className="rounded-2xl border border-border/80 bg-surface p-5 shadow-xs"
          >
            {/* Header */}
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-foreground">{label}</h2>
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
                    {rows.length} configured
                  </span>
                </div>
                <p className="text-xs text-muted mt-0.5">
                  {isShiftsSection
                    ? "Configure operational work hours, break parameters, and overnight schedules."
                    : `Manage ${label.toLowerCase()} available across your organization.`}
                </p>
              </div>

              {isShiftsSection ? (
                <Button
                  onClick={handleOpenCreateShift}
                  size="sm"
                  className="gap-1.5 font-semibold shrink-0"
                >
                  <Plus className="size-4" />
                  <span>Create Shift</span>
                </Button>
              ) : (
                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                  {resource === "workingDays" ? (
                    <>
                      <select
                        aria-label="Select day of week"
                        value={draft.first}
                        onChange={(e) =>
                          setDrafts({
                            ...drafts,
                            [endpoint]: { ...draft, first: e.target.value },
                          })
                        }
                        className="h-9 rounded-lg border border-border bg-surface px-3 text-xs"
                      >
                        <option value="">Select day</option>
                        {DAY_NAMES.map((name, idx) => (
                          <option key={idx} value={String(idx)}>
                            {name}
                          </option>
                        ))}
                      </select>
                      <select
                        aria-label="Is working day"
                        value={draft.second}
                        onChange={(e) =>
                          setDrafts({
                            ...drafts,
                            [endpoint]: { ...draft, second: e.target.value },
                          })
                        }
                        className="h-9 rounded-lg border border-border bg-surface px-3 text-xs"
                      >
                        <option value="true">Working Day</option>
                        <option value="false">Non-working Day</option>
                      </select>
                    </>
                  ) : resource === "holidays" ? (
                    <>
                      <Input
                        aria-label={`${label} ${firstLabel}`}
                        placeholder={firstLabel}
                        value={draft.first}
                        onChange={(e) =>
                          setDrafts({
                            ...drafts,
                            [endpoint]: { ...draft, first: e.target.value },
                          })
                        }
                        className="h-9 text-xs"
                      />
                      <Input
                        aria-label={`${label} ${secondLabel}`}
                        type="date"
                        value={draft.second}
                        onChange={(e) =>
                          setDrafts({
                            ...drafts,
                            [endpoint]: { ...draft, second: e.target.value },
                          })
                        }
                        className="h-9 text-xs"
                      />
                    </>
                  ) : (
                    <>
                      <Input
                        aria-label={`${label} ${firstLabel}`}
                        placeholder={firstLabel}
                        value={draft.first}
                        onChange={(e) =>
                          setDrafts({
                            ...drafts,
                            [endpoint]: { ...draft, first: e.target.value },
                          })
                        }
                        className="h-9 text-xs"
                      />
                      <Input
                        aria-label={`${label} ${secondLabel}`}
                        placeholder={secondLabel}
                        value={draft.second}
                        onChange={(e) =>
                          setDrafts({
                            ...drafts,
                            [endpoint]: {
                              ...draft,
                              second: e.target.value.toUpperCase(),
                            },
                          })
                        }
                        className="h-9 text-xs"
                      />
                    </>
                  )}
                  <Button
                    size="sm"
                    disabled={busy === endpoint || !draft.first || !draft.second}
                    onClick={() => void create(endpoint, resource)}
                    className="shrink-0"
                  >
                    Add
                  </Button>
                </div>
              )}
            </div>

            {/* Content List */}
            <div className="mt-4 space-y-2">
              {rows.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-200 p-5 text-center text-xs text-muted">
                  No {label.toLowerCase()} configured yet.
                </p>
              ) : (
                rows.map((item) => {
                  const isInactive = item.status === "inactive";
                  const start = item.startTime || item.start_time;
                  const end = item.endTime || item.end_time;
                  const displaySchedule =
                    start && end ? `${start.slice(0, 5)} – ${end.slice(0, 5)}` : null;

                  return (
                    <div
                      key={item.id}
                      className={`flex flex-col gap-2 rounded-xl border p-3 text-xs sm:flex-row sm:items-center sm:justify-between transition-colors ${
                        isInactive
                          ? "border-slate-200/60 bg-slate-50/50 opacity-60"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      {/* Left: Metadata */}
                      <div className="flex flex-wrap items-center gap-2">
                        {isShiftsSection && (
                          <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <Clock className="size-3.5" />
                          </div>
                        )}

                        <span className="font-semibold text-foreground text-sm">
                          {item.name ??
                            (item.dayOfWeek !== undefined
                              ? DAY_NAMES[item.dayOfWeek]
                              : item.holidayDate || item.holiday_date)}
                        </span>

                        {item.code && (
                          <span className="rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-700">
                            {item.code}
                          </span>
                        )}

                        {/* Shift schedule indicators */}
                        {isShiftsSection && displaySchedule && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 border border-emerald-200/70 px-2 py-0.5 font-semibold text-emerald-800 text-[11px]">
                            <span>🕒</span>
                            <span>{displaySchedule}</span>
                          </span>
                        )}

                        {isShiftsSection && item.overnight && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 border border-indigo-200/70 px-2 py-0.5 font-semibold text-indigo-800 text-[11px]">
                            <Moon className="size-3" />
                            <span>Overnight</span>
                          </span>
                        )}

                        {isShiftsSection && (
                          <span className="text-[11px] text-muted">
                            Break: {item.breakMinutes ?? item.break_minutes ?? 60}m · Grace:{" "}
                            {item.graceMinutes ?? item.grace_minutes ?? 15}m
                          </span>
                        )}

                        {item.isWorkingDay !== undefined && (
                          <span
                            className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                              item.isWorkingDay
                                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                : "bg-slate-100 text-slate-600 border border-slate-200"
                            }`}
                          >
                            {item.isWorkingDay ? "Working day" : "Non-working day"}
                          </span>
                        )}

                        {isInactive && (
                          <span className="rounded-md bg-rose-50 border border-rose-200 px-1.5 py-0.5 font-semibold text-rose-700 text-[10px]">
                            Inactive
                          </span>
                        )}
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                        {!isInactive && (
                          <Button
                            aria-label={`Edit ${label} item`}
                            variant="ghost"
                            size="sm"
                            className="h-8 text-xs font-semibold text-slate-700 hover:text-foreground"
                            disabled={busy === item.id}
                            onClick={() => handleOpenEdit(resource, label, item)}
                          >
                            Edit
                          </Button>
                        )}

                        {resource !== "workingDays" && !isInactive && (
                          <Button
                            aria-label={`Deactivate ${label} item`}
                            variant="ghost"
                            size="sm"
                            className="h-8 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                            disabled={busy === item.id}
                            onClick={() =>
                              handleOpenDeactivate(resource, endpoint, item)
                            }
                          >
                            Deactivate
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        );
      })}

      {/* Customized Shift Create & Edit Modal */}
      <ShiftFormDialog
        open={shiftModalOpen}
        onOpenChange={setShiftModalOpen}
        shift={editingShift}
        onSuccess={() => {
          showToast({
            type: "success",
            title: editingShift ? "Shift updated" : "Shift created",
            message: editingShift
              ? `Updated shift "${editingShift.name}".`
              : "New work shift added successfully.",
          });
          void load();
        }}
      />

      {/* Customized Master Data Edit Modal */}
      <MasterDataEditDialog
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        resource={editingItem?.resource ?? ""}
        label={editingItem?.label ?? "Item"}
        item={editingItem?.item ?? null}
        onSuccess={() => {
          showToast({
            type: "success",
            title: "Updated",
            message: `Updated ${editingItem?.label ?? "item"} successfully.`,
          });
          void load();
        }}
      />

      {/* Customized Deactivation Confirmation Modal */}
      <ConfirmDialog
        open={deactivateConfirmOpen}
        onOpenChange={setDeactivateConfirmOpen}
        title={`Deactivate ${deactivatingItem?.item.name || deactivatingItem?.item.code || "Item"}?`}
        description={
          <div className="space-y-1.5">
            <p>
              Are you sure you want to deactivate{" "}
              <strong className="text-slate-900">
                {deactivatingItem?.item.name || deactivatingItem?.item.code}
              </strong>
              ?
            </p>
            <p className="text-amber-800 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
              Existing employee profiles and attendance history will preserve their references, but this item will no longer be offered for new assignments.
            </p>
          </div>
        }
        confirmText="Deactivate Item"
        cancelText="Cancel"
        variant="destructive"
        isLoading={isDeactivating}
        onConfirm={executeDeactivate}
      />
    </div>
  );
}
