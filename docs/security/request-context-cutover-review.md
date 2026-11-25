# PostgreSQL request context cutover review

The staging SQL creates a private signing key and a non-login context owner. It grants the runtime no access to this schema or its functions and leaves existing runtime policies in force. It has a matching staging rollback. Neither file belongs in the automatic migration directory.

## Transaction design decision

| Approach | Security and operational tradeoff |
|---|---|
| Separate short-lived initialization issuing a ticket | Can work with an authenticated ticket and a fresh authorization check in the consuming transaction. A detached ticket introduces an expiry, cross-connection replay and revocation problem. The old ledger row cannot be reused because its transaction ID has ended. |
| Privileged write initializer followed by read-only consumption | Can work with a protected lease and an atomic binding step or a signed ticket. Consuming a durable lease by writing in the read-only transaction brings back the original conflict. Keeping a combined read/write transaction also removes PostgreSQL's write protection on read routes. |
| Selected approach, signed context initialized within the read-only transaction | The initializer reads trusted identity records, allocates the current top-level transaction ID and signs a payload with a private database key. The transport is a transaction-local setting; a setting alone conveys no authority. Getters authenticate it, bind it to the backend and transaction IDs and recheck session and membership state. No persistent ticket or separate initialization transaction is required. |

The implementation requires `pgcrypto` in the trusted `public` schema, no runtime CREATE there, and a primary that can allocate transaction IDs for read-only transactions. Measure XID consumption, database latency and pooler behavior on QA before rollout. A hot standby unable to allocate an XID cannot serve this path. Replay of an old authenticated context was rejected by the embedded test after a rollback and a new transaction. Network pool and true overlapping-backend checks still need approved QA.

## Identity and transaction contract

- Begin context using the opaque session cookie through a parameterized call. The function hashes it inside PostgreSQL and checks expiry, active user, active membership, and active organization. The membership constraint currently permits one organization per user. The caller supplies no organization, user, or platform role.
- The key belongs to the context owner. Getters return no identity in a new transaction. Initialize and run all scoped SQL on the same executor, clear the transaction-local value before commit and rely on rollback after any error. Scope each transaction to one request and use READ COMMITTED so the getters recheck at each statement snapshot.
- A raw cookie is a secret. Keep query parameters and database errors out of logs and use the approved local secret store for QA tokens. Stored hashes cannot be replayed as cookies. Before enabling runtime execution, remove direct privileges that let the app role mint arbitrary sessions, change user status or platform roles, or otherwise manufacture trusted identity. Replace the current login, registration, invite, password reset, verification, and revocation grants with reviewed operations, including narrowly authorized pre-auth audit writes.
- Reject a deployment where the runtime owns protected tables, has TRUNCATE, or can assume a role that owns protected objects or can read the signing key. Review both direct and inherited grants, including table-level and column-level grants on identity tables. The staging preflight rejects known elevated roles and public-schema CREATE. The final cutover still needs the complete grant review.
- The dashboard, profile, employee history, employee list and detail APIs, directory API, and department list and detail APIs have a SQL read-only path selected by `SYMPHOWORK_TENANT_READ_CONTEXT=verified`. The verified bootstrap also uses PostgreSQL instead of legacy GUCs and exposes only the current user's profile. The compatibility tenant resolver refuses the legacy authorization fallback. Application code now requires this exact value and has no legacy mode; setting it is safe only after the coordinated database policy/grant cutover and QA acceptance. Before each verified data transaction, the wrapper checks that the database-resolved identity still matches the request user and organization. Platform sessions can bootstrap their own identity, but platform data operations still need independently verified per-operation capabilities.
- The private verifier rechecks session existence, expiry and token rotation, user status, platform role or active membership, and organization status at each statement snapshot. The runtime grant list for tenant reads is schema USAGE plus EXECUTE on `begin_request_context(text)`, `current_user_id()`, `current_organization_id()`, and `end_request_context()`. Approve those grants alongside safe session issuance, verified policies, and the identity-table privilege cutover. Keep direct key and verifier access revoked.

## Policy and query-path review gates

Use the existing table privilege matrix and source operation inventory to track each route and underlying query, then compare them to a fresh catalog export. The review must cover pages, migrated API handlers, services, jobs and nested transactions. Route-local JavaScript authorization does not propagate to an unrelated database transaction.

| Policy group | Forward cutover requirement |
|---|---|
| Standard organization policies, including employees, departments, approvals and notifications | Use verified organization equality for visibility and write checks. Preserve explicit organization predicates and action permissions. Dashboard aggregates, staff searches, pagination, joins and detail reads use the same transaction-bound context. |
| Memberships | Use tenant scope and a narrowly scoped self-read where needed. Keep the separate bootstrap read limited to the context-owner role. Do not add a new authorization branch based on a caller-set user ID. |
| Shared roles and ATS taxonomy rows | Keep approved global reads separate from tenant writes. Restrict creation, reassignment and deletion of global rows to a reviewed capability. |
| Invitation policies | Preserve valid workflows using a dedicated token-scoped, expiring operation. Keep general tenant and platform writes separately authorized. |
| Platform support and provisioning | Replace broad platform treatment with explicit verified capabilities. Account for audit writes that happen before a session exists. |
| Tables without an organization key | Review grants and policies for identity, organizations, permission joins, settings and billing catalogs. Membership validation alone does not constrain these tables. |

Replace the runtime policies and runtime permissions in the same release as the migrated transaction call sites. Remove legacy fallback paths before granting runtime access to the new context functions. Validate the complete policy manifest and a rollback from a disposable copy first.

`request-context-policy-review.sql` lists every matching catalog policy, emits restricted forward fragments and captures inverse DDL from the observed baseline. Embedded PostgreSQL tests rehearse both on a disposable schema. These fragments deliberately deny not-yet-migrated operations, including invitation acceptance without a session, membership administration, platform access and pre-auth audit writes. They must not be deployed as a full migration. The inventory leaves any unclassified policy without a generated fragment.

- The restricted membership proposal permits only SELECT with both verified organization and matching user ID. Retain the separate bootstrap-owner SELECT. Employee role enrichment and member administration need reviewed, operation-specific access to other memberships before activation.
- Shared rows need separate SELECT and mutation policies. Global SELECT requires an authenticated identity. Writes need verified tenant equality or an explicit global administration capability.
- Invitations require token-scoped lookup and acceptance covering membership, session issuance and audit in one transaction. The inline organization setter has been removed, and `withInvitationTokenTransaction` now fails closed until that database capability is implemented. Existing invitation policies still trust legacy context and must be replaced in the coordinated database cutover.
- `withTenantTransaction` still has call sites in employee, department, collaboration and workflow services. Some lack an authenticated request cookie or accept a caller-supplied executor. Migrate those contracts before switching them, along with direct queries that bypass helpers.
- The verified hook bootstrap uses `current_request_user()` and its own membership read. Legacy bootstrap remains for the current deployment. Platform dashboard, support, analytics, billing and provisioning still need operation-specific capabilities. Pre-authentication login audits need a narrow append operation with no tenant or platform escalation.

The static transaction inventory below covers explicit transaction entry points. The source-operation matrix is still needed for tenant-table queries issued outside these entry points.

| Entry points | Dependency before replacing legacy behavior |
|---|---|
| `tenant-read.ts` and `tenant-api-read.ts` | Eight read paths are wired to the verified read-only executor. Before enabling, deploy the coordinated policies and grants and complete the remaining callers. |
| `platform-read.ts` | Platform dashboard, SQL read-only mode and operation-specific capability checks. |
| `context.ts`, tenancy context, and the user/tenant/platform helpers in `db/client.ts` | Session and organization bootstrap, column grants, and a transaction contract that covers callers of the compatibility resolver. |
| Attendance, ATS, collaboration, departments, employees, expenses, leave and workflow services | Route-validated request identity must reach each transaction. Extract shared write flows that also run from jobs or invitations before applying a cookie-only contract. |
| Workflow and approval-task routes, plus employee invite route | Pass the verified executor into nested service operations and preserve atomic approval, invite and audit writes. |
| Platform analytics, authorization, commercial, configuration, features, operations, provisioning and support, plus organization approval route | Define database capabilities for each operation and its roles. Some operations intentionally span organizations. |
| Identity auth, audit, platform invitations and invitation helper | Dedicated pre-authentication/session issuance and invitation scopes. A session cookie cannot initialize these operations. |

## Journal, validation and rollback

The committed journal currently ends at `0018_invitation_token_context`. The unjournaled `0019` proposal is archived as `0019_membership_user_context.superseded.sql` outside the executable migration directory because it still uses a caller-set user identifier. Before assigning journal slots, inspect the configured migration metadata and compare live policy definitions. If the archived statement was manually applied in any environment, record that drift explicitly. Generate and review the journal entry and matching snapshots from the reconciled baseline and approved cutover SQL.

Review these read-only probes on the approved target using the application role:

```sql
SELECT current_database(), current_user, session_user, rolsuper, rolbypassrls
FROM pg_roles WHERE rolname = current_user;

SELECT tablename, policyname, roles, cmd, qual, with_check
FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename, policyname;

SELECT c.relname, c.relrowsecurity, c.relforcerowsecurity, row_security_active(c.oid)
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
JOIN pg_attribute a ON a.attrelid = c.oid AND a.attname = 'organization_id' AND NOT a.attisdropped
WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p') ORDER BY c.relname;
```

Before a QA cutover, capture complete policy DDL, ownership, grants and RLS flags, then rehearse restoring them. The staged-object rollback is separate. The final reverse migration must first restore the compatible application and policy contract, then revoke runtime context execution and remove private objects after their last dependency is gone. Stop if database identity, baseline or rollback reconciliation fails.

## DBA and QA sign-off

1. DBA confirms the isolated project and branch, role privileges and approved migration window. The staging scripts need DDL rights and the ability to assume the new non-login role during installation. RLS verification uses only the runtime login.
2. Application and database reviewers approve the complete forward and reverse diffs, the policy and grant inventory, and the journal changes. Verify permissions on the private schema, key table and functions before and after installation. Grant runtime execution only for the entry points it needs, including `current_request_user()`, alongside the reviewed runtime grants. Keep the verifier and signing key private.
3. QA provisions two independent organizations with approved users, active roles and memberships, employees and departments, and independent sessions. Also prepare inactive membership, expired and revoked session fixtures and a separately authorized platform account.
4. The opt-in harness still requires its approved endpoint, `RUN_RLS_QA_TESTS=1`, `RLS_QA_DATABASE_URL`, and `RLS_QA_ORGANIZATION_{A,B}_ID`, `RLS_QA_EMPLOYEE_{A,B}_ID` and `RLS_QA_DEPARTMENT_{A,B}_ID`. For this draft contract use `RLS_QA_SESSION_TOKEN_{A,B}`, `RLS_QA_EXPIRED_SESSION_TOKEN`, `RLS_QA_REVOKED_SESSION_TOKEN`, `RLS_QA_INACTIVE_USER_SESSION_TOKEN` and `RLS_QA_INACTIVE_MEMBERSHIP_SESSION_TOKEN` in place of the historical hash settings. Supply secrets through the approved local store.
5. Verify both directions at the SQL and HTTP layers, including departments, dashboard, filters and pagination, platform capabilities, unauthorized writes, overlapping requests, and connection reuse after commit and rollback. Use disposable rows and rollback-only write probes. The existing harness does not cover the full HTTP matrix.

After the DBA approves the named QA branch, use the approved QA connection through the local credential store. Run the read-only SQL inventory with `psql -X -v ON_ERROR_STOP=1 -f docs/security/request-context-policy-review.sql`. After separate approval of the staging DDL, the DBA can use the same options with `request-context-stage.sql`. Run the matching rollback file only against that staging deployment before any policy cutover. After the full reviewed migration and approved fixtures are in place, run `npm test -- --run src/lib/server/rls-qa.integration.test.ts` with the QA opt-in settings. Never pass connection credentials or session tokens on the command line.

## Local PostgreSQL check

`scripts/verify-rls-scratch.mjs` executes the staging SQL and rollback with disposable synthetic data on an in-process PostgreSQL WASM engine. It switches to the non-bypass application identity for assertions and never connects to a database URL. It exercises read-only transactions, sample tenant and self-read policies, session rejection and serial transaction reuse. It does not stand in for the full migration chain, the QA pooler or deployment branch acceptance.

```powershell
npm install --prefix scratch/rls-pglite --no-save --no-package-lock --ignore-scripts @electric-sql/pglite@0.5.17
node --test scripts/verify-rls-scratch.mjs
```

For a staged rollout, deploy code with verified reads disabled. Confirm the grant and policy inventory on QA, reconcile the journal, and rehearse forward and reverse migration plus restored application behavior. Enable verified mode only after approval and the full two-tenant acceptance run. If a cutover fails, drain requests and restore the approved compatible database and application versions together. A mode switch alone cannot restore a changed policy or grant.

### Disposable native PostgreSQL rehearsal on Windows

From the repository root, install the test binary under ignored scratch storage, then run the harness.

```powershell
npm install --prefix scratch/rls-native --no-save --no-package-lock --ignore-scripts @embedded-postgres/windows-x64@18.7.0-beta.19
node --test scripts/verify-rls-native.mjs
```

The harness starts a fresh SCRAM-authenticated loopback cluster on a dynamically allocated port. It generates synthetic tenant and session records and applies the staged functions and generated policies for 129 synthetic table shapes, including rehearsal of the captured policy rollback. Two simultaneous direct runtime logins verify distinct backend PIDs and tenant visibility. Both directions exercise update, delete and insert denial, followed by reads on both pooled connections after rollback. The harness stops its server; cluster files remain in ignored scratch storage. This exercise covers the PostgreSQL driver pool. Deployment-specific poolers, application endpoints and the full release policy inventory require separate verification.

### DBA baseline and concurrent HTTP acceptance

Use a DBA-approved disposable branch and its restricted runtime login. Before approving any DDL, record the provider branch ID and its association with both the direct endpoint and deployment pooler. From the checkout, capture the catalog using an approved read-only psql service.

```powershell
psql "service=symphowork_qa_readonly" -X -v ON_ERROR_STOP=1 -f docs/security/qa-cutover-baseline.sql -o qa-baseline.txt
```

Compare the membership policy and migration ledger against the version of 0019 at Git commit 2e4eecd. A matching policy establishes the current expression only. Resolving out-of-band execution requires deployment records. Keep catalog captures in the approved QA evidence store.

Configuration reads and single-session revocations have separate staging and rollback files. Stage them after the private context schema and reverse them before the context rollback. Review runtime schema usage, routine execution and effective direct, inherited and column grants together. These files do not revoke historical runtime table privileges. Hold rollout until the identity and platform cutover covers the remaining callers.

For HTTP acceptance, use the two real sessions and employee and organization IDs from the pooler suite. Both users need employee detail read permission. Set RLS_QA_APPROVED_HTTP_ORIGIN to the verified HTTPS application origin for that same branch. After approval and deployment, run in the environment containing the QA settings:

```powershell
$env:RUN_RLS_QA_TESTS = '1'
npm test -- src/lib/server/rls-qa.integration.test.ts
if ($LASTEXITCODE -ne 0) { throw 'Pooler checks failed' }
$env:RUN_RLS_HTTP_QA = '1'
node --test scripts/verify-rls-http-qa.mjs
```

Record the positive response and foreign-resource denial counts. Rehearse rollback on the disposable branch and compare a second baseline capture before authorizing rollout.

Failed-login audit staging grants the context owner INSERT on the two fixed event columns and adds an INSERT policy for that owner. The function accepts no payload. Apply failed-login-rollback.sql before request-context-stage-rollback.sql when reversing this component. Review the following function signatures for runtime execution only with the matching identity grant cutover:

- app_private.read_platform_configuration()
- app_private.revoke_presented_session(text)
- app_private.append_failed_login()

After a complete QA cutover, execute the runtime catalog gate with the same restricted credentials as the app:

```powershell
psql "service=symphowork_qa_runtime" -X -v ON_ERROR_STOP=1 -f docs/security/qa-cutover-postflight.sql
```
