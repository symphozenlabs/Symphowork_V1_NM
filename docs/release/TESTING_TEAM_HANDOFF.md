# SymphoWork V1 — Testing Team Handoff

**Date:** 2026-11-01
**Workspace:** `C:\Users\nares\Symphowork_Svelte_V1`
**Branch / HEAD:** `svelte-migration` / `2e4eecd3b9ac10379a320fa12a9691e92bd27b2f`
**Release status:** QA handoff only; production **NO-GO**.

## Start and stop

From the workspace:

```powershell
npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

Open [http://127.0.0.1:5173/login](http://127.0.0.1:5173/login). Stop with Ctrl+C. This is one SvelteKit process; no port 3000 server is required. Fresh smoke evidence: Vite ready on 5173; `/login` returned HTTP 200 and contained the login heading. The first response was logged as slow (~9.1 s); this is a single observation, not a benchmark.

## Accounts and secrets

Use only Product Owner, Organization Owner, HR Admin, and other role accounts already authorized by the QA owner and supplied through the approved local secret manager. Do not place credentials in this file, source control, screenshots, browser exports, bug reports, or chat. Do not copy the original project's populated environment file.

The Svelte workspace's ignored `.env.local` currently has `AUTH_SECRET` and `DATABASE_URL` names present, but the configured database identity is the owner role and is rejected by the Svelte runtime guard. `RLS_QA_DATABASE_URL`, `RUN_RLS_QA_TESTS`, and second-organization fixture variables were absent at inspection. Do not use the owner URL. The testing team must obtain an approved `sympowork_app` QA connection via secure local secret storage before authenticated integration testing.

## Evidence from this tree

- `npm run check`: PASS, zero errors/warnings.
- `npm test -- --run --maxWorkers=1`: 102 test files passed, 1 skipped; 908 tests passed, 9 skipped. The skipped suite is `src/lib/server/rls-qa.integration.test.ts`.
- `npm run build`: PASS, adapter-node.
- Browser foundation: 20/20 PASS, anonymous/synthetic.
- Workflow UI harness: 50/50 PASS, mocked/synthetic.
- Private-file/signature focused coverage: mocked unit tests, including forged/expired URL rejection and a newly added test that ensures session context is resolved for each retrieval; no live session revocation was tested.
- `git diff --check`: PASS, exit 0; only LF/CRLF advisory warnings.

Route/API files exist structurally (52/52 pages, 131/131 original API adapters; one additional internal local-file helper), but authenticated functional acceptance is **0/52 routes and 0/131 APIs**. Synthetic cases are not live workflow passes.

## Role test instructions

Use only the accounts the QA owner has explicitly approved. Record the account's role label, not its email/password.

- **PLATFORM_OWNER / PRODUCT_OWNER:** login; expected platform-console redirect; check dashboard, organization list/detail, platform configuration and billing visibility. Attempt an organization-only route and record whether the documented policy allows or denies it.
- **PLATFORM_ADMIN / PLATFORM_SUPPORT / PLATFORM_BILLING:** verify only the relevant console sections and API operations are visible/allowed. Attempt one explicitly disallowed operation and expect a controlled 403.
- **ORGANIZATION_OWNER:** login; verify organization dashboard, employee/department management, approvals, and authorized documents. Check a different-organization identifier is denied.
- **HR_ADMIN / HR_EXECUTIVE:** verify employee onboarding, department/team administration, attendance, leave and document flows according to assigned permissions.
- **FINANCE_ADMIN:** verify expense and payroll read/actions permitted by policy; avoid payment or other irreversible operations.
- **MANAGER / TEAM_LEAD / PROJECT_MANAGER:** verify only assigned team/project and approval scope.
- **RECRUITER:** verify requisitions, candidate access and resume access; verify unrelated tenant resources are denied.
- **EMPLOYEE:** verify own profile, attendance, leave, payslips and own documents; attempt another employee's private record and expect denial.
- **ORGANIZATION_ADMIN:** unresolved business-model discrepancy; it is not in the verified original role model. Do not create or test this role unless Product/CEO approves its definition.

For each account, test login, direct URL access, one navigation, refresh, logout, and retry of a protected endpoint after logout. Do not export cookies. A real test requires the app-role database setup below.

## Priority workflows

Use read-only checks first. Only use approved disposable QA fixtures for any mutation; otherwise stop after safe form validation/error testing.

1. Platform Owner and Product Owner dashboards.
2. Organization Owner and HR Admin dashboards.
3. Employee creation/onboarding and invitation (no send unless the QA mail sink is confirmed).
4. Departments, teams and manager assignment.
5. Recruitment candidate management and resume download.
6. Leave application/approval and attendance/regularization.
7. Employee documents and private downloads.
8. Chat and attachment access.
9. Notifications.
10. Payroll and expenses (read-only; do not trigger payment).
11. Platform administration and billing (read-only; do not change plans/subscriptions).

For mutations, verify validation, authorization denial, response status/body, then persistence/readback only in an approved disposable organization. No live business mutations are approved by this handoff.

## Expected security results and current limitations

- Missing/invalid session: 401; a valid cookie string alone must not authenticate.
- Authenticated wrong role or organization: 403 (or scoped 404 where the API contract uses concealment); no data/bytes returned.
- Invalid identifiers/payloads: controlled 400/422; internal failures must not expose stack, SQL parameters, credentials, or record contents.
- Local signed-file links: forged/expired links are denied before session/storage lookup; retrieval must revalidate session and current organization/document permissions and return `private, no-store`.
- RLS is **not accepted**: current configured DB role is an owner role, custom tenant/platform GUCs remain caller-settable, and no reviewed complete migration/rollback exists. Never use `neondb_owner` as application runtime.
- Two-tenant isolation, session expiration/revocation against the database, private-file cross-tenant denial, authenticated role workflows and persistence are not verified.
- A signed HMAC URL is time-limited, but the signature itself has no independent revocation list. Access is expected to stop through expiry or current session/document authorization; that behavior still needs a real QA run.
- Visual parity and performance improvements are not verified. Do not compare the one first-request latency with historical runs.

## QA database safety gates

Before integration tests, the QA owner/DBA must supply and verify:
1. Neon project `SymphoWork_NM`, branch `naresh-dev`, parent `production`, database `neondb`, and endpoint identity through trusted dashboard/metadata.
2. QA-only `DATABASE_URL` and `RLS_QA_DATABASE_URL` for `sympowork_app`, injected through ignored `.env.local` or approved secret manager. Keep the existing `AUTH_SECRET` server-side.
3. Explicit DBA authorization for QA DDL and runtime cutover, plus reviewed forward and rollback SQL.
4. Two approved organizations and QA users, memberships, employees, session hashes for active/expired/revoked cases, and clean isolated document/resume fixtures.

No migration or rollback command is currently available; do not run Drizzle migrations, schema push, seeds, resets, DDL, or business mutations. Authorization flags in environment files are not a substitute for DBA approval.

After the migration is reviewed/applied only to verified QA, run:

```powershell
npm test -- --run --maxWorkers=1 src/lib/server/rls-qa.integration.test.ts
npm run check
npm test -- --run --maxWorkers=1
npm run build
npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

Expected acceptance: current user resolves to `sympowork_app` with NOBYPASSRLS; missing/forged tenant context is denied; A↔B cross-tenant SELECT/INSERT/UPDATE/DELETE are denied; pool context does not leak; active sessions work and expired/revoked sessions fail; permitted role reads succeed; forbidden role/direct-URL/API/file requests fail; approved disposable workflow writes persist and read back. A skipped test, mock, owner-role result, or unapproved fixture is not a PASS.

## Coverage matrix for this handoff

| Scope | Inventory | Automated evidence | Authenticated functional acceptance |
|---|---:|---|---:|
| Svelte page routes | 52 | Public rendering and anonymous protected-route tests only | 0/52 |
| Original API contracts | 131 | Unit/mocked tests cover selected contracts; no full endpoint-by-endpoint auth run | 0/131 |
| Local file helper | 1 extra endpoint | Signature/authorization unit mocks | Live access not verified |
| Roles | 14 configured roles (9 org, 5 platform) | Permission/module and synthetic UI tests | Live role acceptance not verified |

The route-by-route and API inventory files are `docs/routes.csv`, `docs/api-routes.csv`, `docs/release/SYMPHOWORK_V1_ROUTE_COVERAGE.md`, and `docs/release/SYMPHOWORK_V1_API_COVERAGE.md`. Structural presence is not functional completion evidence.

## Collect and report test evidence

Capture command, UTC/local timestamp, exit code, total/pass/fail/skip counts, role label, route/API, status code, redacted correlation/request ID, and sanitized screenshot if useful. Do not capture passwords, cookies, bearer tokens, full URLs containing signatures, private document bytes, personal data, SQL values, or connection strings.

Report bugs using:

```text
ID / timestamp:
Environment and verified QA branch:
Role label (no user identifier):
Route/API and method:
Preconditions (fixture alias only):
Steps:
Expected result:
Actual result and HTTP status:
Request/correlation ID (redacted if sensitive):
Screenshot/log reference (sanitized):
Data mutation performed? (must be approved and disposable):
```

Keep release **NO-GO** until database/RLS, two-tenant isolation, critical authenticated workflows, private-file authorization and reviewed deployment/rollback all pass with actual evidence.

## Current containment-hardening sprint — 2026-11-01

- [x] Baseline: branch svelte-migration, expected HEAD, 534 status entries, nothing staged.
- [x] Replace local storage path-prefix containment with path.relative directory containment.
- [x] Add a no-storage-read regression for a sibling directory sharing the root prefix.
- [x] Focused storage tests: 5 passed across 2 files.
- [ ] Final check/unit/build gates: running; record observed outcomes before acceptance.
- [ ] Live RLS/roles/persistence: BLOCKED by the previously documented credentials, migration and fixture prerequisites.

Changed source files: src/lib/storage/local.ts and src/lib/storage/local.test.ts. This is filesystem boundary hardening; it does not prove database RLS or private-file authorization. Authenticated route/API acceptance remains 0/52 and 0/131. No live database operation was performed.

## Containment sprint final results — 2026-11-01

Check PASS (0 errors/warnings); unit suite 909 passed, 9 skipped (103 files passed, one RLS suite skipped); build PASS; focused storage tests 5/5. Fresh dev smoke: /login HTTP 200, invalid signed-file URL HTTP 403; server stopped. Browser foundation 20/20 and workflow harness 50/50 remain historical results from the preceding run, not rerun for this filesystem-only change. No DB accessed. Authenticated functional acceptance remains 0/52 routes and 0/131 APIs. Completion percentage is not established for the whole product; verified live route/API acceptance is 0/183 = 0%. Production decision: PRODUCTION NO-GO — QA HANDOFF READY.

Changed in this sprint: src/lib/storage/local.ts, src/lib/storage/local.test.ts, and release/security/verification documentation. The directory containment fix and regression test are complete. The remaining RLS migration/grant/context design still requires query-path review, DBA review and approved non-owner QA credentials; no executable SQL was invented or applied.

## Document-review runtime validation — 2026-11-01

Comparison against the original src/app/api/app/documents/[documentId]/route.ts found an unchecked TypeScript cast for review input. The Svelte handler now parses status (verified/rejected) and optional text comment with Zod, and src/modules/documents/service.ts independently rejects invalid runtime status/comment values before authorization or database access. The existing authorization and tenant selection remain in place. src/lib/server/api/app/documents/[documentId]/route.test.ts has 7 passing mocked route tests, including four invalid payloads and accepted forwarding. No live mutation occurred.

The new SOURCE_TARGET_ACCEPTANCE.json maps all 183 original page/API source files to present target files. It records structural evidence only. It does not cover every component, service, integration or workflow and must not be used to claim full migration completion. Full migration remains INCOMPLETE; live QA prerequisites and the RLS engineering gaps documented above remain unresolved.

Final post-change gates: npm run check PASS (0 errors/warnings); npm test -- --run --maxWorkers=1 PASS WITH SKIPS (103 files passed, 1 skipped; 914 passed, 9 skipped; gated RLS suite only); npm run build PASS with adapter-node. Focused document route tests 7/7 PASS, mocked. No database/provider/business mutation test was run. Browser results from the preceding run were not rerun and are historical evidence. MIGRATION INCOMPLETE; production NO-GO.
