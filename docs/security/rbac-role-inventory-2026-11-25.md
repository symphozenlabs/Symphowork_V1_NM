# SymphoWork V1 RBAC Role Discovery and Audit Report

**Date:** 2026-11-25  
**Target Workspace:** `C:\Users\nares\Symphowork_V1_NM`  
**Audit Method:** Read-only inspection of schema, Drizzle SQL migrations, server authorization modules, SvelteKit SSR loaders/routes, API routes, Svelte UI components, existing security docs, and RBAC tests. Zero source files, database records, migrations, or Git settings were modified.

---

## 1. Executive Summary

SymphoWork implements a **dual-layer Role-Based Access Control (RBAC)** model separating **Platform Console roles** (`users.platform_role` PostgreSQL enum) from **Organization / Tenant roles** (`roles` + `memberships` + `role_permissions` tables), supplemented by **structural hierarchy designations** (Department Head, Team Lead, Reporting Manager) and **collaboration participant enums** (`projectMemberRole`, `conversationMemberRole`).

Key verified findings:

1. **Active RBAC Role Count:** There are **14 active built-in RBAC roles**: **5 platform roles** (`PLATFORM_OWNER`, `PRODUCT_OWNER`, `PLATFORM_ADMIN`, `PLATFORM_SUPPORT`, `PLATFORM_BILLING`) and **9 organization roles** (`ORGANIZATION_OWNER`, `HR_ADMIN`, `HR_EXECUTIVE`, `FINANCE_ADMIN`, `MANAGER`, `TEAM_LEAD`, `PROJECT_MANAGER`, `RECRUITER`, `EMPLOYEE`).
2. **Product Owner (`PRODUCT_OWNER`) Classification:** `PRODUCT_OWNER` is **both** a real PostgreSQL enum value in `platform_role` (`src/db/schema.ts:9`, `drizzle/0012_swift_blur.sql:1`) **and** an application-level platform role (`src/lib/auth/platform.ts:4`, `src/modules/platform/authorization.ts:10`) holding all **26** `PLATFORM_PERMISSIONS`. However, **`PRODUCT_OWNER` does NOT receive `PLATFORM_OWNER`'s tenant RBAC bypass** in `src/lib/auth/policy.ts:10`, `src/modules/tenancy/context.ts:105`, or `src/modules/tenancy/authorization.ts:77,198`.
3. **Single-Role Per User Architecture:** `memberships.userId` has a database `UNIQUE` constraint (`src/db/schema.ts:90`, `drizzle/0001_fluffy_micromax.sql:53`), restricting every user account to at most **one** active organization membership and **one** organization role globally.
4. **Custom Roles Not Implemented at Runtime:** Although the `roles` table has `isSystem` (`boolean default false`) and `role_permissions` supports dynamic rows, **0 custom/configurable roles** exist or can be created/edited via any API or UI. Both `PERMISSIONS.roleRead` (`"role.read"`) and `PERMISSIONS.roleManage` (`"role.manage"`) are defined in `PERMISSIONS` but have **zero** runtime API/UI consumers.
5. **Audit Log Exposure Finding:**
   - **Organization Admins / Owners (`ORGANIZATION_OWNER`, `HR_ADMIN`)** have **0** tenant APIs or UI screens querying `audit_logs` (only employee-scoped `employee_history` and document/expense history exist).
   - **Platform Audit API (`GET /api/platform/audit`)** and **`/platform` Overview** (`listPlatformAudit`, gated by `platform.audit.view`, held by `PLATFORM_OWNER`, `PRODUCT_OWNER`, `PLATFORM_ADMIN`, `PLATFORM_SUPPORT`, and **not** `PLATFORM_BILLING`) execute inside `withPlatformTransaction` (`app.is_platform_owner = 'true'`) and query `audit_logs` **with no `organization_id IS NULL` filter**. Consequently, **Product Owner and other `auditView` roles receive tenant audit events** (including `employee_created`, `employee_updated`, `employee_offboarded`, attendance, leave, payroll, expense, ATS, chat/task actions) along with **`actor: { id, name, email }`** and `audit.metadata` in the API JSON payload (while `PlatformAuditList.svelte` renders `actor.name`, `audit.action`, `audit.resource`, and `organization.name` in the table UI).

---

## 2. Exact Total Role Count

| Category | Count | Exact Identifiers | Notes / Classification |
|---|---:|---|---|
| **Platform roles** | **5** | `PLATFORM_OWNER`, `PRODUCT_OWNER`, `PLATFORM_ADMIN`, `PLATFORM_SUPPORT`, `PLATFORM_BILLING` | Stored in `users.platform_role` enum (`NONE` is a non-role sentinel, excluded from count). |
| **Organization roles** | **9** | `ORGANIZATION_OWNER`, `HR_ADMIN`, `HR_EXECUTIVE`, `FINANCE_ADMIN`, `MANAGER`, `TEAM_LEAD`, `PROJECT_MANAGER`, `RECRUITER`, `EMPLOYEE` | Provisioned per org (`is_system = true`) by `syncOrganizationRolePermissions`. |
| **Specialized organization RBAC roles** | **0** | *(none)* | No separate department/branch RBAC roles exist beyond the 9 organization roles above. |
| **Built-in roles (total active)** | **14** | 5 platform + 9 organization | `PLATFORM_OWNER` is listed in `SYSTEM_ROLES` (`src/modules/rbac/permissions.ts:15`) for metadata/exclusion only; counted **once** as a platform role (no double-counting). |
| **Configurable / custom roles** | **0** | *(none implemented at runtime)* | Schema supports `roles.is_system = false` and `role_permissions` rows, but no API, service, or UI creates/edits custom roles. |
| **Total distinct active RBAC role identifiers** | **14** | All 5 platform + 9 organization roles | Authoritative runtime RBAC set. |
| **Sub-module collaboration participant enums** *(non-RBAC)* | **7 enum values** *(5 unique names)* | `projectMemberRole`: `owner`, `manager`, `member`, `viewer` (4); `conversationMemberRole`: `owner`, `admin`, `member` (3) | Feature-level membership labels on `collaboration_project_members` and `collaboration_conversation_members`; do not grant RBAC permissions (`project.*`/`chat.*` govern API access). |
| **Structural runtime / hierarchy flags** *(non-role)* | **1 runtime flag** (+2 schema relations) | `isDepartmentManager` (`departments.headEmployeeId`); plus `teams.teamLeadEmployeeId` and `employees.reportingManagerId` | Assignment fields on employees/departments/teams; `isDepartmentManager` grants department view/team management gates. |
| **Workflow actor routing types** *(non-role)* | **5** | `reporting_manager`, `organization_role`, `specific_user`, `department_head`, `hr_admin` | `workflowActorType` enum for approval step routing (`src/db/schema.ts:28`). |
| **Obsolete / UI-only / legacy strings** *(excluded)* | **3** | `ORGANIZATION_ADMIN` (test exclusion + legacy default string), `FINANCE_MANAGER` (workflow/payroll fallback string), `PLATFORM_AUDITOR` (UI badge style only) | Not provisioned in DB and not assignable/active RBAC roles. |

---

## 3. Complete Role Inventory Table

### A. Platform-Level Roles (5)

| Role Identifier | Display / Console Title | Storage / Source | Scope | Explicit Platform Perms | Tenant Access Behavior | Can View Audit Logs? |
|---|---|---|---|---:|---|---|
| `PLATFORM_OWNER` | `Platform Owner` / `Platform Owner Console` | `users.platform_role` enum (`NONE`, `PLATFORM_OWNER`, `PRODUCT_OWNER`, `PLATFORM_ADMIN`, `PLATFORM_SUPPORT`, `PLATFORM_BILLING`) | Global SaaS Platform | **26 / 26** | **Special tenant bypass** in `can()`, `canAny()`, `resolveTenantContext()`, `policy.ts:can()`, `isActorPrivilegedForOwnerRecord()`; **still blocked** from `/app` SSR layout (`!context?.organization` -> 403) and HTTP tenant endpoints requiring `tenant.organization` (returns null org in `resolveContext()` / `resolveTenantContext()`). | **Yes** (`platform.audit.view` -> global + all tenant `audit_logs`) |
| `PRODUCT_OWNER` | `Product Owner` / `Product Owner Console` | `users.platform_role` enum + `src/lib/auth/platform.ts:4,11` | Global SaaS Platform | **26 / 26** | **No tenant RBAC bypass** (`policy.ts`, `tenancy/context.ts`, `tenancy/authorization.ts` check `=== "PLATFORM_OWNER"` only). Blocked from `/app` (`platformRole !== 'NONE'` -> `organization: null` -> 403). | **Yes** (`platform.audit.view` -> global + all tenant `audit_logs`) |
| `PLATFORM_ADMIN` | `Platform Admin Console` | `users.platform_role` enum + `src/lib/auth/platform.ts:4,12` | Global SaaS Platform | **24 / 26** (all except `platform.billing.view`, `platform.billing.manage`) | **No tenant access** (`platformRole !== 'NONE'` -> `organization: null` -> 403). | **Yes** (`platform.audit.view` -> global + all tenant `audit_logs`) |
| `PLATFORM_SUPPORT` | `Platform Support Console` | `users.platform_role` enum + `src/lib/auth/platform.ts:4,13` | Global SaaS Platform (read/support) | **10 / 26** (`organizationView`, `provisioningView`, `supportView`, `systemHealthView`, `auditView`, `planView`, `subscriptionView`, `entitlementView`, `usageView`, `billingView`) | **No tenant access**. Note: `supportManage` is NOT granted to `PLATFORM_SUPPORT` in `rolePermissions`, though `supportView` is. | **Yes** (`platform.audit.view` -> global + all tenant `audit_logs`) |
| `PLATFORM_BILLING` | `Platform Billing Console` | `users.platform_role` enum + `src/lib/auth/platform.ts:4,14` | Global SaaS Platform (commercial) | **10 / 26** (`organizationView`, `planView`, `planManage`, `subscriptionView`, `subscriptionManage`, `billingView`, `billingManage`, `entitlementView`, `entitlementManage`, `usageView`) | **No tenant access**. | **No** (lacks `platform.audit.view`) |

*(Note: `NONE` in `users.platform_role` represents standard non-platform tenant users; it is a sentinel value, not a role.)*

### B. Organization-Level Roles (9)

All 9 roles are inserted into the `roles` table (`is_system = true`) for every provisioned organization (`src/modules/platform/provisioning.ts:111-149`). Display titles come from `ROLE_METADATA` (`src/modules/rbac/permissions.ts:110-182`) and `ROLE_DISPLAY_NAMES` (`src/modules/employees/service.ts:181-191`).

| Role Identifier | Display Name (`ROLE_METADATA` / `employees/service.ts`) | Scope | Static Perm Count | Extra Hardcoded Role-Key / Structural Capabilities | Dept Required Onboard? | Audit Log Access? |
|---|---|---|---:|---|---|---|
| `ORGANIZATION_OWNER` | `Organization Owner` | Single Tenant Organization | **162 / 162** (`ALL_PERMISSION_KEYS`) | Full tenant bypass in `can()`, `canAny()`, `getRolePermissionSet()`; sole tenant role allowed to offboard employees (`offboarding.ts:13`), modify/protect Owner records, and inspect self profile in `/app/employees/[id]`; exempt from attendance reminders (`reminder.ts:66`); sees organization attendance dashboard. | No | **No** (no tenant audit API exists) |
| `HR_ADMIN` | `HR Administrator` / `HR Admin` | Single Tenant Organization | **69** | Hardcoded privileged org attendance dashboard & other-employee attendance lookup (`attendance/route.ts:26`, `organization-dashboard.ts:156`, `attendance/+page.server.ts:1`); sees all departments (`departments/service.ts:623`); can access payroll landing (`app/payroll/+page.server.ts:2`); can assign 7 non-HR-Admin/non-Owner roles; must be assigned to HR department and cannot have a `teamId` or `locationId` (`employees/service.ts:76,148,1024-1046`). | Must be HR dept (`!teamId`, `!locationId`) | **No** |
| `HR_EXECUTIVE` | `HR Executive` | Single Tenant Organization | **19** | Hardcoded privileged org attendance dashboard & other-employee attendance lookup (`attendance/route.ts:27`, `organization-dashboard.ts:156`, `attendance/+page.server.ts:1`); can assign `EMPLOYEE` role only; must be assigned to HR department and cannot have a `teamId` or `locationId`. | Must be HR dept (`!teamId`, `!locationId`) | **No** |
| `FINANCE_ADMIN` | `Finance Administrator` / `Finance Admin` | Single Tenant Organization | **31** | Eligible to be assigned as Department Manager (`departments/service.ts:310`); hardcoded in payroll landing gate (`app/payroll/+page.server.ts:2`) and workflow payroll approval resolution (`workflows/service.ts:36-37`). | No | **No** |
| `MANAGER` | `Department Manager` | Single Tenant Organization | **23** | Eligible to be assigned as Department Manager (`departments/service.ts:310`). Note: if actually assigned as `departments.headEmployeeId`, `context.isDepartmentManager = true` unlocks `/app/departments` nav & specific department read/team management (`departments/service.ts:183,213`). | Yes (`DEPARTMENT_REQUIRED_ROLES`) | **No** |
| `TEAM_LEAD` | `Team Lead` | Single Tenant Organization | **22** | Sole role eligible to be assigned as `teams.teamLeadEmployeeId` (`departments/service.ts:472`). Holds approval permissions (`leave.approve`, `expense.approve`, `payroll.approve`, `workflow.approve`, `attendance.regularization.approve`). | Yes (`DEPARTMENT_REQUIRED_ROLES`) | **No** |
| `PROJECT_MANAGER` | `Project Manager` | Single Tenant Organization | **26** | Full `project.*` (5) and `task.*` (9) permissions, plus self-service attendance/chat and `employee.read`. | Yes (`DEPARTMENT_REQUIRED_ROLES`) | **No** |
| `RECRUITER` | `Talent Recruiter` | Single Tenant Organization | **35** | 25 `ats.*` permissions (`ats.analytics.view` through `ats.view`), plus self-service attendance (`attendance.break/clockin/clockout/read`, `regularization.create/read`), `chat.create/read/send`, `organization.read`. Note: lacks `employee.read`, `leave.apply`, `payslip.view`, `expense.create` in static `ROLE_PERMISSIONS`. | No | **No** |
| `EMPLOYEE` | `Employee` | Single Tenant Organization | **33** | Self-service attendance, leave (`leave.apply`, `leave.balance.read`, `leave.read`), documents (`download/read/update/upload`), expenses (`cancel/create/read/submit/update`), payslips (`payroll.viewself`, `payslip.download`, `payslip.view`), notifications (`read`, `preference.update`), basic project/task/chat participation (`project.create/view`, `task.comment/create/read/update`). | Yes (`DEPARTMENT_REQUIRED_ROLES`) | **No** |

---

## 4. Platform vs Organization Role Classification & `PRODUCT_OWNER` Analysis

### Separation Architecture
1. **Platform Roles (`users.platform_role`):** Live directly on the `users` table (`src/db/schema.ts:76`), default `'NONE'`. Authenticated platform sessions set PostgreSQL transaction-local GUC `app.is_platform_owner = 'true'` via `withPlatformTransaction` (`src/db/client.ts:162-177`) or `platformRead` (`src/lib/server/platform-read.ts:9-27`). Note that `platformRead` sets `app.is_platform_owner = 'true'` for **any** user passing `hasPlatformPermission(context.user.platformRole, permission)` (including `PLATFORM_SUPPORT` and `PLATFORM_BILLING`), bypassing RLS on tenant tables inside platform read transactions!
2. **Organization Roles (`roles` + `memberships`):** Tenant-scoped rows in `roles` (`organization_id`, `key`, `is_system`). Authenticated tenant requests resolve `memberships` + `roles` + `role_permissions` in `resolveContext()` (`src/lib/server/context.ts:58-124`) or `resolveTenantContext()` (`src/modules/tenancy/context.ts:97-215`) and execute queries inside `withTenantTransaction` (`app.current_organization_id`) or `tenantRead` (`app.current_user_id`, `app.current_organization_id`, `READ ONLY`).

### Is Product Owner (`PRODUCT_OWNER`) a real DB role, platform permission, or application-level role?
**Answer:** `PRODUCT_OWNER` is **both a real PostgreSQL enum role and an application-level platform role**, NOT a platform permission string and NOT an organization `roles` table row:
- **Database schema & migration:** Defined as an enum value in `platform_role` (`src/db/schema.ts:9`), added to PostgreSQL in `drizzle/0012_swift_blur.sql:1` (`ALTER TYPE "public"."platform_role" ADD VALUE 'PRODUCT_OWNER';`).
- **Application RBAC definition:** Mapped in `rolePermissions` (`src/lib/auth/platform.ts:4` and `src/modules/platform/authorization.ts:10`) with all **26** `PLATFORM_PERMISSIONS` (`all`), in `PLATFORM_ROLE_CONSOLE_TITLES` (`"Product Owner Console"`), in `platformRoleSchema` (`src/modules/platform/validation.ts:167`), and in owner-protection logic (`changePlatformRole` in `src/modules/platform/operations.ts:296-300`, where `authority = ["PLATFORM_OWNER", "PRODUCT_OWNER"]` prevents removing the last high-authority owner).
- **Critical asymmetry with `PLATFORM_OWNER`:**
  - `PLATFORM_OWNER` has an explicit cross-tenant application bypass (`if (platformRole === "PLATFORM_OWNER") return true`) in `src/modules/tenancy/authorization.ts:77,198`, `src/lib/auth/policy.ts:10`, `src/modules/employees/service.ts:837,860,983`, and `src/modules/departments/service.ts:621` (plus `SYSTEM_ROLES` / `ROLE_METADATA`).
  - `PRODUCT_OWNER` does **NOT** appear in any of those tenant bypass checks, does **NOT** appear in `PlatformUserList.svelte`'s `roleBadgeMap` (`L31-36`, falling back to `PLATFORM_ADMIN` badge styling), and does **NOT** have an organization membership (`src/lib/server/context.ts:54` returns `organization: null` for any `platformRole !== 'NONE'`, causing `/app` routes to return HTTP 403).

---

## 5. Role-Permission Matrix

### A. Platform Roles vs `PLATFORM_PERMISSIONS` (26 Keys)

Source: `src/lib/auth/platform.ts:1-4` and `src/modules/platform/authorization.ts:7-10`.

| Permission Key | `PLATFORM_OWNER` | `PRODUCT_OWNER` | `PLATFORM_ADMIN` | `PLATFORM_SUPPORT` | `PLATFORM_BILLING` |
|---|:---:|:---:|:---:|:---:|:---:|
| `platform.organization.view` | Yes | Yes | Yes | Yes | Yes |
| `platform.organization.create` | Yes | Yes | Yes | No | No |
| `platform.organization.edit` | Yes | Yes | Yes | No | No |
| `platform.organization.suspend` | Yes | Yes | Yes | No | No |
| `platform.provisioning.view` | Yes | Yes | Yes | Yes | No |
| `platform.provisioning.manage` | Yes | Yes | Yes | No | No |
| `platform.plan.view` | Yes | Yes | Yes | Yes | Yes |
| `platform.plan.manage` | Yes | Yes | Yes | No | Yes |
| `platform.subscription.view` | Yes | Yes | Yes | Yes | Yes |
| `platform.subscription.manage` | Yes | Yes | Yes | No | Yes |
| `platform.billing.view` | Yes | Yes | **No** | Yes | Yes |
| `platform.billing.manage` | Yes | Yes | **No** | No | Yes |
| `platform.entitlement.view` | Yes | Yes | Yes | Yes | Yes |
| `platform.entitlement.manage` | Yes | Yes | Yes | No | Yes |
| `platform.usage.view` | Yes | Yes | Yes | Yes | Yes |
| `platform.analytics.view` | Yes | Yes | Yes | No | No |
| `platform.user.view` | Yes | Yes | Yes | No | No |
| `platform.user.manage` | Yes | Yes | Yes | No | No |
| `platform.support.view` | Yes | Yes | Yes | Yes | No |
| `platform.support.manage` | Yes | Yes | Yes | **No** | No |
| `platform.feature.view` | Yes | Yes | Yes | No | No |
| `platform.feature.manage` | Yes | Yes | Yes | No | No |
| `platform.system_health.view` | Yes | Yes | Yes | Yes | No |
| `platform.audit.view` | Yes | Yes | Yes | Yes | **No** |
| `platform.configuration.view` | Yes | Yes | Yes | No | No |
| `platform.configuration.manage` | Yes | Yes | Yes | No | No |
| **Total Platform Permissions** | **26** | **26** | **24** | **10** | **10** |

### B. Organization Roles vs Application Modules (Static `ROLE_PERMISSIONS` + Code Enforcement)

Source: `src/modules/rbac/permissions.ts:1-99` (mirrored in `src/lib/domain/rbac/permissions.ts:1-99`) and module `authorize()` calls. Out of **162** unique `PERMISSIONS` keys, **94** are referenced outside `permissions.ts` and **68** are unreferenced by any runtime check.

| Domain / Capability | Enforced Permissions / Checks | `ORG_OWNER` | `HR_ADMIN` | `HR_EXEC` | `FINANCE_ADMIN` | `MANAGER` | `TEAM_LEAD` | `PROJ_MGR` | `RECRUITER` | `EMPLOYEE` |
|---|---|---|---|---|---|---|---|---|---|---|
| **Org Settings & Billing** | `organization.settings.read/update`, `billing.view/manage` | All (4) | `settings.read/update` | No (`org.read` only) | No (`org.read` only) | No | No | No | No | No |
| **Roles & Memberships** | `role.read/manage`, `membership.*` *(Note: **0** runtime APIs enforce these)* | Defined (6) | `membership.read/invite/update`, `role.read` | No | No | No | No | No | No | No |
| **Departments & Teams** | `department.read/create/update/manage`, `team.read/create/update/manage` | All (8) | All (8) | `dept.read` | `dept.read` | `dept.read` (+`isDepartmentManager` if assigned head) | No | No | No | No |
| **Designations & Locations** | `designation.read/create/update`, `location.read/create/update` | All | All | No | No | No | No | No | No | No |
| **Employees & Invites & Onboarding** | `employee.read/create/update/invite/onboard` (+ `canAssignRole`) | All (assigns 8 roles; can offboard) | `read/create/update/invite/onboard` (assigns 7 roles) | `read/create/update/invite` (assigns `EMPLOYEE`) | No | `employee.read` | `employee.read` | `employee.read` | No | No |
| **Personal Employee PII** | Directory (`/api/app/directory`), Detail (`/api/app/employees/[id]`, `employee.read`), Self (`/api/app/me/employee`) | Full org + self | Full org (except Owner edits) | Org read/edit (except Owner) | Org list/detail via `employee.read` | Org list/detail via `employee.read` | Org list/detail via `employee.read` | Org list/detail via `employee.read` | Directory + `/me/employee` only | Directory + `/me/employee` only |
| **Attendance & Regularization** | `attendance.read/clockin/clockout/break/manage`, `attendance.regularization.create` (+ hardcoded role-key check for viewing others) | All + view others | All + view others | Self + `attendance.read` + **view others** (hardcoded) | Self + `attendance.read` | Self + `regularization.approve` (in static set) | Self + `regularization.approve` (in static set) | Self (`clockin/out/break/read/reg.create`) | Self | Self |
| **Leave** | `leave.read/apply` (`leave.approve` via `APPROVAL_PERMISSIONS`) | All | `read/approve/manage/balance.*/policy/type` (no `leave.apply`) | `read/apply` | No | `read/approve` | `read/approve` | No | No | `read/apply/balance.read` |
| **Expenses** | `expense.create/submit/read/cancel`, `expense.category.manage` | All | `read/manage/category/policy` (no `create/submit`) | No | `read/approve/manage/category/policy/reimbursement` | `read/approve` | `read/approve` | No | No | `create/submit/read/update/cancel` |
| **Documents** | `document.read/upload/download/verify/reject` | All | `read/upload/verify/reject/manage` | `read/upload` | No | No | No | No | No | `read/upload/download/update` |
| **Payroll & Payslips** | `payroll.view/configure/calculate/finalize/manage`, `payslip.view` | All | `view/configure/calculate/finalize/manage/approve/review/viewall`, `payslip.view/download` | No | `view/configure/calculate/finalize/manage/approve/review/viewall`, `payslip.view/download` | `payroll.view/review/approve`, `payslip.view` | `payroll.view/review/approve`, `payslip.view` | No | No | `payroll.viewself`, `payslip.view/download` |
| **ATS / Recruitment** | `ats.*` (25 keys enforced in `ats/service.ts`, `recruiter-intelligence`, `resume-intelligence`) | All | No | No | No | No | No | No | **All 25 `ats.*`** | No |
| **Projects & Tasks** | `project.view/create/edit/archive/manage.members`, `task.*` | All | No | No | No | No | No | Full (`project.*` 5 + `task.*` 9) | No | `project.create/view`, `task.create/read/update/comment` |
| **Chat** | `chat.read/send/create` | All | Yes (3) | Yes (3) | Yes (3) | Yes (3) | Yes (3) | Yes (3) | Yes (3) | Yes (3) |
| **Workflows & Approvals** | `workflow.read/manage`, `APPROVAL_PERMISSIONS` (7 keys) | All | `workflow.read/manage`, `leave/att.reg/payroll.approve` | No | `workflow.read`, `workflow/expense/payroll.approve` | `workflow.read/approve`, `leave/att.reg/expense/payroll.approve` | `workflow.read/approve`, `leave/att.reg/expense/payroll.approve` | No | No | No |
| **Reports** | `report.*` (`employee`, `attendance`, `leave`, `expense`, `recruitment`, `project`, `task`, `payroll`, `export`) | All (`report.*`) | **None** | **None** | **None** | **None** | **None** | **None** | **None** | **None** |
| **Total Static Perms** | (`ROLE_PERMISSIONS`) | **162** | **69** | **19** | **31** | **23** | **22** | **26** | **35** | **33** |

> [!NOTE]
> Look closely at two code-observed asymmetries in the static matrix above:
> - **Reports (`report.*`):** Only `ORGANIZATION_OWNER` has any `report.*` permission in `ROLE_PERMISSIONS`; `HR_ADMIN`, `FINANCE_ADMIN`, `PROJECT_MANAGER`, and `RECRUITER` have zero `report.*` keys.
> - **Approval Permissions (`APPROVAL_PERMISSIONS`):** `TEAM_LEAD` and `MANAGER` hold `workflow.approve`, `leave.approve`, `attendance.regularization.approve`, `expense.approve`, and `payroll.approve` (`src/modules/rbac/permissions.ts:38-39`), allowing `GET/POST /api/app/approvals` (which uses `authorizeAny(APPROVAL_PERMISSIONS)` plus `approvalTasks.approverUserId = tenant.user.id`). Meanwhile `HR_EXECUTIVE`, `PROJECT_MANAGER`, `RECRUITER`, and `EMPLOYEE` hold **none** of the 7 `APPROVAL_PERMISSIONS`.

---

## 6. Role Assignment Implementation

### How Roles Are Assigned & Updated
1. **Organization Creation & Owner Provisioning:** `createOrganization` (`src/modules/platform/provisioning.ts:76-84`) creates a pending invitation with `intendedRole: "ORGANIZATION_OWNER"`. During `approveOrganization` / `runProvisioning` (`src/modules/platform/provisioning.ts:111-149`), `syncOrganizationRolePermissions` inserts rows into `roles` (`isSystem: true`) for all 9 non-platform `SYSTEM_ROLES`, upserts all 162 `PERMISSIONS` into `permissions`, and syncs `role_permissions` for each role.
2. **Invitation Acceptance (`acceptInvitation`):** `src/modules/platform/invitations.ts:90-136` looks up `roles` matching `(invitation.organizationId, invitation.intendedRole)` and inserts a single `memberships` row (`userId`, `organizationId`, `roleId`, `status: "active"`). Note: `getOrEnsureEmployeeForUser` is called if the invitation is not already linked to an employee (e.g., `ORGANIZATION_OWNER` self-onboarding).
3. **Employee Creation (`createEmployee`) & Invitation Issuance (`POST /api/app/employees/[employeeId]/invite`):**
   - Controlled by `ASSIGNABLE_ROLES_BY_ACTOR` and `canAssignRole(actorRoleKey, targetRole)` (`src/modules/rbac/permissions.ts:45-85`):
     - `ORGANIZATION_OWNER`: can assign `HR_ADMIN`, `HR_EXECUTIVE`, `FINANCE_ADMIN`, `MANAGER`, `TEAM_LEAD`, `PROJECT_MANAGER`, `RECRUITER`, `EMPLOYEE` (8 roles). Cannot assign `PLATFORM_OWNER` or `ORGANIZATION_OWNER`.
     - `HR_ADMIN`: can assign `HR_EXECUTIVE`, `FINANCE_ADMIN`, `MANAGER`, `TEAM_LEAD`, `PROJECT_MANAGER`, `RECRUITER`, `EMPLOYEE` (7 roles; cannot assign `HR_ADMIN` or `ORGANIZATION_OWNER`).
     - `HR_EXECUTIVE`: can assign `EMPLOYEE` only.
     - All other roles: `[]` (cannot assign any role).
   - `createEmployee` (`src/modules/employees/service.ts:29-47,174`) stores `targetRole` in `employeeHistory` (`joining` event), since an uninvited employee does not yet have a `userId` or `memberships` row.
   - `POST /api/app/employees/[employeeId]/invite` (`src/lib/server/api/app/employees/[employeeId]/invite/route.ts:98-152`) validates `canAssignRole`, looks up `roles` for `(organizationId, targetRoleKey)`, and writes `invitations.intendedRole`.
4. **Role Modification (`updateEmployee`):** `src/modules/employees/service.ts:938-999,1099-1131`:
   - Blocks changing an `ORGANIZATION_OWNER` record's role, and blocks setting `targetRole` to `PLATFORM_OWNER` or `ORGANIZATION_OWNER`.
   - Checks `canAssignRole(actorRoleKey, changes.targetRole)` (treating `PLATFORM_OWNER` as `ORGANIZATION_OWNER` at `L983-984`).
   - Updates `memberships.roleId` (if linked to a `userId`), updates `invitations.intendedRole`, and appends an `employeeHistory` `role_changed` row.
5. **Platform Role Assignment (`changePlatformRole`):** `src/modules/platform/operations.ts:290-310` requires `PLATFORM_PERMISSIONS.userManage` (`PLATFORM_OWNER`, `PRODUCT_OWNER`, `PLATFORM_ADMIN`), validates `platformRoleSchema`, and blocks demoting the last `PLATFORM_OWNER` or `PRODUCT_OWNER`.

### Answers to Phase 4 Questions
- **Can a user have multiple roles?** **No.** `memberships.userId` has a database unique constraint (`memberships_user_id_unique`, `src/db/schema.ts:90`, `drizzle/0001_fluffy_micromax.sql:53`), and `acceptInvitation` explicitly rejects any user already having a membership (`L101-103`).
- **Are roles organization-specific?** **Yes.** `roles` rows have `organizationId` and unique index `(organizationId, key)` (`src/db/schema.ts:83-85`). Platform roles are global on `users.platform_role`.
- **Are custom roles supported?** **No runtime creation/editing/assignment.** Only DB schema (`roles.isSystem default false`, `role_permissions`) and DB-backed `getRolePermissionSet` / `resolveContext` read paths exist. `resolveTenantContext` (`src/modules/tenancy/context.ts:189-195`) only reads static `ROLE_PERMISSIONS[role.key]` rather than `role_permissions`!
- **Are permissions inherited?** **No formal role hierarchy inheritance.** Each role lists its explicit flat array in `ROLE_PERMISSIONS`, and `ORGANIZATION_OWNER` resolves `ALL_PERMISSION_KEYS` (`162`). The only contextual privilege augmentation is `departments.headEmployeeId` setting `context.isDepartmentManager = true` for department view/team management (`departments/service.ts:165-223`, `AppShell.svelte:36`).
- **Does Product Owner bypass tenant-level authorization?** **No.** Only `PLATFORM_OWNER` returns `true` in `policy.ts:can()`, `tenancy/authorization.ts:can()/canAny()`, `tenancy/context.ts:getCachedTenantContext()/resolveTenantContext()`, `departments/service.ts:621`, and `employees/service.ts:837,860,983`. However, inside `/platform/*` endpoints/loaders (`platformRead`, `withPlatformTransaction`), **any** platform role with the required `PLATFORM_PERMISSIONS` executes PostgreSQL transactions with `app.is_platform_owner = 'true'`.
- **Do database RLS policies enforce the same boundaries?**
  - Tenant tables enforce `(organization_id::text = current_setting('app.current_organization_id', true) OR current_setting('app.is_platform_owner', true) = 'true')` (`drizzle/0001_fluffy_micromax.sql:202-205`, `0002`, `0011`, `0015`).
  - `roles` enforces tenant isolation (`0015_tidy_raptor.sql:2-6`); `permissions` and `role_permissions` allow platform-owner writes (`0015_tidy_raptor.sql:10-15`).
  - **Important distinction:** PostgreSQL RLS isolates **organization boundaries** (`app.current_organization_id`), **NOT** intra-organization RBAC roles (`HR_ADMIN` vs `EMPLOYEE`) — intra-tenant role and permission enforcement lives in the application layer (`authorize()`, `can()`, service role checks) and `app.current_user_id` self-checks where applicable. Furthermore, `platformRead()` (`src/lib/server/platform-read.ts:20`) sets `app.is_platform_owner = 'true'` even for `PRODUCT_OWNER`, `PLATFORM_ADMIN`, `PLATFORM_SUPPORT`, and `PLATFORM_BILLING`, so DB RLS does not separate platform sub-roles once `hasPlatformPermission` passes.

---

## 7. API Authorization Mapping

Repository totals: **133** SvelteKit endpoint files (`src/routes/api/**/+server.ts`), delegating to **132** handlers in `src/lib/server/api/**` plus **1** native SvelteKit handler (`POST /api/app/employees/[employeeId]/offboard` at `src/routes/api/app/employees/[employeeId]/offboard/+server.ts`).

| Route Group / Endpoint | Auth Mechanism & Required Permission / Role | Who Can Access |
|---|---|---|
| **Health & Public (`2` + `1`)** | | |
| `GET /api/health` | Unauthenticated | Public |
| `GET /api/public/jobs/[slug]`, `POST .../apply` | Unauthenticated (published job slug scoped) | Public applicants |
| **Auth (`10` routes)** | | |
| `/api/auth/{login,register,forgot-password,reset-password,verify-email,verify-email/resend,logout}` | Public / session cookie / token (`registerUser` sets `platformRole: "NONE"`) | Public / user |
| `POST /api/auth/change-password` | `requireSession()` | Any signed-in user |
| `GET /api/auth/invitations/accept/preview`, `POST .../accept` | `withInvitationTokenTransaction(tokenHash)` | Invitation bearer (or matching signed-in user) |
| **Platform Console APIs (`18` route files)** | | |
| `POST /api/platform/auth/login` | `authenticate()` + `hasPlatformPermission(role, platform.organization.view)` | Any of the 5 platform roles (`NONE` rejected 403 & session revoked) |
| `GET /api/platform/organizations`, `POST ...` | `organizationView` (5 platform roles) / `organizationCreate` (`PLATFORM_OWNER`, `PRODUCT_OWNER`, `PLATFORM_ADMIN`) | Platform roles per permission |
| `GET/PATCH/DELETE /api/platform/organizations/[id]` | `organizationView` / `organizationEdit` | Platform roles per permission |
| `POST .../approve`, `.../status` | `organizationSuspend` (`PLATFORM_OWNER`, `PRODUCT_OWNER`, `PLATFORM_ADMIN`) | Platform leadership roles |
| `.../invitation/link`, `.../invitation/resend`, `GET /provisioning`, `POST /provisioning/[id]/retry` | `provisioningView` (all except `PLATFORM_BILLING`) / `provisioningManage` (`OWNER`, `PRODUCT_OWNER`, `ADMIN`) | Platform ops roles |
| `GET/POST/PATCH /api/platform/plans*`, `/subscriptions*`, `GET /billing`, `GET /usage` | `plan*`, `subscription*`, `billing*`, `usageView` (Note: `PLATFORM_ADMIN` lacks `billing*`!) | `PLATFORM_OWNER`, `PRODUCT_OWNER`, `PLATFORM_BILLING` (reads also `PLATFORM_SUPPORT`, non-billing `PLATFORM_ADMIN`) |
| `GET /api/platform/analytics` | `platform.analytics.view` | `PLATFORM_OWNER`, `PRODUCT_OWNER`, `PLATFORM_ADMIN` |
| `GET /api/platform/users`, `PATCH ...` | `platform.user.view` / `platform.user.manage` | `PLATFORM_OWNER`, `PRODUCT_OWNER`, `PLATFORM_ADMIN` |
| `GET /api/platform/audit` | `platform.audit.view` (`listPlatformAudit`) | `PLATFORM_OWNER`, `PRODUCT_OWNER`, `PLATFORM_ADMIN`, `PLATFORM_SUPPORT` (**not** `PLATFORM_BILLING`) |
| `GET/POST /api/platform/support`, `GET /health`, `/features*`, `/configuration` | `support*`, `systemHealthView`, `feature*`, `configuration*` | See `PLATFORM_PERMISSIONS` matrix (Section 5A) |
| **Tenant App APIs (`102` route files)** | *(All require `resolveTenantContext()` + `tenant.organization` except `GET /api/app/employees` which returns `[]` if null org)* | |
| `/api/app/employees` (`GET`/`POST`) | `employee.read` / `employee.create` + `canAssignRole` | `ORG_OWNER`, `HR_ADMIN`, `HR_EXEC` (read also `MANAGER`, `TEAM_LEAD`, `PROJ_MGR`) |
| `/api/app/employees/[id]` (`GET`/`PATCH`) | `employee.read` / `employee.update` + Owner record protection + `canAssignRole` | Read: 6 roles; Write: `ORG_OWNER`, `HR_ADMIN`, `HR_EXEC` |
| `/api/app/employees/[id]/invite` (`POST`/`revoke`) | `employee.invite` + `canAssignRole` + Owner record protection | `ORG_OWNER`, `HR_ADMIN`, `HR_EXEC` |
| `/api/app/employees/[id]/onboarding` (`GET`/`PATCH`/`POST`) | `employee.onboard` + Owner record protection + HR/dept checks | `ORG_OWNER`, `HR_ADMIN` |
| `POST /api/app/employees/[id]/offboard` | Hardcoded: `role.key === "ORGANIZATION_OWNER" && user.platformRole === "NONE"` | **`ORGANIZATION_OWNER` only** |
| `/api/app/directory` (`GET`), `/api/app/me/employee` (`GET`/`PATCH`), `/api/app/notifications*`, `/api/app/attendance/reminder` | Active tenant membership only (`!tenant.organization` -> 403; no `authorize()` call) | All 9 org roles (self-scoped for `me`, `notifications`, `reminder`) |
| `/api/app/departments*` (`GET`, `eligible-managers`, `eligible-team-leads`, `[id]`, `/teams*`, `/deletion-check`) | `department.read/create/update/manage`, `team.manage` + **`isManagerOfDepartment`** (`headEmployeeId`) + `DEFAULT_ELIGIBLE_MANAGER_ROLES` / `TEAM_LEAD` checks | Org-wide: `ORG_OWNER`, `HR_ADMIN` (`PLATFORM_OWNER` in `getDepartments`); Dept-scoped: assigned `headEmployeeId` |
| `/api/app/master-data/*` (`departments`, `designations`, `employment-types`, `holidays`, `locations`, `shifts`, `teams`, `working-days`, `[resource]/[itemId]`) | Respective `.read`/`.create`/`.update`/`.manage` or `authorizeAny([...read, employee.create, employee.read])` | Mostly `ORG_OWNER`, `HR_ADMIN` (reads broader where `employee.read` allowed) |
| `/api/app/attendance` (`GET`, `/organization`, `/punch`, `/regularization`, `/process-absent`) | `attendance.read` (+ hardcoded `ORG_OWNER`/`HR_ADMIN`/`HR_EXECUTIVE` for org/other-employee reads); `authorizeAny(..., "attendance.manage")` for punch/process-absent; `attendance.regularization.create` | Self-punch/reg: all 9 org roles; Org dashboard & others' records: `ORG_OWNER`, `HR_ADMIN`, `HR_EXECUTIVE` |
| `/api/app/leave` & `/leave/types` | `leave.read`, `leave.apply` | `ORG_OWNER`, `HR_ADMIN`, `HR_EXEC`, `MANAGER`, `TEAM_LEAD`, `EMPLOYEE` |
| `/api/app/expenses*` (`GET/POST`, `[id]`, `/submit`, `/categories`, `/items/[id]/receipt`) | `expense.read/create/submit/cancel`, `expense.category.manage`; receipt upload is org-member + claim-owner check | Claim ops: `ORG_OWNER`, `EMPLOYEE` (and `read` for `HR_ADMIN`, `FINANCE_ADMIN`, `MANAGER`, `TEAM_LEAD`); categories: `ORG_OWNER`, `HR_ADMIN`, `FINANCE_ADMIN` |
| `/api/app/documents*` (`GET/POST`, `[id]`, `/types`) & `/api/app/storage/file` | `document.read/upload/download/verify/reject/manage`; `/storage/file` validates HMAC signature + calls `readAuthorizedLocalFile` (`document.download` or `ats.candidate.view`) | Employee docs: `ORG_OWNER`, `HR_ADMIN`, `HR_EXEC`, `EMPLOYEE`; verify/reject: `ORG_OWNER`, `HR_ADMIN`; ATS resumes: `ORG_OWNER`, `RECRUITER` |
| `/api/app/payroll/*` (`config`, `periods`, `profiles`, `runs*`, `salary-assignments`, `employee-options`, `payslips`) | `payroll.view/configure/calculate/finalize`, `payslip.view` | Admin/run ops: `ORG_OWNER`, `HR_ADMIN`, `FINANCE_ADMIN` (`view`: also `MANAGER`, `TEAM_LEAD`); `payslips`: also `EMPLOYEE` |
| `/api/app/approvals*` & `/api/app/workflows` | `authorizeAny(APPROVAL_PERMISSIONS)` (+ `approverUserId = tenant.user.id`); `workflow.read/manage` | Approvals: `ORG_OWNER`, `HR_ADMIN`, `FINANCE_ADMIN`, `MANAGER`, `TEAM_LEAD` |
| `/api/app/ats/*` (20 routes) | Respective `ats.*` permissions (`ats.view`, `ats.job.*`, `ats.candidate.*`, `ats.application.*`, `ats.interview.*`, `ats.requisition.*`, `ats.talentpool.manage`, `ats.manage`) | **`ORGANIZATION_OWNER` and `RECRUITER` only** |
| `/api/app/projects*`, `/tasks*`, `/chat/*` | `project.*`, `task.*`, `chat.*` | Chat: all 9 org roles; Projects/Tasks: `ORG_OWNER`, `PROJECT_MANAGER`, `EMPLOYEE` |
| `/api/app/reports` | `report.employee`, `report.<kind>`, `report.export` | **`ORGANIZATION_OWNER` only** (under default `ROLE_PERMISSIONS`) |
| `/api/app/billing` | `billing.view` / `billing.manage` | **`ORGANIZATION_OWNER` only** |

### SSR Page & Layout Gates (`src/routes/**`)
- **`src/routes/platform/+layout.server.ts`:** Gates all `/platform/*` pages (except `/platform/login`) via `hasPlatformPermission(context.user.platformRole, access[segment] ?? p.organizationView)`.
- **`src/routes/app/+layout.server.ts:4`:** Requires `context?.organization` (blocking all platform-role accounts with 403).
- **`src/lib/components/layout/AppShell.svelte:20-36`:** Builds navigation using `context.navigationPermissions` + `owner` (`ORGANIZATION_OWNER`) + `context.isDepartmentManager` (`L36`).
- **Special hardcoded SSR page checks:** `app/payroll/+page.server.ts:2` checks `ORGANIZATION_OWNER | PLATFORM_OWNER | FINANCE_ADMIN | FINANCE_MANAGER | HR_ADMIN | payroll.view | payroll.manage`; `app/attendance/+page.server.ts:1` sets `canViewOthers` for `ORGANIZATION_OWNER | HR_ADMIN | HR_EXECUTIVE`; `app/employees/[employeeId]/+page.svelte:23-24` enables `canOffboard` strictly for `ORGANIZATION_OWNER && user.platformRole === "NONE"`.

---

## 8. Audit Log Access Mapping

1. **Tenant-Side Audit Logs:**
   - **Exposed APIs / UI:** **None (0 routes).** No `/api/app/**` or `/app/**` page queries `auditLogs` (`src/db/schema.ts:104`).
   - *(Note: Non-RBAC entity history tables exist: `employeeHistory` is visible on employee detail SSR `/app/employees/[employeeId]/+page.server.ts:2` to users with `employee.read` (`ORGANIZATION_OWNER`, `HR_ADMIN`, `HR_EXECUTIVE`, `MANAGER`, `TEAM_LEAD`, `PROJECT_MANAGER`), and `documentHistory` / `expenseHistory` exist in schema.)*
2. **Platform-Side Audit Logs (`audit_logs` table):**
   - `GET /api/platform/audit` (`src/routes/api/platform/audit/+server.ts` -> `src/lib/server/api/platform/audit/route.ts` -> `listPlatformAudit` in `src/modules/platform/operations.ts:325-375`) — requires `PLATFORM_PERMISSIONS.auditView`.
   - `/platform/audit` SSR loader (`src/routes/platform/audit/+page.server.ts`) — fetches `/api/platform/audit` after `+layout.server.ts` verifies `PLATFORM_PERMISSIONS.auditView`.
   - `/platform` Dashboard SSR loader (`src/routes/platform/+page.server.ts:12`) — queries the latest 5 rows from `auditLogs` via `platformRead(context, p.auditView, ...)` when `hasPlatformPermission(..., p.auditView)` is true.
   - `GET /api/platform/analytics` (`src/modules/platform/analytics.ts:24`) — requires `PLATFORM_PERMISSIONS.analyticsView` and aggregates `{ action: auditLogs.action, value: count() }` across all rows in the time window (`1/7/30/90` days) without `organizationId` filtering, though without actor PII.
3. **Database RLS on `audit_logs` (`drizzle/0001_fluffy_micromax.sql:201,205`):**
   ```sql
   USING (organization_id::text = current_setting('app.current_organization_id', true)
          OR current_setting('app.is_platform_owner', true) = 'true')
   ```
   Because `withPlatformTransaction` and `platformRead` set `app.is_platform_owner = 'true'`, **every row in `audit_logs`** (both `organization_id IS NULL` platform events and `organization_id IS NOT NULL` tenant events) is visible to platform queries unless explicitly filtered in application SQL.

---

## 9. Product Owner Audit Log Permission Discovery

- **Which audit APIs can Product Owner access?**
  - `GET /api/platform/audit` (`listPlatformAudit` -> `PLATFORM_PERMISSIONS.auditView`) — **Allowed** (`PRODUCT_OWNER` holds all 26 `PLATFORM_PERMISSIONS`).
  - `/platform` Overview recent activity query & `/platform/audit` page — **Allowed**.
  - `GET /api/platform/analytics` (aggregated action counts from `auditLogs`) — **Allowed** (`platform.analytics.view`).
- **Which audit APIs can Organization Admin / Organization Owner access?**
  - **None.** Neither `ORGANIZATION_OWNER` nor `HR_ADMIN` can access `/api/platform/audit` (`user.platformRole === "NONE"` -> 403) and no `/api/app/audit` route exists.
- **Do platform audit logs include tenant audit events?**
  - **Yes.** `listPlatformAudit()` (`src/modules/platform/operations.ts:346-365`) runs under `withPlatformTransaction` and queries `auditLogs` with **no `isNull(auditLogs.organizationId)` filter**. It returns both global platform events (`organization_creation`, `organization_approval`, `platform_role_changed`, `platform_configuration_updated`, `feature_flag_updated`, `plan_updated`, etc.) **and** tenant-level `recordAudit()` events (`employee_created`, `employee_updated`, `employee_offboarded`, `invitation_created`, `invitation_accepted`, `attendance_clocked_in`, `attendance_regularization_requested`, `expense_created`, `document_uploaded`, `payroll_run_*`, `task_created`, `project_created`, `conversation_created`, `ats_*`, `login_failed`, etc.). Note `src/modules/platform/analytics.ts:24` also aggregates all `auditLogs` actions regardless of `organizationId`.
- **Are employee names, email addresses, or individual activities exposed?**
  - **Yes, in the API response (`GET /api/platform/audit`), and partially in the UI:**
    - `listPlatformAudit()` selects (`operations.ts:347-351`):
      ```ts
      audit: auditLogs,
      actor: { id: users.id, name: users.fullName, email: users.email },
      organization: { id: organizations.id, name: organizations.name, slug: organizations.slug },
      ```
      and `src/lib/server/api/platform/audit/route.ts` serializes the full rows as `{ success: true, events: result.rows, ... }`. Thus **actor `id`, `name` (`fullName`), `email`, `organizationId`, `organization.name/slug`, `audit.action`, `audit.resource`, `audit.resourceId`, and `audit.metadata` are returned over HTTP**. (In `/platform/audit?search=...`, `listPlatformAudit` also matches against `users.fullName`, `auditLogs.action`, `auditLogs.resource`, `organizations.name/slug`, and `auditLogs.organizationId`.)
    - In the UI component `PlatformAuditList.svelte` (`L14-27, L133-157`), the TypeScript interface only types `{ audit, actor: { name }, organization: { name } }` and the table renders `audit.createdAt`, `actor?.name ?? "Platform System"`, `audit.action`, `audit.resource`, and `organization?.name` — so `actor.email` and `audit.metadata` are **not rendered in the Svelte table**, though they remain present in the `/api/platform/audit` JSON payload (and `audit` row fields in `/platform` page server props).
- **Exact authorization functions controlling this:**
  - `authorizePlatform(PLATFORM_PERMISSIONS.auditView)` (`src/modules/platform/authorization.ts:12`)
  - `hasPlatformPermission(role, PLATFORM_PERMISSIONS.auditView)` (`src/lib/auth/platform.ts:5` & `src/modules/platform/authorization.ts:11`)
  - `listPlatformAudit()` (`src/modules/platform/operations.ts:325-375`)
  - `platformRead(context, p.auditView, ...)` (`src/lib/server/platform-read.ts:9-27`, called in `src/routes/platform/+page.server.ts:12`)
  - `src/routes/platform/+layout.server.ts:2-7` (`access.audit = p.auditView`)

---

## 10. Duplicate, Deprecated, Unused, and Inconsistent Roles / Code

1. **`ORGANIZATION_ADMIN` (Deprecated / Excluded):**
   - Explicitly excluded from `SYSTEM_ROLES` and `ROLE_PERMISSIONS`; only referenced in unit tests asserting its exclusion (e.g., `src/modules/rbac/permissions.test.ts`) and as the schema column default `invitationType: varchar(...).default("organization_admin")` on `invitations` (`src/db/schema.ts:102`), whereas employee invitations explicitly set `invitationType: "employee"`.
2. **`PLATFORM_AUDITOR` (Phantom UI-Only Key):**
   - Exists solely in `roleBadgeMap` in `src/lib/components/platform/PlatformUserList.svelte:35`. Absent from `platformRole` PostgreSQL enum, `platformRoleSchema`, `PLATFORM_PERMISSIONS`, and `PLATFORM_ROLE_CONSOLE_TITLES` (`PRODUCT_OWNER` and `PLATFORM_BILLING` are missing from `roleBadgeMap` instead and fall back to `roleBadgeMap.PLATFORM_ADMIN`).
3. **`FINANCE_MANAGER` (Dead Legacy Alias):**
   - Referenced in `src/modules/workflows/service.ts:36-37` (`["FINANCE_ADMIN", "FINANCE_MANAGER", "ORGANIZATION_OWNER"]`) and `src/routes/app/payroll/+page.server.ts:2`, despite the actual provisioned role key being `FINANCE_ADMIN`.
4. **Unused `department_head` Branch in Workflows (`src/modules/workflows/service.ts:33-42`):**
   - `workflowActorType` enum defines `"department_head"`, and `departments.headEmployeeId` exists, yet `resolveApprover()` handles `"reporting_manager"`, `"hr_admin"`, and `"organization_role"`, with **no explicit `"department_head"` branch** (falling through to `step.actorRoleKey` / throwing 422 if null).
5. **Duplicate Static Definitions (`src/modules/rbac/permissions.ts` vs `src/lib/domain/rbac/permissions.ts`, and `src/lib/auth/platform.ts` vs `src/modules/platform/authorization.ts`):**
   - Static role/permission dictionaries are duplicated across client/domain (`$lib/...`) and server module (`@/modules/...`) files and must be updated together to avoid drift.
6. **68 Defined-but-Unchecked `PERMISSIONS` Keys:**
   - Including `role.read`, `role.manage`, `membership.read/invite/update/remove`, `organization.read/update/manage`, `employee.delete/activate/deactivate/manage/self.*`, `leave.approve/manage/cancel/balance.*`, `expense.approve/manage/policy.*`, `payroll.review/approve/viewall/viewself`, `workflow.approve/create/update/activate`, `ats.requisition.approve`, etc. Many approval flows check `APPROVAL_PERMISSIONS` via `authorizeAny` or hardcoded role keys rather than individual `*.approve` calls.
7. **Searched Identifiers Confirmed Absent as Role Keys (0 hits):**
   - `STAFF`, `DEPARTMENT_MANAGER`, `DEPARTMENT_HEAD`, `AUDITOR`, `SUPER_ADMIN`, `ADMIN`.

---

## 11. Exact Source Files and Line References

- **Database Schema & Migrations:**
  - `src/db/schema.ts`: `L9` (`platformRole`), `L28` (`workflowActorType`), `L64` (`projectMemberRole`), `L66` (`conversationMemberRole`), `L76` (`users.platformRole`), `L83-88` (`roles`, `permissions`, `rolePermissions`), `L90-92` (`memberships.userId` `.unique()`), `L102` (`invitations`), `L104` (`auditLogs`), `L109` (`departments.headEmployeeId`), `L116` (`teams.teamLeadEmployeeId`), `L118` (`employees.reportingManagerId`)
  - `drizzle/0001_fluffy_micromax.sql`: `L5`, `L45-53`, `L198-205` (RLS policies for `memberships`, `invitations`, `subscriptions`, `audit_logs`)
  - `drizzle/0012_swift_blur.sql`: `L1-4` (adds `PRODUCT_OWNER`, `PLATFORM_ADMIN`, `PLATFORM_SUPPORT`, `PLATFORM_BILLING` to `platform_role`)
  - `drizzle/0015_tidy_raptor.sql`: `L1-15` (RLS on `roles`, `permissions`, `role_permissions`)
  - `src/db/client.ts`: `L111-177` (`withUserTransaction`, `withInvitationTokenTransaction`, `withTenantTransaction`, `withPlatformTransaction`)
- **Platform RBAC & Operations:**
  - `src/lib/auth/platform.ts`: `L1-20` (`PLATFORM_PERMISSIONS`, `rolePermissions`, `hasPlatformPermission`, `PLATFORM_ROLE_CONSOLE_TITLES`)
  - `src/modules/platform/authorization.ts`: `L1-32` (`authorizePlatform`, `authorizePlatformTargetOrganization`, duplicate `rolePermissions`)
  - `src/modules/platform/validation.ts`: `L167` (`platformRoleSchema`)
  - `src/modules/platform/operations.ts`: `L244-375` (`listPlatformUsers`, `changePlatformRole`, `listPlatformAudit`)
  - `src/modules/platform/provisioning.ts`: `L10-237` (`createOrganization`, `approveOrganization`, `syncOrganizationRolePermissions`, `runProvisioning`)
  - `src/modules/platform/invitations.ts`: `L29-137` (`getInvitationPreview`, `acceptInvitation`)
  - `src/modules/platform/analytics.ts`: `L8-31` (`getPlatformAnalytics`)
  - `src/lib/server/platform-read.ts`: `L9-27` (`platformRead`)
  - `src/routes/platform/+layout.server.ts`: `L1-8`, `src/routes/platform/+page.server.ts`: `L1-19`, `src/routes/platform/audit/+page.server.ts`
  - `src/lib/server/api/platform/audit/route.ts`: `L1-3`, `src/lib/server/api/platform/auth/login/route.ts`
- **Tenant RBAC & Authorization:**
  - `src/modules/rbac/permissions.ts` & `src/lib/domain/rbac/permissions.ts`: `L1-183` (`PERMISSIONS`, `SYSTEM_ROLES`, `APPROVAL_PERMISSIONS`, `ROLE_PERMISSIONS`, `ASSIGNABLE_ROLES_BY_ACTOR`, `canAssignRole`, `ROLE_METADATA`)
  - `src/lib/auth/policy.ts`: `L1-17` (`Context` type, `can()` with `PLATFORM_OWNER` check)
  - `src/lib/server/context.ts`: `L11-137` (`resolveContext`, `isDepartmentManager`, `platformRole !== 'NONE'` early return)
  - `src/modules/tenancy/context.ts`: `L29-215` (`getCachedTenantContext`, `resolveTenantContext`, `PLATFORM_OWNER` bypass)
  - `src/modules/tenancy/authorization.ts`: `L10-292` (`getRolePermissionSet`, `can`, `authorize`, `canAny`, `authorizeAny`)
  - `src/lib/server/tenant-read.ts`: `L8-17` (`tenantRead`)
- **Module-Specific Role & Hierarchy Checks:**
  - `src/modules/employees/service.ts`: `L13-47` (`createEmployee`, `DEPARTMENT_REQUIRED_ROLES`, `canAssignRole`), `L181-191` (`ROLE_DISPLAY_NAMES`), `L716-912` (`isOrganizationOwnerEmployee`, `isActorPrivilegedForOwnerRecord`), `L914-1140` (`updateEmployee` role changes & HR restrictions)
  - `src/modules/employees/offboarding.ts`: `L9-71` (`offboardEmployee` — `ORGANIZATION_OWNER` + `platformRole === "NONE"` only)
  - `src/lib/server/api/app/employees/[employeeId]/invite/route.ts`: `L65-160` (`canAssignRole`, `roles` lookup, `intendedRole`)
  - `src/modules/departments/service.ts`: `L134-223` (`isManagerOfDepartment`, `assertCanAccessDepartment`, `assertCanManageDepartmentTeams`), `L310-356` (`DEFAULT_ELIGIBLE_MANAGER_ROLES`), `L472-516` (`DEFAULT_ELIGIBLE_TEAM_LEAD_ROLES`), `L621-623` (role bypasses)
  - `src/modules/attendance/organization-dashboard.ts`: `L155-163,608-609` (`ORGANIZATION_OWNER`, `HR_ADMIN`, `HR_EXECUTIVE`)
  - `src/lib/server/api/app/attendance/route.ts`: `L24-31` (`ORGANIZATION_OWNER`, `HR_ADMIN`, `HR_EXECUTIVE` viewing other employees)
  - `src/modules/attendance/reminder.ts`: `L66-67` (`ORGANIZATION_OWNER` exempt)
  - `src/modules/workflows/service.ts`: `L24-54` (`resolveApprover`, `FINANCE_ADMIN`/`FINANCE_MANAGER`, `hr_admin`, `reporting_manager`)
  - `src/modules/collaboration/service.ts`: `L22-35,107-111` (project & conversation roles vs `project.*`/`task.*`/`chat.*` auth)
- **UI & SvelteKit Components:**
  - `src/routes/app/+layout.server.ts:4`, `src/routes/app/attendance/+page.server.ts:1`, `src/routes/app/departments/+page.server.ts:2`, `src/routes/app/departments/[departmentId]/+page.server.ts:2`, `src/routes/app/employees/[employeeId]/+page.server.ts:2`, `src/routes/app/employees/[employeeId]/+page.svelte:23-24`, `src/routes/app/payroll/+page.server.ts:2`
  - `src/lib/components/layout/AppShell.svelte:20-36`, `src/lib/components/platform/PlatformShell.svelte:5`, `src/lib/components/platform/PlatformAuditList.svelte:14-158`, `src/lib/components/platform/PlatformUserList.svelte:31-36,126`
  - `src/lib/components/employees/EditEmployeeDialog.svelte:66-68,292-306,548-550`, `src/lib/components/employees/WorkforceDirectoryTable.svelte:51-58`, `src/lib/components/employees/onboarding/Step2RoleDetails.svelte:126-138`

---

## 12. Uncertainties and Items Requiring Further Verification

1. **Live Database State (`users`, `roles`, `role_permissions`, `memberships`):** Per strict read-only source-audit rules, no queries were executed against the live Neon PostgreSQL database. Any manual rows in `roles` (`is_system = false`), custom `role_permissions` overrides for existing tenants (as previously noted in `docs/security/hr-admin-authorization-matrix.csv`), or stale `users.platform_role` assignments must be verified directly in PostgreSQL.
2. **Dynamic `role_permissions` vs Static `resolveTenantContext` Gap:** In `src/modules/tenancy/context.ts:189-195`, `resolveTenantContext()` derives `result.permissions` from static `ROLE_PERMISSIONS[role.key]` rather than querying `role_permissions` (unlike `src/lib/server/context.ts:89-92,116` and `getRolePermissionSet` in `src/modules/tenancy/authorization.ts:15-52`). If live DB `role_permissions` diverge from static `ROLE_PERMISSIONS` (or if custom roles are ever seeded), routes relying on `tenant.permissions` could behave differently from `can()` / `resolveContext()`.
3. **Seed Data / Fixtures:** `git ls-files "*seed*"` returned **0** seed files in the repository; test accounts and tenant fixtures exist outside version control or directly in the QA database (as described in `docs/security/multi-tenant-security-audit-2026-11-25.md`).
4. **Live `app_private.*` Functions in Neon:** This audit evaluated the SvelteKit application codebase after Option A GUC transaction restoration; any legacy `app_private.*` routines still residing in the Neon database catalog were not inspected.
