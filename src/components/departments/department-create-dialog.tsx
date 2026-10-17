"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CustomSelect } from "@/components/ui/custom-select";
import { AlertTriangle, Building2, X } from "lucide-react";
import type { DepartmentManagerSummary } from "@/modules/departments/types";

interface DepartmentCreateDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function DepartmentCreateDialog({
  open,
  onClose,
  onCreated,
}: DepartmentCreateDialogProps) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [headEmployeeId, setHeadEmployeeId] = useState<string>("");
  const [eligibleManagers, setEligibleManagers] = useState<DepartmentManagerSummary[]>([]);
  const [isLoadingManagers, setIsLoadingManagers] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setName("");
      setCode("");
      setDescription("");
      setHeadEmployeeId("");
      setError(null);
      return;
    }

    async function loadManagers() {
      setIsLoadingManagers(true);
      try {
        const res = await fetch("/api/app/departments/eligible-managers");
        const data = await res.json();
        if (data.success && Array.isArray(data.managers)) {
          setEligibleManagers(data.managers);
        }
      } catch {
        // Fall back gracefully
      } finally {
        setIsLoadingManagers(false);
      }
    }

    void loadManagers();
  }, [open]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const cleanName = name.trim();
    const cleanCode = code.trim().toUpperCase();

    if (!cleanName) {
      setError("Department name is required.");
      return;
    }
    if (!cleanCode) {
      setError("Department code is required.");
      return;
    }
    if (!/^[A-Za-z0-9_-]+$/.test(cleanCode)) {
      setError("Department code can only contain letters, numbers, hyphens, and underscores.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/app/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: cleanName,
          code: cleanCode,
          description: description.trim() || undefined,
          headEmployeeId: headEmployeeId || null,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || "Failed to create department.");
      }

      onCreated();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create department.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-dept-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-surface p-6 shadow-xl sm:p-7 space-y-5">
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Building2 className="size-5" />
            </div>
            <div>
              <h2 id="create-dept-title" className="text-base font-bold text-foreground">
                Create Department
              </h2>
              <p className="text-xs text-muted">
                Add a new operational department to your company hierarchy.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Close dialog"
          >
            <X className="size-4" />
          </button>
        </div>

        {error && (
          <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800">
            <AlertTriangle className="size-4 shrink-0 text-rose-600 mt-0.5" />
            <p className="font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground" htmlFor="dept-name">
              Department Name <span className="text-rose-500">*</span>
            </label>
            <Input
              id="dept-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Engineering, Sales, Human Resources"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground" htmlFor="dept-code">
              Department Code <span className="text-rose-500">*</span>
            </label>
            <Input
              id="dept-code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. ENG, SALES, HR, FIN"
              required
            />
            <p className="text-[11px] text-muted">
              Unique identifier used in employee IDs, expense policies, and team scopes.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground" htmlFor="dept-manager">
              Department Manager <span className="text-xs font-normal text-muted">(optional)</span>
            </label>
            <CustomSelect
              value={headEmployeeId}
              onChange={(val) => setHeadEmployeeId(val)}
              options={[
                { value: "", label: "None (Unassigned)" },
                ...eligibleManagers.map((m) => ({
                  value: m.id,
                  label: `${m.displayName} (${m.roleTitle || "Manager"}) - ${m.employeeId}`,
                })),
              ]}
              placeholder={isLoadingManagers ? "Loading managers…" : "Select a department manager…"}
              searchable={eligibleManagers.length > 5}
              searchPlaceholder="Search active managers…"
              emptyMessage="No eligible managers found."
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground" htmlFor="dept-desc">
              Description <span className="text-xs font-normal text-muted">(optional)</span>
            </label>
            <textarea
              id="dept-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Brief description of the department's mandate and scope…"
              className="w-full rounded-lg border border-input bg-surface px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating…" : "Create Department"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
