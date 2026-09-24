export const PERMISSIONS = {
  organizationRead: "organization.read", organizationCreate: "organization.create", organizationUpdate: "organization.update", organizationSuspend: "organization.suspend", organizationManage: "organization.manage",
  membershipRead: "membership.read", membershipInvite: "membership.invite", membershipUpdate: "membership.update", membershipRemove: "membership.remove", roleRead: "role.read", roleManage: "role.manage",
  employeeRead: "employee.read", employeeCreate: "employee.create", employeeUpdate: "employee.update", employeeDelete: "employee.delete", attendanceRead: "attendance.read", attendanceManage: "attendance.manage",
  leaveRead: "leave.read", leaveApply: "leave.apply", leaveApprove: "leave.approve", expenseRead: "expense.read", expenseCreate: "expense.create", expenseApprove: "expense.approve", payrollRead: "payroll.read", payrollManage: "payroll.manage",
  jobRead: "job.read", jobCreate: "job.create", jobUpdate: "job.update", candidateRead: "candidate.read", candidateCreate: "candidate.create", candidateUpdate: "candidate.update", taskRead: "task.read", taskCreate: "task.create", taskAssign: "task.assign", taskUpdate: "task.update", chatRead: "chat.read", chatSend: "chat.send",
} as const;
export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
export const ALL_PERMISSION_KEYS = Object.values(PERMISSIONS);
export const SYSTEM_ROLES = ["PLATFORM_OWNER", "ORGANIZATION_OWNER", "ORGANIZATION_ADMIN", "HR_ADMIN", "HR_EXECUTIVE", "RECRUITER", "MANAGER", "TEAM_LEAD", "EMPLOYEE", "FINANCE_ADMIN", "PROJECT_MANAGER"] as const;
export type SystemRole = (typeof SYSTEM_ROLES)[number];

export const ROLE_PERMISSIONS: Record<string, readonly Permission[]> = {
  ORGANIZATION_OWNER: ALL_PERMISSION_KEYS,
  ORGANIZATION_ADMIN: ALL_PERMISSION_KEYS,
  HR_ADMIN: [PERMISSIONS.organizationRead, PERMISSIONS.membershipRead, PERMISSIONS.membershipInvite, PERMISSIONS.membershipUpdate, PERMISSIONS.roleRead, PERMISSIONS.employeeRead, PERMISSIONS.employeeCreate, PERMISSIONS.employeeUpdate],
  RECRUITER: [PERMISSIONS.organizationRead, PERMISSIONS.jobRead, PERMISSIONS.jobCreate, PERMISSIONS.jobUpdate, PERMISSIONS.candidateRead, PERMISSIONS.candidateCreate, PERMISSIONS.candidateUpdate],
  EMPLOYEE: [PERMISSIONS.organizationRead, PERMISSIONS.leaveRead, PERMISSIONS.leaveApply, PERMISSIONS.expenseRead, PERMISSIONS.expenseCreate, PERMISSIONS.taskRead, PERMISSIONS.taskCreate, PERMISSIONS.taskUpdate, PERMISSIONS.chatRead, PERMISSIONS.chatSend],
};
