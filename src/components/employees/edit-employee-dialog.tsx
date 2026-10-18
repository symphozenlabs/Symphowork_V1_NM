"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import {
  AlertCircle,
  Building2,
  Calendar,
  Clock,
  Edit3,
  Loader2,
  Lock,
  Moon,
  ShieldCheck,
  Sun,
  User,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CustomSelect, type CustomSelectOption } from "@/components/ui/custom-select";
import { getAssignableRoles, ROLE_METADATA, type SystemRole } from "@/modules/rbac/permissions";
import { isHrDepartment } from "@/modules/departments/validation";
import type { EmployeeDetails } from "@/modules/employees/service";

interface MasterDataItem {
  id: string;
  name: string;
  code?: string;
  status?: string;
  level?: number;
  departmentId?: string;
  department_id?: string;
  startTime?: string;
  start_time?: string;
  endTime?: string;
  end_time?: string;
  breakMinutes?: number;
  break_minutes?: number;
  graceMinutes?: number;
  grace_minutes?: number;
  overnight?: boolean;
}

interface ManagerSummary {
  id: string;
  displayName: string;
  employeeId: string;
  departmentId?: string | null;
}

export interface EditEmployeeDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  employee: EmployeeDetails;
  currentUserRole?: string | null;
  currentUserId?: string;
  isOwnerViewer?: boolean;
  onSuccess?: () => void;
}

export function EditEmployeeDialog({
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  employee,
  currentUserRole,
  isOwnerViewer = false,
  onSuccess,
}: EditEmployeeDialogProps) {
  const router = useRouter();

  // Internal open state if uncontrolled
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;
  const setOpen = (next: boolean) => {
    if (isControlled) {
      controlledOnOpenChange?.(next);
    } else {
      setInternalOpen(next);
    }
  };

  // Target role determination
  const isOwner = isOwnerViewer || currentUserRole === "ORGANIZATION_OWNER";
  const isTargetOwner = employee.roleKey === "ORGANIZATION_OWNER";
  const assignableRoles = getAssignableRoles(isOwner ? "ORGANIZATION_OWNER" : currentUserRole);

  // Form state
  const [firstName, setFirstName] = useState(employee.firstName ?? "");
  const [middleName, setMiddleName] = useState(employee.middleName ?? "");
  const [lastName, setLastName] = useState(employee.lastName ?? "");
  const [personalEmail, setPersonalEmail] = useState(employee.personalEmail ?? "");
  const [workEmail, setWorkEmail] = useState(employee.workEmail ?? "");
  const [phone, setPhone] = useState(employee.phone ?? "");
  const [city, setCity] = useState(employee.city ?? "");
  const [addressLine1, setAddressLine1] = useState(employee.addressLine1 ?? "");
  const [joiningDate, setJoiningDate] = useState(employee.joiningDate ?? "");

  const [departmentId, setDepartmentId] = useState(employee.departmentId ?? "");
  const [designationId, setDesignationId] = useState(employee.designationId ?? "");
  const [targetRole, setTargetRole] = useState(employee.roleKey ?? "EMPLOYEE");
  const [shiftId, setShiftId] = useState(employee.shiftId ?? "");
  const [employmentTypeId, setEmploymentTypeId] = useState(employee.employmentTypeId ?? "");
  const [reportingManagerId, setReportingManagerId] = useState(employee.reportingManagerId ?? "");
  const [teamId, setTeamId] = useState(employee.teamId ?? "");
  const [locationId, setLocationId] = useState(employee.locationId ?? "");
  const [status, setStatus] = useState(employee.status ?? "active");

  // Master data states
  const [departments, setDepartments] = useState<MasterDataItem[]>([]);
  const [designations, setDesignations] = useState<MasterDataItem[]>([]);
  const [shifts, setShifts] = useState<MasterDataItem[]>([]);
  const [employmentTypes, setEmploymentTypes] = useState<MasterDataItem[]>([]);
  const [locations, setLocations] = useState<MasterDataItem[]>([]);
  const [managers, setManagers] = useState<ManagerSummary[]>([]);
  const [teams, setTeams] = useState<MasterDataItem[]>([]);

  const [isLoadingMasterData, setIsLoadingMasterData] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when employee prop or modal open state changes
  useEffect(() => {
    if (isOpen) {
      setFirstName(employee.firstName ?? "");
      setMiddleName(employee.middleName ?? "");
      setLastName(employee.lastName ?? "");
      setPersonalEmail(employee.personalEmail ?? "");
      setWorkEmail(employee.workEmail ?? "");
      setPhone(employee.phone ?? "");
      setCity(employee.city ?? "");
      setAddressLine1(employee.addressLine1 ?? "");
      setJoiningDate(employee.joiningDate ?? "");

      setDepartmentId(employee.departmentId ?? "");
      setDesignationId(employee.designationId ?? "");
      setTargetRole(employee.roleKey ?? "EMPLOYEE");
      setShiftId(employee.shiftId ?? "");
      setEmploymentTypeId(employee.employmentTypeId ?? "");
      setReportingManagerId(employee.reportingManagerId ?? "");
      setTeamId(employee.teamId ?? "");
      setLocationId(employee.locationId ?? "");
      setStatus(employee.status ?? "active");
      setError(null);
    }
  }, [isOpen, employee]);

  // Load master data when dialog opens
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    async function loadData() {
      setIsLoadingMasterData(true);
      try {
        const [deptRes, desigRes, shiftRes, typeRes, locRes, empRes] = await Promise.allSettled([
          fetch("/api/app/master-data/departments").then((r) => r.json()),
          fetch("/api/app/master-data/designations").then((r) => r.json()),
          fetch("/api/app/master-data/shifts").then((r) => r.json()),
          fetch("/api/app/master-data/employment-types").then((r) => r.json()),
          fetch("/api/app/master-data/locations").then((r) => r.json()),
          fetch("/api/app/employees?pageSize=100").then((r) => r.json()),
        ]);

        if (!isMounted) return;

        if (deptRes.status === "fulfilled" && deptRes.value.items) {
          setDepartments(deptRes.value.items);
        }
        if (desigRes.status === "fulfilled" && desigRes.value.items) {
          setDesignations(desigRes.value.items);
        }
        if (shiftRes.status === "fulfilled" && shiftRes.value.items) {
          setShifts(shiftRes.value.items);
        }
        if (typeRes.status === "fulfilled" && typeRes.value.items) {
          setEmploymentTypes(typeRes.value.items);
        }
        if (locRes.status === "fulfilled" && locRes.value.items) {
          setLocations(locRes.value.items);
        }
        if (empRes.status === "fulfilled" && empRes.value.employees) {
          setManagers(
            (empRes.value.employees as { id: string; displayName: string; employeeId: string; departmentId?: string | null }[])
              .filter((m) => m.id !== employee.id)
              .map((m) => ({
                id: m.id,
                displayName: m.displayName,
                employeeId: m.employeeId,
                departmentId: m.departmentId,
              }))
          );
        }
      } catch {
        // Fallback gracefully to existing employee relations
      } finally {
        if (isMounted) setIsLoadingMasterData(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [isOpen, employee.id]);

  // Load teams whenever departmentId changes
  useEffect(() => {
    if (!departmentId || !isOpen) {
      setTeams([]);
      return;
    }

    let isMounted = true;
    async function loadTeams() {
      try {
        const res = await fetch(`/api/app/master-data/teams?departmentId=${encodeURIComponent(departmentId)}`);
        const data = await res.json();
        if (isMounted && data.items) {
          setTeams(data.items);
        }
      } catch {
        if (isMounted) setTeams([]);
      }
    }

    loadTeams();
    return () => {
      isMounted = false;
    };
  }, [departmentId, isOpen]);

  // HR role constraints
  const isSelectedRoleHr = targetRole === "HR_ADMIN" || targetRole === "HR_EXECUTIVE";
  const hrDepartments = departments.filter(isHrDepartment);

  // Sync state if HR role is selected (clear team & location, restrict department)
  useEffect(() => {
    if (isSelectedRoleHr) {
      if (teamId) setTeamId("");
      if (locationId) setLocationId("");
      if (departmentId && hrDepartments.length > 0) {
        const currentDept = departments.find((d) => d.id === departmentId);
        if (currentDept && !isHrDepartment(currentDept)) {
          setDepartmentId(hrDepartments[0]?.id || "");
        }
      }
    }
  }, [isSelectedRoleHr, teamId, locationId, departmentId, departments, hrDepartments]);

  // Selected shift details preview
  const selectedShift = shifts.find((s) => s.id === shiftId) ?? employee.shift;
  const rawShift = selectedShift as (MasterDataItem & { startTime?: string; endTime?: string; breakMinutes?: number; graceMinutes?: number }) | null;
  const shiftStartTime = rawShift?.startTime ?? rawShift?.start_time;
  const shiftEndTime = rawShift?.endTime ?? rawShift?.end_time;
  const shiftBreak = rawShift?.breakMinutes ?? rawShift?.break_minutes;
  const shiftGrace = rawShift?.graceMinutes ?? rawShift?.grace_minutes;
  const shiftOvernight = Boolean(rawShift?.overnight);

  // Form options: For HR roles, restrict department options to HR departments only
  const availableDepartments = isSelectedRoleHr && hrDepartments.length > 0 ? hrDepartments : departments;
  const departmentOptions: CustomSelectOption[] = availableDepartments.map((d) => ({
    value: d.id,
    label: d.name,
    sublabel: d.code ? `${d.code}${d.status === "inactive" ? " (Inactive)" : ""}` : undefined,
  }));

  const designationOptions: CustomSelectOption[] = designations.map((d) => ({
    value: d.id,
    label: d.name,
    sublabel: d.code ? `${d.code}${d.level !== undefined ? ` • L${d.level}` : ""}` : undefined,
  }));

  const shiftOptions: CustomSelectOption[] = shifts.map((s) => {
    const sStart = s.startTime ?? s.start_time;
    const sEnd = s.endTime ?? s.end_time;
    const timeSnippet = sStart && sEnd ? ` (${sStart.slice(0, 5)} - ${sEnd.slice(0, 5)})` : "";
    return {
      value: s.id,
      label: `${s.name}${timeSnippet}`,
      sublabel: s.code ?? undefined,
    };
  });

  const employmentTypeOptions: CustomSelectOption[] = employmentTypes.map((et) => ({
    value: et.id,
    label: et.name,
    sublabel: et.code ?? undefined,
  }));

  const locationOptions: CustomSelectOption[] = [
    { value: "", label: "No specific location" },
    ...locations.map((l) => ({ value: l.id, label: l.name, sublabel: l.code ?? undefined })),
  ];

  const teamOptions: CustomSelectOption[] = [
    { value: "", label: "Not assigned to a team" },
    ...teams.map((t) => ({ value: t.id, label: t.name, sublabel: t.code ?? undefined })),
  ];

  const managerOptions: CustomSelectOption[] = [
    { value: "", label: "Not assigned (Reports to executive leadership)" },
    ...managers.map((m) => ({
      value: m.id,
      label: m.displayName,
      sublabel: `ID: ${m.employeeId}`,
    })),
  ];

  // System role options: only display roles actor is authorized to assign
  const availableRoleKeys: SystemRole[] = isTargetOwner
    ? ["ORGANIZATION_OWNER" as SystemRole]
    : assignableRoles.length > 0
      ? [...assignableRoles]
      : (([targetRole as SystemRole].filter(Boolean) as SystemRole[]));

  // Ensure current target role is included in options so it doesn't vanish
  if (targetRole && !availableRoleKeys.includes(targetRole as SystemRole)) {
    availableRoleKeys.push(targetRole as SystemRole);
  }

  const roleOptions: CustomSelectOption[] = availableRoleKeys.map((rKey) => {
    const meta = ROLE_METADATA[rKey];
    return {
      value: rKey,
      label: meta?.title || rKey,
      sublabel: rKey,
      disabled: isTargetOwner || (!isOwner && !assignableRoles.includes(rKey)),
    };
  });

  const statusOptions: CustomSelectOption[] = [
    { value: "active", label: "Active" },
    { value: "onboarding", label: "Onboarding" },
    { value: "probation", label: "Probation" },
    { value: "confirmed", label: "Confirmed" },
    { value: "notice_period", label: "Notice Period" },
    { value: "inactive", label: "Inactive" },
    { value: "resigned", label: "Resigned" },
    { value: "terminated", label: "Terminated" },
    { value: "invited", label: "Invited" },
  ];

  // Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    // Validation
    const cleanFirstName = firstName.trim();
    const cleanLastName = lastName.trim();

    if (!cleanFirstName) {
      setError("First name is required.");
      return;
    }
    if (!cleanLastName) {
      setError("Last name is required.");
      return;
    }

    if (isSelectedRoleHr && departmentId) {
      const selectedDept = departments.find((d) => d.id === departmentId);
      if (selectedDept && !isHrDepartment(selectedDept)) {
        setError("HR personnel must be assigned to an active Human Resources (HR) department.");
        return;
      }
    }

    if (isSelectedRoleHr && teamId) {
      setError("Team assignments are not permitted for HR personnel.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload: Record<string, unknown> = {
        firstName: cleanFirstName,
        middleName: middleName.trim() || undefined,
        lastName: cleanLastName,
        personalEmail: personalEmail.trim() || undefined,
        workEmail: workEmail.trim() || undefined,
        phone: phone.trim() || undefined,
        city: city.trim() || undefined,
        addressLine1: addressLine1.trim() || undefined,
        joiningDate: joiningDate || undefined,
        departmentId: departmentId || undefined,
        designationId: designationId || undefined,
        shiftId: shiftId || undefined,
        employmentTypeId: employmentTypeId || undefined,
        reportingManagerId: reportingManagerId ? reportingManagerId : null,
        teamId: isSelectedRoleHr ? null : (teamId ? teamId : null),
        locationId: isSelectedRoleHr ? null : (locationId ? locationId : null),
        status,
      };

      // Only include targetRole if it changed and actor is authorized
      if (!isTargetOwner && targetRole && targetRole !== employee.roleKey) {
        payload.targetRole = targetRole;
      }

      const res = await fetch(`/api/app/employees/${employee.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || "Failed to update employee details.");
      }

      setOpen(false);
      onSuccess?.();
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update employee details.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {!isControlled && (
        <Button
          type="button"
          onClick={() => setOpen(true)}
          className="gap-2 font-semibold shadow-xs transition-colors"
          size="sm"
        >
          <Edit3 className="size-3.5" />
          <span>Edit Employee</span>
        </Button>
      )}

      <Dialog.Root open={isOpen} onOpenChange={(next) => !isSubmitting && setOpen(next)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[90] bg-slate-900/60 backdrop-blur-xs transition-opacity data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

          <Dialog.Content className="fixed left-1/2 top-1/2 z-[100] flex max-h-[90vh] sm:max-h-[85vh] w-[95vw] sm:w-[90vw] max-w-2xl lg:max-w-3xl -translate-x-1/2 -translate-y-1/2 flex-col rounded-2xl border border-border/80 bg-white shadow-2xl focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 overflow-hidden">
            {/* Header - Fixed at top */}
            <div className="flex shrink-0 items-center justify-between border-b border-border/60 bg-white px-5 py-3.5 sm:px-6">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Edit3 className="size-4.5" />
                </div>
                <div>
                  <Dialog.Title className="text-base sm:text-lg font-bold text-foreground">
                    Edit Employee Profile
                  </Dialog.Title>
                  <Dialog.Description className="text-xs text-muted">
                    {employee.displayName} • ID: <span className="font-mono">{employee.employeeId}</span>
                  </Dialog.Description>
                </div>
              </div>

              <Dialog.Close asChild>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setOpen(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-40 transition-colors"
                  aria-label="Close"
                >
                  <X className="size-4" />
                </button>
              </Dialog.Close>
            </div>

            {/* Scrollable Form Body with Fixed Footer */}
            <form onSubmit={handleSubmit} className="flex flex-1 flex-col min-h-0 overflow-hidden">
              <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 sm:px-6 space-y-4.5">
                {/* Error Notification Banner */}
                {error && (
                  <div
                    role="alert"
                    className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800"
                  >
                    <AlertCircle className="size-4 shrink-0 text-rose-600 mt-0.5" />
                    <p className="font-medium leading-relaxed">{error}</p>
                  </div>
                )}

                {/* Section 1: Personal Profile & Contact */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted">
                    <User className="size-3.5 text-primary" />
                    <span>Personal Details & Contact</span>
                  </div>

                  {/* Name fields in responsive columns */}
                  <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1">
                        First Name <span className="text-rose-500">*</span>
                      </label>
                      <Input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                        placeholder="e.g. Eleanor"
                        className="h-9 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1">
                        Middle Name
                      </label>
                      <Input
                        type="text"
                        value={middleName}
                        onChange={(e) => setMiddleName(e.target.value)}
                        placeholder="Optional"
                        className="h-9 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1">
                        Last Name <span className="text-rose-500">*</span>
                      </label>
                      <Input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                        placeholder="e.g. Vance"
                        className="h-9 text-xs"
                      />
                    </div>
                  </div>

                  {/* Contact emails */}
                  <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1">
                        Work Email
                      </label>
                      <Input
                        type="email"
                        value={workEmail}
                        onChange={(e) => setWorkEmail(e.target.value)}
                        placeholder="work@organization.com"
                        className="h-9 text-xs font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1">
                        Personal Email
                      </label>
                      <Input
                        type="email"
                        value={personalEmail}
                        onChange={(e) => setPersonalEmail(e.target.value)}
                        placeholder="personal@domain.com"
                        className="h-9 text-xs font-mono"
                      />
                    </div>
                  </div>

                  {/* Phone & City */}
                  <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1">
                        Phone Number
                      </label>
                      <Input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+1 (555) 012-3456"
                        className="h-9 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1">
                        Location / City
                      </label>
                      <Input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="e.g. San Francisco, CA"
                        className="h-9 text-xs"
                      />
                    </div>
                  </div>

                  {/* Address */}
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">
                      Residential Address
                    </label>
                    <Input
                      type="text"
                      value={addressLine1}
                      onChange={(e) => setAddressLine1(e.target.value)}
                      placeholder="Street address"
                      className="h-9 text-xs"
                    />
                  </div>
                </div>

                {/* Section 2: Employment & Organizational Placement */}
                <div className="space-y-3 border-t border-slate-100 pt-4">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted">
                    <Building2 className="size-3.5 text-primary" />
                    <span>Organizational Hierarchy & Placement</span>
                  </div>

                  <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1">
                        Department
                      </label>
                      <CustomSelect
                        value={departmentId}
                        onChange={(val) => {
                          setDepartmentId(val);
                          setTeamId("");
                        }}
                        options={departmentOptions}
                        placeholder={isLoadingMasterData ? "Loading departments…" : "Select Department"}
                        searchable
                        disabled={isLoadingMasterData}
                      />
                      {isSelectedRoleHr && (
                        <p className="mt-1 text-[11px] text-amber-700 font-medium">
                          HR roles must be assigned to an active Human Resources department.
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1">
                        Designation / Job Title
                      </label>
                      <CustomSelect
                        value={designationId}
                        onChange={setDesignationId}
                        options={designationOptions}
                        placeholder={isLoadingMasterData ? "Loading designations…" : "Select Designation"}
                        searchable
                        disabled={isLoadingMasterData}
                      />
                    </div>
                  </div>

                  <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                    {/* System Role */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-semibold text-foreground">
                          System Role (RBAC)
                        </label>
                        {isTargetOwner && (
                          <span className="flex items-center gap-1 text-[11px] font-semibold text-indigo-700">
                            <Lock className="size-3" />
                            Owner Protected
                          </span>
                        )}
                      </div>
                      <CustomSelect
                        value={targetRole}
                        onChange={setTargetRole}
                        options={roleOptions}
                        placeholder="Select System Role"
                        disabled={isTargetOwner || roleOptions.length <= 1}
                      />
                      <p className="mt-1 text-[10px] text-muted">
                        {isTargetOwner
                          ? "The Organization Owner role is protected and cannot be changed."
                          : currentUserRole === "ORGANIZATION_OWNER"
                            ? "As Organization Owner, you can assign roles across executive and staff levels."
                            : "Role changes are restricted to roles you are authorized to assign."}
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1">
                        Employment Type
                      </label>
                      <CustomSelect
                        value={employmentTypeId}
                        onChange={setEmploymentTypeId}
                        options={employmentTypeOptions}
                        placeholder={isLoadingMasterData ? "Loading types…" : "Select Employment Type"}
                        disabled={isLoadingMasterData}
                      />
                    </div>
                  </div>

                  <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1">
                        Reporting Manager
                      </label>
                      <CustomSelect
                        value={reportingManagerId}
                        onChange={setReportingManagerId}
                        options={managerOptions}
                        placeholder="Select Reporting Manager"
                        searchable
                      />
                    </div>

                    {/* Team selection: for HR roles, render policy banner rather than a misleading disabled select */}
                    {isSelectedRoleHr ? (
                      <div className="flex flex-col justify-end">
                        <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-2.5">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                            <ShieldCheck className="size-3.5 text-slate-500" />
                            <span>Team Assignment</span>
                          </div>
                          <p className="mt-1 text-[11px] text-muted leading-tight">
                            Team selection is disabled for HR roles by organization policy.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <label className="block text-xs font-semibold text-foreground mb-1">
                          Team / Squad
                        </label>
                        <CustomSelect
                          value={teamId}
                          onChange={setTeamId}
                          options={teamOptions}
                          placeholder={
                            !departmentId
                              ? "Select a department first"
                              : teamOptions.length <= 1
                                ? "No teams in this department"
                                : "Select Team"
                          }
                          disabled={!departmentId || teamOptions.length <= 1}
                        />
                      </div>
                    )}
                  </div>

                  {/* Location field: preserved for non-HR roles, omitted for HR roles */}
                  {!isSelectedRoleHr && (
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1">
                        Work Location / Office
                      </label>
                      <CustomSelect
                        value={locationId}
                        onChange={setLocationId}
                        options={locationOptions}
                        placeholder="Select Office Location"
                      />
                    </div>
                  )}
                </div>

                {/* Section 3: Work Shift & Schedule */}
                <div className="space-y-3 border-t border-slate-100 pt-4">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted">
                    <Clock className="size-3.5 text-primary" />
                    <span>Work Shift & Schedule Assignment</span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">
                      Assigned Shift
                    </label>
                    <CustomSelect
                      value={shiftId}
                      onChange={setShiftId}
                      options={shiftOptions}
                      placeholder={isLoadingMasterData ? "Loading shifts…" : "Select Assigned Shift"}
                      searchable
                      disabled={isLoadingMasterData}
                    />
                  </div>

                  {/* Compact Live Shift Preview Card */}
                  {selectedShift && (
                    <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-3 text-xs space-y-2">
                      <div className="flex items-center justify-between border-b border-slate-200/60 pb-1.5">
                        <span className="font-semibold text-foreground">{selectedShift.name}</span>
                        {shiftOvernight ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-purple-200 bg-purple-50 px-2 py-0.5 text-[10px] font-semibold text-purple-700">
                            <Moon className="size-3" />
                            Overnight Shift
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                            <Sun className="size-3 text-emerald-600" />
                            Daytime Shift
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-[11px]">
                        <div>
                          <span className="text-muted block text-[10px]">Schedule</span>
                          <span className="font-mono font-semibold text-foreground">
                            {shiftStartTime && shiftEndTime
                              ? `${shiftStartTime.slice(0, 5)} – ${shiftEndTime.slice(0, 5)}`
                              : "—"}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted block text-[10px]">Break Duration</span>
                          <span className="font-medium text-slate-800">
                            {shiftBreak !== undefined && shiftBreak !== null ? `${shiftBreak} mins` : "—"}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted block text-[10px]">Grace Buffer</span>
                          <span className="font-medium text-slate-800">
                            {shiftGrace !== undefined && shiftGrace !== null ? `${shiftGrace} mins` : "—"}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Section 4: Lifecycle & Dates */}
                <div className="space-y-3 border-t border-slate-100 pt-4">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted">
                    <Calendar className="size-3.5 text-primary" />
                    <span>Employment Lifecycle & Status</span>
                  </div>

                  <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1">
                        Joining Date
                      </label>
                      <Input
                        type="date"
                        value={joiningDate}
                        onChange={(e) => setJoiningDate(e.target.value)}
                        className="h-9 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1">
                        Account / Lifecycle Status
                      </label>
                      <CustomSelect
                        value={status}
                        onChange={(val) => setStatus(val as typeof employee.status)}
                        options={statusOptions}
                        placeholder="Select Status"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Fixed Footer - Always accessible without scrolling */}
              <div className="flex shrink-0 items-center justify-end gap-3 border-t border-border/60 bg-slate-50/90 px-5 py-3 sm:px-6 backdrop-blur-xs">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={isSubmitting}
                  className="text-xs"
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="gap-2 text-xs font-semibold bg-primary text-white hover:bg-primary/90"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      <span>Saving Changes…</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </Button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
