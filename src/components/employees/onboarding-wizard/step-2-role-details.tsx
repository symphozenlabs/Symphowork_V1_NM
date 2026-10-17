"use client";

import React, { useEffect, useState } from "react";
import { User, Building2, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { CustomSelect } from "@/components/ui/custom-select";
import { ROLE_METADATA } from "@/modules/rbac/permissions";
import type {
  OnboardingWizardFormState,
  MasterDataItem,
  ManagerSummary,
} from "./types";

interface Step2RoleDetailsProps {
  form: OnboardingWizardFormState;
  onChange: (patch: Partial<OnboardingWizardFormState>) => void;
  errors: Record<string, string>;
}

export function Step2RoleDetails({
  form,
  onChange,
  errors,
}: Step2RoleDetailsProps) {
  const roleMeta = ROLE_METADATA[form.targetRole] || ROLE_METADATA.EMPLOYEE;

  // Master data states
  const [departments, setDepartments] = useState<MasterDataItem[]>([]);
  const [designations, setDesignations] = useState<MasterDataItem[]>([]);
  const [teams, setTeams] = useState<MasterDataItem[]>([]);
  const [locations, setLocations] = useState<MasterDataItem[]>([]);
  const [shifts, setShifts] = useState<MasterDataItem[]>([]);
  const [employmentTypes, setEmploymentTypes] = useState<MasterDataItem[]>([]);
  const [managers, setManagers] = useState<ManagerSummary[]>([]);
  const [isLoadingMasterData, setIsLoadingMasterData] = useState(false);
  const [isLoadingTeams, setIsLoadingTeams] = useState(false);
  const [teamError, setTeamError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadMasterData() {
      setIsLoadingMasterData(true);
      try {
        const [
          deptRes,
          desigRes,
          locRes,
          shiftRes,
          typeRes,
          empRes,
        ] = await Promise.allSettled([
          fetch("/api/app/master-data/departments").then((r) => r.json()),
          fetch("/api/app/master-data/designations").then((r) => r.json()),
          fetch("/api/app/master-data/locations").then((r) => r.json()),
          fetch("/api/app/master-data/shifts").then((r) => r.json()),
          fetch("/api/app/master-data/employment-types").then((r) => r.json()),
          fetch("/api/app/employees?pageSize=100").then((r) => r.json()),
        ]);

        if (!isMounted) return;

        if (deptRes.status === "fulfilled" && deptRes.value.items) {
          setDepartments(deptRes.value.items);
        }
        if (desigRes.status === "fulfilled" && desigRes.value.items) {
          setDesignations(desigRes.value.items);
        }
        if (locRes.status === "fulfilled" && locRes.value.items) {
          setLocations(locRes.value.items);
        }
        if (shiftRes.status === "fulfilled" && shiftRes.value.items) {
          setShifts(shiftRes.value.items);
        }
        if (typeRes.status === "fulfilled" && typeRes.value.items) {
          setEmploymentTypes(typeRes.value.items);
        }
        if (empRes.status === "fulfilled" && empRes.value.rows) {
          setManagers(
            empRes.value.rows.map((e: { id: string; displayName: string; employeeId: string }) => ({
              id: e.id,
              displayName: e.displayName,
              employeeId: e.employeeId,
            }))
          );
        }
      } catch {
        // Fall back gracefully if endpoints are restricted or empty
      } finally {
        if (isMounted) setIsLoadingMasterData(false);
      }
    }

    void loadMasterData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch active teams synchronized with selected department
  useEffect(() => {
    let isMounted = true;

    if (!form.departmentId) {
      setTeams([]);
      setIsLoadingTeams(false);
      setTeamError(null);
      if (form.teamId) {
        onChange({ teamId: "" });
      }
      return;
    }

    async function loadDepartmentTeams() {
      setIsLoadingTeams(true);
      setTeamError(null);
      try {
        const res = await fetch(
          `/api/app/master-data/teams?departmentId=${encodeURIComponent(form.departmentId)}&status=active`
        );
        const data = await res.json();
        if (!isMounted) return;

        if (res.ok && data.success && Array.isArray(data.items)) {
          setTeams(data.items);
          // If the currently selected team does not belong to the newly fetched department teams, clear it
          if (form.teamId && !data.items.some((t: MasterDataItem) => t.id === form.teamId)) {
            onChange({ teamId: "" });
          }
        } else {
          setTeams([]);
          setTeamError(data.error?.message || "Failed to load teams for this department.");
          if (form.teamId) {
            onChange({ teamId: "" });
          }
        }
      } catch {
        if (!isMounted) return;
        setTeams([]);
        setTeamError("Network error loading teams. Please try again.");
        if (form.teamId) {
          onChange({ teamId: "" });
        }
      } finally {
        if (isMounted) {
          setIsLoadingTeams(false);
        }
      }
    }

    void loadDepartmentTeams();

    return () => {
      isMounted = false;
    };
  }, [form.departmentId]);

  const isEmployeeRole = form.targetRole === "EMPLOYEE";
  const isLeadershipRole =
    form.targetRole === "MANAGER" ||
    form.targetRole === "TEAM_LEAD" ||
    form.targetRole === "PROJECT_MANAGER";
  const isHrRole =
    form.targetRole === "HR_ADMIN" || form.targetRole === "HR_EXECUTIVE";
  const isFinanceRole = form.targetRole === "FINANCE_ADMIN";
  const isRecruiterRole = form.targetRole === "RECRUITER";
  const isDeptRequired =
    form.targetRole === "MANAGER" ||
    form.targetRole === "TEAM_LEAD" ||
    form.targetRole === "PROJECT_MANAGER" ||
    form.targetRole === "EMPLOYEE";
  const canAssignShift = form.targetRole !== "ORGANIZATION_OWNER";

  return (
    <div className="space-y-6">
      {/* Header and Role Pill */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-4">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
            {roleMeta.title} Profile Details
          </h2>
          <p className="mt-0.5 text-xs text-muted">
            Configure identity credentials and organizational placement for this {roleMeta.title.toLowerCase()}.
          </p>
        </div>
        <div className="shrink-0">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <span>●</span> {roleMeta.title}
          </span>
        </div>
      </div>

      {/* Role Scope Notice */}
      <div className="rounded-xl border border-slate-200/90 bg-slate-50/70 p-3.5 text-xs text-slate-700 leading-relaxed">
        {isEmployeeRole && (
          <p>
            Standard workforce profile: Collects personal identity, employment terms, department designation, and optional reporting structure.
          </p>
        )}
        {isHrRole && (
          <p>
            People Operations role: Grants access to the Workforce Directory, onboarding lifecycle workflows, and document verifications.
          </p>
        )}
        {isFinanceRole && (
          <p>
            Financial Operations role: Oversees payroll calculation batches, expense claim validations, and reimbursement processing.
          </p>
        )}
        {isLeadershipRole && (
          <p>
            Departmental Leadership role: Manages direct reports, approves leave applications, and coordinates sprint deliverable assignments.
          </p>
        )}
        {isRecruiterRole && (
          <p>
            Talent Acquisition role: Manages ATS job requisitions, candidate evaluation pipelines, and hiring offer workflows.
          </p>
        )}
      </div>

      {/* Section 1: Core Identity (Required for all roles) */}
      <div className="rounded-2xl border border-border/80 bg-white p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <User className="size-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground">
            Identity & Contact Credentials
          </h3>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              First name <span className="text-rose-500">*</span>
            </label>
            <Input
              value={form.firstName}
              onChange={(e) => onChange({ firstName: e.target.value })}
              placeholder="e.g. Arjun"
              className={errors.firstName ? "border-rose-400 focus:border-rose-500" : ""}
            />
            {errors.firstName && (
              <p className="text-[11px] font-medium text-rose-600">{errors.firstName}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Middle name <span className="text-xs text-muted font-normal">(optional)</span>
            </label>
            <Input
              value={form.middleName}
              onChange={(e) => onChange({ middleName: e.target.value })}
              placeholder="e.g. Kumar"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Last name <span className="text-rose-500">*</span>
            </label>
            <Input
              value={form.lastName}
              onChange={(e) => onChange({ lastName: e.target.value })}
              placeholder="e.g. Sharma"
              className={errors.lastName ? "border-rose-400 focus:border-rose-500" : ""}
            />
            {errors.lastName && (
              <p className="text-[11px] font-medium text-rose-600">{errors.lastName}</p>
            )}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Personal email <span className="text-rose-500">*</span>
            </label>
            <Input
              type="email"
              value={form.personalEmail}
              onChange={(e) => onChange({ personalEmail: e.target.value })}
              placeholder="arjun.sharma@example.com"
              className={errors.personalEmail ? "border-rose-400 focus:border-rose-500" : ""}
            />
            <p className="text-[11px] text-muted">
              The invitation link and credential setup instructions will be sent here.
            </p>
            {errors.personalEmail && (
              <p className="text-[11px] font-medium text-rose-600">{errors.personalEmail}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Work email <span className="text-xs text-muted font-normal">(optional)</span>
            </label>
            <Input
              type="email"
              value={form.workEmail}
              onChange={(e) => onChange({ workEmail: e.target.value })}
              placeholder="arjun@company.com"
            />
            <p className="text-[11px] text-muted">
              Corporate email alias for official notifications.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Phone number <span className="text-xs text-muted font-normal">(optional)</span>
            </label>
            <Input
              type="tel"
              value={form.phone}
              onChange={(e) => onChange({ phone: e.target.value })}
              placeholder="+91 98765 43210"
            />
          </div>

          {(isEmployeeRole || isLeadershipRole) && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Joining date <span className="text-xs text-muted font-normal">(optional)</span>
              </label>
              <Input
                type="date"
                value={form.joiningDate}
                onChange={(e) => onChange({ joiningDate: e.target.value })}
              />
            </div>
          )}
        </div>
      </div>

      {/* Section 2: Organizational Placement */}
      <div className="rounded-2xl border border-border/80 bg-white p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Building2 className="size-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground">
            Organizational Hierarchy & Placement
          </h3>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Department */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Department{" "}
              {isDeptRequired ? (
                <span className="text-rose-500">*</span>
              ) : (
                <span className="text-xs text-muted font-normal">(optional)</span>
              )}
            </label>
            <CustomSelect
              value={form.departmentId}
              onChange={(value) => {
                const patch: Partial<OnboardingWizardFormState> = { departmentId: value };
                if (value !== form.departmentId) {
                  patch.teamId = "";
                }
                onChange(patch);
              }}
              options={departments.map((d) => ({
                value: d.id,
                label: `${d.name}${d.code ? ` (${d.code})` : ""}`,
              }))}
              placeholder="Select a department…"
              searchable={departments.length > 6}
              searchPlaceholder="Search departments…"
              emptyMessage="No departments configured yet."
              error={errors.departmentId}
            />
            {departments.length === 0 && !isLoadingMasterData ? (
              isDeptRequired ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-800 flex items-start gap-2">
                  <AlertTriangle className="size-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">No active departments configured</p>
                    <p className="text-[11px] text-amber-700 mt-0.5">
                      An Organization Owner must create at least one department before onboarding a {roleMeta.title.toLowerCase()}.
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-muted">No departments configured yet (optional for {roleMeta.title}).</p>
              )
            ) : null}
            {errors.departmentId && (
              <p className="text-[11px] font-medium text-rose-600">{errors.departmentId}</p>
            )}
          </div>

          {/* Designation */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Designation / Title <span className="text-xs text-muted font-normal">(optional)</span>
            </label>
            <CustomSelect
              value={form.designationId}
              onChange={(value) => onChange({ designationId: value })}
              options={designations.map((d) => ({
                value: d.id,
                label: `${d.name}${d.code ? ` (${d.code})` : ""}`,
              }))}
              placeholder="Select a designation…"
              searchable={designations.length > 6}
              searchPlaceholder="Search designations…"
              emptyMessage="No designations configured yet."
              error={errors.designationId}
            />
          </div>
        </div>

        {/* Team & Location */}
        <div className="grid gap-4 sm:grid-cols-2">
          {(isEmployeeRole || isLeadershipRole) && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Team / Squad <span className="text-xs text-muted font-normal">(optional)</span>
              </label>
              <CustomSelect
                value={form.teamId}
                onChange={(value) => onChange({ teamId: value })}
                options={
                  !form.departmentId
                    ? []
                    : teams.map((t) => ({
                        value: t.id,
                        label: `${t.name}${t.code ? ` (${t.code})` : ""}`,
                      }))
                }
                placeholder={
                  !form.departmentId
                    ? "Select a department first"
                    : isLoadingTeams
                      ? "Loading department teams…"
                      : teamError
                        ? "Error loading teams"
                        : teams.length === 0
                          ? "No teams available in this department"
                          : "Select a team…"
                }
                disabled={!form.departmentId || isLoadingTeams}
                searchable={teams.length > 6}
                searchPlaceholder="Search teams…"
                emptyMessage={
                  !form.departmentId
                    ? "Please select a department first."
                    : teamError
                      ? teamError
                      : "No active teams configured for this department."
                }
                error={errors.teamId}
              />
              {!form.departmentId ? (
                <p className="text-[11px] text-muted">Select a department above to see available teams.</p>
              ) : teamError ? (
                <p className="text-[11px] font-medium text-rose-600">{teamError}</p>
              ) : !isLoadingTeams && teams.length === 0 ? (
                <p className="text-[11px] text-muted">No active teams in this department (optional).</p>
              ) : null}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Location / Office <span className="text-xs text-muted font-normal">(optional)</span>
            </label>
            <CustomSelect
              value={form.locationId}
              onChange={(value) => onChange({ locationId: value })}
              options={locations.map((l) => ({
                value: l.id,
                label: l.name,
              }))}
              placeholder="Select a location…"
              searchable={locations.length > 6}
              searchPlaceholder="Search locations…"
              emptyMessage="No locations configured yet."
              error={errors.locationId}
            />
          </div>
        </div>

        {/* Reporting Manager (For Employee or Leadership) */}
        {(isEmployeeRole || isLeadershipRole) && (
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Reporting Manager <span className="text-xs text-muted font-normal">(optional)</span>
            </label>
            <CustomSelect
              value={form.reportingManagerId}
              onChange={(value) => onChange({ reportingManagerId: value })}
              options={managers.map((m) => ({
                value: m.id,
                label: `${m.displayName} (${m.employeeId})`,
              }))}
              placeholder="Select reporting manager…"
              searchable
              searchPlaceholder="Search managers by name or ID…"
              emptyMessage="No managers available."
              error={errors.reportingManagerId}
            />
          </div>
        )}

        {/* Shift and Employment Type (Operational Workforce Roles) */}
        {canAssignShift && (
          <div className="grid gap-4 sm:grid-cols-2 pt-1 border-t border-slate-100">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Work Shift <span className="text-xs text-muted font-normal">(optional)</span>
              </label>
              <CustomSelect
                value={form.shiftId}
                onChange={(value) => onChange({ shiftId: value })}
                options={shifts.map((s) => ({
                  value: s.id,
                  label: s.name,
                }))}
                placeholder="Standard organization shift"
                searchable={shifts.length > 6}
                searchPlaceholder="Search work shifts…"
                emptyMessage="No custom shifts configured."
                error={errors.shiftId}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Employment Type <span className="text-xs text-muted font-normal">(optional)</span>
              </label>
              <CustomSelect
                value={form.employmentTypeId}
                onChange={(value) => onChange({ employmentTypeId: value })}
                options={employmentTypes.map((t) => ({
                  value: t.id,
                  label: t.name,
                }))}
                placeholder="Full-time regular"
                searchable={employmentTypes.length > 6}
                searchPlaceholder="Search employment types…"
                emptyMessage="No custom types configured."
                error={errors.employmentTypeId}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
