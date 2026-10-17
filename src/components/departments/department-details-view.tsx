"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  CalendarCheck2,
  CheckCircle2,
  Clock,
  Edit3,
  Layers,
  Plus,
  Save,
  Trash2,
  User,
  Users,
  X,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CustomSelect } from "@/components/ui/custom-select";
import { DepartmentDeleteDialog } from "./department-delete-dialog";
import { DepartmentTeamDialog } from "./department-team-dialog";
import { DepartmentTeamDeleteDialog } from "./department-team-delete-dialog";
import type {
  DepartmentDetails,
  DepartmentManagerSummary,
  DepartmentTeamItem,
} from "@/modules/departments/types";

interface DepartmentDetailsViewProps {
  initialDepartment: DepartmentDetails;
  isOrganizationOwner: boolean;
  canManageTeams?: boolean;
}

export function DepartmentDetailsView({
  initialDepartment,
  isOrganizationOwner,
  canManageTeams = isOrganizationOwner,
}: DepartmentDetailsViewProps) {
  const router = useRouter();
  const [department, setDepartment] = useState<DepartmentDetails>(initialDepartment);
  const [selectedDate, setSelectedDate] = useState(initialDepartment.dateContext.date);
  const [isLoadingDate, setIsLoadingDate] = useState(false);

  // Team management dialog state
  const [isTeamDialogOpen, setIsTeamDialogOpen] = useState(false);
  const [teamDialogMode, setTeamDialogMode] = useState<"create" | "edit">("create");
  const [selectedTeam, setSelectedTeam] = useState<DepartmentTeamItem | null>(null);
  const [isTeamDeleteOpen, setIsTeamDeleteOpen] = useState(false);

  function handleOpenCreateTeam() {
    setSelectedTeam(null);
    setTeamDialogMode("create");
    setIsTeamDialogOpen(true);
  }

  function handleOpenEditTeam(team: DepartmentTeamItem) {
    setSelectedTeam(team);
    setTeamDialogMode("edit");
    setIsTeamDialogOpen(true);
  }

  function handleOpenDeleteTeam(team: DepartmentTeamItem) {
    setSelectedTeam(team);
    setIsTeamDeleteOpen(true);
  }

  // Edit Mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(initialDepartment.name);
  const [editCode, setEditCode] = useState(initialDepartment.code);
  const [editDescription, setEditDescription] = useState(initialDepartment.description || "");
  const [editHeadId, setEditHeadId] = useState(initialDepartment.headEmployeeId || "");
  const [editStatus, setEditStatus] = useState<"active" | "inactive">(initialDepartment.status);
  const [eligibleManagers, setEligibleManagers] = useState<DepartmentManagerSummary[]>([]);
  const [isLoadingManagers, setIsLoadingManagers] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState(false);

  // Deletion modal
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  async function handleDateChange(newDate: string) {
    setSelectedDate(newDate);
    setIsLoadingDate(true);
    try {
      const res = await fetch(
        `/api/app/departments/${department.id}?date=${encodeURIComponent(newDate)}`
      );
      const data = await res.json();
      if (data.success && data.department) {
        setDepartment(data.department);
      }
    } catch {
      // Fallback
    } finally {
      setIsLoadingDate(false);
    }
  }

  function handleStartEdit() {
    setEditName(department.name);
    setEditCode(department.code);
    setEditDescription(department.description || "");
    setEditHeadId(department.headEmployeeId || "");
    setEditStatus(department.status);
    setEditError(null);
    setEditSuccess(false);
    setIsEditing(true);

    setIsLoadingManagers(true);
    fetch(`/api/app/departments/eligible-managers?departmentId=${encodeURIComponent(department.id)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success && Array.isArray(d.managers)) {
          setEligibleManagers(d.managers);
        }
      })
      .finally(() => setIsLoadingManagers(false));
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    setEditError(null);
    setEditSuccess(false);

    const cleanName = editName.trim();
    const cleanCode = editCode.trim().toUpperCase();

    if (!cleanName) {
      setEditError("Department name is required.");
      return;
    }
    if (!cleanCode) {
      setEditError("Department code is required.");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch(`/api/app/departments/${department.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: cleanName,
          code: cleanCode,
          description: editDescription.trim() || undefined,
          headEmployeeId: editHeadId || null,
          status: editStatus,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || "Failed to save department changes.");
      }

      setEditSuccess(true);
      setIsEditing(false);
      // Reload details with date
      await handleDateChange(selectedDate);
      router.refresh();
    } catch (err: unknown) {
      setEditError(err instanceof Error ? err.message : "Failed to update department.");
    } finally {
      setIsSaving(false);
    }
  }

  const { dateContext } = department;

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/app/departments"
            className="flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
            aria-label="Back to departments list"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                {department.name}
              </h1>
              <span className="font-mono font-bold text-xs px-2.5 py-0.5 rounded-md border border-[#CDE0CC] bg-[#E2EDE1] text-primary">
                {department.code}
              </span>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
                  department.status === "active"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-slate-100 text-slate-600 border border-slate-200"
                }`}
              >
                <span
                  className={`size-1.5 rounded-full ${
                    department.status === "active" ? "bg-emerald-500" : "bg-slate-400"
                  }`}
                />
                {department.status}
              </span>
            </div>
            {department.description && (
              <p className="mt-1 text-xs text-muted max-w-2xl">{department.description}</p>
            )}
          </div>
        </div>

        {isOrganizationOwner && !isEditing && (
          <Button onClick={handleStartEdit} variant="outline" className="shrink-0">
            <Edit3 className="size-4 mr-1.5 text-primary" />
            Edit Department
          </Button>
        )}
      </div>

      {editSuccess && (
        <div role="status" className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 font-medium animate-in fade-in">
          <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
          <span>Department details successfully updated.</span>
        </div>
      )}

      {/* Edit Form Card (Owner-Only) */}
      {isEditing && (
        <Card className="border-primary/40 bg-white shadow-md">
          <CardHeader className="border-b border-slate-100 pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Edit3 className="size-4 text-primary" />
              Edit Department Information (Owner Controls)
            </CardTitle>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="size-4" />
            </button>
          </CardHeader>
          <CardContent className="pt-4">
            {editError && (
              <div role="alert" className="mb-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
                <AlertTriangle className="size-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground" htmlFor="edit-name">
                    Department Name <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    id="edit-name"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground" htmlFor="edit-code">
                    Department Code <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    id="edit-code"
                    value={editCode}
                    onChange={(e) => setEditCode(e.target.value.toUpperCase())}
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Assigned Manager
                  </label>
                  <CustomSelect
                    value={editHeadId}
                    onChange={(val) => setEditHeadId(val)}
                    options={(() => {
                      const opts = [
                        { value: "", label: "None (Unassigned)" },
                        ...eligibleManagers.map((m) => ({
                          value: m.id,
                          label: `${m.displayName} (${m.roleTitle || "Manager"}) - ${m.employeeId}`,
                        })),
                      ];
                      if (department.manager && !opts.some((o) => o.value === department.manager?.id)) {
                        opts.push({
                          value: department.manager.id,
                          label: `${department.manager.displayName} (${department.manager.roleTitle || "Manager"}) - ${department.manager.employeeId}`,
                        });
                      }
                      return opts;
                    })()}
                    placeholder={isLoadingManagers ? "Loading managers…" : "Select a department manager…"}
                    searchable={eligibleManagers.length > 5}
                    searchPlaceholder="Search active managers…"
                    emptyMessage="No eligible managers found."
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Status</label>
                  <CustomSelect
                    value={editStatus}
                    onChange={(val) => setEditStatus(val as "active" | "inactive")}
                    options={[
                      { value: "active", label: "Active" },
                      { value: "inactive", label: "Inactive" },
                    ]}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground" htmlFor="edit-desc">
                  Description
                </label>
                <textarea
                  id="edit-desc"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-input bg-surface px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSaving}>
                  <Save className="size-4 mr-1.5" />
                  {isSaving ? "Saving…" : "Save Changes"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* KPI Overview Grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Manager Card */}
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <User className="size-5" />
            </div>
            <div className="truncate">
              <p className="text-[11px] font-semibold text-muted uppercase tracking-wider">
                Department Manager
              </p>
              <p className="text-sm font-bold text-foreground truncate">
                {department.manager?.displayName || "Unassigned"}
              </p>
              <p className="text-[11px] text-muted truncate">
                {department.manager?.workEmail || (department.manager ? department.manager.employeeId : "No head assigned")}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Total Workforce */}
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <Users className="size-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-muted uppercase tracking-wider">
                Total Workforce
              </p>
              <p className="text-2xl font-bold text-foreground">
                {department.totalEmployees}
              </p>
              <p className="text-[11px] text-muted">{department.teams.length} sub-teams / squads</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Summary Grid (Selected Date) */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Attendance Summary ({dateContext.date})
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* Present */}
          <Card className="border-emerald-200/90 bg-emerald-50/40">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                <CheckCircle2 className="size-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">
                  Present
                </p>
                <p className="text-2xl font-bold text-emerald-700">
                  {department.presentCount}
                </p>
                <p className="text-[11px] text-emerald-600">On shift or checked in</p>
              </div>
            </CardContent>
          </Card>

          {/* Absent */}
          <Card className={`border-rose-200/90 ${department.absentCount > 0 ? "bg-rose-50/40" : "bg-white"}`}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${department.absentCount > 0 ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-500"}`}>
                <XCircle className="size-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-rose-800 uppercase tracking-wider">
                  Absent
                </p>
                <p className={`text-2xl font-bold ${department.absentCount > 0 ? "text-rose-700" : "text-slate-600"}`}>
                  {department.absentCount}
                </p>
                <p className="text-[11px] text-rose-600">Unpunched past workday</p>
              </div>
            </CardContent>
          </Card>

          {/* On Leave */}
          <Card className="border-blue-200/90 bg-blue-50/40">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                <CalendarCheck2 className="size-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-blue-800 uppercase tracking-wider">
                  On Leave
                </p>
                <p className="text-2xl font-bold text-blue-700">
                  {department.onLeaveCount}
                </p>
                <p className="text-[11px] text-blue-600">Approved leave request</p>
              </div>
            </CardContent>
          </Card>

          {/* Pending Arrival */}
          <Card className="border-amber-200/90 bg-amber-50/40">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                <Clock className="size-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider">
                  Pending Arrival
                </p>
                <p className="text-2xl font-bold text-amber-700">
                  {department.pendingCount}
                </p>
                <p className="text-[11px] text-amber-600">Current day awaiting punch</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Date Inspection Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-surface p-3.5 rounded-xl border border-slate-200/90 shadow-2xs">
        <div className="flex items-center gap-2">
          <Calendar className="size-4 text-primary" />
          <span className="text-xs font-semibold text-foreground">
            Attendance inspection date:
          </span>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => void handleDateChange(e.target.value)}
            className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          {dateContext.isHoliday && (
            <span className="inline-flex items-center gap-1 rounded-full border border-purple-200 bg-purple-50 px-2.5 py-0.5 text-[11px] font-semibold text-purple-700">
              Company Holiday: {dateContext.holidayName}
            </span>
          )}
          {!dateContext.isWorkingDay && !dateContext.isHoliday && (
            <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700">
              Weekly Rest Day
            </span>
          )}
          {dateContext.isToday && (
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
              Today (Live)
            </span>
          )}
        </div>
      </div>

      {/* Assigned Workforce Roster */}
      <Card>
        <CardHeader className="border-b border-slate-100 pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Users className="size-4 text-primary" />
            Department Workforce Roster ({department.roster.length} members)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200/90 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  <th className="py-3 px-4">Employee ID</th>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Role / Title</th>
                  <th className="py-3 px-4">Work Email</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Date Attendance ({dateContext.date})</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {isLoadingDate ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-xs text-muted">
                      Refreshing roster attendance…
                    </td>
                  </tr>
                ) : department.roster.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-xs text-muted">
                      No employees are currently assigned to this department.
                    </td>
                  </tr>
                ) : (
                  department.roster.map((member) => (
                    <tr key={member.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-xs text-slate-700">
                        {member.employeeId}
                      </td>
                      <td className="py-3 px-4 font-semibold text-foreground">
                        <Link
                          href={`/app/employees/${member.id}`}
                          className="hover:text-primary hover:underline transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-xs"
                        >
                          {member.displayName}
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {member.roleTitle || member.roleKey || "Employee"}
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {member.workEmail || "—"}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            member.status === "active"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-slate-100 text-slate-600 border border-slate-200"
                          }`}
                        >
                          {member.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {member.punchStatus === "present" ||
                        member.punchStatus === "late" ||
                        member.punchStatus === "missing_punch" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border border-emerald-200 bg-emerald-50 text-emerald-700">
                            <CheckCircle2 className="size-3" />
                            {member.punchStatus === "late"
                              ? "Present (Late)"
                              : member.punchStatus === "missing_punch"
                              ? "On Shift"
                              : "Present"}
                          </span>
                        ) : member.punchStatus === "on_leave" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border border-blue-200 bg-blue-50 text-blue-700">
                            Approved Leave
                          </span>
                        ) : member.punchStatus === "pending_arrival" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border border-amber-200 bg-amber-50 text-amber-700">
                            <Clock className="size-3" />
                            Pending Arrival
                          </span>
                        ) : member.punchStatus === "holiday" ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium border border-purple-200 bg-purple-50 text-purple-700">
                            Holiday
                          </span>
                        ) : member.punchStatus === "weekend" ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium border border-slate-200 bg-slate-100 text-slate-600">
                            Weekly Off
                          </span>
                        ) : member.punchStatus === "not_joined" ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium border border-slate-200 bg-slate-100 text-slate-500">
                            Not Yet Joined
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border border-rose-200 bg-rose-50 text-rose-700">
                            <XCircle className="size-3" />
                            Absent
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Sub-teams Section */}
      <Card>
        <CardHeader className="border-b border-slate-100 pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Layers className="size-4 text-primary" />
            Sub-Teams & Pods ({department.teams.length})
          </CardTitle>
          {canManageTeams && (
            <Button size="sm" onClick={handleOpenCreateTeam} className="shrink-0 text-xs">
              <Plus className="size-3.5 mr-1" />
              Create Team
            </Button>
          )}
        </CardHeader>
        <CardContent className="p-4">
          {department.teams.length === 0 ? (
            <div className="py-8 text-center space-y-2">
              <Layers className="mx-auto size-7 text-slate-300" />
              <p className="text-xs font-semibold text-slate-700">No teams or squads configured yet.</p>
              <p className="text-[11px] text-muted max-w-sm mx-auto">
                {canManageTeams
                  ? "Organize this department into focused pods, squads, or functional teams."
                  : "No sub-teams have been created within this department yet."}
              </p>
              {canManageTeams && (
                <Button size="sm" variant="outline" onClick={handleOpenCreateTeam} className="text-xs mt-2">
                  <Plus className="size-3.5 mr-1" />
                  Create First Team
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {department.teams.map((team) => (
                <div
                  key={team.id}
                  className="rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-2xs space-y-2 flex flex-col justify-between"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-foreground truncate max-w-[170px]">{team.name}</span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="font-mono text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded-xs">
                          {team.code}
                        </span>
                        <span
                          className={`inline-flex items-center text-[10px] font-bold uppercase rounded-sm px-1.5 py-0.2 ${
                            team.status === "active"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-slate-100 text-slate-500 border border-slate-200"
                          }`}
                        >
                          {team.status}
                        </span>
                      </div>
                    </div>
                    {team.description && (
                      <p className="text-[11px] text-muted line-clamp-2">{team.description}</p>
                    )}
                    <p className="text-[11px] text-slate-600 pt-1 border-t border-slate-100">
                      Lead:{" "}
                      <span className="font-medium text-foreground">
                        {team.teamLeadName || "Unassigned"}
                      </span>
                    </p>
                  </div>

                  {canManageTeams && (
                    <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-slate-100 mt-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEditTeam(team)}
                        className="h-7 px-2 text-[11px] text-slate-600 hover:text-primary"
                        aria-label={`Edit ${team.name}`}
                      >
                        <Edit3 className="size-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDeleteTeam(team)}
                        className="h-7 px-2 text-[11px] text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                        aria-label={`Deactivate ${team.name}`}
                      >
                        <Trash2 className="size-3 mr-1" />
                        Deactivate
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Owner-Only Danger Zone at Bottom */}
      {isOrganizationOwner && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/40 p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h2 className="text-sm font-bold text-rose-950 flex items-center gap-2">
                <Trash2 className="size-4 text-rose-600" />
                Danger Zone
              </h2>
              <p className="text-xs text-rose-800 leading-relaxed max-w-xl">
                Deleting a department removes it from organizational reporting and approval escalations. Employees will never be deleted, but all workforce assignments and active requisitions must be cleared before permanent deletion is permitted.
              </p>
            </div>
            <Button
              type="button"
              variant="destructive"
              onClick={() => setIsDeleteOpen(true)}
              className="shrink-0"
            >
              <Trash2 className="size-4 mr-1.5" />
              Delete Department
            </Button>
          </div>
        </div>
      )}

      {/* Deletion Dialog */}
      <DepartmentDeleteDialog
        open={isDeleteOpen}
        departmentId={department.id}
        departmentName={department.name}
        departmentCode={department.code}
        onClose={() => setIsDeleteOpen(false)}
        onDeleted={() => {
          router.push("/app/departments");
          router.refresh();
        }}
      />

      {/* Team Dialogs */}
      <DepartmentTeamDialog
        open={isTeamDialogOpen}
        mode={teamDialogMode}
        departmentId={department.id}
        departmentName={department.name}
        initialTeam={selectedTeam}
        roster={department.roster}
        onClose={() => setIsTeamDialogOpen(false)}
        onSaved={async () => {
          await handleDateChange(selectedDate);
          router.refresh();
        }}
      />

      <DepartmentTeamDeleteDialog
        open={isTeamDeleteOpen}
        departmentId={department.id}
        team={selectedTeam}
        onClose={() => setIsTeamDeleteOpen(false)}
        onDeleted={async () => {
          await handleDateChange(selectedDate);
          router.refresh();
        }}
      />
    </div>
  );
}
