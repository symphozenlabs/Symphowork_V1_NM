"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertTriangle, Archive, Loader2, ShieldAlert, Trash2, X } from "lucide-react";
import type { DepartmentDeletionSafety } from "@/modules/departments/types";

interface DepartmentDeleteDialogProps {
  open: boolean;
  departmentId: string;
  departmentName: string;
  departmentCode: string;
  onClose: () => void;
  onDeleted: () => void;
}

export function DepartmentDeleteDialog({
  open,
  departmentId,
  departmentName,
  departmentCode,
  onClose,
  onDeleted,
}: DepartmentDeleteDialogProps) {
  const [safety, setSafety] = useState<DepartmentDeletionSafety | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmInput, setConfirmInput] = useState("");

  useEffect(() => {
    if (!open) {
      setSafety(null);
      setIsLoading(true);
      setError(null);
      setConfirmInput("");
      return;
    }

    async function checkSafety() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/app/departments/${departmentId}/deletion-check`);
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error?.message || "Failed to inspect department dependencies.");
        }
        setSafety(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Unable to verify deletion safety.");
      } finally {
        setIsLoading(false);
      }
    }

    void checkSafety();
  }, [open, departmentId]);

  if (!open) return null;

  async function handleDelete(forceSoft = false) {
    setIsDeleting(true);
    setError(null);
    try {
      const url = `/api/app/departments/${departmentId}${forceSoft ? "?mode=soft" : ""}`;
      const res = await fetch(url, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || "Failed to execute department deletion.");
      }
      onDeleted();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete department.");
    } finally {
      setIsDeleting(false);
    }
  }

  const isConfirmed = confirmInput.trim().toUpperCase() === departmentCode.toUpperCase();

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="relative w-full max-w-lg rounded-2xl border border-rose-200 bg-surface p-6 shadow-2xl sm:p-7 space-y-5">
        <div className="flex items-start justify-between border-b border-rose-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
              <Trash2 className="size-5" />
            </div>
            <div>
              <h2 id="delete-dialog-title" className="text-base font-bold text-foreground">
                Delete Department
              </h2>
              <p className="text-xs text-muted">
                {departmentName} ({departmentCode})
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

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8 text-center space-y-3">
            <Loader2 className="size-6 animate-spin text-primary" />
            <p className="text-xs text-muted">Checking workforce assignments and workflow dependencies…</p>
          </div>
        ) : (
          <div className="space-y-4">
            {error && (
              <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800">
                <AlertTriangle className="size-4 shrink-0 text-rose-600 mt-0.5" />
                <p className="font-medium">{error}</p>
              </div>
            )}

            {safety && !safety.safe ? (
              // Deletion Blocked State
              <div className="space-y-3.5">
                <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4 text-xs text-amber-900 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-amber-950">
                    <ShieldAlert className="size-4 text-amber-700" />
                    <span>Permanent Deletion Blocked</span>
                  </div>
                  <p className="leading-relaxed">
                    This department cannot be permanently deleted because active organizational records depend on it:
                  </p>
                  <ul className="list-disc pl-4 space-y-1 font-medium text-amber-800">
                    {safety.reasons.map((reason, idx) => (
                      <li key={idx}>{reason}</li>
                    ))}
                  </ul>
                  <p className="text-[11px] text-amber-700 pt-1">
                    To maintain data integrity, you must either reassign these resources in the Workforce Directory first, or archive/deactivate this department instead.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                  <Button type="button" variant="outline" onClick={onClose} disabled={isDeleting}>
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    onClick={() => void handleDelete(true)}
                    disabled={isDeleting}
                    className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white"
                  >
                    <Archive className="size-4 mr-1.5" />
                    {isDeleting ? "Deactivating…" : "Deactivate (Safe Archive)"}
                  </Button>
                </div>
              </div>
            ) : (
              // Safe Deletion State
              <div className="space-y-3.5">
                <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-4 text-xs text-rose-900 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-rose-950">
                    <AlertTriangle className="size-4 text-rose-600" />
                    <span>Warning: Destructive Action</span>
                  </div>
                  <p className="leading-relaxed">
                    This department currently has no assigned active employees or open requisitions. Permanently deleting it will remove the department record from your workspace.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-foreground">
                    Type <span className="font-mono font-bold text-rose-600">{departmentCode}</span> to confirm deletion:
                  </label>
                  <Input
                    value={confirmInput}
                    onChange={(e) => setConfirmInput(e.target.value)}
                    placeholder={`Type ${departmentCode} here`}
                    className="font-mono text-xs border-rose-300 focus:border-rose-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                  <Button type="button" variant="outline" onClick={onClose} disabled={isDeleting}>
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => void handleDelete(false)}
                    disabled={isDeleting || !isConfirmed}
                  >
                    {isDeleting ? "Deleting…" : "Permanently Delete Department"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
