# SYMPHOWORK V1 — END-TO-END TEST SCENARIOS & VERIFICATION SPECIFICATION

> **Author**: Senior Principal Software Architect & QA Automation Specialist  
> **Target Release**: SymphoWork V1 — 5-Day Delivery Readiness  
> **Specification Standard**: Playwright E2E & Vitest Integration Specification  
> **Environment Preconditions**: Clean database seeded with platform admin user and default commercial plans.

---

## 1. TEST SUITE OVERVIEW & EXECUTION MATRIX

This document specifies the end-to-end verification test suite for SymphoWork V1. These scenarios cover the complete lifecycle from platform-level tenant creation through all 9 tenant workforce roles, operational workflows, cross-tenant isolation, and disaster recovery.

| Scenario ID | Test Scenario Title | Target Role | Primary Target Modules | Execution Tool |
|---|---|---|---|---|
| **E2E-01** | Organization Creation & Provisioning | `PLATFORM_ADMIN` | Platform Plane, Commercial Plans, Provisioning Engine | Playwright / API |
| **E2E-02** | Owner Invitation Acceptance & First Login | Public / `ORGANIZATION_OWNER` | Auth, Identity, Memberships, Employee Record | Playwright / Web |
| **E2E-03** | Tenant Workspace Init & Wizard | `ORGANIZATION_OWNER` | Onboarding Wizard, Departments, Shifts | Playwright / Web |
| **E2E-04** | Workforce Onboarding (All 8 Roles) | `ORGANIZATION_OWNER`, `HR_ADMIN` | Employees, Invitations, Roles, RBAC | Playwright / API |
| **E2E-05** | Role Dashboard & Navigation Enforcement | All 9 Tenant Roles | Layout, Middleware, Permission Checks | Playwright / Web |
| **E2E-06** | Granular Permission Allow/Deny Matrix | Subordinate Tenant Roles | Authorization Middleware, API 403 Guards | Vitest / API |
| **E2E-07** | Department & Team Lifecycle | `HR_ADMIN`, `MANAGER` | Departments, Teams, Eligibility Rules | Playwright / Web |
| **E2E-08** | Attendance Punch & Policy Calculation | `EMPLOYEE`, `MANAGER` | Attendance Punches, Records, Policies | Playwright / API |
| **E2E-09** | Leave Request, Balance & Unified Approval | `EMPLOYEE`, `MANAGER` | Leave Balances, Workflow Instances, Tasks | Playwright / Web |
| **E2E-10** | Expense Claim, Receipts & Reimbursement | `EMPLOYEE`, `FINANCE_ADMIN` | Expense Claims, Receipts, Approvals | Playwright / Web |
| **E2E-11** | Payroll Profile, Run, Approval & Payslip | `FINANCE_ADMIN`, `ORGANIZATION_OWNER` | Payroll Calculator, Statutory, Payslips | Playwright / Web |
| **E2E-12** | ATS Requisition, Job, Candidate & Match | `RECRUITER`, `HR_ADMIN` | ATS Requisitions, Public Jobs, Resumes | Playwright / Web |
| **E2E-13** | Cross-Tenant Data Isolation (RLS Security) | Multi-Tenant Attack Actor | PostgreSQL RLS, Session Variables | Vitest / Direct SQL |
| **E2E-14** | Failure Recovery & Race Condition Handling | Any User | Transactions, Concurrency, Rollbacks | Vitest / Integration |
| **E2E-15** | Regression Test Verification Checklist | Automated CI Suite | All Core Application Modules | Vitest / GitHub CI |

---

## 2. DETAILED EXECUTABLE TEST SCENARIOS

### SCENARIO E2E-01: Organization Creation & Provisioning
- **Scenario ID**: `E2E-01`
- **Target Role**: `PLATFORM_ADMIN` or `PLATFORM_OWNER`
- **Preconditions**: Platform Admin is authenticated at `/platform` with active session.
- **Step-by-Step Procedure**:
  1. Navigate to `/platform/organizations`.
  2. Click **"+ New Organization"** button.
  3. Enter Organization Name: `"Acme Global Technologies"`.
  4. Select Commercial Plan: `"Enterprise Scale"` (`tier: "enterprise"`).
  5. Enter Primary Admin Email: `"owner@acmeglobal.test"`, Full Name: `"Alice Walker"`.
  6. Set Timezone: `"Asia/Kolkata"`, Currency: `"INR"`.
  7. Submit form (`POST /api/platform/organizations`).
  8. Click **"Approve Organization"** action on the newly created tenant card (`POST /api/platform/organizations/[id]/approve`).
  9. Click **"Run Provisioning"** or trigger provisioning retry (`POST /api/platform/provisioning/[id]/retry`).
- **Expected System Behavior & UI Verification**:
  - Modal displays real-time progress indicators across the 4 provisioning phases: Roles, Permissions, Subscription, Invitation.
  - Success banner appears with status badge displaying `"ACTIVE"`.
  - Invitation link is generated and displayed with a `"Copy Link"` action.
- **Database State Assertions**:
  - `organizations`: row exists with `name = "Acme Global Technologies"`, `status = "active"`.
  - `subscriptions`: row exists with `organization_id`, matching plan ID, `status = "active"`.
  - `provisioning_jobs`: row exists with `organization_id`, `status = "completed"`.
  - `roles`: exactly 9 system roles inserted (`ORGANIZATION_OWNER` through `EMPLOYEE`).
  - `role_permissions`: 50+ entries linked to the newly provisioned roles.
  - `invitations`: row exists with `intended_role = "ORGANIZATION_OWNER"`, `status = "pending"`, `expires_at > NOW()`.
- **Negative / Edge Cases**:
  - Attempting to provision with an existing organization slug or domain fails with HTTP 409 conflict.
  - Attempting to approve an already active organization is rejected idempotently.

---

### SCENARIO E2E-02: Organization Owner Invitation Acceptance & Password Setup
- **Scenario ID**: `E2E-02`
- **Target Role**: `ORGANIZATION_OWNER` (New User)
- **Preconditions**: Pending invitation token exists from `E2E-01`. User has no existing session.
- **Step-by-Step Procedure**:
  1. In an incognito browser window, navigate to `/invitations/accept?token=<TOKEN_FROM_E2E_01>`.
  2. Verify pre-filled organization name `"Acme Global Technologies"` and email `"owner@acmeglobal.test"`.
  3. Enter Full Name: `"Alice Walker"`.
  4. Enter Password: `"SecureStr0ngP@ssw0rd!2026"`.
  5. Confirm Password: `"SecureStr0ngP@ssw0rd!2026"`.
  6. Click **"Accept Invitation & Create Account"** button (`POST /api/auth/invitations/accept`).
- **Expected System Behavior & UI Verification**:
  - Button transitions to loading state (`BrandedLoader`).
  - Response sets HTTP-only secure cookie `symphowork_session`.
  - Browser automatically redirects to `/app`.
  - Welcome banner appears: `"Welcome to Acme Global Technologies, Alice Walker"`.
- **Database State Assertions**:
  - `users`: row created with `email = "owner@acmeglobal.test"`, `password_hash` populated (PBKDF2 salt:hash), `platform_role = "NONE"`.
  - `memberships`: row created with `user_id = <new_user_id>`, `organization_id = <org_id>`, `role_id = <ORGANIZATION_OWNER_ID>`, `status = "active"`.
  - `employees`: row created via `getOrEnsureEmployeeForUser` with `user_id = <new_user_id>`, `work_email = "owner@acmeglobal.test"`, `employee_id = "EMP0001"`, `status = "active"`.
  - `invitations`: status transitioned to `"accepted"`, `accepted_at` populated.
  - `sessions`: active session row created with token hash and 7-day expiration.
- **Negative / Edge Cases**:
  - Submitting with password `< 10` characters or lacking numbers/special characters returns HTTP 400 validation error.
  - Re-submitting an already accepted token returns HTTP 409 `"This invitation has already been used"`.
  - Submitting an expired token returns HTTP 400 `"Invitation token has expired"`.

---

### SCENARIO E2E-03: Tenant Workspace Initialization & Department Setup
- **Scenario ID**: `E2E-03`
- **Target Role**: `ORGANIZATION_OWNER`
- **Preconditions**: Authenticated as Organization Owner from `E2E-02`.
- **Step-by-Step Procedure**:
  1. Navigate to `/app/departments`.
  2. Click **"+ Add Department"** button.
  3. Enter Name: `"Engineering"`, Code: `"ENG"`.
  4. Submit form (`POST /api/app/departments`).
  5. Click **"+ Add Department"** again.
  6. Enter Name: `"Human Resources"`, Code: `"HR"`.
  7. Submit form.
  8. Open `"Engineering"` department details and click **"+ Create Team"**.
  9. Enter Team Name: `"Core Platform Team"`, Code: `"ENG-PLAT"`.
  10. Submit form (`POST /api/app/master-data/teams`).
- **Expected System Behavior & UI Verification**:
  - Department table lists `"Engineering"` and `"Human Resources"` with `status: "active"`.
  - Team dialog lists `"Core Platform Team"` assigned to `"Engineering"`.
- **Database State Assertions**:
  - `departments`: 2 rows exist with `organization_id = <org_id>`, status `"active"`.
  - `teams`: 1 row exists with `department_id = <eng_dept_id>`, status `"active"`.

---

### SCENARIO E2E-04: Workforce Onboarding (All 8 Subordinate Roles)
- **Scenario ID**: `E2E-04`
- **Target Role**: `ORGANIZATION_OWNER` or `HR_ADMIN`
- **Preconditions**: At least one active department exists (`E2E-03`).
- **Step-by-Step Procedure**:
  For each role (`HR_ADMIN`, `HR_EXECUTIVE`, `FINANCE_ADMIN`, `MANAGER`, `TEAM_LEAD`, `PROJECT_MANAGER`, `RECRUITER`, `EMPLOYEE`):
  1. Navigate to `/app/employees`.
  2. Click **"+ Onboard Employee"** to open `OnboardingWizard`.
  3. Step 1 (Personal Details):
     - First Name: `RoleName`, Last Name: `"Tester"`.
     - Personal Email: `<role_lowercase>@acmeglobal.test`.
     - Date of Birth, Gender, Contact number.
  4. Step 2 (Employment Details):
     - Select Role: `<TARGET_ROLE>`.
     - Select Department: `"Engineering"` (or `"Human Resources"`).
     - Select Team: `"Core Platform Team"` (if required for `TEAM_LEAD`).
     - Joining Date: Today. Employment Type: `"Full-time"`.
  5. Step 3 (Confirmation & Send Invitation):
     - Click **"Complete Onboarding & Send Invitation"** (`POST /api/app/employees`).
- **Expected System Behavior & UI Verification**:
  - Each employee is created in sequence with incremental employee IDs (`EMP0002` through `EMP0009`).
  - Workforce directory table displays each row with appropriate colored role badges.
  - Invitations are generated for each employee.
- **Database State Assertions**:
  - `employees`: 8 new rows created with corresponding `department_id` and unique `employee_id`.
  - `invitations`: 8 new rows created with matching `intended_role`.
  - `employee_history`: audit entries logged for employee creation.
- **Negative / Edge Cases**:
  - Onboarding a `TEAM_LEAD` without selecting a valid team belonging to the chosen department fails with HTTP 400.
  - Onboarding an `EMPLOYEE` with duplicate personal email fails with HTTP 409.

---

### SCENARIO E2E-05: Role Dashboard & Navigation Enforcement
- **Scenario ID**: `E2E-05`
- **Target Role**: All 9 Tenant Roles (Evaluated per role)
- **Preconditions**: Accounts created and invitations accepted for all 8 roles from `E2E-04`.
- **Step-by-Step Procedure**:
  Log in as each role and inspect `/app` sidebar navigation items and route access:
  1. **ORGANIZATION_OWNER**: Access `/app` $\to$ all navigation items visible (Workforce, Departments, Attendance, Leave, Payroll, Expenses, ATS, Approvals, Settings).
  2. **HR_ADMIN**: Access `/app` $\to$ Workforce, Departments, Attendance, Leave, ATS, Approvals visible. Financial settings and platform admin hidden.
  3. **FINANCE_ADMIN**: Access `/app` $\to$ Payroll, Expenses, Invoices, Approvals visible. ATS and department restructuring hidden.
  4. **MANAGER**: Access `/app` $\to$ My Team, Approvals, Attendance, Leave visible. Global payroll configuration hidden.
  5. **RECRUITER**: Access `/app` $\to$ ATS, Requisitions, Candidates, Jobs visible. Payroll and workforce salary hidden.
  6. **EMPLOYEE**: Access `/app` $\to$ Self-service Attendance, My Leave, My Expenses, My Payslips, Team Chat visible.
- **Expected System Behavior & UI Verification**:
  - Navigation drawer renders strictly permitted items based on `src/components/layout/nav-utils.ts`.
  - No broken links or loading errors.

---

### SCENARIO E2E-06: Granular Permission Allow/Deny Matrix Tests
- **Scenario ID**: `E2E-06`
- **Target Role**: `EMPLOYEE`, `RECRUITER`, `FINANCE_ADMIN`
- **Preconditions**: Users authenticated with active sessions.
- **Step-by-Step Procedure (Negative Security Assertions)**:
  1. Authenticate as `EMPLOYEE` and execute:
     - `POST /api/app/departments` with body `{ name: "Illegal Dept" }`.
     - `GET /api/app/payroll/runs`.
     - `POST /api/app/employees` with onboarding payload.
  2. Authenticate as `RECRUITER` and execute:
     - `POST /api/app/payroll/runs`.
     - `PATCH /api/app/departments/[id]`.
  3. Authenticate as `FINANCE_ADMIN` and execute:
     - `POST /api/app/ats/requisitions`.
     - `PATCH /api/app/employees/[id]` on Organization Owner's employee record.
- **Expected System Behavior & API Verification**:
  - Every unauthorized request is intercepted by `authorize()` in [`src/modules/tenancy/authorization.ts`](file:///c:/Users/nares/Symphowork_V1_NM/src/modules/tenancy/authorization.ts).
  - API returns HTTP 403 Forbidden with payload:
    `{ success: false, error: { code: "FORBIDDEN", message: "You do not have permission to perform this action." } }`.
  - Target database tables remain completely unchanged.

---

### SCENARIO E2E-07: Department & Team Lifecycle Management
- **Scenario ID**: `E2E-07`
- **Target Role**: `HR_ADMIN` or `ORGANIZATION_OWNER`
- **Preconditions**: Existing departments and employees.
- **Step-by-Step Procedure**:
  1. Navigate to `/app/departments`.
  2. Select `"Engineering"` department.
  3. Click **"Assign Department Head"**.
  4. Filter eligible managers (`GET /api/app/departments/eligible-managers`).
  5. Select an employee with role `MANAGER` and click **"Save"**.
  6. Open `"Core Platform Team"` and click **"Assign Team Lead"**.
  7. Filter eligible team leads (`GET /api/app/departments/eligible-team-leads`).
  8. Select an employee with role `TEAM_LEAD` and click **"Save"**.
- **Expected System Behavior & UI Verification**:
  - Department header displays assigned manager's display name and avatar.
  - Team card displays assigned team lead.
- **Database State Assertions**:
  - `departments`: `manager_employee_id` updated to selected employee UUID.
  - `teams`: `team_lead_employee_id` updated to selected employee UUID.
  - `audit_logs`: records `action = "department_updated"` and `action = "team_updated"`.

---

### SCENARIO E2E-08: Attendance Punch & Policy Calculation
- **Scenario ID**: `E2E-08`
- **Target Role**: `EMPLOYEE`
- **Preconditions**: Employee has assigned shift (`shifts`).
- **Step-by-Step Procedure**:
  1. Navigate to `/app` (Employee Overview).
  2. In the Attendance Widget, click **"Clock In"** (`POST /api/app/attendance/punch` with `type: "clock_in"`).
  3. Verify status updates to `"Clocked In"` with live elapsed timer.
  4. Click **"Start Break"** (`type: "break_start"`).
  5. Verify status updates to `"On Break"`.
  6. Click **"End Break"** (`type: "break_end"`).
  7. Click **"Clock Out"** (`type: "clock_out"`).
- **Expected System Behavior & UI Verification**:
  - Widget dynamically transitions state across all 4 punch actions without page reloads.
  - Summary shows `totalWorkMinutes`, `breakMinutes`, and `netWorkMinutes`.
- **Database State Assertions**:
  - `attendance_records`: row created for current work date with `actual_first_in` and `actual_last_out` timestamps.
  - `attendance_punches`: exactly 4 rows created linking to `attendance_record.id`.
- **Negative / Edge Cases**:
  - Clicking "Clock In" twice on the same day returns HTTP 409 `"You are already clocked in for this work date"`.
  - Clocking out before clocking in returns HTTP 400 `"Clock in before clocking out"`.

---

### SCENARIO E2E-09: Leave Request, Balance Reservation & Unified Approval
- **Scenario ID**: `E2E-09`
- **Target Role**: `EMPLOYEE` (Applicant), `MANAGER` (Approver)
- **Preconditions**: Employee has positive leave balance for `"Annual Leave"`.
- **Step-by-Step Procedure**:
  1. **Employee Session**:
     - Navigate to `/app/leave`.
     - Click **"Apply for Leave"**.
     - Select Leave Type: `"Annual Leave"`.
     - Select Dates: Next Monday to Next Tuesday (2 working days).
     - Enter Reason: `"Family vacation"`.
     - Submit form (`POST /api/app/leave`).
  2. Verify Employee UI shows:
     - Status: `"Pending Approval"`.
     - Leave Balance: `pending` balance increased by 2, `available` decreased by 2.
  3. **Manager Session**:
     - Log in as Manager.
     - Navigate to `/app/approvals`.
     - Verify pending task exists: `"Leave Application: 2 days for <EmployeeName>"`.
     - Click **"Approve"** (`POST /api/app/approvals/[taskId]` with `action: "approve"`).
  4. **Employee Session Re-verification**:
     - Refresh `/app/leave`.
     - Status updates to `"Approved"`.
     - Leave Balance: `consumed` increased by 2, `pending` cleared.
- **Database State Assertions**:
  - `leave_applications`: `status = "approved"`, `approved_at` populated.
  - `leave_balances`: `consumed` incremented by 2, `pending` decremented by 2.
  - `leave_transactions`: 2 transactions logged (`reservation` followed by `consumption`).
  - `approval_tasks`: `status = "approved"`, `completed_at` populated.

---

### SCENARIO E2E-10: Expense Claim, Receipt Upload & Reimbursement
- **Scenario ID**: `E2E-10`
- **Target Role**: `EMPLOYEE` (Claimant), `FINANCE_ADMIN` (Approver)
- **Preconditions**: Active expense categories exist.
- **Step-by-Step Procedure**:
  1. **Employee Session**:
     - Navigate to `/app/expenses`.
     - Click **"+ New Claim"**.
     - Title: `"Client Dinner Meeting"`, Category: `"Meals & Entertainment"`.
     - Amount: `₹3,500.00`, Date: Yesterday.
     - Upload receipt file (PDF/JPEG, `< 5MB`).
     - Submit claim (`POST /api/app/expenses`).
  2. **Finance Admin Session**:
     - Navigate to `/app/approvals`.
     - Review claim details and view receipt preview.
     - Click **"Approve Claim"**.
- **Expected System Behavior & Database State**:
  - `expense_claims`: transitions from `"submitted"` to `"approved"`.
  - `expense_receipts`: stores uploaded file URL and metadata.
  - `approval_tasks`: records approval by Finance Admin.

---

### SCENARIO E2E-11: Payroll Profile Configuration, Run & Payslip Generation
- **Scenario ID**: `E2E-11`
- **Target Role**: `FINANCE_ADMIN` or `ORGANIZATION_OWNER`
- **Preconditions**: Active salary structures and components configured; employees onboarded.
- **Step-by-Step Procedure**:
  1. Assign Salary Structure to Employee (`POST /api/app/payroll/salary-assignments`).
  2. Configure Employee Payroll Profile with statutory options (PF, ESI, TDS regime).
  3. Create Payroll Period for current month (`POST /api/app/payroll/periods`).
  4. Trigger Payroll Calculation (`POST /api/app/payroll/runs`).
  5. Review calculation preview: verify gross pay, PF deduction (12%), ESI deduction, professional tax, and net payable.
  6. Submit Payroll Run for approval.
  7. As Organization Owner, approve payroll run at `/app/approvals`.
  8. Click **"Finalize Payroll Run"** (`POST /api/app/payroll/runs/[id]/finalize`).
  9. **Employee Session**:
     - Navigate to `/app/payroll` (or `/app/payslips`).
     - View generated monthly payslip (`PSL-2026-10-EMP0001`).
     - Download/view itemized breakdown.
- **Database State Assertions**:
  - `payroll_runs`: `status = "finalized"`, `gross_total`, `net_total` calculated.
  - `payroll_calculation_snapshots`: `frozen_at` populated; JSON input and result preserved.
  - `payroll_payslips`: row created linking to employee and calculation snapshot.

---

### SCENARIO E2E-12: Job Posting, Candidate Application & Recruiter Intelligence
- **Scenario ID**: `E2E-12`
- **Target Role**: `RECRUITER`
- **Preconditions**: Requisition approved by HR Admin.
- **Step-by-Step Procedure**:
  1. Recruiter publishes job to public board: `"Senior Full-Stack Engineer"`.
  2. Public candidate visits `/jobs` and clicks on the job posting.
  3. Candidate fills name, email, contact, and uploads `resume.pdf`.
  4. Submits application (`POST /api/jobs/[jobId]/apply`).
  5. **Recruiter Session**:
     - Navigate to `/app/ats/candidates`.
     - Open candidate card.
     - View **Recruiter Intelligence Match Score**: inspect skills match, experience match, and resume summary.
     - Move candidate stage from `"Applied"` to `"Shortlisted"` to `"Interview"`.
- **Database State Assertions**:
  - `ats_jobs`: `status = "published"`.
  - `ats_candidates`: candidate row created.
  - `ats_applications`: application row linked to job and candidate.
  - `ats_resumes`: text extracted and stored.

---

### SCENARIO E2E-13: Cross-Tenant Data Isolation (RLS Verification)
- **Scenario ID**: `E2E-13`
- **Target Role**: Security Auditor / Penetration Test Actor
- **Preconditions**: Two distinct organizations exist: Tenant A (`org-A`) and Tenant B (`org-B`).
- **Step-by-Step Procedure**:
  1. Authenticate as Organization Owner of Tenant A.
  2. Obtain an employee UUID belonging to Tenant B (`emp_B_id`).
  3. Issue authenticated HTTP requests from Tenant A session:
     - `GET /api/app/employees/[emp_B_id]`
     - `PATCH /api/app/employees/[emp_B_id]` with body `{ firstName: "Hacked" }`
     - `GET /api/app/departments?organizationId=[org_B_id]`
     - `GET /api/app/payroll/runs` with Tenant B period ID.
  4. Execute direct database query under Tenant A transaction context:
     ```sql
     SET LOCAL app.current_organization_id = '<ORG_A_UUID>';
     SET LOCAL app.is_platform_owner = 'false';
     SELECT * FROM employees WHERE organization_id = '<ORG_B_UUID>';
     ```
- **Expected System Behavior & Assertions**:
  - HTTP requests return HTTP 404 Not Found or HTTP 403 Forbidden.
  - SQL query returns **0 rows** due to PostgreSQL RLS policy enforcement.
  - Zero leakage of Tenant B data to Tenant A.

---

### SCENARIO E2E-14: Failure Recovery & Concurrency Handling
- **Scenario ID**: `E2E-14`
- **Target Role**: Automated Integration Runner
- **Preconditions**: Standard tenant environment.
- **Step-by-Step Procedure**:
  1. **Audit Failure Rollback Test**:
     - Execute invitation accept transaction where `recordAudit()` throws a simulated exception.
     - Assert that user, membership, and employee records are **completely rolled back** (`db.transaction` atomicity).
  2. **Race Condition Test (Double Acceptance)**:
     - Dispatch two simultaneous concurrent requests accepting the same invitation token.
     - Assert that exactly one request succeeds (HTTP 200) and the second returns HTTP 409 conflict.
  3. **Employee ID Collision Test**:
     - Concurrently onboard 5 employees.
     - Assert that all 5 receive unique, gapless, sequential employee IDs (`EMP0001` through `EMP0005`) via `organizations.employeeIdNext` locking.

---

### SCENARIO E2E-15: Regression Test Checklist & CI Matrix
- **Scenario ID**: `E2E-15`
- **Execution**: Automated Test Suite (`pnpm test` and `pnpm test:e2e`)
- **Required Verification Checklist**:
  - [x] All 73 Vitest test suites pass (438 unit/integration tests).
  - [x] Password hashing never stores plaintext (PBKDF2 SHA-256 verified).
  - [x] Organization Owner employee record cannot be modified by HR Admin or Manager.
  - [x] Role badges in workforce directory match authoritative database memberships.
  - [x] HUD components render accurately across desktop and mobile viewports.
  - [x] File upload admission rejects files $> 10\text{ MB}$ or invalid MIME types.
  - [x] Department manager and team lead eligibility rules strictly enforced.
  - [x] Payroll proration engine correctly handles 30/31-day months and leap years.
  - [x] Sunday working day policy correctly identified as working vs weekend.
  - [x] Zero unhandled promise rejections or TypeScript type errors.

---

## 3. AUDIT CONCLUSION
Execution of these 15 end-to-end scenarios verifies complete system readiness across every tier: presentation, routing, application services, database transactions, and cryptographic security.
