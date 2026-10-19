# SymphoWork V1 — Attendance, Salary Management & Payroll Workflow
## Read-Only Deep Technical Investigation Report

**Document File:** `SYMPHOWORK_V1_ATTENDANCE_SALARY_PAYROLL_INVESTIGATION.md`  
**Investigation Date:** October 19, 2026  
**Repository Branch:** `naresh-dev`  
**HEAD Commit:** `17ef148 fix(ci): resolve ESLint and Next.js build errors for Vercel deployment`  
**Investigation Scope:** Attendance, Shift Timing, Absent Processing, Employee Salary Management, Payroll Calculation, Workflow Approvals, Payslips, RBAC, and Tenant Isolation.

---

## 1. Executive Summary

A comprehensive, read-only architectural and code-level investigation of SymphoWork V1 was conducted across its schemas, modules, API routes, user interfaces, authorization logic, and test suites. 

### Key High-Level Findings:
1. **Attendance Engine & Time Clock:** The core punch system (`clock_in`, `clock_out`, `break_start`, `break_end`) and shift boundary validation are **implemented and verified** for assigned shifts, including overnight shifts crossing midnight in the organization's local timezone.
2. **Automatic Absent Processing is Missing:** There is **no background worker, cron job, or scheduled processor** that marks employees absent after their shifts conclude. An in-memory status calculation exists exclusively inside the Department Roster UI, but it is **never written or persisted to `attendance_records`**.
3. **Fatal Payroll Eligibility Blocker:** The `calculatePayrollRun` engine requires active records in `employee_payroll_profiles` (`status = 'eligible'`). However, **no service, API endpoint, or UI exists anywhere in the repository to create or seed `employee_payroll_profiles`**. Any attempt to calculate payroll in a real tenant throws `422 VALIDATION_ERROR: No eligible employees are configured for this payroll period`.
4. **Attendance-to-Payroll Disconnect & Zero-Deduction Absences:** In `payroll/service.ts`, `absentDays` is calculated by counting `attendance_records` where `status IN ('absent', 'missing_punch')`. Because absent records are never generated for employees who do not clock in, **employees who never show up to work have 0 attendance records and receive 100% full pay with 0 loss-of-pay deductions**. Conversely, employees who clocked in but forgot to clock out (`missing_punch`) receive a full day's loss of pay.
5. **Critical Financial Double-Deduction Bug in Loss of Pay (LOP):** In `payroll/calculator.ts`, the Loss of Pay deduction (`lopAmount`) is subtracted from `grossEarnings` on line 30, **and** simultaneously appended as a line item of `type: 'deduction'`, which is included in `totalDeductions` on line 39. When `netSalary = grossEarnings - totalDeductions` is calculated on line 42, **the employee's loss of pay is deducted twice**, cutting net salary by twice the intended amount.
6. **Critical Approval Workflow Misrouting for Payroll:** When payroll is calculated, a workflow approval task is generated with `subjectEmployeeId = firstRunEmployee.employeeId` (the first alphabetical employee in the run). The entire organization's payroll run is routed for approval to the **personal reporting manager of employee #1**, rather than Finance or Executive leadership. If employee #1 has no manager, payroll calculation crashes with a `422` error; if employee #1 reports to the submitter, it crashes with a `403` self-approval error.
7. **Disbursement & Payout Records Missing:** Payroll concludes at `finalized`. There are no payment tables, payout records, banking integration files (NEFT/RTGS/NACH CSV), or payment status tracking (`paid`).
8. **Safety & Working-Tree State:** No source files, database records, configuration, or Git state were modified during this investigation. All existing working-tree modifications and untracked files remain preserved.

---

## 2. Repository & Working-Tree Baseline

### 2.1 Git Metadata
- **Current Branch:** `naresh-dev`
- **Current HEAD Commit:** `17ef148 fix(ci): resolve ESLint and Next.js build errors for Vercel deployment`
- **Recent Commit History:**
  - `17ef148` fix(ci): resolve ESLint and Next.js build errors for Vercel deployment
  - `f312c1e` feat: improve employee and attendance workflows
  - `ec86d1b` fix: improve role permissions and department management
  - `f79d75a` Polish landing page and authentication UI
  - `8d8666a` feat(ui): major green redesign and authentication improvements

### 2.2 Working-Tree Status
The repository contains existing unstaged modifications and untracked files from active development:
- **Modified Tracked Files (Preserved Unchanged):**
  - `.gitignore`
  - `src/components/layout/app-shell.tsx`
  - `src/db/client.ts`
  - `src/lib/errors.ts`
  - `src/modules/attendance/attendance-shift-workflow.test.ts`
  - `src/modules/attendance/calculator.ts`
  - `src/modules/attendance/service.ts`
  - `src/modules/rbac/permissions.test.ts`
  - `src/modules/rbac/permissions.ts`
- **Untracked Files (Preserved Unchanged):**
  - `src/app/api/app/attendance/reminder/`
  - `src/components/attendance/attendance-reminder-modal.test.ts`
  - `src/components/attendance/attendance-reminder-modal.tsx`
  - `src/components/layout/header-notifications.test.ts`
  - `src/components/layout/header-notifications.tsx`
  - `src/modules/attendance/attendance-authorization-and-roles.test.ts`
  - `src/modules/attendance/attendance-reminder.test.ts`
  - `src/modules/attendance/attendance-shift-timing.test.ts`
  - `src/modules/attendance/reminder.ts`
  - `drizzle/0019_membership_user_context.sql`
  - Documentation and scratch scripts: `SYMPHOWORK_V1_DEEP_ANALYSIS_AND_DELIVERY_PLAN.md`, `SYMPHOWORK_V1_E2E_TEST_SCENARIOS.md`, `SYMPHOWORK_V1_PROJECT_UNDERSTANDING_REPORT.md`, `SYMPHOWORK_V1_SOURCE_CODE_MAP.md`, `scripts/benchmark-phase1.ts`, `scripts/sync-tenant-permissions.ts`, `scratch/`.

### 2.3 Technology Stack & Architecture
- **Framework:** Next.js 15.5.4 (App Router, Server Components + Client Components) with React 19.1.1 and TypeScript 5.9.2.
- **Styling:** Tailwind CSS v4 with Radix UI headless components and Lucide icons.
- **Database & Driver:** Neon Serverless Postgres via `postgres` driver (v3.4.7) and Drizzle ORM (v0.45.3).
- **Authentication:** Custom session cookie `symphowork_session` containing a cryptographically secure token, hashed via SHA-256 and verified against the `sessions` table in `src/modules/identity/auth.ts`.
- **Tenant Isolation:**
  - Multi-tenant model via `organizations` and `memberships` tables.
  - Active tenant resolved in `src/modules/tenancy/context.ts` using `symphowork_tenant_org` cookie, session user, and active membership.
  - PostgreSQL Row Level Security (RLS) policies exist in Drizzle migrations (`current_setting('app.current_organization_id', true)`).
  - Explicit programmatic query scoping (`eq(table.organizationId, tenant.organization.id)`) enforced across module services.
- **Permission & RBAC Architecture:**
  - System roles and permission strings defined in `src/modules/rbac/permissions.ts`.
  - Tenancy authorization evaluated in `src/modules/tenancy/authorization.ts` through `can()`, `authorize()`, `canAny()`, and `authorizeAny()`.
  - Roles query DB table `role_permissions` join `permissions`, with static fallback to `ROLE_PERMISSIONS` in `permissions.ts`.
  - `PLATFORM_OWNER` bypasses tenant restrictions globally; `ORGANIZATION_OWNER` bypasses permissions within their organization.

---

## 3. Existing Module & Data-Flow Map

```
  ┌────────────────────────────────────────────────────────────────────────┐
  │                            Next.js Web UI                              │
  │  /app/attendance   /app/leave   /app/payroll   /app/payroll/payslips   │
  └───────┬──────────────────┬──────────────┬──────────────────┬───────────┘
          │                  │              │                  │
          ▼                  ▼              ▼                  ▼
  ┌──────────────┐   ┌──────────────┐ ┌──────────────┐  ┌──────────────┐
  │  Attendance  │   │    Leave     │ │   Payroll    │  │   Payslips   │
  │     API      │   │     API      │ │     API      │  │     API      │
  └───────┬──────┘   └───────┬──────┘ └──────┬───────┘  └──────┬───────┘
          │                  │               │                 │
          ▼                  ▼               ▼                 ▼
  ┌──────────────┐   ┌──────────────┐ ┌──────────────┐  ┌──────────────┐
  │  Attendance  │   │    Leave     │ │   Payroll    │  │   Employee   │
  │   Service    │   │   Service    │ │   Service    │  │   Payslips   │
  └───────┬──────┘   └───────┬──────┘ └──────┬───────┘  └──────┬───────┘
          │                  │               │                 │
          ▼                  ▼               ▼                 ▼
  ┌────────────────────────────────────────────────────────────────────┐
  │                           Database Tables                          │
  │  shifts               leave_types          payroll_periods         │
  │  attendance_records   leave_applications   payroll_runs            │
  │  attendance_punches   leave_balances       payroll_run_employees   │
  │  attendance_policies  leave_transactions   payroll_snapshots       │
  │  regularization_reqs  working_days/holidays payroll_line_items     │
  │  salary_structures    salary_components    payroll_payslips        │
  │  salary_assignments   (payroll_profiles)   (payroll_adjustments)   │
  └────────────────────────────────────────────────────────────────────┘
```

### Module Responsibilities:
- **`src/modules/attendance/`**: Shift boundary resolver, punch recording, break tracking, attendance calculation (work minutes, late minutes, early departure minutes), regularization requests, daily in-app reminder checks.
- **`src/modules/leave/`**: Leave application validation against working days and holidays, balance reservations, balance consumptions on approval, leave transaction ledger.
- **`src/modules/payroll/`**: Period creation, salary structure assignment, gross-to-net calculation engine (`calculator.ts`), statutory withholding calculations (PF, ESI, PT, TDS), workflow submission, run finalization, and snapshot freezing.
- **`src/modules/workflows/`**: Sequential approval engine with instances, step orders, approval tasks, and audit history.
- **`src/modules/departments/`**: Department hierarchies, manager eligibility, and on-the-fly department roster status calculation.

---

## 4. Actual Role & Permission Matrix

The application defines 10 system roles in `src/modules/rbac/permissions.ts`. Below is the actual enforced matrix for Attendance, Salary, Payroll, and Approvals:

| Role | Attendance Punch (Self) | Attendance Audit (Others) | Regularization Request (Self) | Regularization Approve | Salary Structure Config | Employee Salary Assign | Payroll Calculate / Run | Payroll Approve | Payroll Finalize | View Own Payslip | View All Payslips / Runs |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **PLATFORM_OWNER** | N/A (Console) | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| **ORGANIZATION_OWNER** | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| **HR_ADMIN** | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| **HR_EXECUTIVE** | Yes | Yes | Yes | **No** | **No** | **No** | **No** | **No** | **No** | Yes | **No** |
| **FINANCE_ADMIN** | Yes | **No** | Yes | **No** | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| **MANAGER** (Dept) | Yes | **No\*** | Yes | Yes | **No** | **No** | **No** | **Yes\*\*** | **No** | Yes | **No** |
| **TEAM_LEAD** | Yes | **No** | Yes | Yes | **No** | **No** | **No** | **Yes\*\*** | **No** | Yes | **No** |
| **EMPLOYEE** | Yes | **No** | Yes | **No** | **No** | **No** | **No** | **No** | **No** | Yes | **No** |
| **PROJECT_MANAGER** | Yes | **No** | Yes | **No** | **No** | **No** | **No** | **No** | **No** | Yes | **No** |
| **RECRUITER** | Yes | **No** | Yes | **No** | **No** | **No** | **No** | **No** | **No** | Yes | **No** |

*\*Note on Manager Attendance View:* Managers cannot audit employee attendance logs through `/api/app/attendance?employeeId=...` (forbidden by `isPrivileged` check in `src/app/api/app/attendance/route.ts:22-29`). Managers can only view calculated daily presence via the Department Roster (`/app/departments/[deptId]`).  
*\*\*Note on Manager/Team Lead Payroll Approval:* `MANAGER` and `TEAM_LEAD` have `payroll.approve` listed in `ROLE_PERMISSIONS` (`permissions.ts:39-40`), but workflow assignment in `payroll/service.ts` assigns the task to the manager of employee #1 in the run.

### Detailed Role Findings & Inconsistencies:
1. **HR Executive Lacks Regularization Approval:** `HR_EXECUTIVE` has `employee.create` and `employee.update`, but lacks `attendance.regularization.approve`. They cannot resolve punch discrepancies.
2. **Finance Admin Blocked from Attendance Records:** `FINANCE_ADMIN` possesses full payroll calculation and finalization authority, but cannot inspect employee attendance records in `/api/app/attendance?employeeId=...` because `isPrivileged` only allows `ORGANIZATION_OWNER`, `HR_ADMIN`, and `HR_EXECUTIVE`.
3. **Manager Dashboard Crash on Payroll:** `MANAGER` has `payroll.view`, but when visiting `/app/payroll`, the frontend `PayrollDashboard` component executes a `Promise.all` that calls `/api/app/payroll/salary-assignments`, requiring `payroll.configure`. Because `MANAGER` lacks this permission, the entire dashboard load crashes with an error banner.
4. **Employee UI Exposure:** The core desktop sidebar navigation (`src/components/layout/app-shell.tsx:77`) unconditionally displays the **"Payroll"** link to all users, including standard `EMPLOYEE` roles. Clicking it leads to `/app/payroll`, where all API requests fail with `403 Forbidden`.

---

## 5. Attendance End-to-End Implementation Findings

### 5.1 Clock-In, Clock-Out & Breaks
- **File Reference:** `src/modules/attendance/service.ts:25-312`, `src/app/api/app/attendance/punch/route.ts:13-68`
- **Supported Punch Types:** `clock_in`, `clock_out`, `break_start`, `break_end`.
- **Enforced Business Rules:**
  - Strict punch state machine: `break_start` is rejected if a break is already active; `break_end` is rejected if no break is active.
  - Clocking out while on an active break is blocked (`service.ts:232`: `"End active break before clocking out"`).
  - Subsequent punches after a shift is completed (`actualLastOut` set) are rejected (`service.ts:167-172`).
  - Punches are strictly self-service: passing a foreign `employeeId` in the body is rejected with `403 Forbidden` (`punch/route.ts:53`, `service.ts:57-59`), even if initiated by an HR Admin.
  - Organization and employee active status verified before punch recording.

### 5.2 Shifts, Overnight Shifts & Timezone Boundaries
- **File Reference:** `src/modules/attendance/calculator.ts:86-183`, `src/modules/attendance/service.ts:81-90`
- **Behavior:**
  - Shifts are configured in the `shifts` table with `startTime`, `endTime`, `breakMinutes`, `graceMinutes`, and `overnight` boolean flag.
  - Shift timing is evaluated against the organization's configured IANA timezone (e.g., `Asia/Kolkata`, `UTC`) using `createDateInTimezone()` and `resolveShiftWindowAndWorkDate()`.
  - **Overnight Shifts:** Correctly evaluates whether the current punch timestamp falls within yesterday's overnight window (started previous day, ending today) or today's upcoming window.
  - Clock-in outside the assigned shift window is blocked (`service.ts:127-150`).

### 5.3 Grace Period, Late Arrival & Early Departure
- **File Reference:** `src/modules/attendance/calculator.ts:189-239`, `src/modules/attendance/service.ts:262-284`
- **Calculation Rules:**
  - `lateMinutes`: If `actualFirstIn > scheduledStart + gracePeriodMinutes`, calculated as `minutesBetween(scheduledStart, actualFirstIn) - gracePeriodMinutes`.
  - `earlyDepartureMinutes`: If `actualLastOut < scheduledEnd - earlyDepartureThresholdMinutes`, calculated as `minutesBetween(actualLastOut, scheduledEnd) - earlyDepartureThresholdMinutes`.
  - Calculated status is persisted as: `"present"`, `"late"`, `"early_departure"`, `"late_and_early"`, or `"missing_punch"`.

### 5.4 Regularization Requests & Approvals
- **File Reference:** `src/modules/attendance/regularization.ts:10-21`, `src/app/api/app/attendance/regularization/route.ts:10-12`, `src/app/api/app/approvals/[taskId]/route.ts:31-33`
- **Behavior & Gaps:**
  - Self-service submission via `createRegularizationRequest()` creates an entry in `attendance_regularization_requests` and triggers a sequential workflow routed to the employee's reporting manager.
  - **Critical Gap 1 — Requires Existing Record:** The function queries `attendanceRecords` by `attendanceId` (`regularization.ts:14-15`). If an employee completely missed punching in for a day, **no `attendance_records` row exists**. The employee cannot select or regularize a missed day from the UI dropdown (`regularization-panel.tsx:83-96`).
  - **Critical Gap 2 — Metrics Not Recalculated:** When a manager approves a regularization request (`approvals/[taskId]/route.ts:33`), the code updates `actualFirstIn`, `actualLastOut`, and `status = 'regularized'`. It **does not recalculate `totalWorkMinutes`, `netWorkMinutes`, `lateMinutes`, or `earlyDepartureMinutes`**.
  - **Critical Gap 3 — No Retroactive Payroll Recalculation:** Approving a regularization after payroll has been calculated does not notify or invalidate the payroll run.

### 5.5 Attendance Reminders
- **File Reference:** `src/modules/attendance/reminder.ts:35-212`, `src/app/api/app/attendance/reminder/route.ts:7-22`, `src/components/attendance/attendance-reminder-modal.tsx:1-120`
- **Behavior:**
  - Evaluates user membership, assigned shift, organization timezone, public holidays (`holidays`), weekly offs (`working_days`), and approved leave (`leave_applications`).
  - If required and no clock-in exists, generates an in-app notification with idempotency key `attendance:daily_reminder:${employee.id}:${workDate}`.
  - Automatically resolves (marks read) when the employee punches in (`service.ts:287-299`).
  - **Limitation:** Triggered exclusively via browser fetch from the active client session modal. It does not run for employees who do not open the web application.

---

## 6. Automatic Absent-Processing Findings

### Critical Evaluation:
| Requirement | Status | Evidence & Verification |
| :--- | :---: | :--- |
| **Evaluates only active employees with schedule** | Partially (Roster UI only) | `departments/service.ts:766` checks joining date; `reminder.ts:72` checks active status. |
| **Excludes approved leave, holidays, weekly offs** | Partially (Roster UI only) | Handled in `departments/service.ts:784-788` and `reminder.ts:111-163`. |
| **Handles overnight shifts and org timezone** | Verified in calculator | `resolveShiftWindowAndWorkDate()` supports overnight shifts in `calculator.ts:136-183`. |
| **Avoids marking absent before shift is over** | Implemented in Roster UI | `departments/service.ts:789-795` uses `pending_arrival` for today; only marks absent if `isPastDate`. |
| **Avoids duplicate absent records** | **Not Applicable** | Absent records are **never created or inserted**. |
| **Distinguishes Absent vs Missing Punch** | In-Memory Only | `departments/service.ts:981-988` distinguishes missing punch from absent in memory. |
| **Reliable Scheduler / Cron Background Job** | **MISSING** | **Zero schedulers, crons, or background workers exist in the repository.** |
| **Audit trail of who/what generated absence** | **MISSING** | No absence generation logic exists to log audits. |
| **Supports authorized review / regularization** | **BROKEN** | Regularization requires an existing `attendance_records` row; missed days have none. |

### Technical Summary:
There is **no automated absent processing**. If an employee does not clock in:
1. No record is ever inserted into `attendance_records`.
2. The employee is marked as "Pending Arrival" during the day in the Department Roster, and "Absent" on past dates in that same view.
3. However, this status is **purely transient and never written to the database**.
4. The database table `attendance_records` remains completely empty for that employee on that date.

---

## 7. Employee Salary Management Findings

### 7.1 Data Storage & Modeling
- **File Reference:** `src/db/schema.ts:178-182`
- **Schema Entities:**
  - `salary_structures`: Base structure containing `name`, `currency`, `effectiveFrom`, `effectiveTo`, `frequency`, and `status` (`draft`, `active`, `archived`).
  - `salary_components`: Component definitions (`BASIC`, `HRA`, `PF`, etc.) with `type` (`earning`, `deduction`, `employer_contribution`), `calculationMethod` (`fixed`, `percentage`, `formula`), `taxable`, `statutory`, and `proratable`.
  - `salary_structure_components`: Junction table linking structures to components with `fixedAmount`, `percentage`, `formulaReference`, and `displayOrder`.
  - `employee_salary_assignments`: Maps employees to salary structures with `effectiveFrom`, `effectiveTo`, `revisionReason`, and `notes`.
  - `employee_payroll_profiles`: Stores statutory eligibility (`pfApplicable`, `esiApplicable`, `professionalTaxApplicable`, `tdsApplicable`), `taxRegime` (`old`, `new`), encrypted PAN, and encrypted bank metadata.

### 7.2 Major Salary Management Gaps
1. **`employee_payroll_profiles` Cannot Be Created:**
   - In `schema.ts:178`, the table is defined.
   - In `payroll/service.ts:74`, the calculation engine selects from `employee_payroll_profiles`.
   - **Crucial Finding:** There is **zero insert or update code** for `employee_payroll_profiles` in any service, API route, or frontend component in the entire project. As a result, this table is permanently empty unless manually populated via raw database SQL.
2. **Missing UI for Salary Structure Component Linking:**
   - The backend API (`src/app/api/app/payroll/config/route.ts:10`) supports the `action: 'link_component'` payload.
   - However, `PayrollDashboard` (`src/components/payroll/payroll-dashboard.tsx:26-28`) only provides forms to add a structure name and add a component code. It **completely lacks any form or modal to link components to structures or set component amounts**. Any structure created via the UI has zero earnings and zero deductions.
3. **No Salary Structure Approval Workflow:**
   - Newly created salary structures are set to `status: 'draft'` (`config/route.ts:10`).
   - There is no endpoint or workflow to review, approve, or activate structures (`status: 'active'`).
   - When assigning a structure or running payroll, the code queries `salary_structures` without filtering by `status = 'active'`, allowing draft structures to be assigned and calculated.
4. **No Salary Revision Approval Process:**
   - Salary assignments (`assignSalaryStructure` in `payroll/service.ts:44-58`) insert directly into `employee_salary_assignments` without managerial approval, HR four-eyes verification, or pending review states.

---

## 8. Payroll Calculation and Payment Findings

### 8.1 Execution Trace of `calculatePayrollRun`
- **File Reference:** `src/modules/payroll/service.ts:69-139`
- **Step-by-Step Flow:**
  1. Authorizes caller with `payroll.calculate` (`service.ts:70`).
  2. Retrieves `payrollPeriods` row and validates status is not `finalized` or `locked` (`service.ts:71-73`).
  3. Queries `employee_payroll_profiles` for `status = 'eligible'` (`service.ts:74`). **[Fatal Blocker: Always returns 0 rows]**.
  4. Queries `employees` matching eligible profile IDs (`service.ts:75`). If empty, aborts with `422 VALIDATION_ERROR`.
  5. Computes calendar days and working days (excluding non-working days in `working_days` and active dates in `holidays`).
  6. Checks for existing active runs (`processing`, `under_review`, `approved`, `finalized`, `locked`) to prevent duplicate runs (`service.ts:83-84`).
  7. Inserts a new `payroll_runs` row with `status: 'processing'`.
  8. For each employee:
     - Fetches active `employee_salary_assignments` and associated `salary_structures`.
     - Fetches linked `salary_structure_components` and `salary_components`.
     - Fetches `attendance_records` within period boundaries.
     - Fetches approved `leave_applications` within period boundaries.
     - Queries `payroll_adjustments` where `status = 'approved'` **[Gap: No adjustment creation UI/API exists]**.
     - Evaluates statutory configurations (`payroll_statutory_configurations` and `payroll_tax_configurations`).
     - Calls `calculatePayroll()` pure calculation engine (`src/modules/payroll/calculator.ts:13-43`).
     - Inserts `payroll_run_employees`, `payroll_calculation_snapshots`, and `payroll_line_items`.
  9. Submits payroll run to approval workflow (`service.ts:115-118`). **[Misrouted to manager of employee #1]**.
  10. Updates run status to `under_review` and period status to `under_review`.

### 8.2 Critical Calculation Deficiencies & Bugs

#### Bug 1: Unpunched Absences Result in Zero Deductions
- **Code Reference:** `src/modules/payroll/service.ts:98-103`
  ```typescript
  const attendance = await db.select().from(attendanceRecords).where(...);
  const absentDays = attendance.filter((row) => ["absent", "missing_punch"].includes(row.status)).length;
  ...
  const lopDays = Math.min(workingDates.length, absentDays + unpaidLeaveDays);
  ```
- **Finding:** Because unpunched absences are never written to `attendance_records`, an employee who is absent for 20 working days has `attendance.length = 0`. Thus `absentDays = 0`, `lopDays = 0`, and the employee is paid their full salary. Only employees with an unclosed punch (`missing_punch`) are penalized.

#### Bug 2: Financial Double-Deduction of Loss of Pay (LOP)
- **Code Reference:** `src/modules/payroll/calculator.ts:26-42`
  ```typescript
  // Line 27-28: LOP is added as a deduction line
  const lopAmount = input.lopDays > 0 ? money(earnedBeforeLop * Math.min(1, input.lopDays / Math.max(eligibleBasisDays, 1))) : 0;
  if (lopAmount > 0) lines.push({ code: "LOP", name: "Loss of Pay", type: "deduction", amount: lopAmount, taxable: false, statutory: false });

  // Line 30: lopAmount is subtracted from grossEarnings
  const grossEarnings = money(earnedBeforeLop - lopAmount + ...);

  // Line 39: totalDeductions sums all deduction lines, including LOP!
  const totalDeductions = money(lines.filter((line) => line.type === "deduction").reduce((sum, line) => sum + line.amount, 0));

  // Line 42: netSalary subtracts totalDeductions from grossEarnings
  return {
    ...
    grossEarnings,
    totalDeductions,
    netSalary: money(grossEarnings - totalDeductions),
  };
  ```
- **Financial Impact Example:**
  - Base Earning: ₹60,000 / month (30 days).
  - LOP Days: 3 days. `lopAmount` = ₹6,000.
  - `grossEarnings` = ₹60,000 - ₹6,000 = ₹54,000.
  - `totalDeductions` = ₹6,000 (LOP line item).
  - `netSalary` = ₹54,000 - ₹6,000 = **₹48,000** (Employee lost ₹12,000 instead of ₹6,000).

#### Bug 3: Multi-Month Cross-Boundary Leave Overcounting
- **Code Reference:** `src/modules/payroll/service.ts:100-102`
  ```typescript
  const approvedLeaves = await db.select(...).where(
    and(
      eq(leaveApplications.status, "approved"),
      lte(leaveApplications.startDate, period.periodEnd),
      gte(leaveApplications.endDate, period.periodStart)
    )
  );
  const paidLeaveDays = approvedLeaves.filter(...).reduce((sum, row) => sum + row.application.requestedDays, 0);
  const unpaidLeaveDays = approvedLeaves.filter(...).reduce((sum, row) => sum + row.application.requestedDays, 0);
  ```
- **Finding:** If an employee takes 10 days of unpaid leave spanning April 25 to May 5 (5 days in April, 5 days in May), `requestedDays` (10) is added in full to April's calculation, and then added in full again to May's calculation. There is no period date-clipping or intersection logic.

### 8.3 Payroll Approval & Finalization
- **Approval Processing:** `src/app/api/app/approvals/[taskId]/route.ts:34-36` updates `payrollRuns` to `status: 'approved'` and sets `approvedAt` when the workflow task is approved.
- **Finalization:** `finalizePayrollRun()` in `src/modules/payroll/service.ts:141-192`:
  - Requires `payroll.finalize` permission.
  - Verifies run is `status = 'approved'`.
  - Freezes snapshots by populating `frozenAt = new Date()`.
  - Generates immutable payslip records in `payroll_payslips` with sequential format `PSL-{year}-{month}-{employeeId}`.
  - Updates run and period status to `finalized`.
- **Payment & Payout (Disbursement):**
  - **MISSING:** The payroll workflow ends at `finalized`. There is no ability to mark runs as "paid", record disbursement dates, log bank transaction IDs, generate bank transfer files, or track payment failures.

---

## 9. Proposed Workflow Coverage Matrix

| Proposed Step | Current Implementation State | Code Evidence | Responsible Role(s) | Identified Risks / Gaps |
| :--- | :---: | :--- | :--- | :--- |
| **1. HR maintains employee records & salary** | Partially Implemented | `employees/service.ts`, `payroll/service.ts:44-58`, `payroll/config/route.ts` | HR Admin, Org Owner | Cannot link components to structures via UI; cannot create employee payroll profiles. |
| **2. Managers approve salary changes / inputs** | Missing | N/A (Direct DB insertion in `assignSalaryStructure`) | None (Uncontrolled) | Salary assignments take immediate effect without review or multi-level approval. |
| **3. Employees record attendance, leave, regularization** | Implemented & Verified | `attendance/service.ts:25`, `leave/service.ts:15`, `attendance/regularization.ts:10` | Employee | Punches verified against shifts. Cannot regularize days where no clock-in occurred. |
| **4. System calculates attendance & auto absences** | Partially Implemented | `attendance/calculator.ts:189`, `departments/service.ts:783` | Automated / None | Calculation engine works, but automatic absent processing background job is absent. |
| **5. HR reviews exceptions & missing punches** | Partially Implemented | `app/attendance/page.tsx`, `components/attendance/attendance-actions.tsx:225` | HR Admin, Org Owner | HR can audit personal logs, but cannot regularize or punch on behalf of employees. |
| **6. Payroll integrates attendance, leave, payable days** | Risky & Incomplete | `payroll/service.ts:69-139`, `payroll/calculator.ts:13-43` | HR Admin, Finance Admin | Missed absences get 0 deductions; LOP is deducted twice; cross-month leave overcounted. |
| **7. Finance reviews payroll & manages payments** | Incomplete & Risky | `payroll/service.ts:141`, `app/payroll/page.tsx`, `approvals/[taskId]/route.ts:34` | Finance Admin | Approval task is misrouted to employee #1's manager. Payment/payout stage is missing. |
| **8. Owner oversees settings & policies** | Implemented | `tenancy/authorization.ts:118`, `app/settings/page.tsx` | Organization Owner | Owner has full administrative control and workflow configuration access. |
| **9. Employees view permitted records & payslips** | Implemented (Viewing only) | `payroll/service.ts:194-198`, `app/payroll/payslips/page.tsx` | Employee | Employees see their finalized payslips. Payslip download / PDF generator is missing. |
| **10. Relevant actions logged in audit trail** | Implemented | `lib/audit.ts:recordAudit` across all mutating services | System / All Actors | Audit logs recorded for punches, salary assignments, periods, runs, and finalizations. |

---

## 10. Security, Tenant-Isolation & Data-Integrity Risks

### 10.1 Security & Access Vulnerabilities
1. **Unprotected Payroll UI Route:** `src/app/app/payroll/page.tsx:9` only checks `getSessionUser()`. Any authenticated user (including regular `EMPLOYEE` roles) can access the payroll page. Although API routes block unauthorized data requests, the UI exposes the admin dashboard shell.
2. **Excessive Permissions on Manager & Team Lead:** `MANAGER` and `TEAM_LEAD` roles possess `payroll.approve` in `ROLE_PERMISSIONS` (`src/modules/rbac/permissions.ts:39-40`), violating segregation of duties between operational supervisors and financial controllers.
3. **Audit Log Data Leaks:** Audit records in `auditLogs` store metadata as unencrypted JSON text (`schema.ts:104`). Sensitive compensation changes could be inspected by anyone with read access to audit logs.

### 10.2 Tenant Isolation Integrity
- **Verified Strong:** All primary database operations in `attendance/service.ts`, `payroll/service.ts`, `leave/service.ts`, and `workflows/service.ts` enforce `eq(table.organizationId, tenant.organization.id)`.
- **Context Boundary Protection:** `src/modules/tenancy/authorization.ts:85-89` explicitly invalidates cached membership if `membership.organizationId !== input.organizationId`, preventing cross-tenant privilege escalation.
- **Single Minor Inefficiency:** In `src/app/api/app/payroll/runs/[runId]/route.ts:9`, line items are loaded with `eq(payrollLineItems.organizationId, tenant.organization.id)` without filtering by `snapshotId`, loading all organization line items into memory before filtering in JavaScript.

### 10.3 Financial & Data Integrity Risks
1. **Double LOP Deduction:** Net pay formula in `payroll/calculator.ts` deducts loss of pay twice (P0 Financial Integrity Risk).
2. **Phantom Full Pay on Absenteeism:** Zero deductions for employees who fail to report to work (P0 Financial Integrity Risk).
3. **Arbitrary Workflow Approver Assignment:** Company-wide payroll approval assigned to an arbitrary employee's manager (P0 Governance Risk).
4. **Permanent Ineligibility Lockout:** Inability to run payroll due to uncreatable `employee_payroll_profiles` (P0 Operational Blocker).

---

## 11. Test Coverage & Verification Results

### 11.1 Test Execution Summary
All safe, non-mutating unit and integration tests were executed in Vitest. 

- **Test Run 1 (Attendance, RBAC, Payroll Calculator):**
  - Command: `pnpm vitest run src/modules/payroll/ src/modules/attendance/ src/modules/rbac/`
  - Result: **8 test files passed, 70 tests passed, 0 failed**.
  - Verified Passing:
    - `src/modules/payroll/calculator.test.ts` (9 tests)
    - `src/modules/rbac/permissions.test.ts` (18 tests)
    - `src/modules/attendance/attendance-shift-timing.test.ts` (11 tests)
    - `src/modules/attendance/attendance-shift-workflow.test.ts` (14 tests)
    - `src/modules/attendance/attendance-reminder.test.ts` (7 tests)
    - `src/modules/attendance/attendance-authorization-and-roles.test.ts` (6 tests)
    - `src/modules/attendance/sunday-working-day.test.ts` (3 tests)
    - `src/modules/attendance/calculator.test.ts` (2 tests)
- **Test Run 2 (Attendance APIs, Tenancy, Workflows, Leave Calculator):**
  - Command: `pnpm vitest run src/app/api/app/attendance/ src/modules/workflows/ src/modules/tenancy/ src/modules/leave/`
  - Result: **7 test files passed, 64 tests passed, 0 failed**.
  - Verified Passing:
    - `src/modules/leave/calculator.test.ts` (3 tests)
    - `src/app/api/app/attendance/reminder/route.test.ts` (2 tests)
    - `src/modules/tenancy/context.test.ts` (16 tests)
    - `src/modules/tenancy/authorization.test.ts` (27 tests)
    - `src/app/api/app/attendance/punch/punch-api.test.ts` (8 tests)
    - `src/app/api/app/attendance/attendance-api.test.ts` (5 tests)
    - `src/modules/workflows/service.test.ts` (3 tests)

### 11.2 Verification Breakdown
- **Verified Passing Checks:**
  - Shift start/end timing and overnight window math across timezones.
  - Self-service punch restrictions and rejection of third-party punching.
  - Break sequencing (cannot end unstarted break; cannot start break during active break; cannot clock out while on break).
  - RBAC role assignment constraints and permission set inheritance.
  - Tenant context resolution and isolation boundaries.
  - Leave day calculation against working days and holidays.
- **Verified Failing Behavior (Code Evidence):**
  - `calculatePayroll` with LOP deducts LOP from gross and also includes it in deductions, causing double deduction. (Existing test in `calculator.test.ts:6` only asserted `grossEarnings` and did not assert `netSalary`).
- **Features with No Existing Tests (Unverified / Missing Test Coverage):**
  - `src/modules/payroll/service.ts` has **zero unit or integration tests**.
  - Payroll API endpoints (`/api/app/payroll/*`) have **zero API tests**.
  - Attendance regularization approval flow has **no integration test**.
  - Finalized payroll immutability has **no automated test**.
  - Payslip listing endpoint has **no automated test**.

---

## 12. Feature Classification Table

| Feature / Capability | Classification | Technical Evidence & Details |
| :--- | :--- | :--- |
| **Time Clock (In, Out, Break Start, Break End)** | Implemented and Verified | `attendance/service.ts:25`, verified by 14 passing workflow tests. |
| **Shift Timing & Overnight Shift Support** | Implemented and Verified | `attendance/calculator.ts:86`, verified by 11 passing timing tests. |
| **Self-Service Punch Security Enforcement** | Implemented and Verified | Rejects third-party punches in `punch/route.ts:53` and `service.ts:58`. |
| **Attendance In-App Daily Reminder** | Implemented and Verified | Evaluates exemptions in `reminder.ts:35`, verified by 7 passing tests. |
| **Leave Application Working-Day Validation** | Implemented and Verified | Deducts holidays/weekends in `leave/service.ts:15`, verified by 3 tests. |
| **Attendance Regularization Submission** | Implemented but Partially Verified | Works for existing punches; cannot regularize missed unpunched days. |
| **Regularization Metrics Recalculation** | Missing | `approvals/[taskId]/route.ts:33` sets status but skips recalculation. |
| **Automatic Absent Processing Scheduler** | Missing | No background worker, cron, or schedule exists in the repository. |
| **Employee Payroll Profile Management** | Missing | `employee_payroll_profiles` table has zero insert/update logic. |
| **Salary Structure Component Linking UI** | Missing | Backend action exists, but UI in `PayrollDashboard` has no linking form. |
| **Salary Structure & Assignment Approvals** | Missing | Salary assignments take immediate effect without review workflow. |
| **Gross-to-Net Payroll Calculation Engine** | Implemented but Incorrect | Engine calculates lines, but LOP is deducted twice from net salary. |
| **Attendance to Payroll Absent Deductions** | Risky / Incorrect | Completely absent employees have 0 records and receive full pay. |
| **Multi-Month Cross-Boundary Leave Proration** | Risky / Incorrect | Spanning leaves count full requested days in both consecutive months. |
| **Payroll Approval Workflow Routing** | Risky / Incorrect | Hardcoded to reporting manager of employee #1 in the run. |
| **Payroll Period Finalization & Freezing** | Implemented but Partially Verified | Snapshots frozen, payslip numbers created, runs locked to edits. |
| **Disbursement & Payment Tracking** | Missing | No payout records, payment tables, bank export files, or "paid" status. |
| **Itemized Payslip Breakdown & PDF Export** | Missing | Payslips page shows totals only; no itemized breakdown or PDF download. |
| **Payroll UI Page Route Guard** | Insecure / Partially Implemented | `/app/payroll` accessible to standard employees; fails at API layer. |

---

## 13. Prioritized Technical Gaps

### Priority 0 (P0) — Security, Financial Integrity & Critical Blockers
1. **Fix Double LOP Deduction in Payroll Engine (`src/modules/payroll/calculator.ts`):** Ensure Loss of Pay is either deducted from base earnings or treated as a deduction line, never both.
2. **Create Employee Payroll Profiles Service & UI (`src/modules/payroll/`):** Implement profile creation during onboarding or payroll configuration so employees can be eligible for payroll runs.
3. **Correct Payroll Approval Workflow Routing (`src/modules/payroll/service.ts`):** Route payroll run approvals to authorized Finance Administrators or Organization Owners, not employee #1's manager.
4. **Implement Automatic Absent Processing (`src/modules/attendance/`):** Build an automatic job or explicit manual daily processing action that identifies employees with no punches after shift end and writes persisted `absent` records to `attendance_records`.
5. **Fix Attendance-Payroll Absent Integration (`src/modules/payroll/service.ts`):** Ensure absent days accurately translate into loss-of-pay deductions during payroll calculation.

### Priority 1 (P1) — Essential Workflow Gaps
1. **Support Regularization for Missed Shifts:** Allow regularization requests for dates where no clock-in occurred, creating or updating the record upon approval.
2. **Recalculate Attendance Metrics on Regularization Approval:** Recompute total work minutes, late minutes, and early departure minutes when punches are regularized.
3. **Salary Structure Component Management UI:** Add interface in `PayrollDashboard` to link components to structures with amounts, percentages, and formulas.
4. **Multi-Month Leave Proration in Payroll:** Clip leave dates to period boundaries so cross-month leaves do not double-deduct.
5. **Secure Payroll Page Routing:** Protect `/app/payroll` at the page level so employees without `payroll.view` are redirected to `/app/payroll/payslips`.

### Priority 2 (P2) — Reliability, Reporting & Usability Gaps
1. **Itemized Payslip Breakdown & PDF Download:** Provide full earnings/deductions breakdown and printable/downloadable payslip document.
2. **Payment & Disbursement Status:** Add payout tracking (`paid` status, payment date, reference number) to finalize the financial lifecycle.
3. **HR Attendance Management on Behalf of Employees:** Allow HR Admins to record corrections or regularizations directly.
4. **Salary Revision History & Approvals:** Formalize salary adjustment approval workflows and revision audit trails.
5. **Comprehensive Payroll Automated Tests:** Add test suites for `payroll/service.ts` and all payroll API endpoints.

### Priority 3 (P3) — Enhancements
1. **Banking Export Integration:** Generate standard bank payout files (NACH / NEFT / CSV format).
2. **Formula Component Evaluator:** Implement dynamic expression evaluator for formula-based salary components.

---

## 14. Suggested Implementation Phases (Non-Breaking)

### Phase 1: Financial & Calculation Correctness (P0)
- Correct LOP calculation in `src/modules/payroll/calculator.ts` and add unit test verifying `netSalary`.
- Implement `employee_payroll_profiles` creation service and API route to unblock payroll eligibility.
- Update `payroll/service.ts` workflow creation to route approval to Finance Admin or Org Owner.
- Add date intersection logic to prevent multi-month leave overcounting.

### Phase 2: Attendance Completion & Absence Persistence (P0/P1)
- Implement an authorized absent-processing service that checks past shifts against working days, holidays, and approved leaves, writing persisted `absent` records.
- Provide a trigger mechanism: cron endpoint or explicit manual "Process Daily Attendance" button in HR Attendance view.
- Update `regularization.ts` to support regularizing completely missed days.
- Ensure regularization approval recalculates hours and attendance metrics.

### Phase 3: Salary Management & Configuration UI (P1)
- Build the component linking modal in `PayrollDashboard` (`action: 'link_component'`).
- Add structure status transition (`draft` -> `active`).
- Add page-level route guard on `/app/payroll` to redirect non-finance employees to `/app/payroll/payslips`.

### Phase 4: Disbursement, Payslips & Test Coverage (P2)
- Implement itemized payslip breakdown component with PDF export.
- Add payment recording step (marking run as `paid` with transaction details).
- Implement end-to-end integration test suite for `src/modules/payroll/service.ts` and payroll API routes.

---

## 15. Open Business Decisions for Product Owner Approval

1. **Absence Salary Deduction Policy:**
   - Does an absence automatically deduct `1 / Calendar Days` or `1 / Working Days`?
   - Should a missing punch (`missing_punch`) automatically result in a full day's loss of pay, half-day pay, or hold until regularized?
2. **Absent Processing Execution Model:**
   - Should absent processing run via a scheduled server cron (e.g., nightly at 23:59 in organization timezone), or via a manual "Process Day's Attendance" button in the HR dashboard?
3. **Payroll Approval Hierarchy:**
   - Who is authorized to approve payroll: Finance Admin only, Organization Owner only, or either?
   - Should department managers approve attendance/overtime hours *before* payroll calculation is initiated?
4. **Employee Self-Service Regularization Time Limits:**
   - How many days after a missed punch can an employee submit a regularization request (e.g., within 7 days or before payroll lock)?
5. **Disbursement Method:**
   - Is recording a manual payment reference sufficient, or is export of specific bank format files (e.g., HDFC/ICICI CMS, NACH format) required?

---

## 16. Verification & State Integrity Confirmation

- **Files Modified:** 0 source files, 0 config files, 0 schema files.
- **Database Records:** No database records written, updated, or deleted.
- **Git State:** Exactly preserved as found on branch `naresh-dev` at commit `17ef148`.
- **Report Location:** `c:\Users\nares\Symphowork_V1_NM\SYMPHOWORK_V1_ATTENDANCE_SALARY_PAYROLL_INVESTIGATION.md`
