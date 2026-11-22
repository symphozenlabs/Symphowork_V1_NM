# API Coverage

## Structural crosswalk

`docs/api-routes.csv` inventories **131** original APIs. This run found **131 SvelteKit API adapters** and **131 matching adapter files**. A static comparison of each inventory method set with exported SvelteKit methods found **131/131 method-set matches**. The generated `SYMPHOWORK_V1_COVERAGE.json` records each source route, original method set, target adapter, actual exported methods, structural match, and `functionalStatus: NOT VERIFIED`.

Method/file matching is not evidence that the handler preserves request schemas, response envelopes/statuses, cookies, authorization, tenant scoping, side effects, transaction behavior, upload/download security, or persistence. This run did not execute every API route. The unit and browser checks include selected handler/component contracts only.

## Architecture evidence

SvelteKit `+server.ts` adapters invoke handler functions through `src/lib/server/endpoint.ts`; that adapter creates request-scoped cookie compatibility and invokes the supplied handler directly. The route code is therefore structured for same-process handling. Compatibility aliases for Next.js-shaped APIs remain in Vite/SvelteKit configuration. There is also an optional relay implementation in `src/lib/server/legacy.ts`; it has tests, but the route adapter tree does not call it. A real deployment/network trace was not performed in this run.

## Explicit gaps

- Route-by-route input and response contract acceptance: NOT VERIFIED.
- Authenticated role and tenant authorization for all endpoints: NOT VERIFIED.
- Two-tenant RLS behavior and cross-tenant denial: BLOCKED by missing second QA organization and protected application-role setup.
- Private file upload/download authorization: NOT VERIFIED.
- Successful live business mutations/readback: NOT RUN; no disposable records were approved.
- Full external provider, email, storage, and background-job behavior: NOT VERIFIED.

Do not use the API adapter count as a parity percentage. See the route-level entries in `SYMPHOWORK_V1_COVERAGE.json`.

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

## Parallel audit addendum — 2026-11-01

The 131 API inventory entries group structurally as app 95, auth 10, health 1, platform 23, public 2. All 131 remain `NOT VERIFIED` for full request validation, authorization/RBAC, tenant scoping, response/error contracts, side effects, and persistence. The focused private chat-attachment route test is a selected synthetic check only; it does not change the route-wide status.

## Final end-to-end closure run — 2026-11-01

- Structural adapters and method inventory remain 131/131; all 131 functional statuses remain `NOT VERIFIED`.
- Current-tree checks: Svelte check 0 errors/warnings; unit tests 898 passed, 9 skipped; build passed; 20 browser foundation tests and 50 synthetic workflow tests passed.
- Targeted private download tests passed 6/6 across chat attachments, employee documents, and ATS resumes. New checks assert that missing organization context prevents signed-URL service calls, and that successful employee/resume signed-URL responses set `Cache-Control: private, no-store`.
- These tests use mocked service/context boundaries. No live authorization, storage access, DB query, persistence, tenant isolation or role-boundary request was performed.

API-level live acceptance remains 0/131. Do not infer contract or security parity from method matching, adapter presence, fixture tests, or an anonymous API error response.

The local storage provider now has one additional Svelte-only `GET /api/app/storage/file` endpoint to resolve authenticated local-file URLs. It is intentionally not counted as an original-API parity match. Its signatures and mocked route behavior are unit-tested; live database, file-store and cross-tenant authorization remain NOT VERIFIED.

After adding that helper, the serial test suite passed 905 tests and skipped 9 (the gated RLS file); build passed; the 20-test browser foundation and 50-test synthetic workflow suites passed. The mapped original API count remains 131, with 0/131 live authenticated behavior acceptance. The extra helper endpoint has 7 unit tests for signing and route behavior, not DB-backed authorization evidence.

## Current-tree final rerun — 2026-11-01

Structural mapping remains 131/131 original API adapters (plus one local signed-file delivery helper, 132 Svelte endpoints total). The new local file route and signed URL behavior have mocked unit coverage; document and resume URL responses are private/no-store. Overall authenticated functional acceptance remains 0/131 original APIs. The serial unit suite passed 907 and skipped 9 RLS assertions; browser workflow cases use intercepted/mock transport. No live API, database persistence, per-role contract, or tenant authorization result is claimed.

## Four-hour sprint current evidence — 2026-11-01

Current full suite now reports 908 passed / 9 skipped. The local-file route test includes a mocked revoked-session rejection check; it does not establish database-backed session revocation. Original API functional acceptance remains 0/131; selected unit and synthetic tests do not represent full method/auth/RBAC/tenant/response-contract coverage.

## Containment sprint final results — 2026-11-01

Check PASS (0 errors/warnings); unit suite 909 passed, 9 skipped (103 files passed, one RLS suite skipped); build PASS; focused storage tests 5/5. Fresh dev smoke: /login HTTP 200, invalid signed-file URL HTTP 403; server stopped. Browser foundation 20/20 and workflow harness 50/50 remain historical results from the preceding run, not rerun for this filesystem-only change. No DB accessed. Authenticated functional acceptance remains 0/52 routes and 0/131 APIs. Completion percentage is not established for the whole product; verified live route/API acceptance is 0/183 = 0%. Production decision: PRODUCTION NO-GO — QA HANDOFF READY.

Changed in this sprint: src/lib/storage/local.ts, src/lib/storage/local.test.ts, and release/security/verification documentation. The directory containment fix and regression test are complete. The remaining RLS migration/grant/context design still requires query-path review, DBA review and approved non-owner QA credentials; no executable SQL was invented or applied.

## Document-review runtime validation — 2026-11-01

Comparison against the original src/app/api/app/documents/[documentId]/route.ts found an unchecked TypeScript cast for review input. The Svelte handler now parses status (verified/rejected) and optional text comment with Zod, and src/modules/documents/service.ts independently rejects invalid runtime status/comment values before authorization or database access. The existing authorization and tenant selection remain in place. src/lib/server/api/app/documents/[documentId]/route.test.ts has 7 passing mocked route tests, including four invalid payloads and accepted forwarding. No live mutation occurred.

The new SOURCE_TARGET_ACCEPTANCE.json maps all 183 original page/API source files to present target files. It records structural evidence only. It does not cover every component, service, integration or workflow and must not be used to claim full migration completion. Full migration remains INCOMPLETE; live QA prerequisites and the RLS engineering gaps documented above remain unresolved.

Final post-change gates: npm run check PASS (0 errors/warnings); npm test -- --run --maxWorkers=1 PASS WITH SKIPS (103 files passed, 1 skipped; 914 passed, 9 skipped; gated RLS suite only); npm run build PASS with adapter-node. Focused document route tests 7/7 PASS, mocked. No database/provider/business mutation test was run. Browser results from the preceding run were not rerun and are historical evidence. MIGRATION INCOMPLETE; production NO-GO.
