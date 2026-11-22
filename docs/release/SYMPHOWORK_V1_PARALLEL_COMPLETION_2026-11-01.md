# SymphoWork V1 — Parallel Completion Record (2026-11-01)

## Decision

**Production NO-GO.** Local static and synthetic checks previously passed. This execution added one focused private-file cache correction and a targeted test. Database context/RLS migration, live login, tenant isolation, persistence, visual parity and comparable performance remain unaccepted.

## Work completed

- Changed the chat attachment response from a one-day private cache with stale revalidation to `Cache-Control: private, no-store`. The previous response could remain in a browser cache after account/session changes.
- Added `src/lib/server/api/app/chat/conversations/[conversationId]/attachments/[attachmentId]/route.test.ts`: missing organization context returns 403 without calling attachment storage; authenticated route response is no-store and passes the active organization/user identifiers to the service.
- Targeted test: **1 file passed, 2 tests passed**. The first draft used malformed fixture IDs and got 400; the test fixtures were corrected to UUID format and the final targeted run passed.
- Added `docs/security/rls-table-privilege-matrix.csv`, an inventory of the 129 tenant plus 11 global tables. It preserves historical catalog evidence separately from unknown per-operation requirements; it does not claim a least-privilege grant matrix.
- Added `docs/release/SYMPHOWORK_V1_QA_OPERATOR_CHECKLIST.md` with safe prerequisites, config names, fixture requirements, commands and PASS criteria.

## Static/API and RBAC audit status

`docs/release/SYMPHOWORK_V1_COVERAGE.json` contains 52 routes and 131 API routes; every route remains `NOT VERIFIED` for functional behavior. Static group counts: app 95, auth 10, health 1, platform 23, public 2. These counts establish only inventory structure. Authorization, validation, response/side-effect and tenant scope have not been accepted route-by-route. Existing synthetic unit/Playwright suites cover selected flows only.

The configured platform roles are PLATFORM_OWNER, PRODUCT_OWNER, PLATFORM_ADMIN, PLATFORM_SUPPORT and PLATFORM_BILLING. The original organization role set in `SYSTEM_ROLES` contains nine roles: ORGANIZATION_OWNER, HR_ADMIN, HR_EXECUTIVE, FINANCE_ADMIN, MANAGER, TEAM_LEAD, PROJECT_MANAGER, RECRUITER and EMPLOYEE. `ORGANIZATION_ADMIN` is absent and must not be silently added. Platform permission unit tests cover selected role boundaries; real direct-URL/API role acceptance is not verified.

Private-file handlers inspected: document download, ATS resume download, and chat attachments. The chat cache issue is corrected locally. Storage authorization and tenant-boundary behavior remain NOT VERIFIED because no live identity, database or object-storage check ran.

## Database/RLS engineering status

The Phase 2C investigation records 140 public tables, 129 tenant tables with legacy GUC-based policies, and 11 global/auth tables. Historical catalog evidence says `neondb_owner` owned the tables and had BYPASSRLS; `sympowork_app` had broad DML grants. This execution did not connect to the database. No protected context functions, complete operation grant matrix, executable migration, rollback, SQL parser validation, DDL, or runtime cutover was produced/applied. The existing code still sets freely settable tenant/platform GUCs. The 140-row CSV marks unresolved grants explicitly rather than guessing privileges.

The current local configuration has `DATABASE_URL` but not `RLS_QA_DATABASE_URL`, `RLS_QA_ALLOW_DDL`, `RLS_QA_ALLOW_RUNTIME_CUTOVER`, or `RUN_RLS_QA_TESTS`. The configured application credential was previously identified as `neondb_owner`; the runtime guard rejects it. No app-role credential is available for this work. Only one approved QA organization is currently reported.

## Performance and reliability

Static inspection found the app dashboard loader runs three aggregate queries concurrently inside one tenant-read transaction. Session resolution performs a session/user lookup followed by a membership lookup and four related reads in a transaction; current instrumentation emits session lookup, organization context, API and endpoint durations. These are candidate measurement points, not measured production bottlenecks. Source search found no `TimeoutNegativeWarning` implementation/reference. No dashboard/DB profile was run, and no comparative optimization claim is made. Prior local dev `/login` samples are not dashboard or end-to-end performance evidence.

## Verification and unchanged completed gates

This execution did not repeat the already-recorded full check/test/build/browser gates because no broad source changes were made. The targeted chat route test passed 2/2. Previous current-tree results remain: check passed; unit suite 892 passed/9 skipped; build passed; browser foundation 20/20; synthetic workflows 50/50; dev startup and `/login` smoke passed. The skipped PostgreSQL RLS suite is still BLOCKED, not PASS. Re-run check/build after this source change before release; rerun full tests if subsequent broad changes are made.

## Remaining blockers

1. Protected QA-only `sympowork_app` credentials, explicit DDL and runtime-cutover approval, and branch identity verification.
2. Reviewed, syntactically validated full RLS migration and rollback; complete least-privilege grants for all 140 tables; DB-context source/runtime integration.
3. Approved second-tenant users and fixtures; invitations/platform/jobs/document fixtures for exception testing.
4. Full route/API permission-validation coverage, real login/session acceptance, persistence, private-file authorization, matched screenshot comparison and controlled dashboard performance baseline.
5. Business decision for `ORGANIZATION_ADMIN` if the role is required.

See the operator checklist for safe next commands and acceptance criteria. No database access, DDL, business mutations, staging, commit or push occurred.
