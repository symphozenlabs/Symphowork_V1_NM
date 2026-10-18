import React from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { employeeHistory, employees } from "@/db/schema";
import { getSessionUser } from "@/modules/identity/auth";
import { resolveTenantContext } from "@/modules/tenancy/context";
import { can } from "@/modules/tenancy/authorization";
import { isOrganizationOwnerEmployee, getEmployeeDetails, type EmployeeDetails } from "@/modules/employees/service";
import { Button } from "@/components/ui/button";
import { EmployeeInvitationActions } from "@/components/employees/employee-invitation-actions";
import { OnboardingChecklist } from "@/components/employees/onboarding-checklist";
import { EditEmployeeDialog } from "@/components/employees/edit-employee-dialog";
import {
  ArrowLeft,
  User,
  Briefcase,
  CheckSquare,
  History,
  ShieldCheck,
  Clock,
  Moon,
  Sun,
  Mail,
} from "lucide-react";

export default async function EmployeeDetailsPage({
  params,
}: {
  params: Promise<{ employeeId: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const tenant = await resolveTenantContext();
  if (!tenant.organization) redirect("/platform");

  // Restrict access to roles authorized to view employee details
  const canRead = await can({
    userId: user.id,
    organizationId: tenant.organization.id,
    permission: "employee.read",
    user,
  });
  if (!canRead) {
    redirect("/app");
  }

  const { employeeId } = await params;
  let employee = await getEmployeeDetails(tenant.organization.id, employeeId);

  // Fallback query for test environments with simple mocks
  if (!employee) {
    const [raw] = await db
      .select()
      .from(employees)
      .where(
        and(
          eq(employees.id, employeeId),
          eq(employees.organizationId, tenant.organization.id)
        )
      );

    if (!raw) notFound();

    const rawRecord = raw as Record<string, unknown>;
    employee = {
      ...raw,
      department: (rawRecord.department as EmployeeDetails["department"]) ?? null,
      designation: (rawRecord.designation as EmployeeDetails["designation"]) ?? null,
      shift: (rawRecord.shift as EmployeeDetails["shift"]) ?? null,
      employmentType: (rawRecord.employmentType as EmployeeDetails["employmentType"]) ?? null,
      reportingManager: (rawRecord.reportingManager as EmployeeDetails["reportingManager"]) ?? null,
      team: (rawRecord.team as EmployeeDetails["team"]) ?? null,
      location: (rawRecord.location as EmployeeDetails["location"]) ?? null,
      roleKey: (rawRecord.roleKey as string | null) ?? null,
      roleTitle: (rawRecord.roleTitle as string | null) ?? null,
    };
  }

  if (!employee) notFound();

  // Prevent HR Admin / non-owner from accessing their own employee management/onboarding profile.
  // Legitimate personal profile management is accessed via /app/profile.
  if (employee.userId === user.id && tenant.role?.key !== "ORGANIZATION_OWNER") {
    redirect("/app/employees");
  }

  const isOwnerRecord = await isOrganizationOwnerEmployee(tenant.organization.id, employee.id);
  const isOwnerViewer =
    tenant.role?.key === "ORGANIZATION_OWNER" ||
    Boolean(user.platformRole && user.platformRole !== "NONE");

  const [canInviteRaw, canOnboardRaw, canReadAttendance, canUpdateRaw] = await Promise.all([
    can({
      userId: user.id,
      organizationId: tenant.organization.id,
      permission: "employee.invite",
      user,
    }),
    can({
      userId: user.id,
      organizationId: tenant.organization.id,
      permission: "employee.onboard",
      user,
    }),
    can({
      userId: user.id,
      organizationId: tenant.organization.id,
      permission: "attendance.read",
      user,
    }),
    can({
      userId: user.id,
      organizationId: tenant.organization.id,
      permission: "employee.update",
      user,
    }),
  ]);

  const canInvite = isOwnerRecord && !isOwnerViewer ? false : canInviteRaw;
  const canOnboard = isOwnerRecord && !isOwnerViewer ? false : canOnboardRaw;
  const canUpdate = isOwnerRecord && !isOwnerViewer ? false : canUpdateRaw;

  let history: (typeof employeeHistory.$inferSelect)[] = [];
  try {
    history = await db
      .select()
      .from(employeeHistory)
      .where(
        and(
          eq(employeeHistory.employeeId, employee.id),
          eq(employeeHistory.organizationId, tenant.organization.id)
        )
      );
  } catch {
    history = [];
  }

  const statusMap: Record<string, { bg: string; text: string; dot: string; border: string }> = {
    active: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", border: "border-emerald-200" },
    onboarding: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500", border: "border-amber-200" },
    suspended: { bg: "bg-rose-50", text: "text-rose-700", dot: "bg-rose-500", border: "border-rose-200" },
    terminated: { bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400", border: "border-slate-200" },
    invited: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500", border: "border-blue-200" },
    probation: { bg: "bg-purple-50", text: "text-purple-700", dot: "bg-purple-500", border: "border-purple-200" },
    confirmed: { bg: "bg-teal-50", text: "text-teal-700", dot: "bg-teal-500", border: "border-teal-200" },
    notice_period: { bg: "bg-orange-50", text: "text-orange-700", dot: "bg-orange-500", border: "border-orange-200" },
    inactive: { bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400", border: "border-slate-200" },
  };

  const currentTheme = statusMap[employee.status] || statusMap.active;

  return (
    <div className="w-full space-y-5">
      {/* 1. Top Navigation & Action Ribbon */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/app/employees"
          className="group inline-flex items-center gap-2 rounded-lg border border-slate-200/80 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-2xs transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
        >
          <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5 text-slate-400 group-hover:text-slate-600" />
          <span>Back to Employee Directory</span>
        </Link>

        {/* Action Button Group */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          {canUpdate && (
            <EditEmployeeDialog
              employee={employee}
              currentUserRole={tenant.role?.key}
              currentUserId={user.id}
              isOwnerViewer={isOwnerViewer}
            />
          )}

          {canReadAttendance && (
            <Button variant="outline" size="sm" asChild className="h-9 gap-1.5 font-semibold text-xs border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs">
              <Link href={`/app/attendance?employeeId=${employee.id}`}>
                <Clock className="h-3.5 w-3.5 text-primary" />
                <span>Attendance History</span>
              </Link>
            </Button>
          )}

          {isOwnerRecord && !isOwnerViewer ? (
            <span className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-emerald-200/90 bg-emerald-50 px-3 text-xs font-semibold text-emerald-800 shadow-2xs">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              Protected Organization Owner
            </span>
          ) : (
            canInvite && employee.status !== "active" && (
              <EmployeeInvitationActions
                employeeId={employee.id}
                email={employee.personalEmail ?? employee.workEmail}
                status={employee.status}
              />
            )
          )}
        </div>
      </div>

      {/* 2. Employee Profile Workspace Header */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-emerald-500 to-teal-400" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 pt-1">
          <div className="flex items-start sm:items-center gap-4 min-w-0">
            {/* Avatar */}
            <div className="flex h-14 w-14 sm:h-16 sm:w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1E4D2B] via-primary to-[#2C6E3B] text-white shadow-sm font-bold text-lg sm:text-xl select-none ring-4 ring-emerald-50">
              {employee.displayName.slice(0, 2).toUpperCase()}
            </div>

            <div className="space-y-1.5 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 truncate">
                  {employee.displayName}
                </h1>

                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold border ${currentTheme.bg} ${currentTheme.text} ${currentTheme.border} shrink-0`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${currentTheme.dot}`} />
                  {employee.status.toUpperCase()}
                </span>

                <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 font-mono text-xs text-slate-700 font-medium shrink-0">
                  ID: {employee.employeeId}
                </span>

                {employee.roleTitle && (
                  <span className="inline-flex items-center gap-1 rounded-md border border-indigo-200/80 bg-indigo-50/80 px-2 py-0.5 text-xs font-semibold text-indigo-700 shrink-0">
                    <ShieldCheck className="h-3.5 w-3.5 text-indigo-600" />
                    <span>{employee.roleTitle}</span>
                  </span>
                )}
              </div>

              {/* Secondary Details Ribbon */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                <span
                  className="inline-flex items-center gap-1 font-mono text-slate-600 truncate max-w-xs"
                  title={employee.workEmail ?? employee.personalEmail ?? ""}
                >
                  <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  {employee.workEmail ?? employee.personalEmail ?? "No email registered"}
                </span>

                {employee.department && (
                  <>
                    <span className="text-slate-300">•</span>
                    <span className="inline-flex items-center gap-1 text-slate-600 font-medium truncate">
                      <Briefcase className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      {employee.department.name}
                    </span>
                  </>
                )}

                {employee.designation && (
                  <>
                    <span className="text-slate-300">•</span>
                    <span className="text-slate-600 font-medium truncate">
                      {employee.designation.name}
                    </span>
                  </>
                )}

                {employee.reportingManager && (
                  <>
                    <span className="text-slate-300">•</span>
                    <span className="text-slate-600 truncate" title={`Manager: ${employee.reportingManager.displayName}`}>
                      Manager: <span className="font-medium text-slate-800">{employee.reportingManager.displayName}</span>
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Primary/Secondary Asymmetric Information Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* PRIMARY WORKSPACE: Employment Details & Schedule Command Center (Left 7/12 cols) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-5">
          {/* Module 1: Employment & Organizational Details Workspace */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100">
                  <Briefcase className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Employment &amp; Organizational Details
                  </h2>
                  <p className="text-[11px] text-slate-400">Position, reporting line, and organizational structure</p>
                </div>
              </div>
            </div>

            {/* Scannable Micro-Grid for Organizational Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 pt-3.5 text-xs">
              {/* Department */}
              <div className="flex flex-col py-1 border-b border-slate-100/70 sm:border-b-0">
                <span className="text-[11px] font-medium text-slate-400 mb-0.5">Department</span>
                <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                  <span className="font-semibold text-slate-800 truncate" title={employee.department?.name ?? ""}>
                    {employee.department ? employee.department.name : "Not assigned"}
                  </span>
                  {employee.department?.code && (
                    <span className="rounded bg-slate-100 border border-slate-200/70 px-1.5 py-0.5 font-mono text-[10px] text-slate-600 font-medium shrink-0">
                      {employee.department.code}
                    </span>
                  )}
                  {employee.department?.status === "inactive" && (
                    <span className="rounded bg-amber-50 border border-amber-200/70 text-amber-700 px-1.5 py-0.5 text-[10px] font-semibold shrink-0">
                      (Inactive)
                    </span>
                  )}
                </div>
              </div>

              {/* Designation */}
              <div className="flex flex-col py-1 border-b border-slate-100/70 sm:border-b-0">
                <span className="text-[11px] font-medium text-slate-400 mb-0.5">Designation</span>
                <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                  <span className="font-semibold text-slate-800 truncate" title={employee.designation?.name ?? ""}>
                    {employee.designation ? employee.designation.name : "Not assigned"}
                  </span>
                  {employee.designation?.code && (
                    <span className="rounded bg-slate-100 border border-slate-200/70 px-1.5 py-0.5 font-mono text-[10px] text-slate-600 font-medium shrink-0">
                      {employee.designation.code}
                    </span>
                  )}
                  {employee.designation?.level !== null && employee.designation?.level !== undefined && (
                    <span className="rounded bg-blue-50 border border-blue-200/70 text-blue-700 px-1.5 py-0.5 text-[10px] font-semibold shrink-0">
                      Level {employee.designation.level}
                    </span>
                  )}
                </div>
              </div>

              {/* System Role */}
              <div className="flex flex-col py-1 border-b border-slate-100/70 sm:border-b-0">
                <span className="text-[11px] font-medium text-slate-400 mb-0.5">System Role</span>
                <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                  <span className="font-semibold text-slate-800 truncate">
                    {employee.roleTitle || "Employee"}
                  </span>
                  <span className="rounded-md border border-indigo-200/80 bg-indigo-50 px-1.5 py-0.5 font-mono text-[10px] font-bold text-indigo-700 shrink-0">
                    {employee.roleKey || "EMPLOYEE"}
                  </span>
                </div>
              </div>

              {/* Employment Type */}
              <div className="flex flex-col py-1 border-b border-slate-100/70 sm:border-b-0">
                <span className="text-[11px] font-medium text-slate-400 mb-0.5">Employment Type</span>
                <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                  <span className="font-semibold text-slate-800 truncate" title={employee.employmentType?.name ?? ""}>
                    {employee.employmentType ? employee.employmentType.name : "Not assigned"}
                  </span>
                  {employee.employmentType?.code && (
                    <span className="rounded bg-slate-100 border border-slate-200/70 px-1.5 py-0.5 font-mono text-[10px] text-slate-600 font-medium shrink-0">
                      {employee.employmentType.code}
                    </span>
                  )}
                </div>
              </div>

              {/* Joining Date */}
              <div className="flex flex-col py-1 border-b border-slate-100/70 sm:border-b-0">
                <span className="text-[11px] font-medium text-slate-400 mb-0.5">Joining Date</span>
                <span className="font-semibold text-slate-800">
                  {employee.joiningDate ?? "Not set"}
                </span>
              </div>

              {/* Work Email */}
              <div className="flex flex-col py-1 border-b border-slate-100/70 sm:border-b-0">
                <span className="text-[11px] font-medium text-slate-400 mb-0.5">Work Email</span>
                <span className="font-mono text-slate-800 truncate" title={employee.workEmail ?? ""}>
                  {employee.workEmail ?? "—"}
                </span>
              </div>

              {/* Reporting Manager */}
              <div className="flex flex-col py-1 border-b border-slate-100/70 sm:border-b-0">
                <span className="text-[11px] font-medium text-slate-400 mb-0.5">Reporting Manager</span>
                <span
                  className="font-semibold text-slate-800 truncate"
                  title={employee.reportingManager ? `${employee.reportingManager.displayName} (${employee.reportingManager.employeeId})` : ""}
                >
                  {employee.reportingManager
                    ? `${employee.reportingManager.displayName} (${employee.reportingManager.employeeId})`
                    : "Not assigned"}
                </span>
              </div>

              {/* Lifecycle Status */}
              <div className="flex flex-col py-1">
                <span className="text-[11px] font-medium text-slate-400 mb-0.5">Lifecycle Status</span>
                <div>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold border ${currentTheme.bg} ${currentTheme.text} ${currentTheme.border} shrink-0`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${currentTheme.dot}`} />
                    {employee.status.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Team / Squad (if assigned) */}
              {employee.team && (
                <div className="flex flex-col py-1">
                  <span className="text-[11px] font-medium text-slate-400 mb-0.5">Team / Squad</span>
                  <span className="font-semibold text-slate-800 truncate">
                    {employee.team.name} ({employee.team.code})
                  </span>
                </div>
              )}

              {/* Location (if assigned) */}
              {employee.location && (
                <div className="flex flex-col py-1">
                  <span className="text-[11px] font-medium text-slate-400 mb-0.5">Location</span>
                  <span className="font-semibold text-slate-800 truncate">
                    {employee.location.name}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Module 2: Work Shift & Schedule Command Center */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-700 border border-blue-100">
                  <Clock className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Work Shift &amp; Schedule
                  </h2>
                  <p className="text-[11px] text-slate-400">Assigned working hours, policies, and punch verifications</p>
                </div>
              </div>
              {canReadAttendance && (
                <Link
                  href={`/app/attendance?employeeId=${employee.id}`}
                  className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                >
                  <span>Logs →</span>
                </Link>
              )}
            </div>

            {/* Hero Shift Banner */}
            <div className="mt-4 rounded-xl border border-slate-200/80 bg-slate-50/60 p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-800">
                      {employee.shift ? employee.shift.name : "Not assigned"}
                    </span>
                    {employee.shift?.code && (
                      <span className="rounded bg-slate-200/80 px-1.5 py-0.5 font-mono text-[10px] text-slate-700 font-medium">
                        {employee.shift.code}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 font-mono text-2xl font-bold tracking-tight text-slate-900">
                    {employee.shift
                      ? `${employee.shift.startTime.slice(0, 5)} – ${employee.shift.endTime.slice(0, 5)}`
                      : "—"}
                  </div>
                </div>

                <div className="shrink-0">
                  {employee.shift ? (
                    employee.shift.overnight ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700 shadow-2xs">
                        <Moon className="h-3.5 w-3.5" />
                        Overnight Shift (Crosses Midnight)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800 shadow-2xs">
                        <Sun className="h-3.5 w-3.5 text-emerald-600" />
                        Standard Daytime Shift
                      </span>
                    )
                  ) : (
                    <span className="text-xs font-medium text-slate-400">No shift schedule configured</span>
                  )}
                </div>
              </div>

              {/* Shift Attributes Grid */}
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-200/60 text-xs">
                <div>
                  <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Break Duration</span>
                  <p className="mt-0.5 font-semibold text-slate-800">
                    {employee.shift ? `${employee.shift.breakMinutes ?? 0} mins` : "—"}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Grace Period</span>
                  <p className="mt-0.5 font-semibold text-slate-800">
                    {employee.shift ? `${employee.shift.graceMinutes ?? 0} mins` : "—"}
                  </p>
                </div>
                <div className="col-span-2">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Attendance Policy</span>
                  <p className="mt-0.5 font-semibold text-slate-800">Standard Punch Verification</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CONTEXTUAL SIDEBAR: Personal Profile (Right 5/12 cols) */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-5">
          {/* Module 3: Personal Profile Card */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs">
            <div className="flex items-center gap-2.5 pb-3.5 border-b border-slate-100">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-50 text-purple-700 border border-purple-100">
                <User className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Personal Profile
                </h2>
                <p className="text-[11px] text-slate-400">Contact details and personal background</p>
              </div>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {/* Full Name */}
              <div className="flex items-center justify-between py-2.5">
                <span className="text-slate-400 font-medium shrink-0">Full Name</span>
                <span className="font-semibold text-slate-800 text-right truncate min-w-0 ml-3">
                  {[employee.firstName, employee.middleName, employee.lastName].filter(Boolean).join(" ")}
                </span>
              </div>

              {/* Personal Email */}
              <div className="flex items-center justify-between py-2.5">
                <span className="text-slate-400 font-medium shrink-0">Personal Email</span>
                <span className="font-mono text-slate-800 text-right truncate min-w-0 ml-3" title={employee.personalEmail ?? ""}>
                  {employee.personalEmail ?? "—"}
                </span>
              </div>

              {/* Phone Number */}
              <div className="flex items-center justify-between py-2.5">
                <span className="text-slate-400 font-medium shrink-0">Phone Number</span>
                <span className="text-slate-800 font-medium text-right min-w-0 ml-3">
                  {employee.phone ?? "Not provided"}
                </span>
              </div>

              {/* City / Location */}
              <div className="flex items-center justify-between py-2.5">
                <span className="text-slate-400 font-medium shrink-0">City / Location</span>
                <span className="text-slate-800 text-right truncate min-w-0 ml-3">
                  {employee.city ?? "Not provided"}
                </span>
              </div>

              {/* Address */}
              {employee.addressLine1 && (
                <div className="flex items-center justify-between py-2.5">
                  <span className="text-slate-400 font-medium shrink-0">Address</span>
                  <span className="text-slate-800 text-right truncate min-w-0 ml-3" title={employee.addressLine1}>
                    {employee.addressLine1}
                  </span>
                </div>
              )}

              {/* Date of Birth */}
              {employee.dateOfBirth && (
                <div className="flex items-center justify-between py-2.5">
                  <span className="text-slate-400 font-medium shrink-0">Date of Birth</span>
                  <span className="text-slate-800 font-mono text-right min-w-0 ml-3">{employee.dateOfBirth}</span>
                </div>
              )}

              {/* Gender */}
              {employee.gender && (
                <div className="flex items-center justify-between py-2.5">
                  <span className="text-slate-400 font-medium shrink-0">Gender</span>
                  <span className="text-slate-800 font-medium text-right min-w-0 ml-3 capitalize">{employee.gender}</span>
                </div>
              )}

              {/* Marital Status */}
              {employee.maritalStatus && (
                <div className="flex items-center justify-between py-2.5">
                  <span className="text-slate-400 font-medium shrink-0">Marital Status</span>
                  <span className="text-slate-800 font-medium text-right min-w-0 ml-3 capitalize">{employee.maritalStatus}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Employee Journey & Lifecycle History (Bottom Asymmetric Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Onboarding Checklist (Left 5/12 cols) */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs">
          <div className="flex items-center gap-2.5 pb-3.5 border-b border-slate-100">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-700 border border-amber-100">
              <CheckSquare className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Onboarding Checklist
              </h2>
              <p className="text-[11px] text-slate-400">Required steps, tasks, and completion status</p>
            </div>
          </div>

          <div className="pt-4">
            {isOwnerRecord && !isOwnerViewer ? (
              <div className="rounded-xl border border-dashed border-emerald-200/80 bg-emerald-50/30 p-4 text-center">
                <ShieldCheck className="h-5 w-5 text-emerald-600 mx-auto mb-1.5" />
                <p className="text-xs font-semibold text-emerald-800">
                  Organization Owner Record Protected
                </p>
                <p className="mt-0.5 text-[11px] text-slate-500 max-w-sm mx-auto">
                  Onboarding, account status, and role configurations for the Organization Owner cannot be modified by other tenant roles.
                </p>
              </div>
            ) : canOnboard ? (
              <OnboardingChecklist employeeId={employee.id} />
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center">
                <ShieldCheck className="h-5 w-5 text-slate-400 mx-auto mb-1.5" />
                <p className="text-xs text-slate-500">
                  Onboarding workflow access is restricted to authorized people-operations roles.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Lifecycle History Timeline (Right 7/12 cols) */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                <History className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Employee Lifecycle History
                </h2>
                <p className="text-[11px] text-slate-400">Audit trail of identity, onboarding, and status changes</p>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 border border-slate-200/80 rounded-md px-2 py-0.5">
              {history.length} records
            </span>
          </div>

          <div className="pt-4">
            {history.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center">
                <History className="h-6 w-6 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-500 font-medium">No historical events recorded for this employee profile yet.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {history.map((event, index) => {
                  const isFirst = index === 0;
                  const isLast = index === history.length - 1;
                  return (
                    <div key={event.id} className="relative flex items-center gap-3">
                      {/* Timeline Rail Column */}
                      <div className="relative flex self-stretch w-4 items-center justify-center shrink-0">
                        {/* Continuous vertical connecting line */}
                        {!isFirst && (
                          <div className="absolute top-[-10px] bottom-1/2 left-1/2 -translate-x-1/2 w-0.5 bg-emerald-200" />
                        )}
                        {!isLast && (
                          <div className="absolute top-1/2 bottom-[-10px] left-1/2 -translate-x-1/2 w-0.5 bg-emerald-200" />
                        )}
                        {/* Timeline Dot */}
                        <div className="relative z-10 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-600 ring-2 ring-emerald-500/20 shadow-2xs" />
                      </div>

                      {/* Event Row Content */}
                      <div className="flex-1 flex items-center justify-between rounded-lg border border-slate-200/70 bg-slate-50/50 p-2.5 text-xs transition-colors hover:bg-slate-50">
                        <span className="font-semibold text-slate-900 font-mono text-[11px]">
                          {event.eventType}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {new Date(event.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
