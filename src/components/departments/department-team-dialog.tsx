"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CustomSelect } from "@/components/ui/custom-select";
import { AlertCircle, AlertTriangle, Layers, X } from "lucide-react";
import type {
  DepartmentRosterMember,
  DepartmentTeamItem,
  DepartmentTeamLeadSummary,
} from "@/modules/departments/types";

interface DepartmentTeamDialogProps {
  open: boolean;
  mode: "create" | "edit";
  departmentId: string;
  departmentName: string;
  initialTeam?: DepartmentTeamItem | null;
  roster?: DepartmentRosterMember[];
  eligibleTeamLeads?: DepartmentTeamLeadSummary[];
  onClose: () => void;
  onSaved: () => void;
}

export function DepartmentTeamDialog({
  open,
  mode,
  departmentId,
  departmentName,
  initialTeam,
  eligibleTeamLeads: propEligibleLeads,
  onClose,
  onSaved,
}: DepartmentTeamDialogProps) {
  const [name, setName] = useState(mode === "edit" && initialTeam ? initialTeam.name : "");
  const [code, setCode] = useState(mode === "edit" && initialTeam ? initialTeam.code : "");
  const [description, setDescription] = useState(
    mode === "edit" && initialTeam ? initialTeam.description || "" : ""
  );
  const [teamLeadEmployeeId, setTeamLeadEmployeeId] = useState<string>(
    mode === "edit" && initialTeam ? initialTeam.teamLeadEmployeeId || "" : ""
  );
  const [status, setStatus] = useState<"active" | "inactive">(
    mode === "edit" && initialTeam ? initialTeam.status : "active"
  );
  const [eligibleTeamLeads, setEligibleTeamLeads] = useState<DepartmentTeamLeadSummary[]>(
    propEligibleLeads || []
  );
  const [isLoadingLeads, setIsLoadingLeads] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setName("");
      setCode("");
      setDescription("");
      setTeamLeadEmployeeId("");
      setStatus("active");
      setError(null);
      return;
    }

    if (mode === "edit" && initialTeam) {
      setName(initialTeam.name);
      setCode(initialTeam.code);
      setDescription(initialTeam.description || "");
      setTeamLeadEmployeeId(initialTeam.teamLeadEmployeeId || "");
      setStatus(initialTeam.status);
    } else {
      setName("");
      setCode("");
      setDescription("");
      setTeamLeadEmployeeId("");
      setStatus("active");
    }
    setError(null);

    if (propEligibleLeads !== undefined) {
      setEligibleTeamLeads(propEligibleLeads);
    } else {
      setIsLoadingLeads(true);
      fetch(
        `/api/app/departments/eligible-team-leads?departmentId=${encodeURIComponent(departmentId)}`
      )
        .then((r) => r.json())
        .then((d) => {
          if (d.success && Array.isArray(d.teamLeads || d.leads)) {
            setEligibleTeamLeads(d.teamLeads || d.leads);
          }
        })
        .catch(() => {
          // Fall back gracefully
        })
        .finally(() => setIsLoadingLeads(false));
    }
  }, [open, mode, initialTeam, departmentId, propEligibleLeads]);

  if (!open) return null;

  const leadOptions = eligibleTeamLeads.map((m) => ({
    value: m.id,
    label: `${m.displayName} (${m.roleTitle || "Team Lead"}) - ${m.employeeId}`,
  }));

  // If editing and the team has an existing lead who isn't currently in the eligible list, retain them
  if (
    mode === "edit" &&
    initialTeam?.teamLeadEmployeeId &&
    !leadOptions.some((opt) => opt.value === initialTeam.teamLeadEmployeeId)
  ) {
    leadOptions.unshift({
      value: initialTeam.teamLeadEmployeeId,
      label: `${initialTeam.teamLeadName || "Current Team Lead"} (Current Assignment)`,
    });
  }

  const selectOptions = isLoadingLeads
    ? [{ value: "", label: "Loading team leads…" }]
    : leadOptions.length === 0
      ? [
          {
            value: "",
            label: "None (No eligible Team Leads available)",
          },
        ]
      : [
          { value: "", label: "None (Unassigned)" },
          ...leadOptions,
        ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const cleanName = name.trim();
    const cleanCode = code.trim().toUpperCase();

    if (!cleanName) {
      setError("Team name is required.");
      return;
    }
    if (!cleanCode) {
      setError("Team code is required.");
      return;
    }
    if (!/^[A-Za-z0-9_-]+$/.test(cleanCode)) {
      setError("Team code can only contain letters, numbers, hyphens, and underscores.");
      return;
    }

    setIsSubmitting(true);
    try {
      const url =
        mode === "create"
          ? `/api/app/departments/${departmentId}/teams`
          : `/api/app/departments/${departmentId}/teams/${initialTeam!.id}`;

      const method = mode === "create" ? "POST" : "PATCH";

      const bodyPayload = {
        name: cleanName,
        code: cleanCode,
        description: description.trim() || undefined,
        teamLeadEmployeeId: teamLeadEmployeeId || null,
        ...(mode === "edit" ? { status } : {}),
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyPayload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || `Failed to ${mode} team.`);
      }

      onSaved();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : `Failed to ${mode} team.`);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="team-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in"
    >
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Layers className="size-4.5" />
            </div>
            <div>
              <h2 id="team-dialog-title" className="text-base font-bold text-foreground">
                {mode === "create" ? "Create New Team / Squad" : "Edit Team Details"}
              </h2>
              <p className="text-xs text-muted">
                Scoped to <span className="font-semibold text-foreground">{departmentName}</span>
              </p>
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="team-name" className="text-xs font-semibold text-foreground">
                Team Name <span className="text-rose-500">*</span>
              </label>
              <Input
                id="team-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Talent Operations Squad"
                required
                maxLength={120}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="team-code" className="text-xs font-semibold text-foreground">
                Team Code <span className="text-rose-500">*</span>
              </label>
              <Input
                id="team-code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. HR-OPS"
                required
                maxLength={40}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Team Lead (Optional)
            </label>
            <CustomSelect
              value={teamLeadEmployeeId}
              onChange={(val) => setTeamLeadEmployeeId(val)}
              options={selectOptions}
              placeholder={
                isLoadingLeads
                  ? "Loading team leads…"
                  : leadOptions.length === 0
                    ? "No eligible Team Leads available"
                    : "Select a team lead…"
              }
              searchable={leadOptions.length > 5}
              searchPlaceholder="Search eligible team leads…"
              emptyMessage="No eligible Team Leads available in this organization."
            />
            {leadOptions.length === 0 && !isLoadingLeads && (
              <div
                role="status"
                data-testid="team-lead-empty-state"
                className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/90 p-2.5 text-xs text-amber-800 mt-1"
              >
                <AlertCircle className="size-4 shrink-0 text-amber-600 mt-0.5" />
                <p className="leading-relaxed">
                  No eligible Team Leads are available in this organization. Employees must have the active Team Lead (<span className="font-semibold">TEAM_LEAD</span>) role to be assigned.
                </p>
              </div>
            )}
            {eligibleTeamLeads.length > 0 && (
              <ul className="sr-only" data-testid="eligible-team-leads-list" aria-label="Eligible Team Leads">
                {eligibleTeamLeads.map((lead) => (
                  <li key={lead.id} data-employee-id={lead.employeeId}>
                    {lead.displayName} ({lead.roleTitle || "Team Lead"}) - {lead.employeeId}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {mode === "edit" ? (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Status</label>
                <CustomSelect
                  value={status}
                  onChange={(val) => setStatus(val as "active" | "inactive")}
                  options={[
                    { value: "active", label: "Active" },
                    { value: "inactive", label: "Inactive" },
                  ]}
                />
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Status</label>
                <div className="h-9 px-3 flex items-center rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-600 font-medium">
                  Active (Default)
                </div>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="team-desc" className="text-xs font-semibold text-foreground">
              Description (Optional)
            </label>
            <textarea
              id="team-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              maxLength={500}
              placeholder="Primary responsibilities and mandate of this squad…"
              className="w-full rounded-lg border border-input bg-surface px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (mode === "create" ? "Creating…" : "Saving…") : mode === "create" ? "Create Team" : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
