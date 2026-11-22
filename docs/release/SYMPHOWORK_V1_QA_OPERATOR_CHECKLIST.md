# SymphoWork V1 — QA Database/RLS Cutover Operator Checklist

**Status:** BLOCKED. Do not apply DDL or cut over application traffic until every prerequisite below is evidenced. This checklist does not itself authorize database access.

## Required secret/configuration names

- `RLS_QA_DATABASE_URL`: QA-only PostgreSQL connection for the gated integration test. It must authenticate directly as `sympowork_app`; never `neondb_owner`. Keep it in the approved local secret store/process environment.
- `DATABASE_URL`: only set for application runtime after QA migration approval and verified `sympowork_app` grants/policies. Do not point it at the owner login.
- `RUN_RLS_QA_TESTS=1`: existing integration-suite opt-in. It is not DDL authorization.
- `RLS_QA_ALLOW_DDL=1` and `RLS_QA_ALLOW_RUNTIME_CUTOVER=1`: required explicit QA-only authorization markers for a future migration/cutover runner. **No current runner consumes these flags; setting them alone cannot authorize or apply anything.** A reviewed migration runner must enforce them and verify target identity before use.

No values belong in tracked files, chat, command history or logs. Do not duplicate `.env.local` or reuse original-project credentials.

`AUTH_SECRET` is also required by existing session handling and now signs local-storage download links. It must remain server-side in the same approved secret store. No additional secret is introduced for file delivery.

## Target identity prerequisites

Before any connectivity check, verify in trusted Neon metadata (not from hostname text alone):

- Project: `SymphoWork_NM`.
- Branch: `naresh-dev`, with parent `production`.
- Database: `neondb`.
- Endpoint: the operator-confirmed pooled endpoint for that branch; verify its project and branch IDs in the dashboard/metadata immediately before use.
- Isolation: confirm branch identity and that it is not the production branch. Do not create, rename, reset, or delete branches.

The previously operator-confirmed hostname identifier was `ep-twilight-dawn-b50sv5nz` (pooled endpoint). It is a locator only; it is not independent proof of branch identity. Current execution did not connect or re-verify database metadata.

## Required approved fixtures

The current QA inventory reports only one approved organization. Obtain approval for a second isolated QA organization and active users before cross-tenant acceptance. Required protected fixture names consumed by `src/lib/server/rls-qa.integration.test.ts`:

- `RLS_QA_ORGANIZATION_A_ID`, `RLS_QA_ORGANIZATION_B_ID` (distinct IDs).
- `RLS_QA_EMPLOYEE_A_ID`, `RLS_QA_EMPLOYEE_B_ID` (one disposable/approved employee per org).
- `RLS_QA_SESSION_HASH_A`, `RLS_QA_SESSION_HASH_B` (valid, active QA session hashes only).
- `RLS_QA_EXPIRED_SESSION_HASH`, `RLS_QA_REVOKED_SESSION_HASH`.

Document/document-download, project, invitation, platform and job fixtures are additionally required for those boundaries. Do not create any fixtures without explicit approval. Do not enter raw cookies, passwords or bearer tokens; session hash values must be delivered through protected configuration.

## Mandatory migration gate before tests

1. Complete and review executable SQL and rollback for the protected context owner/schema/functions, all tenant/global policies, table/sequence/function grants, invitation acceptance, platform operations and background jobs.
2. Review `docs/security/rls-source-operation-candidates.csv` and complete the authoritative `sympowork_app` operation matrix for all 140 tables. The offline scan is candidate-only (116 direct table matches, 24 unmatched, 7 raw SQL call sites). Current `src/db/client.ts` still sets freely forgeable context GUCs; no runtime cutover is safe until every active query path uses the reviewed protected context.
3. Validate SQL with a matching PostgreSQL parser/server in a disposable/offline environment; review ownership and grants. Do not treat a TypeScript check as SQL validation.
4. DBA/operator verifies QA project/branch/database/role identity and explicitly approves QA-only DDL and runtime cutover.
5. Apply only the reviewed QA migration via the approved migration mechanism. No production connection, migration, seed or reset is allowed.

No migration command is provided here because no complete reviewed migration exists in this workspace.

## Exact migration and rollback command status

**Migration command: BLOCKED; none is safe to run. Rollback command: BLOCKED; no reviewed rollback SQL exists.** The repository has no `drizzle/` migration directory or executable reviewed RLS SQL; `src/db/migrate.ts` expects `./drizzle`, has no package script, and is not an RLS cutover runner. Do not substitute a schema push, the generic Drizzle migrator, or hand-written SQL. The DBA must first provide/review the complete forward and rollback SQL for the protected context, all 140 table privileges, policies, exceptions, ownership, and runtime cutover. Only then should the DBA add a target-verifying, approval-gated runner and publish its exact invocation here.

## Commands after prerequisites are met

After the approved migration is installed and two-tenant fixtures are supplied, run from `C:\Users\nares\Symphowork_Svelte_V1`. Inject secrets and fixture values through the approved process secret manager; do not paste them into a command line or history:

```powershell
npm run check
npm test -- --run --maxWorkers=1
npm run build
npm test -- --run --maxWorkers=1 src/lib/server/rls-qa.integration.test.ts
npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

For the integration-test process only, the secret manager must inject `RUN_RLS_QA_TESTS=1` plus `RLS_QA_DATABASE_URL` and all fixture variables above. The test checks the approved endpoint hostname, `current_database() = neondb`, and `current_user = sympowork_app`; verify Neon project/branch identity from trusted dashboard metadata immediately before the test because hostname and database identity alone do not prove branch identity. Its probes run in rollback-only transactions. Start the application only after `DATABASE_URL` points to the verified app-role connection. Do not invoke an absent migration runner or point the app at the owner credential.

## PASS criteria

- **Database identity:** metadata proves correct project, branch ID/name, parent, database, endpoint, and non-production isolation.
- **Runtime role:** connection reports `current_user = sympowork_app`; role is NOBYPASSRLS, non-owner, no owner/context-role membership, and only reviewed grants.
- **Policy inventory:** all 129 tenant tables have RLS and appropriate FORCE posture; all 11 global/auth tables have reviewed least-privilege access. No active tenant policy trusts legacy GUCs.
- **Context:** missing/expired/revoked sessions deny; active session resolves the only approved active membership; forged legacy tenant/platform GUCs do not change context; membership suspension is enforced on the next request.
- **Isolation:** both organizations see only own records; cross-tenant SELECT returns no rows and INSERT/tenant reassignment is denied; cross-tenant UPDATE/DELETE affect zero rows; pool reuse cannot retain context.
- **Exceptions:** platform, invitation and background-job paths pass allowed/denied tests using narrowly scoped capabilities; no general tenant runtime bypass.
- **Private files:** unauthorized document, resume and chat-attachment requests are denied before storage reads; successful authorized reads return no-store headers and are tenant-scoped.
- **Application:** real QA logins, session refresh/logout, role redirects, bounded read workflows and real persistence/readback pass with approved users/records. No real-customer mutations.

A skipped test, mock, source scan or passing build is not a live acceptance PASS. Production remains NO-GO until all applicable criteria have actual QA evidence and a separately approved production migration plan.

## Final engineering closure evidence — 2026-11-01

The latest local run passed `npm run check` (0 errors/warnings), `npm test -- --run --maxWorkers=1` (100 files passed, 1 skipped; 898 passed, 9 skipped), `npm run build`, Playwright foundation (20/20), and the synthetic workflow harness (50/50). The skipped suite is `src/lib/server/rls-qa.integration.test.ts`. The local dev server started on port 5173 and returned HTTP 200 for `/login`. These results do not authorize or prove DB security, live authentication, tenant isolation or business persistence.

Private-download response checks now include employee document and ATS resume signed-URL no-store headers, in addition to chat attachments. They are mock-backed only. A real private-file access test still requires approved QA users, tenant fixtures and isolated storage test files.

No SQL, runtime cutover or business mutation was run. The only configured local DB login remains unsuitable for runtime because it is the owner role and is rejected. Continue to treat all database identity, runtime-role, RLS, two-tenant, live login/data and persistence PASS criteria above as blocked until the required non-owner setup, reviewed migration and fixtures are available.

## Final blocker closure checklist — 2026-11-01

### Current commands and results

- `npm run check`: PASS, 0 errors/warnings.
- `npm test -- --run --maxWorkers=1`: PASS WITH SKIPS, 102 files passed and 1 skipped; 905 passed and 9 skipped. The one skipped file is the gated RLS suite.
- `npm run build`: PASS, adapter-node.
- `npx playwright test --config=playwright.config.ts --reporter=list --output=<unique-temp-dir>`: PASS, 20/20; `DATABASE_URL` was blanked for this process.
- `npx playwright test --config=playwright.workflows.config.ts --reporter=list --output=<unique-temp-dir>`: PASS, 50/50 synthetic workflows.
- Focused signature/private-file suites: PASS, 13/13 tests across 5 files. These mock DB context/storage.
- `npm run dev -- --host 127.0.0.1 --port 5173 --strictPort`: PASS after the local-file endpoint was added; `/login` returned HTTP 200 and the server was stopped. This is a public-page smoke check, not live login acceptance.

### Operator inputs and approval

1. For local Svelte development, the established ignored configuration file is `C:\Users\nares\Symphowork_Svelte_V1\.env.local` (`git check-ignore .env.local` confirmed it is ignored). Have the operator enter the QA-only `DATABASE_URL` there through a secure local editor or inject it with the approved secret manager; preserve other settings and restrict local file access. The integration-test process also needs `RLS_QA_DATABASE_URL` and fixture variables from the secret manager. Both DB URLs must authenticate directly as `sympowork_app`. Retain the existing `AUTH_SECRET`; do not print or copy values into tracked files. The current `.env.local` DB identity is an owner role and must not be used.
2. Verify in Neon trusted metadata: project `SymphoWork_NM`, branch `naresh-dev`, parent `production`, database `neondb`, correct endpoint ID, and isolation from production. Record non-secret project/branch/endpoint IDs in the change record.
3. Obtain explicit DBA approval for QA DDL and runtime cutover and a reviewed forward+rollback migration. No current DDL runner or safe SQL exists, so **there is no migration command to run yet**. `RLS_QA_ALLOW_DDL` and `RLS_QA_ALLOW_RUNTIME_CUTOVER` are not consumed by any runner and do not constitute authorization.
4. Obtain approval for a second QA organization, active users, employee fixtures, clean private document/resume fixtures, and required active/expired/revoked session hashes. Populate only the named `RLS_QA_*` process variables through the secret manager. No business data was created in this run.

### Exact tests after those prerequisites

1. Validate source: `npm run check`, then `npm test -- --run --maxWorkers=1`, then `npm run build`.
2. After DBA confirms the migration and rollback are applied only to verified QA `naresh-dev`, run: `npm test -- --run --maxWorkers=1 src/lib/server/rls-qa.integration.test.ts` with `RUN_RLS_QA_TESTS=1` and required fixtures injected only into that process.
3. Set application `DATABASE_URL` to the verified app-role QA connection via the secret manager; run `npm run dev -- --host 127.0.0.1 --port 5173 --strictPort`; verify `/api/health` is ready and use `http://127.0.0.1:5173/login`.
4. In a private browser session, test authorized Product Owner, Organization Owner, and HR Admin credentials; record statuses and role redirects without exporting cookies. Refresh/navigate/logout, then verify role-scoped read endpoints. Use the approved two-tenant fixtures to verify cross-tenant employee/department/project/document denials and pool reuse. No existing automated script covers these live login/workflow checks; run them manually or add an approved credential-safe browser harness.
5. For local file storage, obtain an authorized session, request a document/resume link through its existing API, verify retrieval succeeds only for the owning user/organization before expiry, then verify tampered and expired signatures return 403. Recheck no-store headers. For R2, verify the provider URL expiry and private bucket policy without printing the URL.

### PASS criteria

Database identity matches dashboard metadata and test query returns `neondb`/`sympowork_app`; role is non-owner/NOBYPASSRLS with reviewed grants; all RLS assertions pass including missing/forged context, cross-tenant SELECT/INSERT/UPDATE/DELETE, session expiry/revocation and pool isolation; the Svelte app uses the same verified runtime role; each named login/session flow succeeds or rejects correctly; bounded reads return only expected QA organization data; private file requests are scoped and expire; no business mutation occurs outside approved disposable fixtures. Any skipped test, mock, source scan, unapproved fixture or owner-role result blocks acceptance.

## Final current-tree verification — 2026-11-01

Fresh results: check PASS (0 errors/warnings); serial Vitest PASS WITH SKIPS (102 files passed, 1 skipped; 907 passed, 9 skipped; only gated RLS suite skipped); build PASS; Playwright foundation 20/20 PASS; synthetic workflow harness 50/50 PASS; focused security/private-file/departments suite 21/21 PASS; diff check PASS. No live DB or business data was contacted. Prior nested `vi.mock` warning is resolved in the focused departments tests and did not appear in the final full run.

Cutover remains blocked. Required secret names and secure location are documented above; obtain a direct `sympowork_app` QA URL through the secret manager, verify Neon project/branch identity out of band, obtain explicit DBA approval for QA-only DDL/runtime cutover, and provide two approved organizations plus user/session/employee/private-file fixtures. No reviewed forward/rollback SQL or migration runner exists, so there is no safe migration or rollback command to execute. Do not substitute `neondb_owner`.

## Four-hour delivery run — 2026-11-01

Final post-change gates: `npm run check` PASS (0 errors/warnings); `npm test -- --run --maxWorkers=1` PASS WITH SKIPS (102 files passed, 1 skipped; 908 passed, 9 skipped; gated RLS suite only); `npm run build` PASS; Playwright foundation 20/20; synthetic workflow harness 50/50; focused private-file route 4/4; dev startup on port 5173 and login page HTTP 200; `git diff --check` PASS. There are no credentials for the approved app role or second tenant in the inspected Svelte local config. See `TESTING_TEAM_HANDOFF.md` for the complete role instructions and evidence template. The DB migration remains unavailable and no DDL command is safe to provide.
