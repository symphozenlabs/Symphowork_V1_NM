# SymphoWork database contract readiness

**Deployment verdict: NOT READY.** The recorded Neon ownership blocker is resolved for PostgreSQL 18.7, but the application-to-database contract is not complete. The companion [database capability matrix](database-capability-matrix.csv) is a 140-table static source inventory, not an approved least-privilege grant manifest. Do not execute either `complete-dba-cutover.sql` or `complete-dba-rollback.sql`.

## Evidence and coverage

- The recorded QA catalog snapshot identifies PostgreSQL 18.7, database `neondb`, and deployment role `neondb_owner`; that role has `CREATEROLE`. Its membership in `sympowork_context_owner` is absent from the recorded snapshot. The application identity is separately recorded as `sympowork_app`, non-superuser and `NOBYPASSRLS`.
- The previous `SET LOCAL ROLE sympowork_context_owner` failure is explained by PostgreSQL 18 role-creation defaults: the creator's automatic role membership has `ADMIN TRUE`, but `SET FALSE` and `INHERIT FALSE`. The native PG18.7 reproduction passes only after the creator grants itself a separate non-inheriting SET membership with `GRANT sympowork_context_owner TO CURRENT_USER WITH SET TRUE, INHERIT FALSE;`. Repeating `ADMIN TRUE` in the self-grant fails with SQLSTATE `0LP01`.
- Static source inventory: 492 operation/capability callsite records in `db-callers.json`; 140 public table candidates; 129 RLS-enabled tables and 11 public tables without RLS in the recorded live catalog snapshot. There are 203 direct `db.select`, 78 `db.insert`, 44 `db.update`, and 4 `db.delete` call records. Those counts do not prove whether every operation is inside a valid context transaction. The table inventory records source files, not every service-to-route call chain.
- The table-level matrix found 68 table rows where none of the listed source files contains a recognized verified transaction wrapper. A higher-level caller may wrap the operation, so each remains unresolved until the call chain is traced.

## Required runtime contract

1. **Tenant request context:** `begin_request_context(session_token)` validates an active, unexpired session and exactly one active organization membership, then signs a transaction/backend-bound context. Every tenant query must execute on the same transaction after initialization. Tenant RLS reads `current_organization_id()` and `current_user_id()`; `USING` and `WITH CHECK` must constrain both old and new rows. App authorization still checks the route's permission before SQL.
2. **Tenant direct-query coverage:** route and service SQL must be enclosed by `withVerifiedTenantTransaction`, `withVerifiedTenantWriteTransaction`, `tenantApiRead`/`tenantApiWrite`, or `tenantRead` (including a proved enclosing call chain). The context created in the server hook is resolved in its own transaction and cannot authorize later pooled queries. Source inspection currently finds many direct operations with no demonstrated enclosing transaction.
3. **Platform operations:** `withPlatformTransaction` currently accepts only a callback and authenticates a platform user; it does not bind an operation permission into the database. `authorizePlatform` checks an application permission, but the database contract has no matching operation-specific platform capabilities. Platform reads/writes must not be authorized by a generic platform-owner bypass.
4. **Authentication/session operations:** database functions are required for safe credential lookup, session issue/read/revoke, registration, email verification, reset-token issue/consume, and password update/session invalidation. Current staged SQL provides only failed-login append and presented-session revoke among these operations. Direct access to `users`, `sessions`, and token tables must remain revoked from `sympowork_app` until replacements are complete.
5. **Invitations/memberships:** token preview and acceptance need separate token-bound read/consume capabilities that validate expiry, email, role and organization and create membership atomically. The application transaction helper intentionally fails closed; no matching database capability exists. Membership workflows need separately reviewed SELECT/INSERT/UPDATE checks; ordinary tenant access must not allow DELETE or cross-tenant role assignment.
6. **Background workers:** each job needs a distinct machine identity/capability and table/action allowlist. A user-session context or broad platform context is not an acceptable worker identity. The inventory does not map every worker and nested service operation to a job principal.
7. **Audit and notifications:** tenant audit insert/read and notification creation/delivery/preferences/read/acknowledgement need tenant-bound transactions. Audit UPDATE/DELETE remain denied. Pre-auth failed-login append stays a separate narrow function. Platform audit reads require a platform audit capability.

## Eleven tables without RLS in the recorded catalog

| Relation | Required treatment before granting runtime access |
|---|---|
| `users` | No direct runtime DML. Narrow credential verification and self-profile projections; status, password hash and platform-role mutation are separate capabilities. |
| `sessions` | No direct runtime SELECT/INSERT/DELETE. Issue after authentication; validate via signed-context initializer; revoke only the presented bearer session through the existing narrow revoke function. |
| `password_reset_tokens` | No direct runtime DML. Issue and atomically consume a one-use, unexpired token with password update and session invalidation. |
| `email_verification_tokens` | No direct runtime DML. Issue and consume against the intended account in one transaction. |
| `organizations` | Tenant self-read only for active signed organization; platform list/provision/approve/status actions use separate capabilities. |
| `permissions` | Bounded permission-key reads for role resolution; registry mutations outside ordinary runtime access. |
| `role_permissions` | Resolve only the active role's permissions; assignment writes require tenant/admin policy and cannot alter platform or foreign-tenant assignments. |
| `plans` | Expose only published catalog fields to tenant billing reads; platform plan writes require billing capability. |
| `plan_features` | Read applicable published entitlements; mutations require entitlement capability. |
| `platform_feature_flags` | Tenant access exposes effective flags only; platform administration requires feature-view/manage capabilities. |
| `system_config` | No direct runtime table access; the existing read capability is allowlisted. Configuration writes still need a narrow capability. |

The `drizzle.__drizzle_migrations` relation is separately recorded without RLS and without runtime privileges; preserve that no-runtime-access state.

## Neon DBA role and exact action

The recorded database role suited to the attempted DDL is **`neondb_owner` on the approved disposable QA branch**, because the captured PG18.7 catalog reports `CREATEROLE` for it and PostgreSQL automatically gives a CREATEROLE role ADMIN on roles it creates. The QA snapshot is historical evidence, not current branch verification or deployment authorization. A DBA must verify branch/database/current/session identity and the role's current ADMIN membership before any DDL.

After creating `sympowork_context_owner`, the minimal tested grant is:

```sql
GRANT sympowork_context_owner TO CURRENT_USER WITH SET TRUE, INHERIT FALSE;
SET LOCAL ROLE sympowork_context_owner;
```

Do not include `ADMIN TRUE` in that self-grant; the native PostgreSQL 18.7 test rejected it with `0LP01`. Do not grant membership to `sympowork_app`. Do not grant `BYPASSRLS` or superuser to the app identity. The full cutover remains blocked until its other contracts and rollback are complete; this snippet is not authorization to run the incomplete scripts.

## Scratch evidence and limits

- `node --test scripts/verify-neon-role-grant-native.mjs`: 1/1 passed on isolated native PostgreSQL 18.7. It verified the creator's default options, the explicit SET-only membership, SECURITY DEFINER schema/function ownership, rejection of runtime `SET ROLE`, and runtime `NOSUPERUSER NOBYPASSRLS`.
- `node --test scripts/verify-rls-native.mjs`: 4/4 passed on isolated native PostgreSQL 18.7. It exercised synthetic tenant policies generated from the policy map, both-direction isolation, two simultaneous app connections, denied cross-tenant writes, and rollback/reuse. It does not apply the full forward SQL or represent all application tables and capabilities.
- `node --test scripts/verify-rls-scratch.mjs`: 14/14 passed on disposable PostgreSQL WASM. It checks sample policies, membership/audit restrictions, session rejection, rollback/connection reuse and rerun/key preservation. It does not verify the complete cutover.
- No SQL was executed against Neon/shared QA; no QA business rows were changed. No complete forward/reverse SQL was executed or tested on a Neon branch.

## Remaining work before deployment readiness

1. Trace each of the 492 static caller records from route/worker through service and transaction boundary; replace or wrap every direct authenticated query, and attach the exact required permissions/capability.
2. Implement and test identity, session-create, invitation, operation-specific platform, global catalog/configuration, notification and worker capabilities; map each call to its exact signature and transaction mode.
3. Review all 129 table policies and each of the 11 no-RLS relations, enumerate effective grants including `PUBLIC`, add per-table column grants, and preserve append-only audit behavior.
4. Produce a versioned forward migration and exact inverse that restores the captured pre-state, including original owners, ACLs, functions, policies, role memberships and `request_context_key` state. Rehearse both on a named disposable Neon branch.
5. Run full contract tests against that branch, compare pre/post catalogs, run app API tests as `sympowork_app`, then authorize verified mode and login acceptance.

Until these gates pass, database cutover and real login acceptance are blocked.
