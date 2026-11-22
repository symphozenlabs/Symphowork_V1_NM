import { requestCookieStorage, type CookieStore } from './compat/headers';
import { SESSION_COOKIE } from './proxy-policy';
import { logPerf } from './perf-logger';
import { requestCacheStorage, createRequestCacheStore } from './compat/react';

type RouteHandler = (request: Request, context: { params: Promise<Record<string, string>> }) => Promise<Response> | Response;
interface RouteEntry {
  pattern: RegExp;
  paramNames: string[];
  handlers: Record<string, RouteHandler | undefined>;
  subpath: string;
}

import * as r0 from '$lib/server/api/app/approvals/route';
import * as r1 from '$lib/server/api/app/approvals/[taskId]/route';
import * as r2 from '$lib/server/api/app/ats/applications/route';
import * as r3 from '$lib/server/api/app/ats/applications/[applicationId]/stage/route';
import * as r4 from '$lib/server/api/app/ats/candidates/route';
import * as r5 from '$lib/server/api/app/ats/candidates/[candidateId]/resumes/route';
import * as r6 from '$lib/server/api/app/ats/candidates/[candidateId]/route';
import * as r7 from '$lib/server/api/app/ats/employee-options/route';
import * as r8 from '$lib/server/api/app/ats/intelligence/config/route';
import * as r9 from '$lib/server/api/app/ats/intelligence/search/route';
import * as r10 from '$lib/server/api/app/ats/interviews/list/route';
import * as r11 from '$lib/server/api/app/ats/interviews/route';
import * as r12 from '$lib/server/api/app/ats/interviews/[interviewId]/feedback/route';
import * as r13 from '$lib/server/api/app/ats/jobs/route';
import * as r14 from '$lib/server/api/app/ats/jobs/[jobId]/intelligence/route';
import * as r15 from '$lib/server/api/app/ats/jobs/[jobId]/publish/route';
import * as r16 from '$lib/server/api/app/ats/pipeline/route';
import * as r17 from '$lib/server/api/app/ats/requisitions/route';
import * as r18 from '$lib/server/api/app/ats/requisitions/[requisitionId]/submit/route';
import * as r19 from '$lib/server/api/app/ats/resume-config/route';
import * as r20 from '$lib/server/api/app/ats/resume-fields/[fieldId]/review/route';
import * as r21 from '$lib/server/api/app/ats/resumes/jobs/[jobId]/process/route';
import * as r22 from '$lib/server/api/app/ats/resumes/[documentId]/download/route';
import * as r23 from '$lib/server/api/app/ats/talent-pools/route';
import * as r24 from '$lib/server/api/app/attendance/organization/route';
import * as r25 from '$lib/server/api/app/attendance/process-absent/route';
import * as r26 from '$lib/server/api/app/attendance/punch/route';
import * as r27 from '$lib/server/api/app/attendance/regularization/route';
import * as r28 from '$lib/server/api/app/attendance/reminder/route';
import * as r29 from '$lib/server/api/app/attendance/route';
import * as r30 from '$lib/server/api/app/billing/route';
import * as r31 from '$lib/server/api/app/chat/conversations/route';
import * as r32 from '$lib/server/api/app/chat/conversations/[conversationId]/attachments/route';
import * as r33 from '$lib/server/api/app/chat/conversations/[conversationId]/attachments/[attachmentId]/route';
import * as r34 from '$lib/server/api/app/chat/conversations/[conversationId]/messages/route';
import * as r35 from '$lib/server/api/app/chat/conversations/[conversationId]/messages/[messageId]/reactions/route';
import * as r36 from '$lib/server/api/app/chat/conversations/[conversationId]/read/route';
import * as r37 from '$lib/server/api/app/chat/conversations/[conversationId]/typing/route';
import * as r38 from '$lib/server/api/app/chat/messages/[messageId]/task/route';
import * as r39 from '$lib/server/api/app/chat/presence/route';
import * as r40 from '$lib/server/api/app/chat/recipients/route';
import * as r41 from '$lib/server/api/app/chat/search/route';
import * as r42 from '$lib/server/api/app/chat/unread-count/route';
import * as r43 from '$lib/server/api/app/departments/eligible-managers/route';
import * as r44 from '$lib/server/api/app/departments/eligible-team-leads/route';
import * as r45 from '$lib/server/api/app/departments/route';
import * as r46 from '$lib/server/api/app/departments/[departmentId]/deletion-check/route';
import * as r47 from '$lib/server/api/app/departments/[departmentId]/route';
import * as r48 from '$lib/server/api/app/departments/[departmentId]/teams/route';
import * as r49 from '$lib/server/api/app/departments/[departmentId]/teams/[teamId]/route';
import * as r50 from '$lib/server/api/app/directory/route';
import * as r51 from '$lib/server/api/app/documents/route';
import * as r52 from '$lib/server/api/app/documents/types/route';
import * as r53 from '$lib/server/api/app/documents/[documentId]/route';
import * as r54 from '$lib/server/api/app/employees/route';
import * as r55 from '$lib/server/api/app/employees/[employeeId]/invite/revoke/route';
import * as r56 from '$lib/server/api/app/employees/[employeeId]/invite/route';
import * as r57 from '$lib/server/api/app/employees/[employeeId]/onboarding/route';
import * as r58 from '$lib/server/api/app/employees/[employeeId]/route';
import * as r59 from '$lib/server/api/app/expenses/categories/route';
import * as r60 from '$lib/server/api/app/expenses/items/[itemId]/receipt/route';
import * as r61 from '$lib/server/api/app/expenses/route';
import * as r62 from '$lib/server/api/app/expenses/[claimId]/route';
import * as r63 from '$lib/server/api/app/expenses/[claimId]/submit/route';
import * as r64 from '$lib/server/api/app/leave/route';
import * as r65 from '$lib/server/api/app/leave/types/route';
import * as r66 from '$lib/server/api/app/master-data/departments/route';
import * as r67 from '$lib/server/api/app/master-data/designations/route';
import * as r68 from '$lib/server/api/app/master-data/employment-types/route';
import * as r69 from '$lib/server/api/app/master-data/holidays/route';
import * as r70 from '$lib/server/api/app/master-data/locations/route';
import * as r71 from '$lib/server/api/app/master-data/shifts/route';
import * as r72 from '$lib/server/api/app/master-data/teams/route';
import * as r73 from '$lib/server/api/app/master-data/working-days/route';
import * as r74 from '$lib/server/api/app/master-data/[resource]/[itemId]/route';
import * as r75 from '$lib/server/api/app/me/employee/route';
import * as r76 from '$lib/server/api/app/notifications/preferences/route';
import * as r77 from '$lib/server/api/app/notifications/route';
import * as r78 from '$lib/server/api/app/notifications/[notificationId]/route';
import * as r79 from '$lib/server/api/app/payroll/config/route';
import * as r80 from '$lib/server/api/app/payroll/employee-options/route';
import * as r81 from '$lib/server/api/app/payroll/payslips/route';
import * as r82 from '$lib/server/api/app/payroll/periods/route';
import * as r83 from '$lib/server/api/app/payroll/profiles/route';
import * as r84 from '$lib/server/api/app/payroll/runs/route';
import * as r85 from '$lib/server/api/app/payroll/runs/[runId]/finalize/route';
import * as r86 from '$lib/server/api/app/payroll/runs/[runId]/pay/route';
import * as r87 from '$lib/server/api/app/payroll/runs/[runId]/route';
import * as r88 from '$lib/server/api/app/payroll/salary-assignments/route';
import * as r89 from '$lib/server/api/app/projects/route';
import * as r90 from '$lib/server/api/app/projects/[projectId]/route';
import * as r91 from '$lib/server/api/app/reports/route';
import * as r92 from '$lib/server/api/app/tasks/route';
import * as r93 from '$lib/server/api/app/tasks/[taskId]/route';
import * as r94 from '$lib/server/api/app/workflows/route';
import * as r95 from '$lib/server/api/auth/change-password/route';
import * as r96 from '$lib/server/api/auth/forgot-password/route';
import * as r97 from '$lib/server/api/auth/invitations/accept/preview/route';
import * as r98 from '$lib/server/api/auth/invitations/accept/route';
import * as r99 from '$lib/server/api/auth/login/route';
import * as r100 from '$lib/server/api/auth/logout/route';
import * as r101 from '$lib/server/api/auth/register/route';
import * as r102 from '$lib/server/api/auth/reset-password/route';
import * as r103 from '$lib/server/api/auth/verify-email/resend/route';
import * as r104 from '$lib/server/api/auth/verify-email/route';
import * as r105 from '$lib/server/api/health/route';
import * as r106 from '$lib/server/api/platform/analytics/route';
import * as r107 from '$lib/server/api/platform/audit/route';
import * as r108 from '$lib/server/api/platform/auth/login/route';
import * as r109 from '$lib/server/api/platform/billing/route';
import * as r110 from '$lib/server/api/platform/configuration/route';
import * as r111 from '$lib/server/api/platform/features/route';
import * as r112 from '$lib/server/api/platform/features/[featureId]/route';
import * as r113 from '$lib/server/api/platform/health/route';
import * as r114 from '$lib/server/api/platform/organizations/route';
import * as r115 from '$lib/server/api/platform/organizations/[organizationId]/approve/route';
import * as r116 from '$lib/server/api/platform/organizations/[organizationId]/invitation/link/route';
import * as r117 from '$lib/server/api/platform/organizations/[organizationId]/invitation/resend/route';
import * as r118 from '$lib/server/api/platform/organizations/[organizationId]/route';
import * as r119 from '$lib/server/api/platform/organizations/[organizationId]/status/route';
import * as r120 from '$lib/server/api/platform/plans/route';
import * as r121 from '$lib/server/api/platform/plans/[planId]/route';
import * as r122 from '$lib/server/api/platform/provisioning/route';
import * as r123 from '$lib/server/api/platform/provisioning/[organizationId]/retry/route';
import * as r124 from '$lib/server/api/platform/subscriptions/route';
import * as r125 from '$lib/server/api/platform/subscriptions/[subscriptionId]/route';
import * as r126 from '$lib/server/api/platform/support/route';
import * as r127 from '$lib/server/api/platform/usage/route';
import * as r128 from '$lib/server/api/platform/users/route';
import * as r129 from '$lib/server/api/public/jobs/[slug]/apply/route';
import * as r130 from '$lib/server/api/public/jobs/[slug]/route';

export const ROUTE_ENTRIES: RouteEntry[] = [
  { subpath: "app/approvals", pattern: new RegExp("^/api/app/approvals/?$"), paramNames: [], handlers: { GET: r0.GET } },
  { subpath: "app/approvals/[taskId]", pattern: new RegExp("^/api/app/approvals/([^/]+)/?$"), paramNames: ["taskId"], handlers: { GET: r1.GET, POST: r1.POST } },
  { subpath: "app/ats/applications", pattern: new RegExp("^/api/app/ats/applications/?$"), paramNames: [], handlers: { GET: r2.GET } },
  { subpath: "app/ats/applications/[applicationId]/stage", pattern: new RegExp("^/api/app/ats/applications/([^/]+)/stage/?$"), paramNames: ["applicationId"], handlers: { POST: r3.POST } },
  { subpath: "app/ats/candidates", pattern: new RegExp("^/api/app/ats/candidates/?$"), paramNames: [], handlers: { GET: r4.GET, POST: r4.POST } },
  { subpath: "app/ats/candidates/[candidateId]/resumes", pattern: new RegExp("^/api/app/ats/candidates/([^/]+)/resumes/?$"), paramNames: ["candidateId"], handlers: { GET: r5.GET, POST: r5.POST } },
  { subpath: "app/ats/candidates/[candidateId]", pattern: new RegExp("^/api/app/ats/candidates/([^/]+)/?$"), paramNames: ["candidateId"], handlers: { GET: r6.GET } },
  { subpath: "app/ats/employee-options", pattern: new RegExp("^/api/app/ats/employee-options/?$"), paramNames: [], handlers: { GET: r7.GET } },
  { subpath: "app/ats/intelligence/config", pattern: new RegExp("^/api/app/ats/intelligence/config/?$"), paramNames: [], handlers: { GET: r8.GET, POST: r8.POST } },
  { subpath: "app/ats/intelligence/search", pattern: new RegExp("^/api/app/ats/intelligence/search/?$"), paramNames: [], handlers: { POST: r9.POST } },
  { subpath: "app/ats/interviews/list", pattern: new RegExp("^/api/app/ats/interviews/list/?$"), paramNames: [], handlers: { GET: r10.GET } },
  { subpath: "app/ats/interviews", pattern: new RegExp("^/api/app/ats/interviews/?$"), paramNames: [], handlers: { POST: r11.POST } },
  { subpath: "app/ats/interviews/[interviewId]/feedback", pattern: new RegExp("^/api/app/ats/interviews/([^/]+)/feedback/?$"), paramNames: ["interviewId"], handlers: { POST: r12.POST } },
  { subpath: "app/ats/jobs", pattern: new RegExp("^/api/app/ats/jobs/?$"), paramNames: [], handlers: { GET: r13.GET, POST: r13.POST } },
  { subpath: "app/ats/jobs/[jobId]/intelligence", pattern: new RegExp("^/api/app/ats/jobs/([^/]+)/intelligence/?$"), paramNames: ["jobId"], handlers: { GET: r14.GET, POST: r14.POST } },
  { subpath: "app/ats/jobs/[jobId]/publish", pattern: new RegExp("^/api/app/ats/jobs/([^/]+)/publish/?$"), paramNames: ["jobId"], handlers: { POST: r15.POST } },
  { subpath: "app/ats/pipeline", pattern: new RegExp("^/api/app/ats/pipeline/?$"), paramNames: [], handlers: { GET: r16.GET } },
  { subpath: "app/ats/requisitions", pattern: new RegExp("^/api/app/ats/requisitions/?$"), paramNames: [], handlers: { GET: r17.GET, POST: r17.POST } },
  { subpath: "app/ats/requisitions/[requisitionId]/submit", pattern: new RegExp("^/api/app/ats/requisitions/([^/]+)/submit/?$"), paramNames: ["requisitionId"], handlers: { POST: r18.POST } },
  { subpath: "app/ats/resume-config", pattern: new RegExp("^/api/app/ats/resume-config/?$"), paramNames: [], handlers: { GET: r19.GET, POST: r19.POST } },
  { subpath: "app/ats/resume-fields/[fieldId]/review", pattern: new RegExp("^/api/app/ats/resume-fields/([^/]+)/review/?$"), paramNames: ["fieldId"], handlers: { POST: r20.POST } },
  { subpath: "app/ats/resumes/jobs/[jobId]/process", pattern: new RegExp("^/api/app/ats/resumes/jobs/([^/]+)/process/?$"), paramNames: ["jobId"], handlers: { POST: r21.POST } },
  { subpath: "app/ats/resumes/[documentId]/download", pattern: new RegExp("^/api/app/ats/resumes/([^/]+)/download/?$"), paramNames: ["documentId"], handlers: { GET: r22.GET } },
  { subpath: "app/ats/talent-pools", pattern: new RegExp("^/api/app/ats/talent-pools/?$"), paramNames: [], handlers: { POST: r23.POST } },
  { subpath: "app/attendance/organization", pattern: new RegExp("^/api/app/attendance/organization/?$"), paramNames: [], handlers: { GET: r24.GET } },
  { subpath: "app/attendance/process-absent", pattern: new RegExp("^/api/app/attendance/process-absent/?$"), paramNames: [], handlers: { POST: r25.POST } },
  { subpath: "app/attendance/punch", pattern: new RegExp("^/api/app/attendance/punch/?$"), paramNames: [], handlers: { POST: r26.POST } },
  { subpath: "app/attendance/regularization", pattern: new RegExp("^/api/app/attendance/regularization/?$"), paramNames: [], handlers: { GET: r27.GET, POST: r27.POST } },
  { subpath: "app/attendance/reminder", pattern: new RegExp("^/api/app/attendance/reminder/?$"), paramNames: [], handlers: { GET: r28.GET } },
  { subpath: "app/attendance", pattern: new RegExp("^/api/app/attendance/?$"), paramNames: [], handlers: { GET: r29.GET } },
  { subpath: "app/billing", pattern: new RegExp("^/api/app/billing/?$"), paramNames: [], handlers: { GET: r30.GET, POST: r30.POST } },
  { subpath: "app/chat/conversations", pattern: new RegExp("^/api/app/chat/conversations/?$"), paramNames: [], handlers: { GET: r31.GET, POST: r31.POST } },
  { subpath: "app/chat/conversations/[conversationId]/attachments", pattern: new RegExp("^/api/app/chat/conversations/([^/]+)/attachments/?$"), paramNames: ["conversationId"], handlers: { POST: r32.POST } },
  { subpath: "app/chat/conversations/[conversationId]/attachments/[attachmentId]", pattern: new RegExp("^/api/app/chat/conversations/([^/]+)/attachments/([^/]+)/?$"), paramNames: ["conversationId","attachmentId"], handlers: { GET: r33.GET } },
  { subpath: "app/chat/conversations/[conversationId]/messages", pattern: new RegExp("^/api/app/chat/conversations/([^/]+)/messages/?$"), paramNames: ["conversationId"], handlers: { GET: r34.GET, POST: r34.POST } },
  { subpath: "app/chat/conversations/[conversationId]/messages/[messageId]/reactions", pattern: new RegExp("^/api/app/chat/conversations/([^/]+)/messages/([^/]+)/reactions/?$"), paramNames: ["conversationId","messageId"], handlers: { POST: r35.POST } },
  { subpath: "app/chat/conversations/[conversationId]/read", pattern: new RegExp("^/api/app/chat/conversations/([^/]+)/read/?$"), paramNames: ["conversationId"], handlers: { POST: r36.POST } },
  { subpath: "app/chat/conversations/[conversationId]/typing", pattern: new RegExp("^/api/app/chat/conversations/([^/]+)/typing/?$"), paramNames: ["conversationId"], handlers: { POST: r37.POST } },
  { subpath: "app/chat/messages/[messageId]/task", pattern: new RegExp("^/api/app/chat/messages/([^/]+)/task/?$"), paramNames: ["messageId"], handlers: { POST: r38.POST } },
  { subpath: "app/chat/presence", pattern: new RegExp("^/api/app/chat/presence/?$"), paramNames: [], handlers: { GET: r39.GET, POST: r39.POST } },
  { subpath: "app/chat/recipients", pattern: new RegExp("^/api/app/chat/recipients/?$"), paramNames: [], handlers: { GET: r40.GET } },
  { subpath: "app/chat/search", pattern: new RegExp("^/api/app/chat/search/?$"), paramNames: [], handlers: { GET: r41.GET } },
  { subpath: "app/chat/unread-count", pattern: new RegExp("^/api/app/chat/unread-count/?$"), paramNames: [], handlers: { GET: r42.GET } },
  { subpath: "app/departments/eligible-managers", pattern: new RegExp("^/api/app/departments/eligible-managers/?$"), paramNames: [], handlers: { GET: r43.GET } },
  { subpath: "app/departments/eligible-team-leads", pattern: new RegExp("^/api/app/departments/eligible-team-leads/?$"), paramNames: [], handlers: { GET: r44.GET } },
  { subpath: "app/departments", pattern: new RegExp("^/api/app/departments/?$"), paramNames: [], handlers: { GET: r45.GET, POST: r45.POST } },
  { subpath: "app/departments/[departmentId]/deletion-check", pattern: new RegExp("^/api/app/departments/([^/]+)/deletion-check/?$"), paramNames: ["departmentId"], handlers: { GET: r46.GET } },
  { subpath: "app/departments/[departmentId]", pattern: new RegExp("^/api/app/departments/([^/]+)/?$"), paramNames: ["departmentId"], handlers: { GET: r47.GET, PATCH: r47.PATCH, DELETE: r47.DELETE } },
  { subpath: "app/departments/[departmentId]/teams", pattern: new RegExp("^/api/app/departments/([^/]+)/teams/?$"), paramNames: ["departmentId"], handlers: { GET: r48.GET, POST: r48.POST } },
  { subpath: "app/departments/[departmentId]/teams/[teamId]", pattern: new RegExp("^/api/app/departments/([^/]+)/teams/([^/]+)/?$"), paramNames: ["departmentId","teamId"], handlers: { PATCH: r49.PATCH, DELETE: r49.DELETE } },
  { subpath: "app/directory", pattern: new RegExp("^/api/app/directory/?$"), paramNames: [], handlers: { GET: r50.GET } },
  { subpath: "app/documents", pattern: new RegExp("^/api/app/documents/?$"), paramNames: [], handlers: { GET: r51.GET, POST: r51.POST } },
  { subpath: "app/documents/types", pattern: new RegExp("^/api/app/documents/types/?$"), paramNames: [], handlers: { GET: r52.GET, POST: r52.POST } },
  { subpath: "app/documents/[documentId]", pattern: new RegExp("^/api/app/documents/([^/]+)/?$"), paramNames: ["documentId"], handlers: { GET: r53.GET, PATCH: r53.PATCH } },
  { subpath: "app/employees", pattern: new RegExp("^/api/app/employees/?$"), paramNames: [], handlers: { GET: r54.GET, POST: r54.POST } },
  { subpath: "app/employees/[employeeId]/invite/revoke", pattern: new RegExp("^/api/app/employees/([^/]+)/invite/revoke/?$"), paramNames: ["employeeId"], handlers: { POST: r55.POST } },
  { subpath: "app/employees/[employeeId]/invite", pattern: new RegExp("^/api/app/employees/([^/]+)/invite/?$"), paramNames: ["employeeId"], handlers: { POST: r56.POST } },
  { subpath: "app/employees/[employeeId]/onboarding", pattern: new RegExp("^/api/app/employees/([^/]+)/onboarding/?$"), paramNames: ["employeeId"], handlers: { GET: r57.GET, POST: r57.POST, PATCH: r57.PATCH } },
  { subpath: "app/employees/[employeeId]", pattern: new RegExp("^/api/app/employees/([^/]+)/?$"), paramNames: ["employeeId"], handlers: { GET: r58.GET, PATCH: r58.PATCH } },
  { subpath: "app/expenses/categories", pattern: new RegExp("^/api/app/expenses/categories/?$"), paramNames: [], handlers: { GET: r59.GET, POST: r59.POST } },
  { subpath: "app/expenses/items/[itemId]/receipt", pattern: new RegExp("^/api/app/expenses/items/([^/]+)/receipt/?$"), paramNames: ["itemId"], handlers: { POST: r60.POST } },
  { subpath: "app/expenses", pattern: new RegExp("^/api/app/expenses/?$"), paramNames: [], handlers: { GET: r61.GET, POST: r61.POST } },
  { subpath: "app/expenses/[claimId]", pattern: new RegExp("^/api/app/expenses/([^/]+)/?$"), paramNames: ["claimId"], handlers: { GET: r62.GET, PATCH: r62.PATCH } },
  { subpath: "app/expenses/[claimId]/submit", pattern: new RegExp("^/api/app/expenses/([^/]+)/submit/?$"), paramNames: ["claimId"], handlers: { POST: r63.POST } },
  { subpath: "app/leave", pattern: new RegExp("^/api/app/leave/?$"), paramNames: [], handlers: { GET: r64.GET, POST: r64.POST } },
  { subpath: "app/leave/types", pattern: new RegExp("^/api/app/leave/types/?$"), paramNames: [], handlers: { GET: r65.GET } },
  { subpath: "app/master-data/departments", pattern: new RegExp("^/api/app/master-data/departments/?$"), paramNames: [], handlers: { GET: r66.GET, POST: r66.POST } },
  { subpath: "app/master-data/designations", pattern: new RegExp("^/api/app/master-data/designations/?$"), paramNames: [], handlers: { GET: r67.GET, POST: r67.POST } },
  { subpath: "app/master-data/employment-types", pattern: new RegExp("^/api/app/master-data/employment-types/?$"), paramNames: [], handlers: { GET: r68.GET, POST: r68.POST } },
  { subpath: "app/master-data/holidays", pattern: new RegExp("^/api/app/master-data/holidays/?$"), paramNames: [], handlers: { GET: r69.GET, POST: r69.POST } },
  { subpath: "app/master-data/locations", pattern: new RegExp("^/api/app/master-data/locations/?$"), paramNames: [], handlers: { GET: r70.GET, POST: r70.POST } },
  { subpath: "app/master-data/shifts", pattern: new RegExp("^/api/app/master-data/shifts/?$"), paramNames: [], handlers: { GET: r71.GET, POST: r71.POST } },
  { subpath: "app/master-data/teams", pattern: new RegExp("^/api/app/master-data/teams/?$"), paramNames: [], handlers: { GET: r72.GET, POST: r72.POST } },
  { subpath: "app/master-data/working-days", pattern: new RegExp("^/api/app/master-data/working-days/?$"), paramNames: [], handlers: { GET: r73.GET, POST: r73.POST } },
  { subpath: "app/master-data/[resource]/[itemId]", pattern: new RegExp("^/api/app/master-data/([^/]+)/([^/]+)/?$"), paramNames: ["resource","itemId"], handlers: { PATCH: r74.PATCH, DELETE: r74.DELETE } },
  { subpath: "app/me/employee", pattern: new RegExp("^/api/app/me/employee/?$"), paramNames: [], handlers: { GET: r75.GET, PATCH: r75.PATCH } },
  { subpath: "app/notifications/preferences", pattern: new RegExp("^/api/app/notifications/preferences/?$"), paramNames: [], handlers: { GET: r76.GET, POST: r76.POST } },
  { subpath: "app/notifications", pattern: new RegExp("^/api/app/notifications/?$"), paramNames: [], handlers: { GET: r77.GET, PATCH: r77.PATCH } },
  { subpath: "app/notifications/[notificationId]", pattern: new RegExp("^/api/app/notifications/([^/]+)/?$"), paramNames: ["notificationId"], handlers: { POST: r78.POST } },
  { subpath: "app/payroll/config", pattern: new RegExp("^/api/app/payroll/config/?$"), paramNames: [], handlers: { GET: r79.GET, POST: r79.POST } },
  { subpath: "app/payroll/employee-options", pattern: new RegExp("^/api/app/payroll/employee-options/?$"), paramNames: [], handlers: { GET: r80.GET } },
  { subpath: "app/payroll/payslips", pattern: new RegExp("^/api/app/payroll/payslips/?$"), paramNames: [], handlers: { GET: r81.GET } },
  { subpath: "app/payroll/periods", pattern: new RegExp("^/api/app/payroll/periods/?$"), paramNames: [], handlers: { GET: r82.GET, POST: r82.POST } },
  { subpath: "app/payroll/profiles", pattern: new RegExp("^/api/app/payroll/profiles/?$"), paramNames: [], handlers: { GET: r83.GET, POST: r83.POST } },
  { subpath: "app/payroll/runs", pattern: new RegExp("^/api/app/payroll/runs/?$"), paramNames: [], handlers: { GET: r84.GET, POST: r84.POST } },
  { subpath: "app/payroll/runs/[runId]/finalize", pattern: new RegExp("^/api/app/payroll/runs/([^/]+)/finalize/?$"), paramNames: ["runId"], handlers: { POST: r85.POST } },
  { subpath: "app/payroll/runs/[runId]/pay", pattern: new RegExp("^/api/app/payroll/runs/([^/]+)/pay/?$"), paramNames: ["runId"], handlers: { POST: r86.POST } },
  { subpath: "app/payroll/runs/[runId]", pattern: new RegExp("^/api/app/payroll/runs/([^/]+)/?$"), paramNames: ["runId"], handlers: { GET: r87.GET } },
  { subpath: "app/payroll/salary-assignments", pattern: new RegExp("^/api/app/payroll/salary-assignments/?$"), paramNames: [], handlers: { GET: r88.GET, POST: r88.POST } },
  { subpath: "app/projects", pattern: new RegExp("^/api/app/projects/?$"), paramNames: [], handlers: { GET: r89.GET, POST: r89.POST } },
  { subpath: "app/projects/[projectId]", pattern: new RegExp("^/api/app/projects/([^/]+)/?$"), paramNames: ["projectId"], handlers: { GET: r90.GET, POST: r90.POST, PATCH: r90.PATCH } },
  { subpath: "app/reports", pattern: new RegExp("^/api/app/reports/?$"), paramNames: [], handlers: { GET: r91.GET, POST: r91.POST } },
  { subpath: "app/tasks", pattern: new RegExp("^/api/app/tasks/?$"), paramNames: [], handlers: { GET: r92.GET, POST: r92.POST } },
  { subpath: "app/tasks/[taskId]", pattern: new RegExp("^/api/app/tasks/([^/]+)/?$"), paramNames: ["taskId"], handlers: { GET: r93.GET, POST: r93.POST, PATCH: r93.PATCH } },
  { subpath: "app/workflows", pattern: new RegExp("^/api/app/workflows/?$"), paramNames: [], handlers: { GET: r94.GET, POST: r94.POST } },
  { subpath: "auth/change-password", pattern: new RegExp("^/api/auth/change-password/?$"), paramNames: [], handlers: { POST: r95.POST } },
  { subpath: "auth/forgot-password", pattern: new RegExp("^/api/auth/forgot-password/?$"), paramNames: [], handlers: { POST: r96.POST } },
  { subpath: "auth/invitations/accept/preview", pattern: new RegExp("^/api/auth/invitations/accept/preview/?$"), paramNames: [], handlers: { GET: r97.GET } },
  { subpath: "auth/invitations/accept", pattern: new RegExp("^/api/auth/invitations/accept/?$"), paramNames: [], handlers: { POST: r98.POST } },
  { subpath: "auth/login", pattern: new RegExp("^/api/auth/login/?$"), paramNames: [], handlers: { POST: r99.POST } },
  { subpath: "auth/logout", pattern: new RegExp("^/api/auth/logout/?$"), paramNames: [], handlers: { POST: r100.POST } },
  { subpath: "auth/register", pattern: new RegExp("^/api/auth/register/?$"), paramNames: [], handlers: { POST: r101.POST } },
  { subpath: "auth/reset-password", pattern: new RegExp("^/api/auth/reset-password/?$"), paramNames: [], handlers: { POST: r102.POST } },
  { subpath: "auth/verify-email/resend", pattern: new RegExp("^/api/auth/verify-email/resend/?$"), paramNames: [], handlers: { POST: r103.POST } },
  { subpath: "auth/verify-email", pattern: new RegExp("^/api/auth/verify-email/?$"), paramNames: [], handlers: { POST: r104.POST } },
  { subpath: "health", pattern: new RegExp("^/api/health/?$"), paramNames: [], handlers: { GET: r105.GET } },
  { subpath: "platform/analytics", pattern: new RegExp("^/api/platform/analytics/?$"), paramNames: [], handlers: { GET: r106.GET } },
  { subpath: "platform/audit", pattern: new RegExp("^/api/platform/audit/?$"), paramNames: [], handlers: { GET: r107.GET } },
  { subpath: "platform/auth/login", pattern: new RegExp("^/api/platform/auth/login/?$"), paramNames: [], handlers: { POST: r108.POST } },
  { subpath: "platform/billing", pattern: new RegExp("^/api/platform/billing/?$"), paramNames: [], handlers: { GET: r109.GET } },
  { subpath: "platform/configuration", pattern: new RegExp("^/api/platform/configuration/?$"), paramNames: [], handlers: { GET: r110.GET, PATCH: r110.PATCH } },
  { subpath: "platform/features", pattern: new RegExp("^/api/platform/features/?$"), paramNames: [], handlers: { GET: r111.GET, POST: r111.POST } },
  { subpath: "platform/features/[featureId]", pattern: new RegExp("^/api/platform/features/([^/]+)/?$"), paramNames: ["featureId"], handlers: { PATCH: r112.PATCH } },
  { subpath: "platform/health", pattern: new RegExp("^/api/platform/health/?$"), paramNames: [], handlers: { GET: r113.GET } },
  { subpath: "platform/organizations", pattern: new RegExp("^/api/platform/organizations/?$"), paramNames: [], handlers: { GET: r114.GET, POST: r114.POST } },
  { subpath: "platform/organizations/[organizationId]/approve", pattern: new RegExp("^/api/platform/organizations/([^/]+)/approve/?$"), paramNames: ["organizationId"], handlers: { POST: r115.POST } },
  { subpath: "platform/organizations/[organizationId]/invitation/link", pattern: new RegExp("^/api/platform/organizations/([^/]+)/invitation/link/?$"), paramNames: ["organizationId"], handlers: { POST: r116.POST } },
  { subpath: "platform/organizations/[organizationId]/invitation/resend", pattern: new RegExp("^/api/platform/organizations/([^/]+)/invitation/resend/?$"), paramNames: ["organizationId"], handlers: { POST: r117.POST } },
  { subpath: "platform/organizations/[organizationId]", pattern: new RegExp("^/api/platform/organizations/([^/]+)/?$"), paramNames: ["organizationId"], handlers: { GET: r118.GET, DELETE: r118.DELETE } },
  { subpath: "platform/organizations/[organizationId]/status", pattern: new RegExp("^/api/platform/organizations/([^/]+)/status/?$"), paramNames: ["organizationId"], handlers: { POST: r119.POST } },
  { subpath: "platform/plans", pattern: new RegExp("^/api/platform/plans/?$"), paramNames: [], handlers: { GET: r120.GET, POST: r120.POST } },
  { subpath: "platform/plans/[planId]", pattern: new RegExp("^/api/platform/plans/([^/]+)/?$"), paramNames: ["planId"], handlers: { GET: r121.GET, PUT: r121.PUT, PATCH: r121.PATCH, DELETE: r121.DELETE } },
  { subpath: "platform/provisioning", pattern: new RegExp("^/api/platform/provisioning/?$"), paramNames: [], handlers: { GET: r122.GET } },
  { subpath: "platform/provisioning/[organizationId]/retry", pattern: new RegExp("^/api/platform/provisioning/([^/]+)/retry/?$"), paramNames: ["organizationId"], handlers: { POST: r123.POST } },
  { subpath: "platform/subscriptions", pattern: new RegExp("^/api/platform/subscriptions/?$"), paramNames: [], handlers: { GET: r124.GET, POST: r124.POST } },
  { subpath: "platform/subscriptions/[subscriptionId]", pattern: new RegExp("^/api/platform/subscriptions/([^/]+)/?$"), paramNames: ["subscriptionId"], handlers: { PATCH: r125.PATCH } },
  { subpath: "platform/support", pattern: new RegExp("^/api/platform/support/?$"), paramNames: [], handlers: { GET: r126.GET, POST: r126.POST } },
  { subpath: "platform/usage", pattern: new RegExp("^/api/platform/usage/?$"), paramNames: [], handlers: { GET: r127.GET } },
  { subpath: "platform/users", pattern: new RegExp("^/api/platform/users/?$"), paramNames: [], handlers: { GET: r128.GET, PATCH: r128.PATCH } },
  { subpath: "public/jobs/[slug]/apply", pattern: new RegExp("^/api/public/jobs/([^/]+)/apply/?$"), paramNames: ["slug"], handlers: { POST: r129.POST } },
  { subpath: "public/jobs/[slug]", pattern: new RegExp("^/api/public/jobs/([^/]+)/?$"), paramNames: ["slug"], handlers: { GET: r130.GET } },
];


export function matchRoute(pathname: string): { entry: RouteEntry; params: Record<string, string> } | null {
  for (const entry of ROUTE_ENTRIES) {
    const match = entry.pattern.exec(pathname);
    if (match) {
      const params: Record<string, string> = {};
      for (let i = 0; i < entry.paramNames.length; i++) {
        params[entry.paramNames[i]] = decodeURIComponent(match[i + 1]);
      }
      return { entry, params };
    }
  }
  return null;
}

export function parseCookies(cookieHeader: string | null): Map<string, string> {
  const map = new Map<string, string>();
  if (!cookieHeader) return map;
  const parts = cookieHeader.split(';');
  for (const part of parts) {
    const idx = part.indexOf('=');
    if (idx > 0) {
      const key = part.slice(0, idx).trim();
      const val = part.slice(idx + 1).trim();
      map.set(key, val);
    }
  }
  return map;
}

export async function dispatchApi(request: Request, clientAddress?: string): Promise<Response> {
  const url = new URL(request.url);
  const matched = matchRoute(url.pathname);
  if (!matched) {
    return new Response(
      JSON.stringify({ success: false, error: { code: 'NOT_FOUND', message: 'API route not found.' } }),
      { status: 404, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } }
    );
  }

  const { entry, params } = matched;
  const method = request.method;

  if (method === 'OPTIONS') {
    const available = Object.keys(entry.handlers).filter(k => Boolean(entry.handlers[k]));
    return new Response(null, {
      status: 204,
      headers: {
        allow: [...available, ...(available.includes('GET') ? ['HEAD'] : []), 'OPTIONS'].join(', '),
        'cache-control': 'no-store'
      }
    });
  }

  const handler = entry.handlers[method] ?? (method === 'HEAD' ? entry.handlers['GET'] : undefined);
  if (!handler) {
    return new Response(
      JSON.stringify({ success: false, error: { code: 'METHOD_NOT_ALLOWED', message: 'This method is not supported.' } }),
      { status: 405, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } }
    );
  }

  const parsedCookies = parseCookies(request.headers.get('cookie'));
  const outgoingSetCookies: string[] = [];

  const cookieStore: CookieStore = {
    get(name: string) {
      const val = parsedCookies.get(name);
      if (val === undefined) return undefined;
      return { name, value: val };
    },
    set(name: string, value: string, options?: any) {
      parsedCookies.set(name, value);
      const parts = [`${name}=${value}`];
      parts.push(`Path=${options?.path ?? '/'}`);
      if (options?.httpOnly ?? true) parts.push('HttpOnly');
      if (options?.secure ?? (process.env.NODE_ENV === 'production')) parts.push('Secure');
      if (options?.sameSite) parts.push(`SameSite=${options.sameSite}`);
      else parts.push('SameSite=Lax');
      if (options?.maxAge !== undefined) parts.push(`Max-Age=${options.maxAge}`);
      if (options?.expires) parts.push(`Expires=${options.expires.toUTCString()}`);
      outgoingSetCookies.push(parts.join('; '));
    },
    delete(name: string, options?: any) {
      parsedCookies.delete(name);
      outgoingSetCookies.push(`${name}=; Path=${options?.path ?? '/'}; Max-Age=0`);
    }
  };

  const context = {
    params: Promise.resolve(params)
  };

  const apiStart = performance.now();
  try {
    const runHandler = async () => {
      return await requestCookieStorage.run(cookieStore, async () => {
        return await handler(request, context);
      });
    };

    const response = requestCacheStorage.getStore()
      ? await runHandler()
      : await requestCacheStorage.run(createRequestCacheStore(), runHandler);

    const apiDuration = performance.now() - apiStart;
    logPerf('API', `${request.method} ${url.pathname}`, apiDuration, response.status, 250);

    if (outgoingSetCookies.length > 0) {
      const newHeaders = new Headers(response.headers);
      for (const sc of outgoingSetCookies) {
        newHeaders.append('set-cookie', sc);
      }
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders
      });
    }

    return response;
  } catch (error) {
    const apiDuration = performance.now() - apiStart;
    logPerf('API', `${request.method} ${url.pathname}`, apiDuration, '500_ERROR', 250);
    console.error('Unhandled API dispatch error; details withheld.', error instanceof Error ? error.name : 'UnknownError');
    return new Response(
      JSON.stringify({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Something went wrong.' } }),
      { status: 500, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } }
    );
  }
}
