import { AppError } from "@/lib/errors";
import type { EmployeeStatus } from "@/modules/employees/types";

const transitions: Record<EmployeeStatus, readonly EmployeeStatus[]> = {
  invited: ["onboarding", "inactive"], onboarding: ["active", "inactive"], active: ["probation", "notice_period", "inactive", "resigned", "terminated"], probation: ["confirmed", "notice_period", "inactive", "resigned", "terminated"], confirmed: ["notice_period", "inactive", "resigned", "terminated"], notice_period: ["exited", "active", "terminated"], inactive: ["active", "terminated", "exited"], resigned: ["exited"], terminated: ["exited"], exited: [],
};

export function canTransitionEmployeeStatus(from: EmployeeStatus, to: EmployeeStatus) { return from === to || transitions[from].includes(to); }
export function assertEmployeeStatusTransition(from: EmployeeStatus, to: EmployeeStatus) { if (!canTransitionEmployeeStatus(from, to)) throw new AppError("VALIDATION_ERROR", `Employee status cannot transition from ${from} to ${to}.`, 400); }
export function assertNoSelfReporting(employeeId: string, managerId?: string | null) { if (managerId && employeeId === managerId) throw new AppError("VALIDATION_ERROR", "An employee cannot report to themselves.", 400); }
