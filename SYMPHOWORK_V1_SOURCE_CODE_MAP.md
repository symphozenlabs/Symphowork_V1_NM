# SymphoWork V1 — Source Code Map

A comprehensive symbol-level index linking every major feature, workflow, and data structure to its exact file paths, exported functions, components, schemas, and database entities.

---

## 1. Architectural Core & Infrastructure

| Subsystem | File Path | Key Symbols / Exports | Description |
|---|---|---|---|
| **Edge Middleware** | `middleware.ts` | `middleware(request)`, `config` | Ingress request routing, session cookie detection, security headers (CSP, HSTS, X-Frame-Options) |
| **Environment Config** | `src/config/env.ts` | `getEnv()`, `envSchema` | Zod runtime environment variable validation |
| **Next.js Config** | `next.config.ts` | Next.js configuration | Core bundler and framework settings |
| **Database Client** | `src/db/client.ts` | `db`, `sql`, `withTenantTransaction`, `withPlatformTransaction`, `withUserTransaction`, `withInvitationTokenTransaction` | Postgres.js connection pool + transaction wrappers setting PostgreSQL RLS session variables |
| **Database Migrator** | `src/db/migrate.ts` | `main()` | Drizzle ORM migration execution runner |
| **Drizzle Config** | `drizzle.config.ts` | `default defineConfig({...})` | Drizzle Kit CLI configuration (schema path, migrations output) |
| **Performance Profiler** | `src/lib/perf.ts` | `timeOperation()`, `measureDuration()` | Safe dev-mode operational timing instrumentation |
| **Audit Logger** | `src/lib/audit.ts` | `recordAudit()`, `recordAuditInTransaction()` | Immutable audit trail writes for security and business actions |
| **Error Handling** | `src/lib/errors.ts` | `AppError`, `errorResponse()`, `ErrorCode` | Application error taxonomy and standardized JSON error response builder |
| **Rate Limiter** | `src/lib/rate-limit.ts` | `enforceRateLimit()`, `clientRateLimitKey()` | Sliding-window in-memory rate limiting with retry-after headers |
| **Crypto Utilities** | `src/lib/crypto.ts` | `hashPassword()`, `verifyPassword()`, `createOpaqueToken()`, `hashToken()` | Node.js `scrypt` password hashing and SHA-256 token hashing |
| **Object Storage** | `src/lib/storage.ts` | `getStorageProvider()`, `omitStorageKey()` | Pluggable object storage provider accessor |
| **S3 / R2 Storage** | `src/lib/storage/r2.ts` | `createR2StorageProvider()`, `validateStorageKey()` | AWS S3 / Cloudflare R2 implementation with path traversal protection |
| **Malware Scanner** | `src/lib/malware.ts` | `getMalwareScanner()`, `configureMalwareScanner()` | Pluggable antivirus file scanning abstraction |
| **File Admission** | `src/modules/files/upload-admission.ts` | `admitAndUploadFile()`, `requireCleanFile()` | File size, extension, MIME type, and malware scan gating |

---

## 2. Identity, Authentication & Sessions

| Feature / Workflow | File Path | Key Symbols / Exports | Description |
|---|---|---|---|
| **Session & Auth Core** | `src/modules/identity/auth.ts` | `authenticate()`, `createSession()`, `getSessionUser()`, `requireSession()`, `setSessionCookie()`, `clearSessionCookie()`, `logout()`, `registerUser()`, `verifyEmail()`, `requestPasswordReset()`, `resetPassword()`, `changePassword()` | Core identity service managing cookies, hashed tokens, password validation, and user sessions |
| **Login API** | `src/app/api/auth/login/route.ts` | `POST(request)` | Credential authentication endpoint |
| **Registration API** | `src/app/api/auth/register/route.ts` | `POST(request)` | Self-service account registration endpoint |
| **Logout API** | `src/app/api/auth/logout/route.ts` | `POST(request)` | Session invalidation endpoint |
| **Email Verification API** | `src/app/api/auth/verify-email/route.ts` | `POST(request)` | Email confirmation link processor |
| **Forgot Password API** | `src/app/api/auth/forgot-password/route.ts` | `POST(request)` | Password reset link request endpoint |
| **Reset Password API** | `src/app/api/auth/reset-password/route.ts` | `POST(request)` | Password update submission endpoint |
| **Change Password API** | `src/app/api/auth/change-password/route.ts` | `POST(request)` | Forced password update for bootstrapped owners |
| **Login View** | `src/app/login/page.tsx` | `LoginPage()` | Workspace sign-in page wrapper |
| **Register View** | `src/app/register/page.tsx` | `RegisterPage()` | Account registration page wrapper |
| **Auth UI Components** | `src/components/auth/` | `AuthFlipView`, `LoginForm`, `RegisterForm`, `ChangePasswordForm`, `LogoutConfirmDialog` | Client-side flip animation and authentication forms |

---

## 3. Tenancy, Authorization & Roles

| Feature / Workflow | File Path | Key Symbols / Exports | Description |
|---|---|---|---|
| **Tenant Context** | `src/modules/tenancy/context.ts` | `resolveTenantContext()`, `getCachedTenantContext()`, `setCachedTenantContext()` | Request-scoped WeakMap cache and session-to-tenant resolution |
| **Tenant Authorization** | `src/modules/tenancy/authorization.ts` | `can()`, `authorize()`, `canAny()`, `authorizeAny()`, `getRolePermissionSet()` | Fine-grained RBAC evaluation with static fast-path |
| **Platform Authorization** | `src/modules/platform/authorization.ts` | `authorizePlatform()`, `authorizePlatformTargetOrganization()`, `hasPlatformPermission()`, `PLATFORM_PERMISSIONS` | Platform console permission checks and console titles |
| **Roles & Permissions Definition** | `src/modules/rbac/permissions.ts` | `PERMISSIONS`, `SYSTEM_ROLES`, `ROLE_PERMISSIONS`, `ASSIGNABLE_ROLES_BY_ACTOR`, `canAssignRole()`, `getAssignableRoles()`, `ROLE_METADATA` | Universal permission dictionary, role definitions, and role assignment hierarchy |
| **Tenant Invitations** | `src/modules/platform/invitations.ts` | `acceptInvitation()`, `getInvitationPreview()` | Onboarding invitation token consumption and membership creation |
| **Accept Invitation API** | `src/app/api/auth/invitations/accept/route.ts` | `POST(request)` | Invitation acceptance handler |
| **Accept Invitation Preview** | `src/app/api/auth/invitations/accept/preview/route.ts` | `POST(request)` | Displays invited organization and role details before password setup |

---

## 4. Organization & Master Data Management

| Feature / Workflow | File Path | Key Symbols / Exports | Description |
|---|---|---|---|
| **Department Service** | `src/modules/departments/service.ts` | `listDepartments()`, `getDepartmentDetails()`, `createDepartment()`, `updateDepartment()`, `deleteDepartment()`, `assertCanAccessDepartment()`, `isAssignedDepartmentManager()` | Department lifecycle, manager scoping, deletion safety checks, and team roster |
| **Department API** | `src/app/api/app/departments/route.ts` | `GET()`, `POST()` | Department listing and creation |
| **Department Detail API** | `src/app/api/app/departments/[departmentId]/route.ts` | `GET()`, `PATCH()`, `DELETE()` | Department inspection, editing, and deletion |
| **Eligible Managers API** | `src/app/api/app/departments/eligible-managers/route.ts` | `GET()` | Discovers employees eligible to head a department |
| **Eligible Team Leads API**| `src/app/api/app/departments/eligible-team-leads/route.ts` | `GET()` | Discovers employees eligible to lead teams |
| **Master Data Handlers** | `src/app/api/app/master-data/` | Route handlers for `shifts`, `teams`, `locations`, `designations`, `employment-types`, `holidays`, `working-days` | Master data configuration endpoints |
| **Department UI** | `src/app/app/departments/page.tsx` | `DepartmentsPage()` | Department management dashboard |

---

## 5. Employee Directory & Lifecycle

| Feature / Workflow | File Path | Key Symbols / Exports | Description |
|---|---|---|---|
| **Employee Service** | `src/modules/employees/service.ts` | `createEmployee()`, `updateEmployee()`, `listEmployees()`, `getOrEnsureEmployeeForUser()`, `inviteEmployee()`, `DEPARTMENT_REQUIRED_ROLES` | Employee records, sequence counter allocation, onboarding initiation, and role sync |
| **Employee Lifecycle Rules**| `src/modules/employees/lifecycle.ts` | `assertEmployeeStatusTransition()`, `assertNoSelfReporting()`, `EMPLOYEE_STATUS_TRANSITIONS` | State machine governing employee status transitions (invited → onboarding → active → confirmation → exit) |
| **Employee Validation** | `src/modules/employees/validation.ts` | `employeeInputSchema`, `employeeUpdateSchema` | Zod input validation schemas for employee mutations |
| **Workforce Directory API**| `src/app/api/app/employees/route.ts` | `GET()`, `POST()` | Administrative employee listing and creation |
| **Employee Detail API** | `src/app/api/app/employees/[employeeId]/route.ts` | `GET()`, `PATCH()` | Administrative employee inspection and updates |
| **Invite Employee API** | `src/app/api/app/employees/[employeeId]/invite/route.ts` | `POST()` | Dispatches onboarding invite to employee |
| **Public Directory API** | `src/app/api/app/directory/route.ts` | `GET()` | Sanitized public employee contact book |
| **Self-Service Profile API**| `src/app/api/app/me/employee/route.ts` | `GET()`, `PATCH()` | Employee self-service profile access |
| **Workforce Table UI** | `src/components/employees/workforce-directory-table.tsx` | `WorkforceDirectoryTable` | Client-side workforce grid with role badges and status filters |
| **Onboarding Wizard UI** | `src/components/employees/onboarding-wizard/` | `OnboardingWizardDialog` | Multi-step dialog for new employee intake |

---

## 6. Time, Attendance & Shifts

| Feature / Workflow | File Path | Key Symbols / Exports | Description |
|---|---|---|---|
| **Attendance Service** | `src/modules/attendance/service.ts` | `recordPunch()`, `requestRegularization()`, `getAttendanceRecords()` | Punch clock engine, break tracking, and correction requests |
| **Attendance Calculator** | `src/modules/attendance/calculator.ts` | `calculateAttendance()`, `shiftWindow()` | Math engine calculating work duration, breaks, late arrivals, and early departures |
| **Attendance Punch API** | `src/app/api/app/attendance/punch/route.ts` | `POST()` | Clock in, clock out, and break recording |
| **Regularization API** | `src/app/api/app/attendance/regularization/route.ts` | `POST()` | Regularization request submission |
| **Attendance Page UI** | `src/app/app/attendance/page.tsx` | `AttendancePage()` | Attendance check-in card, timesheet view, and correction dialog |

---

## 7. Leave Management

| Feature / Workflow | File Path | Key Symbols / Exports | Description |
|---|---|---|---|
| **Leave Service** | `src/modules/leave/service.ts` | `applyLeave()`, `getLeaveDashboard()`, `cancelLeaveApplication()`, `calculateLeaveBalance()` | Leave ledger operations, balance reservations, and transaction records |
| **Leave Calculator** | `src/modules/leave/calculator.ts` | `evaluateLeaveBalance()`, `calculateAccrual()` | Balance deduction, carry-forward, and accrual calculations |
| **Leave Application API** | `src/app/api/app/leave/route.ts` | `GET()`, `POST()` | Leave dashboard metrics and application submission |
| **Leave Types API** | `src/app/api/app/leave/types/route.ts` | `GET()`, `POST()` | Leave category and policy configuration |
| **Leave Page UI** | `src/app/app/leave/page.tsx` | `LeavePage()` | Leave quota cards, application form, and transaction history |

---

## 8. Workflow Engine & Approval Tasks

| Feature / Workflow | File Path | Key Symbols / Exports | Description |
|---|---|---|---|
| **Workflow Engine** | `src/modules/workflows/service.ts` | `createWorkflowInstance()`, `actOnApprovalTask()`, `ensureDefaultWorkflow()`, `nextWorkflowStatus()` | Configurable multi-step approval orchestrator supporting sequential and parallel actors |
| **Workflow Actor Resolvers**| `src/modules/workflows/service.ts` | `resolveApprover()` | Dynamically resolves approvers: reporting manager, specific role, specific user, or department head |
| **Approvals API** | `src/app/api/app/approvals/route.ts` | `GET()` | Actionable approval inbox task listing |
| **Approval Action API** | `src/app/api/app/approvals/[taskId]/route.ts` | `POST()` | Submits approval decision (approve, reject, cancel, request changes) |
| **Approvals Inbox UI** | `src/app/app/approvals/page.tsx` | `ApprovalsPage()` | Consolidated approval queue across leave, expenses, attendance, and payroll |

---

## 9. Expenses & Claims

| Feature / Workflow | File Path | Key Symbols / Exports | Description |
|---|---|---|---|
| **Expense Service** | `src/modules/expenses/service.ts` | `createExpenseClaim()`, `submitExpenseClaim()`, `addExpenseItem()`, `attachReceipt()` | Expense claims, category limit enforcement, receipt uploads, and approval attachment |
| **Expense Claims API** | `src/app/api/app/expenses/route.ts` | `GET()`, `POST()` | Expense claim listing and draft creation |
| **Claim Detail API** | `src/app/api/app/expenses/[claimId]/route.ts` | `GET()`, `PATCH()` | Claim itemization and updates |
| **Submit Claim API** | `src/app/api/app/expenses/[claimId]/submit/route.ts` | `POST()` | Attaches claim to approval workflow instance |
| **Receipt Upload API** | `src/app/api/app/expenses/items/[itemId]/receipt/route.ts` | `POST()` | S3/R2 receipt upload with security scanning |

---

## 10. Statutory Payroll Engine

| Feature / Workflow | File Path | Key Symbols / Exports | Description |
|---|---|---|---|
| **Payroll Service** | `src/modules/payroll/service.ts` | `createPayrollPeriod()`, `calculatePayrollRun()`, `finalizePayrollRun()`, `assignSalaryStructure()`, `listPayrollRuns()` | Batch payroll calculation, attendance & leave proration, immutable snapshots, and payslip generation |
| **Payroll Calculator** | `src/modules/payroll/calculator.ts` | `calculatePayroll()`, `calculateStatutoryPF()`, `calculateStatutoryESI()`, `PAYROLL_CALCULATION_VERSION` | Mathematical formula engine for earnings, deductions, PF, ESI, PT, and TDS |
| **Payroll Runs API** | `src/app/api/app/payroll/runs/route.ts` | `GET()`, `POST()` | Payroll run history and batch calculation execution |
| **Finalize Run API** | `src/app/api/app/payroll/runs/[runId]/finalize/route.ts` | `POST()` | Locks payroll run and publishes payslips |
| **Salary Assignment API**| `src/app/api/app/payroll/salary-assignments/route.ts` | `POST()` | Effective-dated salary structure assignments |
| **Payroll Config API** | `src/app/api/app/payroll/config/route.ts` | `GET()`, `POST()` | Salary structures, components, statutory rates, and tax regimes |
| **Payslips API** | `src/app/api/app/payroll/payslips/route.ts` | `GET()` | Payslip list and secure download link generator |
| **Payroll UI** | `src/app/app/payroll/page.tsx` | `PayrollPage()` | Payroll period Cockpit and run summaries |

---

## 11. ATS & Talent Acquisition

| Feature / Workflow | File Path | Key Symbols / Exports | Description |
|---|---|---|---|
| **ATS Service** | `src/modules/ats/service.ts` | `createRequisition()`, `publishJob()`, `createApplication()`, `moveApplicationStage()`, `scheduleInterview()`, `recordInterviewFeedback()`, `publicJobBySlug()` | Requisitions, public job board, candidate intake, pipeline progression, and interview notes |
| **Public Jobs API** | `src/app/api/public/jobs/[slug]/route.ts` | `GET()` | Unauthenticated job details endpoint |
| **Public Apply API** | `src/app/api/public/jobs/[slug]/apply/route.ts` | `POST()` | Public application submission with resume upload |
| **Requisitions API** | `src/app/api/app/ats/requisitions/route.ts` | `GET()`, `POST()` | Job requisition creation and listing |
| **Jobs API** | `src/app/api/app/ats/jobs/route.ts` | `GET()`, `POST()` | Job posting management |
| **Candidates API** | `src/app/api/app/ats/candidates/route.ts` | `GET()`, `POST()` | Candidate talent pool management |
| **Interviews API** | `src/app/api/app/ats/interviews/route.ts` | `GET()`, `POST()` | Interview scheduling and panel coordination |

---

## 12. Resume & Recruiter Intelligence

| Feature / Workflow | File Path | Key Symbols / Exports | Description |
|---|---|---|---|
| **Resume Intelligence** | `src/modules/resume-intelligence/service.ts` | `uploadResume()`, `processResumeJob()`, `retryResumeJob()`, `reviewExtractionField()`, `getResumeDownload()` | Resume ingestion, text extraction, deterministic normalization, and recruiter field confirmation |
| **Resume Normalizer** | `src/modules/resume-intelligence/normalizer.ts` | `parseDeterministicResume()`, `validateResumeFile()`, `resumeHash()` | Deterministic extraction parser extracting personal details, skills, links, and work history |
| **Recruiter Intelligence**| `src/modules/recruiter-intelligence/service.ts` | `matchCandidatesForJob()`, `extractJobRequirements()`, `intelligentSearch()`, `getSemanticConfig()` | Transparent candidate-to-job matching, explainable scoring (strengths, gaps, uncertainties), and search |
| **Matching Engine** | `src/modules/recruiter-intelligence/matching.ts` | `matchCandidateToJob()`, `rankMatchResults()`, `interpretRecruiterQuery()` | Multi-dimensional scoring evaluating skills, experience, location, and notice periods |
| **Matching API** | `src/app/api/app/ats/intelligence/search/route.ts` | `POST()` | Intelligent search handler |
| **Candidate Resume API**| `src/app/api/app/ats/candidates/[candidateId]/resumes/route.ts` | `POST()` | Recruiter resume upload and processing trigger |

---

## 13. Projects, Tasks & Collaboration

| Feature / Workflow | File Path | Key Symbols / Exports | Description |
|---|---|---|---|
| **Collaboration Service**| `src/modules/collaboration/service.ts` | `createProject()`, `createTask()`, `updateTask()`, `sendMessage()`, `convertMessageToTask()` | Projects, Kanban tasks, DAG dependency enforcement, chat channels, and Chat-to-Task creation |
| **Projects API** | `src/app/api/app/projects/route.ts` | `GET()`, `POST()` | Project management endpoints |
| **Tasks API** | `src/app/api/app/tasks/route.ts` | `GET()`, `POST()` | Task management and Kanban status updates |
| **Task Detail API** | `src/app/api/app/tasks/[taskId]/route.ts` | `GET()`, `PATCH()`, `DELETE()` | Task inspection, assignment, and updates |
| **Chat Conversations API**| `src/app/api/app/chat/conversations/route.ts` | `GET()`, `POST()` | Direct and group channel management |
| **Chat Messages API** | `src/app/api/app/chat/conversations/[id]/messages/route.ts` | `GET()`, `POST()` | Paginated message stream and dispatch |
| **Chat-to-Task API** | `src/app/api/app/chat/messages/[id]/task/route.ts` | `POST()` | Converts chat discussion message directly into a project task |

---

## 14. Notifications & Outbox

| Feature / Workflow | File Path | Key Symbols / Exports | Description |
|---|---|---|---|
| **Notification Service** | `src/modules/notifications/service.ts` | `notifyUsers()`, `unreadNotificationCount()`, `markNotificationRead()`, `listNotifications()` | Transactional in-app notification dispatch, idempotency checking, and delivery queue |
| **Notifications API** | `src/app/api/app/notifications/route.ts` | `GET()` | User notification feed |
| **Notification Action API**| `src/app/api/app/notifications/[id]/route.ts` | `PATCH()` | Mark notification as read |
| **Preferences API** | `src/app/api/app/notifications/preferences/route.ts` | `GET()`, `PATCH()` | User notification channel preferences |

---

## 15. Platform Administration & Governance

| Feature / Workflow | File Path | Key Symbols / Exports | Description |
|---|---|---|---|
| **Platform Provisioning** | `src/modules/platform/provisioning.ts` | `createOrganization()`, `approveOrganization()`, `runProvisioning()`, `syncOrganizationRolePermissions()` | Multi-step tenant initialization state machine (roles, permissions, subscriptions, owner invite) |
| **Platform Operations** | `src/modules/platform/operations.ts` | `listPlatformOrganizations()`, `updateOrganizationStatus()`, `listAuditLogs()` | Global tenant directory management and audit querying |
| **Commercial Engine** | `src/modules/platform/commercial.ts` | `commercialDashboard()`, `listSubscriptions()`, `createPlan()`, `updatePlan()` | Platform subscription tiers, active license tracking, and quota enforcement |
| **Platform Orgs API** | `src/app/api/platform/organizations/route.ts` | `GET()`, `POST()` | Platform organization listing and creation |
| **Approve Tenant API** | `src/app/api/platform/organizations/[id]/approve/route.ts` | `POST()` | Approves pending tenant organization |
| **Platform Plans API** | `src/app/api/platform/plans/route.ts` | `GET()`, `POST()` | SaaS pricing plans configuration |
| **Platform Overview UI**| `src/app/platform/page.tsx` | `PlatformOverviewPage()` | Executive cockpit showing total orgs, active tenants, provisioning queue, and commercial telemetry |

---

## 16. Shared UI Shells & Layout Components

| Component | File Path | Key Symbols / Exports | Description |
|---|---|---|---|
| **Tenant App Shell** | `src/components/layout/app-shell.tsx` | `AppShell({ children })` | Organization workspace sidebar, navigation groups, and top header |
| **Platform Shell** | `src/components/platform/platform-shell.tsx` | `PlatformShell({ children })` | Platform control plane sidebar, identity banner, and breadcrumbs |
| **Sidebar Navigation** | `src/components/layout/sidebar-nav.tsx` | `SidebarNav`, `NavGroupDef` | Accessible, responsive sidebar menu items with active state detection |
| **Mobile Navigation** | `src/components/layout/mobile-nav.tsx` | `MobileNav` | Mobile drawer navigation |
| **Breadcrumbs** | `src/components/layout/breadcrumb.tsx` | `Breadcrumb` | Dynamic path hierarchy indicator |
| **Logout Button** | `src/components/layout/logout-button.tsx` | `LogoutButton` | Trigger for session termination modal |
| **Dashboard Overview** | `src/components/dashboard/overview.tsx` | `Overview` | Main workspace landing card grid and quick navigation actions |
| **Journey Map** | `src/components/journey/enterprise-journey-map.tsx` | `EnterpriseJourneyMap` | Visual interactive canvas illustrating the complete HCM lifecycle on landing page |

---

## 17. Database Schema & Tables Map (`src/db/schema.ts`)

| Domain | Table Name (`pgTable`) | Primary Identifiers & Relationships | RLS Isolation Policy |
|---|---|---|---|
| **Identity** | `users` | `id: uuid` (PK), `email: varchar` (Unique) | Unrestricted / Filtered by user context |
| **Tenancy** | `organizations` | `id: uuid` (PK), `slug: varchar` (Unique) | Filtered by `app.is_platform_owner` or tenant lookup |
| **RBAC** | `roles` | `id: uuid` (PK), `organizationId` (FK) | `roles_tenant_isolation` |
| **RBAC** | `permissions` | `id: uuid` (PK), `key: varchar` (Unique) | Global master catalog |
| **RBAC** | `role_permissions` | `roleId` (FK), `permissionId` (FK) (Unique Composite) | Cascaded via `roles` |
| **Memberships**| `memberships` | `id: uuid` (PK), `userId` (Unique FK), `organizationId` (FK) | `memberships_tenant_isolation` |
| **Sessions** | `sessions` | `id: uuid` (PK), `tokenHash: varchar` (Unique), `userId` (FK) | User-scoped session query |
| **Plans** | `plans` | `id: uuid` (PK), `code: varchar` (Unique) | Global catalog |
| **Subscriptions**| `subscriptions`| `id: uuid` (PK), `organizationId` (Unique FK), `planId` (FK) | `subscriptions_tenant_isolation` |
| **Invitations**| `invitations` | `id: uuid` (PK), `tokenHash: varchar` (Unique), `organizationId` (FK) | `invitations_tenant_isolation` |
| **Audit** | `audit_logs` | `id: uuid` (PK), `organizationId` (FK), `actorUserId` (FK) | Tenant / Platform audit isolation |
| **Master Data**| `departments`, `designations`, `locations`, `shifts`, `teams`, `holidays`, `working_days` | `id: uuid` (PK), `organizationId` (FK) | Tenant isolation policy per table |
| **Employees** | `employees` | `id: uuid` (PK), `employeeId` (Unique in Org), `organizationId` (FK), `userId` (Unique FK) | `employees_tenant_isolation` |
| **Attendance** | `attendance_records`, `attendance_punches`, `attendance_regularization_requests` | `id: uuid` (PK), `organizationId` (FK), `employeeId` (FK) | Tenant isolation policy per table |
| **Leave** | `leave_types`, `leave_policies`, `leave_balances`, `leave_transactions`, `leave_applications` | `id: uuid` (PK), `organizationId` (FK), `employeeId` (FK) | Tenant isolation policy per table |
| **Workflows** | `workflow_definitions`, `workflow_versions`, `workflow_steps`, `workflow_instances`, `approval_tasks`, `approval_history` | `id: uuid` (PK), `organizationId` (FK) | Tenant isolation policy per table |
| **Expenses** | `expense_claims`, `expense_items`, `expense_receipts` | `id: uuid` (PK), `organizationId` (FK), `employeeId` (FK) | Tenant isolation policy per table |
| **Payroll** | `salary_structures`, `salary_components`, `employee_salary_assignments`, `payroll_periods`, `payroll_runs`, `payroll_calculation_snapshots`, `payroll_payslips` | `id: uuid` (PK), `organizationId` (FK), `employeeId` (FK) | Tenant isolation policy per table |
| **ATS** | `ats_requisitions`, `ats_jobs`, `ats_candidates`, `ats_applications`, `ats_interviews` | `id: uuid` (PK), `organizationId` (FK) | Tenant isolation policy per table |
| **Intelligence**| `ats_resume_processing_jobs`, `ats_resume_extractions`, `ats_job_requirements`, `ats_match_results`, `ats_embeddings` | `id: uuid` (PK), `organizationId` (FK) | Tenant isolation policy per table |
| **Collaboration**| `collaboration_projects`, `collaboration_tasks`, `collaboration_conversations`, `collaboration_messages` | `id: uuid` (PK), `organizationId` (FK) | Tenant isolation policy per table |
| **Notifications**| `notifications`, `notification_preferences`, `notification_deliveries`, `notification_outbox` | `id: uuid` (PK), `organizationId` (FK), `recipientUserId` (FK) | Tenant isolation policy per table |

---
*Index verified against SymphoWork V1 source repository.*
