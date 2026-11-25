# Final delivery report

**DELIVERY BLOCKED.** HR-admin self-service APIs recovered on the development server. Full UI record reconciliation, write workflows and live two-tenant isolation remain open.

## Reference parity

NM and the reference have the same paths for 52 page components, three layouts, 34 page loaders and 132 endpoint wrappers. The page components, layouts, 173 shared component files, endpoint wrappers, schema and role definitions match byte for byte. Twelve page loaders and eight of 147 server API files match byte for byte. Application behavior still needs verification where implementations diverge.

## Development SSR and authorization

The baseline SSR request stalled while Vite was transforming SvelteKit runtime modules. It timed out before a public login response, with no demonstrated database dependency in that request. The NM scratch tree contains approximately 19,000 files. The Vite watcher now excludes scratch and generated output directories. The subsequent server rendered the public pages and authenticated QA workflows on strict port 5173. This run supports watcher load as a contributing factor. The underlying Vite stall was not independently proven by a reversal trial. One authenticated API attempt still exceeded 65 seconds. A focused browser run completed.

The restricted QA connection authenticated directly as sympowork_app. The HR-admin user had an active membership and a linked employee. Browser form login, protected refresh and logout returned 200. Recruitment jobs, projects and tasks returned 403 with the authorization denial. Their required keys are absent from both this role's database assignments and the built-in policy in both workspaces. Settings loaded with the existing built-in permission. No grants were added.

| Module | PostgreSQL | API | Browser | Result |
|---|---:|---:|---|---|
| Employees | 18 | 18 | 18 in prior QA | Reference evidence retained. Fresh DB and API counts agree. |
| Departments | 4 in prior QA | 4 in prior QA | 4 in prior QA | Prior three-way result retained. |
| Employment types | 5 in prior QA | 5 in prior QA | Count unverified | API evidence only. |
| Teams and shifts | 2 each in prior QA | 2 each in prior QA | Count unverified | API evidence only. |
| Attendance | 1 linked employee record | 1 record and 1 punch | Page 200. Comparable rendered count unverified. | DB and API match for attendance records. |
| Leave | 0 applications | 0 applications and 0 balances | Page 200. Comparable rendered count unverified. | Applications agree. No independent balance count. |
| Expenses | 0 claims | 0 claims | Page 200. Comparable rendered count unverified. | DB and API match. |
| Payslips | 0 slips for linked employee | 0 finalized slips | Payroll page 200. Comparable rendered count unverified. | DB and API match for this empty fixture. |
| Recruitment jobs, projects and tasks | Blocked by permissions | 403 | Module actions unverified | Expected denial for this fixture. |
| Dashboard and settings | Counts unverified | Counts unverified | Both pages 200. Protected refresh 200. | Page access verified. |

The focused browser run recorded zero page errors and zero non-aborted request failures. Masked screenshots and the sanitized report are under test-results/qa-data with the urgent prefix. No QA business fixture was intentionally created or changed. A failed Playwright request included session material in its automatic diagnostic. Later probes caught request failures and recorded sanitized summaries. The failed probe attempted logout during cleanup. Revocation of that earlier session was not independently confirmed.

## Live isolation and owner actions

The reviewed signed-context initializer is absent from the approved QA database. The DBA needs to deploy the reviewed functions and policies only to the isolated QA environment. The QA operator needs to supply two independent tenant fixtures and the active and invalid sessions documented in the live tenant fixture setup. The 11 live cases remain blocked. The prior disposable PostgreSQL run passed four tests and remains separate from live QA evidence.

Delivery still requires a browser count and detail-state comparison for the scoped modules. An authorized non-empty fixture is required for positive leave, expense and payslip rendering and safe workflow checks. API timing remains variable, with focused successful requests ranging from approximately 5.9 to 11.6 seconds. No comparable latency improvement was established.

## Worktree and shutdown

The worktree is on naresh-dev at f55040d7aad4a95065ffa2fdc9d4c87664104729 with existing changes preserved and an empty index. The reference workspace was read only. No production database access, DDL, migration, stage, commit or push occurred. The NM development server was stopped. Port 5173 had zero listeners.

## Fresh regression

| Command | Result |
|---|---|
| npm ls --depth=0 | PASS |
| npm run check | PASS, zero errors and zero warnings |
| npm test | 1,006 passed, zero failed, 11 skipped |
| npm run build | PASS |
| npm run test:e2e | 20 passed |
| git diff --check | PASS, with line-ending notices |

## Live tenant readiness recheck

| Task | Status | Evidence |
|---|---|---|
| Restricted connection and read-only catalog inspection | PASS | The endpoint matched the recorded QA baseline. PostgreSQL returned neondb with current_user and session_user both sympowork_app. SUPERUSER and BYPASSRLS were false. |
| Signed-context deployment | BLOCKED | 129 of 129 organization-scoped tables have RLS enabled. The public catalog has 129 policies referencing legacy GUCs and zero referencing app_private. The initializer and both organization and user getters are absent. Local SQL drafts do not establish deployment. |
| Approved two-tenant fixture configuration | BLOCKED | All 14 suite variables were absent from the process and NM .env.local. The authorized HR-admin fixture can establish one tenant only. Availability of a second approved tenant and invalid-session fixtures could not be established. |
| Existing 11 live tests | BLOCKED, not run | Both deployment and fixture prerequisites failed. The suite includes rollback-contained writes and requires a separately approved execution on isolated QA. |

### DBA and QA operator checklist

1. The DBA confirms the exact isolated endpoint expected by the acceptance suite and reviews and deploys the signed-context functions, restricted grants and policy cutover there. Verify the initializer and user/organization getters are present and legacy GUCs cannot authorize tenant access.
2. The QA operator supplies the direct restricted URL as `RLS_QA_DATABASE_URL` and sets `RUN_RLS_QA_TESTS=1` only after approval. The suite checks the exact endpoint host, database neondb and both runtime roles.
3. The QA operator supplies distinct `RLS_QA_ORGANIZATION_A_ID` and `RLS_QA_ORGANIZATION_B_ID`, employee fixtures `RLS_QA_EMPLOYEE_A_ID` and `RLS_QA_EMPLOYEE_B_ID`, and department fixtures `RLS_QA_DEPARTMENT_A_ID` and `RLS_QA_DEPARTMENT_B_ID`.
4. Supply active sessions as `RLS_QA_SESSION_TOKEN_A` and `RLS_QA_SESSION_TOKEN_B`. Supply `RLS_QA_EXPIRED_SESSION_TOKEN`, `RLS_QA_REVOKED_SESSION_TOKEN`, `RLS_QA_INACTIVE_USER_SESSION_TOKEN` and `RLS_QA_INACTIVE_MEMBERSHIP_SESSION_TOKEN` locally without exporting values to logs or reports.
5. Approve the 11-case run, including transaction-rolled-back negative write attempts. Cases cover RLS enablement, bilateral employee visibility, legacy setting rejection, missing context, foreign insert and reassignment denial, foreign update and delete denial, pooled reuse, four invalid-session states, rollback reuse, and bilateral department visibility. The suite uses a one-connection client for reuse. Concurrent physical-backend isolation needs a separate approved overlap test.

Run the suite from NM after both owners confirm readiness.

```powershell
npm test -- --maxWorkers=3 src/lib/server/rls-qa.integration.test.ts
```

### Fresh HR-admin module verification

The browser signed in at 127.0.0.1:5173 and both login and logout returned 200. The restricted SQL probe verified an active HR_ADMIN membership and linked employee. It counted only that employee's rows within the authorized tenant.

| Module | PostgreSQL | API and elapsed time | Browser | Result |
|---|---:|---|---|---|
| Attendance | 1 record | 200, 1 record and 1 punch, 8.12 s | Page 200. Browser requested the organization attendance API, a different view from self attendance. | PASS for DB/API record count. BLOCKED for equivalent UI count. |
| Leave | 0 applications | 200, 0 applications and 0 balances, 7.28 s | Page and browser leave request 200, zero visible table rows. Explicit empty state unconfirmed. | PASS for application counts. BLOCKED for independent balance count and explicit empty state. |
| Expenses | 0 claims | 200, 0 claims, 7.47 s | Page and browser expenses request 200, zero visible rows and an explicit empty state. | PASS for tested empty state. |
| Payslips | 0 slips | 200, 0 finalized slips, 6.11 s | HR-admin payroll opened the administration view. Browser did not request the self-service payslip endpoint. | PASS for DB/API count. BLOCKED for self-service browser equivalence. |

The browser recorded zero uncaught page errors and zero non-aborted request failures. Organization attendance was requested twice. Chat unread count, notification and attendance reminder requests recurred across page navigations. The timings are end-to-end and do not isolate SQL execution from session resolution, rendering or network latency. No optimization claim follows from these measurements. The sanitized evidence is test-results/qa-data/readiness-modules.json, with masked readiness screenshots where captured. No business record was deliberately changed.

Overall classification remains DELIVERY BLOCKED.
