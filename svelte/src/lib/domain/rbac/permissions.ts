export const PERMISSIONS = {
  organizationRead: "organization.read", organizationCreate: "organization.create", organizationUpdate: "organization.update", organizationSuspend: "organization.suspend", organizationManage: "organization.manage",
  membershipRead: "membership.read", membershipInvite: "membership.invite", membershipUpdate: "membership.update", membershipRemove: "membership.remove", roleRead: "role.read", roleManage: "role.manage",
  employeeRead: "employee.read", employeeCreate: "employee.create", employeeUpdate: "employee.update", employeeDelete: "employee.delete", attendanceRead: "attendance.read", attendanceManage: "attendance.manage",
  leaveRead: "leave.read", leaveApply: "leave.apply", leaveApprove: "leave.approve",
  jobRead: "job.read", jobCreate: "job.create", jobUpdate: "job.update", candidateRead: "candidate.read", candidateCreate: "candidate.create", candidateUpdate: "candidate.update", projectView: "project.view", projectCreate: "project.create", projectEdit: "project.edit", projectArchive: "project.archive", projectManageMembers: "project.manage.members", taskRead: "task.read", taskCreate: "task.create", taskAssign: "task.assign", taskUpdate: "task.update", taskDelete: "task.delete", taskChangeStatus: "task.change.status", taskChangePriority: "task.change.priority", taskComment: "task.comment", taskAttach: "task.attach", taskManageDependencies: "task.manage.dependencies", chatRead: "chat.read", chatSend: "chat.send", chatCreate: "chat.create", chatEditMessage: "chat.edit.message", chatDeleteMessage: "chat.delete.message", chatAttach: "chat.attach", chatManageGroup: "chat.manage.group",
  organizationSettingsRead: "organization.settings.read", organizationSettingsUpdate: "organization.settings.update", departmentRead: "department.read", departmentCreate: "department.create", departmentUpdate: "department.update", departmentManage: "department.manage", designationRead: "designation.read", designationCreate: "designation.create", designationUpdate: "designation.update", designationManage: "designation.manage", locationRead: "location.read", locationCreate: "location.create", locationUpdate: "location.update", locationManage: "location.manage", teamRead: "team.read", teamCreate: "team.create", teamUpdate: "team.update", teamManage: "team.manage", employeeManage: "employee.manage", employeeInvite: "employee.invite", employeeOnboard: "employee.onboard", employeeActivate: "employee.activate", employeeDeactivate: "employee.deactivate", employeeSelfRead: "employee.self.read", employeeSelfUpdate: "employee.self.update", documentRead: "document.read", documentUpload: "document.upload",
  attendanceClockIn: "attendance.clockin", attendanceClockOut: "attendance.clockout", attendanceBreak: "attendance.break", attendanceRegularizationCreate: "attendance.regularization.create", attendanceRegularizationRead: "attendance.regularization.read", attendanceRegularizationApprove: "attendance.regularization.approve", leaveCancel: "leave.cancel", leaveManage: "leave.manage", leaveBalanceRead: "leave.balance.read", leaveBalanceAdjust: "leave.balance.adjust", leavePolicyManage: "leave.policy.manage", leaveTypeManage: "leave.type.manage", workflowRead: "workflow.read", workflowCreate: "workflow.create", workflowUpdate: "workflow.update", workflowActivate: "workflow.activate", workflowApprove: "workflow.approve", workflowManage: "workflow.manage",
  expenseRead: "expense.read", expenseCreate: "expense.create", expenseUpdate: "expense.update", expenseSubmit: "expense.submit", expenseCancel: "expense.cancel", expenseApprove: "expense.approve", expenseManage: "expense.manage", expensePolicyManage: "expense.policy.manage", expenseCategoryManage: "expense.category.manage", expenseReimbursementManage: "expense.reimbursement.manage", documentUpdate: "document.update", documentVerify: "document.verify", documentReject: "document.reject", documentManage: "document.manage", documentDownload: "document.download", notificationRead: "notification.read", notificationManage: "notification.manage", notificationPreferenceUpdate: "notification.preference.update", reportView: "report.view", reportEmployee: "report.employee", reportAttendance: "report.attendance", reportLeave: "report.leave", reportExpense: "report.expense", reportPayroll: "report.payroll", reportRecruitment: "report.recruitment", reportProject: "report.project", reportTask: "report.task", reportExport: "report.export", billingView: "billing.view", billingManage: "billing.manage",
  payrollView: "payroll.view", payrollManage: "payroll.manage", payrollConfigure: "payroll.configure", payrollCalculate: "payroll.calculate", payrollReview: "payroll.review", payrollApprove: "payroll.approve", payrollFinalize: "payroll.finalize", payrollViewAll: "payroll.viewall", payrollViewSelf: "payroll.viewself", payslipView: "payslip.view", payslipDownload: "payslip.download",
  atsView: "ats.view", atsManage: "ats.manage", atsRequisitionCreate: "ats.requisition.create", atsRequisitionView: "ats.requisition.view", atsRequisitionApprove: "ats.requisition.approve", atsRequisitionEdit: "ats.requisition.edit", atsRequisitionClose: "ats.requisition.close", atsJobCreate: "ats.job.create", atsJobEdit: "ats.job.edit", atsJobPublish: "ats.job.publish", atsJobUnpublish: "ats.job.unpublish", atsJobView: "ats.job.view", atsCandidateCreate: "ats.candidate.create", atsCandidateView: "ats.candidate.view", atsCandidateEdit: "ats.candidate.edit", atsCandidateDelete: "ats.candidate.delete", atsCandidateImport: "ats.candidate.import", atsCandidateExport: "ats.candidate.export", atsApplicationView: "ats.application.view", atsApplicationCreate: "ats.application.create", atsApplicationMove: "ats.application.move", atsInterviewCreate: "ats.interview.create", atsInterviewView: "ats.interview.view", atsInterviewEdit: "ats.interview.edit", atsInterviewFeedback: "ats.interview.feedback", atsAssessmentManage: "ats.assessment.manage", atsTalentPoolManage: "ats.talentpool.manage", atsAnalyticsView: "ats.analytics.view",
} as const;
export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
export const ALL_PERMISSION_KEYS = Object.values(PERMISSIONS);
export const SYSTEM_ROLES = ["PLATFORM_OWNER", "ORGANIZATION_OWNER", "HR_ADMIN", "HR_EXECUTIVE", "RECRUITER", "MANAGER", "TEAM_LEAD", "EMPLOYEE", "FINANCE_ADMIN", "PROJECT_MANAGER"] as const;
export type SystemRole = (typeof SYSTEM_ROLES)[number];

export const APPROVAL_PERMISSIONS: readonly Permission[] = [
  PERMISSIONS.workflowApprove,
  PERMISSIONS.workflowManage,
  PERMISSIONS.leaveApprove,
  PERMISSIONS.attendanceRegularizationApprove,
  PERMISSIONS.expenseApprove,
  PERMISSIONS.payrollApprove,
  PERMISSIONS.atsRequisitionApprove,
] as const;

export function hasAnyApprovalPermission(permissions: Set<string> | readonly string[]): boolean {
  const permSet = permissions instanceof Set ? permissions : new Set(permissions);
  return APPROVAL_PERMISSIONS.some((p) => permSet.has(p));
}

export const ROLE_PERMISSIONS: Record<string, readonly Permission[]> = {
  ORGANIZATION_OWNER: ALL_PERMISSION_KEYS,
  HR_ADMIN: [PERMISSIONS.organizationRead, PERMISSIONS.organizationSettingsRead, PERMISSIONS.organizationSettingsUpdate, PERMISSIONS.membershipRead, PERMISSIONS.membershipInvite, PERMISSIONS.membershipUpdate, PERMISSIONS.roleRead, PERMISSIONS.departmentRead, PERMISSIONS.departmentCreate, PERMISSIONS.departmentUpdate, PERMISSIONS.departmentManage, PERMISSIONS.designationRead, PERMISSIONS.designationCreate, PERMISSIONS.designationUpdate, PERMISSIONS.designationManage, PERMISSIONS.locationRead, PERMISSIONS.locationCreate, PERMISSIONS.locationUpdate, PERMISSIONS.locationManage, PERMISSIONS.teamRead, PERMISSIONS.teamCreate, PERMISSIONS.teamUpdate, PERMISSIONS.teamManage, PERMISSIONS.employeeRead, PERMISSIONS.employeeCreate, PERMISSIONS.employeeUpdate, PERMISSIONS.employeeInvite, PERMISSIONS.employeeOnboard, PERMISSIONS.attendanceRead, PERMISSIONS.attendanceClockIn, PERMISSIONS.attendanceClockOut, PERMISSIONS.attendanceBreak, PERMISSIONS.attendanceManage, PERMISSIONS.attendanceRegularizationCreate, PERMISSIONS.attendanceRegularizationRead, PERMISSIONS.attendanceRegularizationApprove, PERMISSIONS.leaveRead, PERMISSIONS.leaveApprove, PERMISSIONS.leaveManage, PERMISSIONS.leaveBalanceRead, PERMISSIONS.leaveBalanceAdjust, PERMISSIONS.leavePolicyManage, PERMISSIONS.leaveTypeManage, PERMISSIONS.workflowRead, PERMISSIONS.workflowManage, PERMISSIONS.expenseRead, PERMISSIONS.expenseManage, PERMISSIONS.expensePolicyManage, PERMISSIONS.expenseCategoryManage, PERMISSIONS.documentRead, PERMISSIONS.documentUpload, PERMISSIONS.documentVerify, PERMISSIONS.documentReject, PERMISSIONS.documentManage, PERMISSIONS.notificationRead, PERMISSIONS.notificationManage, PERMISSIONS.payrollView, PERMISSIONS.payrollManage, PERMISSIONS.payrollConfigure, PERMISSIONS.payrollCalculate, PERMISSIONS.payrollReview, PERMISSIONS.payrollApprove, PERMISSIONS.payrollFinalize, PERMISSIONS.payrollViewAll, PERMISSIONS.payslipView, PERMISSIONS.payslipDownload, PERMISSIONS.chatRead, PERMISSIONS.chatSend, PERMISSIONS.chatCreate],
  HR_EXECUTIVE: [PERMISSIONS.organizationRead, PERMISSIONS.departmentRead, PERMISSIONS.employeeRead, PERMISSIONS.employeeCreate, PERMISSIONS.employeeUpdate, PERMISSIONS.employeeInvite, PERMISSIONS.attendanceRead, PERMISSIONS.attendanceClockIn, PERMISSIONS.attendanceClockOut, PERMISSIONS.attendanceBreak, PERMISSIONS.attendanceRegularizationCreate, PERMISSIONS.attendanceRegularizationRead, PERMISSIONS.leaveRead, PERMISSIONS.leaveApply, PERMISSIONS.documentRead, PERMISSIONS.documentUpload, PERMISSIONS.chatRead, PERMISSIONS.chatSend, PERMISSIONS.chatCreate],
  PROJECT_MANAGER: [PERMISSIONS.organizationRead, PERMISSIONS.employeeRead, PERMISSIONS.attendanceRead, PERMISSIONS.attendanceClockIn, PERMISSIONS.attendanceClockOut, PERMISSIONS.attendanceBreak, PERMISSIONS.attendanceRegularizationCreate, PERMISSIONS.attendanceRegularizationRead, PERMISSIONS.projectView, PERMISSIONS.projectCreate, PERMISSIONS.projectEdit, PERMISSIONS.projectArchive, PERMISSIONS.projectManageMembers, PERMISSIONS.taskRead, PERMISSIONS.taskCreate, PERMISSIONS.taskAssign, PERMISSIONS.taskUpdate, PERMISSIONS.taskDelete, PERMISSIONS.taskChangeStatus, PERMISSIONS.taskChangePriority, PERMISSIONS.taskComment, PERMISSIONS.taskAttach, PERMISSIONS.taskManageDependencies, PERMISSIONS.chatRead, PERMISSIONS.chatSend, PERMISSIONS.chatCreate],
  RECRUITER: [PERMISSIONS.organizationRead, PERMISSIONS.attendanceRead, PERMISSIONS.attendanceClockIn, PERMISSIONS.attendanceClockOut, PERMISSIONS.attendanceBreak, PERMISSIONS.attendanceRegularizationCreate, PERMISSIONS.attendanceRegularizationRead, PERMISSIONS.atsView, PERMISSIONS.atsManage, PERMISSIONS.atsRequisitionCreate, PERMISSIONS.atsRequisitionView, PERMISSIONS.atsRequisitionEdit, PERMISSIONS.atsJobCreate, PERMISSIONS.atsJobEdit, PERMISSIONS.atsJobPublish, PERMISSIONS.atsJobUnpublish, PERMISSIONS.atsJobView, PERMISSIONS.atsCandidateCreate, PERMISSIONS.atsCandidateView, PERMISSIONS.atsCandidateEdit, PERMISSIONS.atsCandidateImport, PERMISSIONS.atsCandidateExport, PERMISSIONS.atsApplicationView, PERMISSIONS.atsApplicationCreate, PERMISSIONS.atsApplicationMove, PERMISSIONS.atsInterviewCreate, PERMISSIONS.atsInterviewView, PERMISSIONS.atsInterviewEdit, PERMISSIONS.atsInterviewFeedback, PERMISSIONS.atsAssessmentManage, PERMISSIONS.atsTalentPoolManage, PERMISSIONS.atsAnalyticsView, PERMISSIONS.chatRead, PERMISSIONS.chatSend, PERMISSIONS.chatCreate],
  MANAGER: [PERMISSIONS.organizationRead, PERMISSIONS.departmentRead, PERMISSIONS.employeeRead, PERMISSIONS.attendanceRead, PERMISSIONS.attendanceClockIn, PERMISSIONS.attendanceClockOut, PERMISSIONS.attendanceBreak, PERMISSIONS.attendanceRegularizationCreate, PERMISSIONS.attendanceRegularizationRead, PERMISSIONS.attendanceRegularizationApprove, PERMISSIONS.leaveRead, PERMISSIONS.leaveApprove, PERMISSIONS.expenseRead, PERMISSIONS.expenseApprove, PERMISSIONS.workflowRead, PERMISSIONS.workflowApprove, PERMISSIONS.payrollView, PERMISSIONS.payrollReview, PERMISSIONS.payrollApprove, PERMISSIONS.payslipView, PERMISSIONS.chatRead, PERMISSIONS.chatSend, PERMISSIONS.chatCreate],
  TEAM_LEAD: [PERMISSIONS.organizationRead, PERMISSIONS.employeeRead, PERMISSIONS.attendanceRead, PERMISSIONS.attendanceClockIn, PERMISSIONS.attendanceClockOut, PERMISSIONS.attendanceBreak, PERMISSIONS.attendanceRegularizationCreate, PERMISSIONS.attendanceRegularizationRead, PERMISSIONS.attendanceRegularizationApprove, PERMISSIONS.leaveRead, PERMISSIONS.leaveApprove, PERMISSIONS.expenseRead, PERMISSIONS.expenseApprove, PERMISSIONS.workflowRead, PERMISSIONS.workflowApprove, PERMISSIONS.payrollView, PERMISSIONS.payrollReview, PERMISSIONS.payrollApprove, PERMISSIONS.payslipView, PERMISSIONS.chatRead, PERMISSIONS.chatSend, PERMISSIONS.chatCreate],
  FINANCE_ADMIN: [PERMISSIONS.organizationRead, PERMISSIONS.departmentRead, PERMISSIONS.attendanceRead, PERMISSIONS.attendanceClockIn, PERMISSIONS.attendanceClockOut, PERMISSIONS.attendanceBreak, PERMISSIONS.attendanceRegularizationCreate, PERMISSIONS.attendanceRegularizationRead, PERMISSIONS.expenseRead, PERMISSIONS.expenseApprove, PERMISSIONS.expenseManage, PERMISSIONS.expensePolicyManage, PERMISSIONS.expenseCategoryManage, PERMISSIONS.expenseReimbursementManage, PERMISSIONS.workflowRead, PERMISSIONS.workflowApprove, PERMISSIONS.notificationRead, PERMISSIONS.notificationManage, PERMISSIONS.payrollView, PERMISSIONS.payrollManage, PERMISSIONS.payrollConfigure, PERMISSIONS.payrollCalculate, PERMISSIONS.payrollReview, PERMISSIONS.payrollApprove, PERMISSIONS.payrollFinalize, PERMISSIONS.payrollViewAll, PERMISSIONS.payslipView, PERMISSIONS.payslipDownload, PERMISSIONS.chatRead, PERMISSIONS.chatSend, PERMISSIONS.chatCreate],
  EMPLOYEE: [PERMISSIONS.organizationRead, PERMISSIONS.attendanceRead, PERMISSIONS.attendanceClockIn, PERMISSIONS.attendanceClockOut, PERMISSIONS.attendanceBreak, PERMISSIONS.attendanceRegularizationCreate, PERMISSIONS.attendanceRegularizationRead, PERMISSIONS.leaveRead, PERMISSIONS.leaveApply, PERMISSIONS.leaveBalanceRead, PERMISSIONS.expenseRead, PERMISSIONS.expenseCreate, PERMISSIONS.expenseUpdate, PERMISSIONS.expenseSubmit, PERMISSIONS.expenseCancel, PERMISSIONS.documentRead, PERMISSIONS.documentUpload, PERMISSIONS.documentUpdate, PERMISSIONS.documentDownload, PERMISSIONS.notificationRead, PERMISSIONS.notificationPreferenceUpdate, PERMISSIONS.payrollViewSelf, PERMISSIONS.payslipView, PERMISSIONS.payslipDownload, PERMISSIONS.projectView, PERMISSIONS.projectCreate, PERMISSIONS.taskRead, PERMISSIONS.taskCreate, PERMISSIONS.taskUpdate, PERMISSIONS.taskComment, PERMISSIONS.chatRead, PERMISSIONS.chatSend, PERMISSIONS.chatCreate],
};

export const ASSIGNABLE_ROLES_BY_ACTOR: Record<string, readonly SystemRole[]> = {
  ORGANIZATION_OWNER: [
    "HR_ADMIN",
    "HR_EXECUTIVE",
    "FINANCE_ADMIN",
    "MANAGER",
    "TEAM_LEAD",
    "PROJECT_MANAGER",
    "RECRUITER",
    "EMPLOYEE",
  ],
  HR_ADMIN: [
    "HR_EXECUTIVE",
    "FINANCE_ADMIN",
    "MANAGER",
    "TEAM_LEAD",
    "PROJECT_MANAGER",
    "RECRUITER",
    "EMPLOYEE",
  ],
  HR_EXECUTIVE: [
    "EMPLOYEE",
  ],
  FINANCE_ADMIN: [],
  MANAGER: [],
  TEAM_LEAD: [],
  PROJECT_MANAGER: [],
  RECRUITER: [],
  EMPLOYEE: [],
};

export function canAssignRole(
  actorRoleKey?: string | null,
  targetRoleKey?: string | null
): boolean {
  if (!actorRoleKey || !targetRoleKey) return false;
  if (targetRoleKey === "PLATFORM_OWNER" || targetRoleKey === "ORGANIZATION_OWNER") return false;
  const allowed = ASSIGNABLE_ROLES_BY_ACTOR[actorRoleKey];
  if (!allowed) return false;
  return allowed.includes(targetRoleKey as SystemRole);
}

export function getAssignableRoles(actorRoleKey?: string | null): readonly SystemRole[] {
  if (!actorRoleKey) return [];
  return ASSIGNABLE_ROLES_BY_ACTOR[actorRoleKey] ?? [];
}

export interface RoleMetadata {
  key: SystemRole;
  title: string;
  category: string;
  badgeColor: string;
  shortDescription: string;
  description: string;
}

export const ROLE_METADATA: Record<SystemRole, RoleMetadata> = {
  PLATFORM_OWNER: {
    key: "PLATFORM_OWNER",
    title: "Platform Owner",
    category: "Platform Administration",
    badgeColor: "purple",
    shortDescription: "Global SaaS root administrator managing tenant organizations and system infra.",
    description: "Global SaaS root administrator managing tenant organizations, database migrations, and commercial tiers.",
  },
  ORGANIZATION_OWNER: {
    key: "ORGANIZATION_OWNER",
    title: "Organization Owner",
    category: "Executive Leadership",
    badgeColor: "emerald",
    shortDescription: "Full administrative ownership of the company workspace, billing, and settings.",
    description: "Full administrative ownership of the company workspace, role authorizations, workforce policies, and subscriptions.",
  },
  HR_ADMIN: {
    key: "HR_ADMIN",
    title: "HR Administrator",
    category: "People Operations",
    badgeColor: "blue",
    shortDescription: "Workforce directory governance, onboarding lifecycle, attendance, and leave administration.",
    description: "Workforce directory governance, role-based onboarding lifecycle, company policy settings, attendance, and leave administration.",
  },
  HR_EXECUTIVE: {
    key: "HR_EXECUTIVE",
    title: "HR Executive",
    category: "People Operations",
    badgeColor: "cyan",
    shortDescription: "Operational talent support, employee record onboarding, and leave regularizations.",
    description: "Operational talent support, employee record onboarding, attendance regularizations, and employee records maintenance.",
  },
  FINANCE_ADMIN: {
    key: "FINANCE_ADMIN",
    title: "Finance Administrator",
    category: "Financial Control",
    badgeColor: "amber",
    shortDescription: "Payroll calculations, expense reimbursement approvals, and fiscal ledger oversight.",
    description: "Payroll calculations, expense reimbursement approvals, salary disbursements, and fiscal ledger oversight.",
  },
  MANAGER: {
    key: "MANAGER",
    title: "Department Manager",
    category: "Management",
    badgeColor: "indigo",
    shortDescription: "Department-level team leadership, approval workflows, leave sign-offs, and performance.",
    description: "Department-level team leadership, multi-level approval workflows, leave sign-offs, shift allocations, and performance evaluations.",
  },
  TEAM_LEAD: {
    key: "TEAM_LEAD",
    title: "Team Lead",
    category: "Pod Leadership",
    badgeColor: "teal",
    shortDescription: "Sprint coordination, day-to-day team attendance verification, and work distribution.",
    description: "Sprint coordination, day-to-day team attendance verification, work distribution, and operational task tracking.",
  },
  PROJECT_MANAGER: {
    key: "PROJECT_MANAGER",
    title: "Project Manager",
    category: "Delivery & Projects",
    badgeColor: "violet",
    shortDescription: "Project planning, task dependency management, board tracking, and deliverable execution.",
    description: "Project planning, Gantt chart scheduling, task dependency management, Kanban board tracking, and deliverable execution.",
  },
  RECRUITER: {
    key: "RECRUITER",
    title: "Talent Recruiter",
    category: "Talent Acquisition",
    badgeColor: "rose",
    shortDescription: "Job requisition management, applicant tracking, interview schedules, and candidate offers.",
    description: "Job requisition management, applicant tracking pipeline, candidate screening, interview scheduling, and offer letter coordination.",
  },
  EMPLOYEE: {
    key: "EMPLOYEE",
    title: "Employee",
    category: "Workforce",
    badgeColor: "slate",
    shortDescription: "Self-service attendance logging, leave requests, expense claims, tasks, and company directory.",
    description: "Self-service attendance check-ins, leave applications, expense claims, task assignments, payslip downloads, and peer collaboration.",
  },
};

