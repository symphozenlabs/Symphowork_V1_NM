# Signed tenant context QA deployment package

**Status: BLOCKED — review and preparation only. Do not run a cutover from this package.**

This package records the verified implementation contract, current database blocker, existing SQL artifacts, deployment gates, and DBA permissions. It does not assert that the staged SQL is a complete migration. The approved QA connection is restricted to `sympowork_app`; the read-only catalog probe found no `app_private` schema or signed-context functions. The live inventory reports 129 tenant policies using mutable legacy GUCs and 11 public tables without RLS. No DBA-authorized DDL identity was available in the target environment.

## Verified application contract

The function signatures below are read from application callers and the existing staged SQL; they are not proposed guesses.

| Function | Required signature and return | Caller |
|---|---|---|
| `app_private.begin_request_context` | `(session_token text) RETURNS void` | `withRequestContext` passes the raw 43-character cookie as a bound parameter. The staged function hashes it in PostgreSQL and rejects an invalid, expired, revoked, inactive, or unbound session with SQLSTATE `28000`. |
| `app_private.current_request_user` | `() RETURNS TABLE (user_id uuid, organization_id uuid, email text, full_name text, platform_role text, must_change_password boolean)` | Verified hook/session resolution and platform/tenant bootstrap. |
| `app_private.current_user_id` | `() RETURNS uuid` | Tenant RLS predicates and transaction identity checks. |
| `app_private.current_organization_id` | `() RETURNS uuid` | Tenant RLS predicates and transaction identity checks. |
| `app_private.end_request_context` | `() RETURNS void` | Clears the transaction-local verified envelope before successful commit. |
| `app_private.valid_request_context` | Internal staged helper: `() RETURNS TABLE (user_id uuid, organization_id uuid, is_platform_owner boolean)` | Called by the public-to-runtime getter functions; no runtime execute grant is required. |
| `app_private.append_failed_login` | `() RETURNS void` | Failed-login path; fixed audit payload, no caller-supplied identity or metadata. |
| `app_private.revoke_presented_session` | `(session_token text) RETURNS void` | Logout/revocation path. |
| `app_private.read_platform_configuration` | `() RETURNS TABLE (key text, value text)` | Platform configuration service. |

The request-context wrapper starts one PostgreSQL transaction, invokes `begin_request_context`, checks the database-resolved identity, performs scoped SQL on that same transaction executor, and invokes `end_request_context` before a successful commit. A callback error aborts the transaction; the wrapper deliberately does not issue cleanup SQL in an aborted transaction. The context is tied to the backend and top-level transaction, and the staged secret is a random 32-byte value in a private table owned by a non-login context role. The runtime must have neither table access nor membership in that owner role. The design requires `pgcrypto` in `public` and a primary that can allocate transaction IDs in read-only transactions.

The current schema enforces one membership per user through a unique constraint on memberships.user_id. Confirm this constraint in the target catalog before staging. The cookie-only initializer resolves this membership and checks the organization status.

## Existing SQL artifacts and their limits

Keep these artifacts outside the automatic Drizzle migration journal until a complete migration and matching rollback have been reviewed. The staged files are transactional individually, but they are not one repeatable, coordinated cutover.

1. **Pre-deployment evidence:** `qa-cutover-baseline.sql` is read-only. Run it against the named disposable QA branch through the approved read-only service, retain the sanitized result, and reconcile it with the documented 2026-11-24 baseline and migration history.
2. **Private context staging:** `request-context-stage.sql` creates the context owner/schema/key and core functions. It intentionally leaves current RLS policies in place and does not grant runtime execution. `request-context-stage-rollback.sql` is only for that exact unpromoted stage.
3. **Narrow operations:** `failed-login-stage.sql`, `session-revocation-stage.sql`, and `platform-configuration-read-stage.sql` have corresponding rollback files. These cover only their named operations; they do not implement login lookup, session creation/lookup, registration, password reset/verification, invitation acceptance, general platform capabilities, or the rest of the identity and product access matrix.
4. **Policy review:** `request-context-policy-review.sql` is an inventory/generator, not a full cutover. Its fragments intentionally leave unsupported paths denied or unclassified. Do not execute generated fragments as a whole-table migration.
5. **Post-deployment gate:** `qa-cutover-postflight.sql` is read-only and must pass as the actual `sympowork_app` login only after the complete, reviewed cutover.
6. **Integration acceptance:** `src/lib/server/rls-qa.integration.test.ts` is gated and needs two approved organizations and synthetic QA fixtures. It has not passed against the current database because the trust objects are absent.

The existing policy inventory has special cases that cannot be replaced by a blanket tenant predicate: nullable/global rows in `roles`, `ats_skill_aliases`, and `ats_skill_taxonomy`; token-scoped invitation preview/acceptance; and platform-only `platform_support_notes` and `provisioning_jobs`. The 11 tables without RLS each need an explicit access design. Do not add a global platform-owner bypass or enable FORCE RLS indiscriminately.

## Shared and identity tables

| Table | Required access before promotion |
|---|---|
| users | The identity service verifies passwords and returns the authenticated actor. Expose self-profile fields and approved directory projections separately. Restrict status, credential and platform-role changes to their authorized operations. |
| sessions | Mint sessions only following authentication. Look up and revoke the presented credential through scoped operations. Block direct runtime session creation, deletion and hash reads. |
| password_reset_tokens | Bind issuance to a recovery request. Consume a valid unexpired token once, atomically with password change and session revocation. |
| email_verification_tokens | Bind issuance and consumption to the intended account. Check expiry and prior use in the same transaction as verification. |
| organizations | Permit the current active tenant to read its own organization. Require specific verified platform capabilities for the list, approval and provisioning paths. |
| permissions | Expose the permission keys needed by the verified role resolver. Reserve changes to the permission registry for authorized administration. |
| role_permissions | Scope assignment reads to eligible roles. Authorize assignment mutations independently and prevent tenant roles from modifying platform or other tenants' assignments. |
| plans | Expose published plan metadata used by billing. Restrict catalog writes to authorized platform billing operations. |
| plan_features | Read applicable published features through plan access. Require a platform capability for changes to entitlements. |
| platform_feature_flags | Restrict administration to authorized platform roles. Expose only the effective flags needed by a tenant. |
| system_config | Use the staged allowlisted platform configuration read operation. Restrict updates and other keys by operation. |

Compare effective table and column grants for each of these models, including grants obtained from PUBLIC and role membership. Record owner, effective RLS status and the decision about FORCE for each relation. The current direct identity queries in the application must be replaced in the same release as revocation of identity grants.

## Deployment order after design and authorization are complete

1. Obtain explicit approval naming a disposable QA branch and a DBA identity permitted to manage the context owner role/schema, protected objects, policies, and grants. Verify database/branch identity independently; never use an owner URL for application runtime.
2. Capture and review a fresh baseline with `qa-cutover-baseline.sql`. Confirm `sympowork_app` remains non-owner, `NOBYPASSRLS`, non-superuser, and unable to assume the context owner. Confirm `pgcrypto` and schema prerequisites.
3. Complete the caller/operation matrix before changing grants: authentication and session operations, tenant direct queries, nested writes, invites, platform operations, background jobs, shared/global data, storage, and reports. Verify the unique membership constraint against the catalog.
4. Produce one versioned, repeatable forward migration with an exact manifest and a matching reverse migration. Include all required private functions and narrowly authorized operations; replace every legacy policy with a reviewed per-table definition; define access for all 11 currently unprotected tables; then apply least-privilege grants. Keep the runtime in blocked/maintenance mode during this transition.
5. Run synthetic two-tenant, invalid/expired/revoked session, forged-GUC, pool-reuse, rollback, invitation, platform-capability, global-table, and worker tests on the disposable branch. Rehearse reverse migration there and compare a fresh baseline.
6. Run `qa-cutover-postflight.sql` as the restricted runtime login and the gated QA integration/HTTP acceptance suite. Only after all gates pass may the operator configure `SYMPHOWORK_TENANT_READ_CONTEXT=verified` and restart the app.
7. If a transaction fails before commit, roll it back. After commit, use only the matching reviewed reverse migration for that recorded migration/version and verified baseline; never restore legacy GUC policies as a normal runtime state. Keep the application blocked if safe rollback cannot be established.

## Required DBA permissions

### Recorded `SET ROLE` failure

The previous QA attempt stopped with SQLSTATE `42501` at `SET LOCAL ROLE sympowork_context_owner`. The recorded read-only QA catalog identifies PostgreSQL 18.7 and `neondb_owner` with `CREATEROLE`; it does not show `sympowork_context_owner` in the snapshot's memberships. PostgreSQL 18 automatically grants the creator `ADMIN TRUE, SET FALSE, INHERIT FALSE` on a role it creates. Thus the reported error is explained by the default `SET FALSE`, not by a Neon prohibition. PostgreSQL documents changing membership options with `GRANT`; see [PostgreSQL 18 role attributes](https://www.postgresql.org/docs/18/role-attributes.html) and [GRANT role membership](https://www.postgresql.org/docs/18/sql-grant.html).

For the recorded PG18.7 `neondb_owner` deployment identity, the tested statement after creating `sympowork_context_owner` is `GRANT sympowork_context_owner TO CURRENT_USER WITH SET TRUE, INHERIT FALSE;`, followed by `SET LOCAL ROLE sympowork_context_owner`. PostgreSQL records the automatic creator ADMIN grant separately from the creator's explicit SET-capable grant. The tested explicit grant has `SET TRUE, INHERIT FALSE, ADMIN FALSE`; the original automatic ADMIN grant remains `ADMIN TRUE, SET FALSE, INHERIT FALSE`. Explicitly repeating `ADMIN TRUE` in a self-grant is rejected with SQLSTATE `0LP01`. This adds only the SET authority needed by the deployment principal; it adds no runtime membership and does not make context-owner privileges ambient. Do not grant any role membership to `sympowork_app`. The complete cutover artifact now contains this statement but remains **DO NOT EXECUTE** for the unrelated missing contract items documented below.

Before a future deployment, the DBA must re-check exact server version, database/branch identity, `current_user`, `session_user`, `CREATEROLE`, and role membership from the approved disposable branch. For the recorded PostgreSQL 18.7 baseline, `neondb_owner` is the exact database role evidenced as CREATEROLE; it can self-enable `SET` on a role it created while retaining `INHERIT FALSE`. Do not assume the same authority for a different branch or role. If the role was created by another owner, or the membership option update is denied, use the role owner/authorized grantor identified from that branch's catalog; do not elevate `sympowork_app` or assume a Neon-wide superuser behavior.

This checkout does not contain a verified Neon deployment identity or a complete forward/reverse migration. `complete-dba-cutover.sql` is now marked **DO NOT EXECUTE**: its name previously overstated readiness. The runtime contract is also incomplete for login/session creation, registration, password reset/email verification, invitation preview/acceptance, operation-specific platform capabilities, and the 11 unprotected relations. A DBA should not execute any cutover artifact from this checkout until those functions, grants, policies, caller matrix, and rollback are complete and reviewed.

The DDL identity must be explicitly approved for the disposable QA branch and have enough authority to create/manage the non-login context-owner role, create/own `app_private` objects, grant only the enumerated column/function privileges, add the context-owner membership bootstrap policy, replace tenant policies, and review/revoke the relevant runtime ACLs. PostgreSQL ownership or authorized membership for the affected public tables is required to alter their policies. Any role-management privilege must be used only for this reviewed QA deployment. The `sympowork_app` role is not suitable and must not receive those privileges.

The deployment identity is not available in this checkout: only the restricted application connection is configured; no approved DBA service entry or `psql` executable was found. Therefore **stop before DDL**. The catalog snapshot is historical evidence, not authorization to use `neondb_owner` or a live database connection. The existing SQL is not a substitute for the missing caller matrix, policy definitions, and complete grants/rollback package.

## Exact operator commands

These commands are for the approved DBA/QA runner, not this checkout. They do not put credentials on the command line. Do not run the staged `*-stage.sql` files as a substitute for the missing complete migration.

Capture the pre-deployment baseline through the approved read-only identity:

```powershell
psql "service=symphowork_qa_readonly" -X -v ON_ERROR_STOP=1 -f docs/security/qa-cutover-baseline.sql -o qa-baseline-before.txt
```

On a disposable branch, the DBA can rehearse private-object staging with the following commands after checking each script against the baseline. Configure the service alias in the operator's local secret store. The SQL files each own their transaction. Stop on the first failure and record which transactions committed.

```powershell
$stages = 'request-context', 'failed-login', 'session-revocation', 'platform-configuration-read'
foreach ($stage in $stages) {
  psql "service=symphowork_qa_ddl" -X -v ON_ERROR_STOP=1 -f "docs/security/$stage-stage.sql"
  if ($LASTEXITCODE -ne 0) { throw "Staging stopped at $stage" }
}
```

Before policy promotion, reverse only the committed stages, in reverse order. Use the matching files `platform-configuration-read-rollback.sql`, `session-revocation-rollback.sql`, `failed-login-rollback.sql` and `request-context-stage-rollback.sql` with the same psql flags. Keep the private schema inaccessible to the runtime throughout this rehearsal. The baseline and postflight use different identities because the runtime must have no DDL authority.

After a separately reviewed full migration, run the runtime gate as the actual restricted application login:

```powershell
psql "service=symphowork_qa_runtime" -X -v ON_ERROR_STOP=1 -f docs/security/qa-cutover-postflight.sql
```

Only after that gate and the independently provisioned two-tenant fixtures are ready, run the gated acceptance checks in an environment that already contains the approved QA settings:

```powershell
$env:RUN_RLS_QA_TESTS = '1'
npm test -- src/lib/server/rls-qa.integration.test.ts
if ($LASTEXITCODE -ne 0) { throw 'Pooler checks failed' }
$env:RUN_RLS_HTTP_QA = '1'
node --test scripts/verify-rls-http-qa.mjs
```

If any migration statement fails before commit, roll back the open transaction. After commit, rollback is permitted only through the matching, versioned reverse migration rehearsed against the same disposable branch and baseline. No such complete forward/reverse pair exists yet, so there is currently **no safe SQL command to deploy or roll back a full cutover**.

## Verification record for this package

- Read-only QA catalog check: database `neondb`; current and session role `sympowork_app`; `SUPERUSER=false`; `BYPASSRLS=false`; transaction read-only; `app_private` and all five core functions absent.
- Environment: `.env.example` documents `SYMPHOWORK_TENANT_READ_CONTEXT=verified`; `.env.local` does not currently enable verified mode. Do not enable it before database cutover.
- No database writes, DDL, migration, credential changes, or attendance/employee changes were made while preparing this package.
