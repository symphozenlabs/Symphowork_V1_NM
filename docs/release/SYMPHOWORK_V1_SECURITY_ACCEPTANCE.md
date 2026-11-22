# Security Acceptance

## Database role and RLS

The existing investigation identified `neondb_owner` as owner of 140 public tables with `BYPASSRLS`; 129 tenant tables were reported with RLS policies, none FORCE-enabled. The current Svelte runtime guard in `src/db/runtime-role.ts` accepts only the login name `sympowork_app`, and `src/db/client.ts` applies that guard before creating/reusing a pool. The configured local login role is `neondb_owner`, so the runtime cannot safely access the database with the present local configuration. No privileged fallback is permitted or attempted.

The context implementation in `src/lib/server/context.ts` still establishes user/organization state through ordinary transaction-local custom GUC values. Existing helpers in `src/db/client.ts` also set tenant/platform/invitation GUCs. A custom GUC settable by the application role is not a protected identity assertion. The protected `app_private.begin_request_context` mechanism expected by `src/lib/server/rls-qa.integration.test.ts` has not been installed or verified. Do not infer that RLS currently protects Svelte application queries.

The RLS integration suite is opt-in (`RUN_RLS_QA_TESTS=1`) and requires a dedicated `RLS_QA_DATABASE_URL`, two distinct organization/user fixtures, session hashes, and an already-installed reviewed policy/function migration. Those requirements were unavailable; the 9 skipped tests are **BLOCKED**, not passed. No DB connection, DDL, grants, policy changes, migrations, or business writes were performed in this mission.

## Security checks completed in this run

| Boundary | Result | Evidence |
|---|---|---|
| Runtime rejects owner role | PASS, unit evidence | `src/db/runtime-role.test.ts` includes owner-role rejection and role-override rejection; included in fresh unit suite. |
| Missing DB login fails safely | PASS, synthetic browser evidence | Login endpoint returned HTTP 503 and the UI displayed the exact database-not-configured message; no credential was accepted. |
| Anonymous protected-route gate | PASS, synthetic/static browser evidence | Aggregate route loop returned expected redirects without authenticated data loading. This does not prove each page's authorized access. |
| Cross-origin mutation protection | PASS, synthetic browser evidence | Browser API guard test returned 403 for a synthetic cross-origin login POST. |
| Two-tenant PostgreSQL RLS | BLOCKED | No second approved organization and no app-role credential/migration acceptance. |
| Private-file tenant authorization | NOT VERIFIED | No live document fixture or authenticated file request. |
| Session expiry/revocation under DB role | NOT VERIFIED | No live DB-backed session acceptance in this run. |
| Platform and organization direct/API permissions | NOT VERIFIED comprehensively | Component mocks are not real-account authorization evidence. |

## Required remediation gate

Before RLS acceptance: obtain explicit approval and protected credentials for the verified isolated QA branch using `sympowork_app`; obtain two approved organization fixtures/users; review complete tenant/global table inventories, per-operation grants, policies, FORCE decisions, protected context functions and rollback; then run gated tests for missing/forged context, cross-tenant SELECT/INSERT/UPDATE/DELETE, pool cleanup, membership revocation, expiry, invitation, platform and jobs. Production remains NO-GO until QA evidence passes and the production change is separately reviewed/authorized.

## Final end-to-end closure run — 2026-11-01

- Runtime-role guard and database gate were not changed. No database connection, query, DDL, grant, policy change or business-data mutation was performed.
- The serial suite passed 898 tests and skipped 9 in one RLS integration file. Those skipped RLS tests are **BLOCKED**, not passes.
- Browser/synthetic evidence: anonymous protected-route rejection, cross-origin mutation rejection, and safe missing-database login behavior passed as covered by the 20 foundation tests; no authenticated role or live API authorization was tested.
- Private-file response hardening: employee-document and ATS-resume signed-URL JSON responses now set `Cache-Control: private, no-store`; tests verify the header and that missing organization context prevents invoking the signed-URL service. Chat bytes already use the same no-store policy. This does not prove cross-tenant authorization or storage-provider access controls.
- `scripts/measure-performance-baseline.mjs` no longer assumes a separate port-3000 API; it measures health through the SvelteKit origin. The script was not run because its authenticated checks read local QA credentials and create/revoke sessions, and the required safe runtime DB role is unavailable.

Critical findings remain: runtime policy context still relies on forgeable custom GUCs; `neondb_owner` is rejected by the runtime guard; non-owner credentials and a complete reviewed migration/rollback are unavailable; only one approved organization fixture exists. Tenant isolation, session expiration under the app role, live RBAC, private storage authorization and business persistence remain **BLOCKED/NOT VERIFIED**. Production remains **NO-GO**.

## Local storage file gate

Local-provider download URLs now include a server HMAC over the storage key and expiry. The endpoint rejects expired/tampered URLs before session or storage lookup, then resolves an authenticated organization and calls an authorization-scoped file lookup. Employee files are limited to the signed-in user's employee record, active/clean documents, and `document.download`; resumes require `ats.candidate.view` and a clean scan. It emits `private, no-store` and `nosniff`. A URL alone is insufficient because the endpoint also requires the current valid session and the matching organization.

The tests use stubbed context and storage/service calls. They do not establish live membership validation, tenant database predicates under RLS, storage object ownership, or cross-tenant rejection. R2 presigned URL expiry is source-verified as capped at 900 seconds with these service call sites requesting 300 seconds; provider-side revocation/expiry was not integration-tested.

The final current-tree run after this addition passed 905 unit tests with 9 RLS tests skipped; check, production build, 20 browser foundation tests and 50 synthetic workflows also passed. Local download signatures and response behavior have unit coverage only. No authenticated service/data/storage request was performed, and GUC trust and the owner-role configuration remain release-critical blockers.

An offline AST scan in `docs/security/rls-source-operation-candidates.csv` records candidate direct Drizzle operations and source paths for 116/140 catalog tables across 360 non-test TS files. Twenty-four tables had no direct call match and seven raw `execute()` sites remain to review. This is an application query inventory aid only; it is not evidence of actual role grants, policy behavior, or complete access requirements.

## Master mission verification addendum — 2026-11-01

This addendum records a fresh local run against the current working tree. It does not overwrite prior findings or make live integration claims.

- `npm run check`: PASS; svelte-check reported 0 errors and 0 warnings.
- `npm test -- --run --maxWorkers=1`: PASS with skips; 97 files passed, 1 file skipped; 892 tests passed, 9 skipped. The skipped file is the opt-in PostgreSQL RLS acceptance suite.
- `npm run build`: PASS; Vite and adapter-node completed with exit code 0.
- `npx playwright test --config=playwright.config.ts --reporter=list --output=<temporary-directory>`: PASS, 20/20 browser foundation tests against the locally built app. Synthetic/anonymous scope only.
- `npx playwright test --config=playwright.workflows.config.ts --reporter=list --output=<temporary-directory>`: PASS, 50/50 synthetic workflow tests in the local component harness. No business API persistence was exercised.
- `npm run dev -- --port 5173 --strictPort`: Vite started on `127.0.0.1:5173`; a GET to `/login` returned HTTP 200; server was stopped. Two dev responses were logged at 12.8 s and 6.3 s; development compilation/cache effects make this a non-comparable local observation, not an optimization claim.
- `git diff --check`: PASS (exit 0; Git emitted only working-tree LF/CRLF advisory warnings).

### Current release decision

**NO-GO for production.** The codebase has structural route presence (52 Svelte page files and 131 API handler files) and passing local synthetic/check/build gates, but route-level workflow parity remains unverified. No QA database connection was made. The only configured database login was safely identified as the table-owning `neondb_owner`; `src/db/client.ts` rejects it before pool creation. The local configuration contains no `sympowork_app` QA URL, explicit QA DDL approval, runtime cutover approval, or RLS test enablement. Do not use the owner role as fallback.

### Security and data acceptance

- The application still contains GUC-setting transaction helpers and reads/sets ordinary `app.current_user_id`, `app.current_organization_id`, `app.is_platform_owner`, and invitation-token settings. Those values remain forgeable by an application SQL role until policies are migrated to a protected DB-validated context and verified. Phase 2C SQL is still a design proposal, not a complete executable migration/rollback.
- 129 tenant-table RLS policies and 11 global-table access rules have not been revalidated on this run. Current application runtime identity has no successful QA connection evidence.
- Two-tenant isolation, membership revocation, session expiry under the app role, private-file authorization, platform boundaries, real organization reads, and business persistence are NOT VERIFIED/BLOCKED.
- No source files or database state were changed by this mission execution. Existing dirty changes were preserved; no stage/commit/push occurred.

### Required next actions

1. Supply a protected QA-only `DATABASE_URL` authenticating directly as `sympowork_app`, and explicit QA-only DDL and runtime-cutover authorization (or separate local approved gate values); never provide production credentials.
2. Complete a reviewed executable migration and rollback covering all table operations, global/auth data, invitations, platform capabilities, workers and transaction context.
3. Provide two approved QA organizations, active users/sessions, and safe employee/document/project fixtures. Then run the gated RLS suite before changing runtime traffic.
4. Re-run real role/session/data acceptance, API workflow persistence, private-file checks and matched original-versus-Svelte screenshots. Production remains NO-GO until those are evidenced.

## Additional local security review — 2026-11-01

The chat attachment handler previously returned private bytes with a one-day cache and stale revalidation. It now returns `Cache-Control: private, no-store`. Its focused test confirms (a) missing organization context yields 403 before `getChatAttachment` is called and (b) the authorized response uses no-store and passes the active context IDs to the service. Result: **PASS, synthetic route test (2 tests)**. This does not verify storage authorization, signed URL behavior, RLS, or cross-tenant access. Document and ATS resume download flows remain NOT VERIFIED against live QA.

## Current-tree final rerun — 2026-11-01

Fresh unit result: 907 passed, 9 skipped; the only skipped suite is the gated RLS integration file. Focused local signature/private-file tests are mock-backed. No database connection, DDL, live login, two-tenant attempt, private storage read, or business mutation was performed. The known owner-role/RLS gap and forgeable custom GUC concern remain unresolved; the runtime guard rejects owner-role fallback, but no `sympowork_app` credential or reviewed policy/grant migration is available. Source operation candidates are not a complete privilege analysis. Tenant isolation and RLS are NOT VERIFIED; production is NO-GO.

## Four-hour sprint current evidence — 2026-11-01

A mocked route test now checks that a valid, unexpired local file URL still fails when session-context resolution returns 401, before storage access. Focused route result: 4/4. Full suite: 908 passed, 9 skipped; gated PostgreSQL RLS suite is the sole skipped suite. This is not live revocation evidence. The database owner-role/GUC/least-privilege gaps remain unresolved; no DB access, DDL, or tenant-isolation claim is made.

### Static private-file query review

Inspected the actual download paths: employee document queries include active organization, current user's employee identity, storage key, active lifecycle and clean scan; ATS resume queries include active organization, document identity, clean scan and `ats.candidate.view`; chat attachment reads require `chat.read`, a current active conversation membership scoped to organization/conversation/employee, and the attachment/message organization and conversation match. These are source-level constraints only; the database owner role currently bypasses RLS, and no cross-tenant runtime test was performed.

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
