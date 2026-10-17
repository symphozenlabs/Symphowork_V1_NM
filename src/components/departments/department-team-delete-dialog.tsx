"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Trash2, X } from "lucide-react";
import type { DepartmentTeamItem } from "@/modules/departments/types";

interface DepartmentTeamDeleteDialogProps {
  open: boolean;
  departmentId: string;
  team: DepartmentTeamItem | null;
  onClose: () => void;
  onDeleted: () => void;
}

export function DepartmentTeamDeleteDialog({
  open,
  departmentId,
  team,
  onClose,
  onDeleted,
}: DepartmentTeamDeleteDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setError(null);
      setIsDeleting(false);
    }
  }, [open]);

  if (!open || !team) return null;

  async function handleDelete() {
    if (!team) return;
    setError(null);
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/app/departments/${departmentId}/teams/${team.id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || "Failed to deactivate team.");
      }

      onDeleted();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to deactivate team.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="team-delete-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in"
    >
      <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
              <Trash2 className="size-4.5" />
            </div>
            <div>
              <h2 id="team-delete-dialog-title" className="text-base font-bold text-foreground">
                Deactivate Team
              </h2>
              <p className="text-xs text-muted">Archive functional squad</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            aria-label="Close dialog"
          >
            <X className="size-4" />
          </button>
        </div>

        {error && (
          <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
            <AlertTriangle className="size-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-2 text-xs text-slate-600 leading-relaxed">
          <p>
            Are you sure you want to deactivate <span className="font-bold text-foreground">{team.name}</span> ({team.code})?
          </p>
          <p className="rounded-lg bg-amber-50 p-2.5 text-amber-800 border border-amber-200">
            Deactivating marks this team as inactive. Employees assigned to this squad will retain their historical records.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? "Deactivating…" : "Deactivate Team"}
          </Button>
        </div>
      </div>
    </div>
  );
}
