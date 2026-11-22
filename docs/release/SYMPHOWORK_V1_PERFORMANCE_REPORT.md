# Performance Evidence

## New measurement in this run

The browser foundation suite recorded three sequential **target-only, unauthenticated public `/login` page loads** from the isolated production build. There is no original-app or database comparison.

| Sample | TTFB (ms) | DOMContentLoaded (ms) | Load (ms) | Transfer bytes |
|---:|---:|---:|---:|---:|
| 1 | 6.8 | 324.4 | 349.3 | 37,205 |
| 2 | 7.5 | 84.4 | 110.6 | 37,205 |
| 3 | 11.2 | 101.7 | 121.9 | 37,205 |

These are a tiny local sample of one public route and are sensitive to cold cache/startup. They are **not** a dashboard, API, authentication, or database latency benchmark. They do not support an improvement or regression claim. Source data is the temporary test artifact `test-results/target-navigation-timings.json`; it was not copied into the repository.

## Historical measurements

The existing `docs/performance-report.md` records prior target-only and workflow timings but describes non-comparable baseline/optimized samples and prior invalid POST/PATCH/DELETE requests returning HTTP 500. Those historical results are not a valid before/after benchmark and are not reclassified here.

## Acceptance status

- Target login navigation samples: measured, limited scope.
- Original-versus-Svelte matched-route baseline: NOT VERIFIED.
- Dashboard navigation at controlled warm/cold conditions: NOT VERIFIED.
- API and database query latency breakdown: NOT VERIFIED.
- Duplicate request/timeout investigation at live dashboard scale: NOT VERIFIED.
- Any performance improvement: NOT CLAIMED.

Next measurement should capture the same role, route, viewport, data volume, warm/cold condition, and backend/database in both applications, with repeated samples and a query/API trace. Do not optimize based on the login-only figures.

## Final end-to-end closure run — 2026-11-01

- Fresh development startup: Vite reported ready at `127.0.0.1:5173` after 8.345 seconds. A direct local `/login` request returned 200. Server logs measured the first request at 5619.3 ms (cold compile) and the repeat at 42.7 ms. These two development samples are not comparable to the production-build login samples or to an original-app baseline.
- Fresh production build completed successfully; client/server transformation and adapter-node setup completed. The tool output reported Vite build segments of 17.67 seconds and 57.43 seconds; these are build timings, not app request latency or before/after evidence.
- The benchmark script was corrected to remove its stale `127.0.0.1:3000` backend measurement and use SvelteKit as the single application/API origin. It was not executed because its authenticated path reads local credentials and would attempt session operations while the required non-owner database setup is unavailable.
- No DB/API/dashboard trace or matched original-versus-Svelte run was performed. A source search found no `TimeoutNegativeWarning` occurrence, which does not rule out a runtime warning.

Performance improvement remains **NOT VERIFIED / NOT CLAIMED**. Dashboard, database query, authentication, duplicate-request and original-versus-Svelte timings still require a controlled repeatable test with approved QA access and identical data/viewports.

After the local-file route change, Vite again started on port 5173. Dev logs recorded 7923.8 ms and 2579.0 ms for two `/login` requests in that run; they reflect dev compilation/runtime noise and are not comparable to previous samples. The updated production build and both browser suites passed, but none provides a controlled dashboard or database performance baseline. No improvement is claimed.

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

## Offline profiling addendum — 2026-11-01

Static code tracing found `src/routes/app/+page.server.ts` issues three authorized aggregate reads (employee, pending approvals, unread notifications) concurrently inside one `tenantRead` transaction. `src/lib/server/context.ts` performs a session/user lookup, then a separate transaction containing membership lookup followed by organization, role, permission and department-manager reads. Existing instrumentation measures session lookup, org-context, endpoint and API durations. These are candidate trace points only; no database was contacted and no query plan was collected. Search found no `TimeoutNegativeWarning` source reference. Dashboard/DB latency and any optimization remain NOT VERIFIED.

## Current-tree final rerun — 2026-11-01

The measured dev smoke timings recorded above are target-only observations and are not comparable baseline/optimized measurements. This run did not execute the credentialed/database performance benchmark. The corrected benchmark script targets the single Svelte origin, but dashboard, API, session and query latency improvements remain NOT VERIFIED. Do not infer performance gains from passing build or browser tests.

## Fresh development startup observation — 2026-11-01

A fresh Vite startup on 127.0.0.1:5173 served `GET /login` with HTTP 200. The server's local perf log recorded the first request at approximately 9.1 seconds and tagged it slow; the browser request completed successfully after startup. This single cold-start request is not a repeatable dashboard/API benchmark and cannot establish a performance regression or improvement. The observed 9.1 s is retained as a QA follow-up measurement.
