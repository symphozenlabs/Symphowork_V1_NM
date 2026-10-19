import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/modules/identity/auth";
import { resolveTenantContext } from "@/modules/tenancy/context";
import { AttendanceViewContainer } from "@/components/attendance/attendance-view-container";

export default async function AttendancePage({
  searchParams,
}: {
  searchParams?: Promise<{ employeeId?: string; date?: string }>;
}) {
  if (!(await getSessionUser())) redirect("/login");
  const tenant = await resolveTenantContext();
  const canViewOthers =
    tenant.role?.key === "ORGANIZATION_OWNER" ||
    tenant.role?.key === "HR_ADMIN" ||
    tenant.role?.key === "HR_EXECUTIVE";

  const resolvedParams = searchParams ? await searchParams : undefined;
  const initialEmployeeId = canViewOthers ? (resolvedParams?.employeeId ?? "") : "";
  const initialDate = resolvedParams?.date ?? "";

  return (
    <div className="space-y-6">
      {/* Executive Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              Time & Attendance
            </span>
            <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600 font-medium">
              Live Workforce Tracking
            </span>
            {canViewOthers && (
              <span className="rounded-md border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-xs text-indigo-700 font-semibold">
                HR Access
              </span>
            )}
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Attendance & Time Clock
          </h1>
          <p className="mt-1 text-sm text-muted">
            Log shift punches, track worked hours, and submit attendance regularization requests synchronized with your organizational working calendar.
          </p>
        </div>
      </div>

      <Suspense fallback={<p className="text-xs text-muted py-4">Loading workforce attendance…</p>}>
        <AttendanceViewContainer
          canViewOthers={canViewOthers}
          userRoleKey={tenant.role?.key}
          initialEmployeeId={initialEmployeeId}
          initialDate={initialDate}
        />
      </Suspense>
    </div>
  );
}
