# PostgreSQL RLS Remediation — Phase 2C Engineering Proposal

**State: proposal only. No database DDL, grants, policies, environment settings, or runtime cutover have been applied.** This document and the gated QA test are new artifacts. Application source was not changed because the current database has no trusted context function and switching the app role before that function/policy path exists would break login and invitation workflows.

## Scope and evidence

Read-only catalog inspection was restricted to the operator-confirmed Neon `SymphoWork_NM` / `naresh-dev` QA endpoint. The identity query returned database `neondb` and current role `neondb_owner`. The Svelte workspace remains on `svelte-migration`, HEAD `2e4eecd3b9ac10379a320fa12a9691e92bd27b2f`; it had 525 existing working-tree entries before this proposal. No original Next.js files were inspected or changed in this phase.

The `public` schema contains 140 base tables; all are owned by `neondb_owner`. There are 129 tables with `organization_id`; each has RLS enabled and exactly one policy; none has FORCE RLS. The other 11 tables have no `organization_id` and no RLS: `email_verification_tokens`, `organizations`, `password_reset_tokens`, `permissions`, `plan_features`, `plans`, `platform_feature_flags`, `role_permissions`, `sessions`, `system_config`, and `users`.

The target has 140 Drizzle table declarations in both `src/db/schema.ts` and `src/lib/server/schema.ts`; the database catalog has 140 public tables (count parity only; this was not an exact column/constraint parity check). QA has 19 Drizzle migration-history rows. The target has no `drizzle/` directory, `drizzle.config.ts`, or SQL migration files; `src/db/migrate.ts` points to `./drizzle`, and `package.json` has no migration script.

### Tenant table inventory

All names below are from `public` catalog columns, not a guessed source list.

- **ATS (46):** `ats_application_stage_history`, `ats_applications`, `ats_assessment_types`, `ats_assessments`, `ats_candidate_activities`, `ats_candidate_certifications`, `ats_candidate_documents`, `ats_candidate_education`, `ats_candidate_experience`, `ats_candidate_field_provenance`, `ats_candidate_languages`, `ats_candidate_links`, `ats_candidate_notes`, `ats_candidate_number_counters`, `ats_candidate_projects`, `ats_candidate_skills`, `ats_candidate_sources`, `ats_candidate_tag_links`, `ats_candidate_tags`, `ats_candidates`, `ats_communications`, `ats_embedding_jobs`, `ats_embeddings`, `ats_interview_feedback`, `ats_interviewers`, `ats_interviews`, `ats_job_requirements`, `ats_jobs`, `ats_match_results`, `ats_pipeline_stages`, `ats_pipelines`, `ats_requisition_number_counters`, `ats_requisitions`, `ats_resume_conflicts`, `ats_resume_extraction_fields`, `ats_resume_extractions`, `ats_resume_processing_attempts`, `ats_resume_processing_configs`, `ats_resume_processing_jobs`, `ats_saved_searches`, `ats_semantic_configs`, `ats_semantic_search_queries`, `ats_skill_aliases`, `ats_skill_taxonomy`, `ats_talent_pool_members`, `ats_talent_pools`.
- **Attendance (4):** `attendance_policies`, `attendance_punches`, `attendance_records`, `attendance_regularization_requests`.
- **Collaboration (17):** `collaboration_activity`, `collaboration_attachments`, `collaboration_conversation_members`, `collaboration_conversations`, `collaboration_mentions`, `collaboration_message_reactions`, `collaboration_message_task_links`, `collaboration_messages`, `collaboration_presence`, `collaboration_project_members`, `collaboration_projects`, `collaboration_task_comments`, `collaboration_task_dependencies`, `collaboration_task_label_links`, `collaboration_task_labels`, `collaboration_task_watchers`, `collaboration_tasks`.
- **Core tenant tables (44):** `approval_history`, `approval_tasks`, `audit_logs`, `billing_usage`, `departments`, `designations`, `document_history`, `document_types`, `employee_documents`, `employee_history`, `employee_payroll_profiles`, `employee_salary_assignments`, `employees`, `employment_types`, `expense_categories`, `expense_claims`, `expense_history`, `expense_items`, `expense_number_counters`, `expense_policies`, `expense_receipts`, `holidays`, `invitations`, `leave_applications`, `leave_balances`, `leave_policies`, `leave_transactions`, `leave_types`, `locations`, `memberships`, `onboarding`, `onboarding_checklist_items`, `platform_support_notes`, `project_number_counters`, `provisioning_jobs`, `roles`, `salary_components`, `salary_structure_components`, `salary_structures`, `shifts`, `subscriptions`, `task_number_counters`, `teams`, `working_days`.
- **Notifications (5):** `notification_deliveries`, `notification_outbox`, `notification_preferences`, `notification_templates`, `notifications`.
- **Payroll (9):** `payroll_adjustments`, `payroll_calculation_snapshots`, `payroll_line_items`, `payroll_payslips`, `payroll_periods`, `payroll_run_employees`, `payroll_runs`, `payroll_statutory_configurations`, `payroll_tax_configurations`.
- **Workflows (4):** `workflow_definitions`, `workflow_instances`, `workflow_steps`, `workflow_versions`.

### Policy inventory

There are 129 permissive `FOR ALL TO PUBLIC` policies. Expression classes are:

1. 123 standard tenant predicates: organization matches `app.current_organization_id`, OR `app.is_platform_owner = true`.
2. Three predicates also allow `organization_id IS NULL`: `ats_skill_aliases`, `ats_skill_taxonomy`, `roles`.
3. `invitations_tenant_isolation` additionally permits token-based row visibility in `USING`; its `WITH CHECK` omits the invitation-token branch.
4. Two platform-only policies: `platform_support_notes_platform_isolation`, `provisioning_jobs_platform_isolation`.

126 policies have no explicit `WITH CHECK`; for `ALL` policies PostgreSQL uses `USING` as the implicit check. This is not by itself a missing write check, though future definitions should make write intent explicit. [PostgreSQL CREATE POLICY](https://www.postgresql.org/docs/current/sql-createpolicy.html)

All 129 policies trust the `app.is_platform_owner` custom setting; 127 also trust `app.current_organization_id`. These settings are user-settable session parameters, so they are useful as application-provided context only when the database independently validates the context. A plain `set_config` call is not that validation. [PostgreSQL configuration settings](https://www.postgresql.org/docs/current/config-setting.html)

## Access-path trace and code changes required

The active path is SvelteKit `src/routes/api/**/+server.ts` → `src/lib/server/endpoint.ts` → `src/lib/server/api/**/route.ts` → `src/modules/**`. Server page loaders also call handlers in-process through `src/lib/server/legacy.ts` and `src/lib/server/api-dispatch.ts`; some loaders perform their own Drizzle reads. `src/app/api/**` is a parallel compatibility/legacy tree and must be classified route-by-route before it is relied on for the grant matrix. Static symbol scanning is not sufficient to identify all dynamic or raw-SQL operations.

Database/context code paths found:

- `src/db/client.ts`: lazy Postgres.js pool, Drizzle client, and `withUserTransaction`, `withTenantTransaction`, `withPlatformTransaction`, `withInvitationTokenTransaction`. These helpers call `set_config(..., true)` inside transactions; the transaction-local setting is appropriate for pool reuse, but it is forgeable and `withTenantTransaction` sets only organization context.
- `src/lib/server/context.ts`: standalone session/user lookup followed by a transaction that sets user context, reads `memberships`, then sets organization context. With the current membership policy, a non-owner app role cannot read the membership before the organization is set.
- `src/modules/tenancy/context.ts`: alternate authentication/tenant-context path using `requireSession`, cached request context, and tenant/user transaction helpers. It must converge on one validated DB context mechanism.
- `src/lib/server/tenant-read.ts` and `src/lib/server/platform-read.ts`: direct server-side read transactions. The latter trusts an app-set platform flag after app-layer permission checking.
- `src/modules/identity/auth.ts`: session creation, lookup, revocation and password/token flows. Session and token tables are currently unprotected by RLS.
- `src/modules/**` (ATS, attendance, billing, collaboration, departments, documents, employees, expenses, identity, leave, notifications, payroll, platform, recruiter/resume intelligence, tenancy, workflows) and `src/lib/server/api/**`: direct table operations and service transactions.
- `src/routes/**/+page.server.ts`: server loaders with direct data reads or in-process API calls.
- Platform operations in `src/modules/platform/**`, provisioning and invitation acceptance in `src/modules/platform/invitations.ts`, and job-like processing endpoints (attendance absence processing, notification outbox, resume processing, provisioning) need separately authorized context. No independent scheduler/worker deployment was verified.

Required application changes before cutover:

1. `src/db/client.ts`: require the dedicated app credential at runtime; add a transaction wrapper that calls a database-owned `begin_request_context(sessionTokenHash)` and `end_request_context()` on the same checked-out connection. No tenant/platform context may be accepted from a client-supplied organization ID.
2. `src/lib/server/context.ts`, `src/modules/tenancy/context.ts`, `src/modules/identity/auth.ts`: unify session validation and membership bootstrap through the DB context function; avoid direct session-hash and cross-user membership reads from the app role.
3. `src/lib/server/endpoint.ts`, `src/lib/server/api-dispatch.ts`, `src/lib/server/compat/headers.ts`, `src/lib/server/legacy.ts`, and all active API handlers/services: pass only the verified request session hash into the transaction context wrapper. Ensure every DB transaction, including nested module and platform operations, has exactly one context and cleanup path.
4. `src/lib/server/tenant-read.ts`, `src/lib/server/platform-read.ts`: remove freely settable GUC authorization and use protected context functions.
5. `src/modules/platform/**`, `src/modules/platform/invitations.ts`, invitation API handlers, notification/ATS processing and attendance processing: split tenant operations, invitation-token capabilities, platform permissions, and background service capabilities. Do not grant a general platform bypass to a tenant runtime role.
6. `src/db/schema.ts` and `src/lib/server/schema.ts`: reconcile the duplicate schema declarations; add DB-private context schema/functions only after SQL has been reviewed.
7. Every table-referencing file under `src/lib/server/api/**`, `src/modules/**`, `src/routes/**`, and any confirmed runtime use of `src/app/api/**`: classify SELECT/INSERT/UPDATE/DELETE and indirect/raw SQL operations. No precise least-privilege grants are ready until this matrix is complete.

Static access scan found direct Drizzle table symbol references for 116 of 140 tables across 500 TypeScript/JavaScript files in the scanned roots. The scan is only a draft: it includes parallel legacy sources and misses dynamic/raw SQL and indirect access. It must not be used as a final grant matrix.

## Context mechanism proposal

Use a **protected transaction-context ledger**, rather than trusting custom GUC values:

1. A new `NOLOGIN NOBYPASSRLS NOINHERIT` role (proposed name `sympowork_context_owner`) owns only a private schema/table and `SECURITY DEFINER` context functions. The app role must not be a member of it, and the functions use a fixed `search_path`, schema-qualified references, revoked `PUBLIC` execution, and minimal grants.
2. `begin_request_context(token_hash)` validates an unexpired session, active user, active membership and active organization. It inserts `{backend_pid, transaction_id, user_id, organization_id, verified_platform_role, context_kind}` into a private table keyed by backend PID and current transaction ID. The function returns only the sanitized identity/role fields required to build request context.
3. RLS predicates call private `current_user_id()`, `current_organization_id()`, and narrowly defined platform/capability predicates that read the protected ledger for the current backend PID + transaction ID. The app role cannot write/read the ledger or forge its row with `set_config`. Existing public GUCs are ignored by policies.
4. `end_request_context()` deletes only the caller’s current transaction row. App transaction wrappers must invoke it in `finally` before commit. Rollback naturally removes the ledger insert. A periodic bounded cleanup for stale committed rows is still required if cleanup is missed; stale rows never match a different transaction ID.
5. The context owner needs narrowly scoped access to session/user/membership/organization identity data. Membership bootstrap requires a dedicated SELECT policy for the non-login context owner; it must not grant that access to `sympowork_app`. App reads/writes of the 11 global tables need separately reviewed grants or narrow definer functions.
6. Any cross-organization platform capability is derived from the verified session’s stored platform role and, where applicable, an explicit operation capability. It is not represented by an app-set `is_platform_owner` flag. Platform route RBAC remains mandatory as well.
7. The request’s cookie token is already a bearer credential, so its hash must stay in process/parameter memory only: never log it, return it from the DB function, store it in the context table, or include it in errors. The context row stores only validated IDs and role/capability data.

This design has a database trust boundary: the non-login function owner and context function bodies. It does not turn a compromised application server into a trustworthy principal; minimizing the exposed app role and validating every supplied session are still required.

## Access/grant matrix status

Observed app role `sympowork_app`: LOGIN; no superuser/BYPASSRLS/CREATEDB/CREATEROLE; NOINHERIT; owns no public tables; no `CREATE` on `public`; CONNECT and schema USAGE; explicit SELECT/INSERT/UPDATE/DELETE on all 140 tables; no TRUNCATE, REFERENCES or TRIGGER. `neondb_owner` is currently a member of `sympowork_app` with admin option; no inverse membership was observed. The app role credential was not tested.

| Data class | Required access design (not yet granted) |
|---|---|
| 129 tenant tables | SELECT on tables used by read paths; INSERT/UPDATE/DELETE only for handlers that perform each operation; tenant RLS applies to all commands with explicit `USING` and `WITH CHECK`. |
| `memberships` | Bootstrap SELECT only through the protected context function; app SELECT limited to current tenant and authorized admin workflows; writes only through membership/invitation operations. |
| `sessions`, `email_verification_tokens`, `password_reset_tokens` | No general app SELECT; lookup/revoke/consume through narrowly scoped authentication functions; INSERT only for session/token creation. |
| `users` | No unrestricted cross-user read. Separate self, same-tenant employee join, and verified platform operations. Login must use a narrowly exposed lookup/verification path. |
| `organizations` | Current organization read by tenant context; platform list/status/provisioning through verified platform operations. No general tenant DML. |
| `permissions`, `role_permissions`, `roles` | Shared permission catalog read-only except controlled platform/tenant role management; tenant roles remain RLS scoped. |
| `plans`, `plan_features`, `subscriptions`, `platform_feature_flags`, `system_config` | Platform-only writes, read access only where product paths require it; feature/config secrets must not be exposed as broad table reads. |
| `platform_support_notes`, `provisioning_jobs` | Scoped platform support/provisioning service operations only; no generic platform-owner bypass from the app role. |
| Background workers | Separate job capability/role and narrow operation grants; no app-set platform context or owner credential. |

The observed `sympowork_app` grants are too broad to call least-privilege. A blanket `REVOKE` is not safe until each operation and indirect dependency is enumerated and tested.

## Reviewed SQL proposal (not executable as-is)

The complete deployable migration is **blocked** on completing the operation matrix, defining the auth-function return contract, handling global-table read/write workflows, and reviewing every worker/platform capability. The following is the reviewed SQL shape; it is not applied and deliberately does not include a broad grant/revoke loop or blanket FORCE statement.

### Existing runtime role posture

`sympowork_app` already exists and has the desired non-owner/non-bypass attributes. A future idempotent hardening statement may be:

```sql
ALTER ROLE sympowork_app
  LOGIN
  NOINHERIT
  NOBYPASSRLS
  NOCREATEDB
  NOCREATEROLE;

GRANT CONNECT ON DATABASE neondb TO sympowork_app;
GRANT USAGE ON SCHEMA public TO sympowork_app;
```

Do not grant `CREATE` on `public`, table ownership, `BYPASSRLS`, or membership in an owner/context-owner role. Do not use the current broad all-table DML grants as proof of least privilege.

### Protected context schema (design SQL; helper bodies and auth-table grants still require review)

```sql
CREATE ROLE sympowork_context_owner NOLOGIN NOINHERIT NOBYPASSRLS;
CREATE SCHEMA app_private AUTHORIZATION sympowork_context_owner;
REVOKE ALL ON SCHEMA app_private FROM PUBLIC;
GRANT USAGE ON SCHEMA app_private TO sympowork_app;

CREATE TABLE app_private.request_context (
  backend_pid integer NOT NULL,
  transaction_id bigint NOT NULL,
  user_id uuid NOT NULL,
  organization_id uuid,
  platform_role text NOT NULL,
  context_kind text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  PRIMARY KEY (backend_pid, transaction_id)
);
ALTER TABLE app_private.request_context OWNER TO sympowork_context_owner;
REVOKE ALL ON app_private.request_context FROM PUBLIC, sympowork_app;

-- Required SECURITY DEFINER functions, all owned by sympowork_context_owner,
-- fixed search_path, qualified object references, PUBLIC EXECUTE revoked:
--   app_private.begin_request_context(token_hash text)
--   app_private.end_request_context()
--   app_private.current_user_id() returns uuid
--   app_private.current_organization_id() returns uuid
--   app_private.current_platform_role() returns text
-- The begin function must validate session/user/membership/organization in DB,
-- write context for pg_backend_pid() + txid_current(), and return no token/hash.
-- The current_* functions must return NULL absent a valid current-transaction row.
-- Grant app role EXECUTE only on the functions it must call; no ledger privileges.
```

The SQL above is not sufficient by itself: the function bodies, context-owner SELECT policy on `memberships`, and authentication function flow must be reviewed before installation. Context owner access must not be inherited by `sympowork_app`.

### Tenant policy shape

After private context functions exist and the request bootstrap path is working, replace each existing public policy with a role-scoped policy. For an ordinary tenant table:

```sql
ALTER POLICY employees_tenant_isolation ON public.employees
  TO sympowork_app
  USING (organization_id = app_private.current_organization_id())
  WITH CHECK (organization_id = app_private.current_organization_id());
```

This is a template, not a complete policy migration. The 3 nullable/global-row tables, invitations, two platform-only tables, and all 11 global tables need their distinct reviewed policies. `invitations` token acceptance must use a narrowly scoped verified token capability in both row visibility and write validation (or a definer operation), not the current GUC exception. Remove the `app.is_platform_owner` escape branch from all policies.

Consider `FORCE ROW LEVEL SECURITY` for the 129 tenant tables only after owner/migration/admin access and background jobs are designed. It is defense against accidental table-owner bypass for roles without BYPASSRLS; it does not constrain `neondb_owner` while that role has BYPASSRLS. [PostgreSQL row security documentation](https://www.postgresql.org/docs/16/ddl-rowsecurity.html)

## Rollback procedure

1. Before any approved QA migration, save a sanitized catalog snapshot (table owners, role flags, ACLs, policy definitions, RLS/force flags) and identify the exact migration hash.
2. Apply DDL in a reviewed migration transaction where PostgreSQL supports transactional execution. Do not drop the old policy/function/grant until its replacement is validated in the same QA release plan.
3. If checks fail before commit, roll back that transaction. If a committed QA migration fails, run a reviewed reverse migration that restores the captured grants/policies/flags and removes only newly created private objects after confirming no dependent code is using them.
4. Keep the application in maintenance/blocked mode until the least-privilege role passes. Never fall back to `neondb_owner` as an application runtime workaround.
5. Change the Svelte runtime credential only after DB migration and all login, route, RLS, invitation, platform and worker tests pass. If runtime cutover fails, return to the previous application release only if it also uses a non-bypass application role; otherwise remain unavailable pending repair.
6. Production is outside this proposal. Require a separate production plan, backup/restore approval and change window.

### Rollback policy SQL shape (QA only; run only against a captured matching migration)

This restores the currently observed QA policy expressions and removes FORCE flags. It deliberately restores the known-insecure custom-GUC policy behavior, so it is only a short-lived recovery action while the app is blocked; it is not an acceptable runtime state. Validate the pre-migration snapshot before using it.

```sql
BEGIN;
DO $rollback$
DECLARE p record; using_expr text; check_expr text;
BEGIN
  FOR p IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN (
        SELECT c.relname
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p')
          AND EXISTS (
            SELECT 1 FROM information_schema.columns i
            WHERE i.table_schema = n.nspname
              AND i.table_name = c.relname
              AND i.column_name = 'organization_id'
          )
      )
  LOOP
    IF p.tablename IN ('platform_support_notes', 'provisioning_jobs') THEN
      using_expr := 'current_setting(''app.is_platform_owner'', true) = ''true''';
      check_expr := using_expr;
    ELSIF p.tablename = 'invitations' THEN
      using_expr := '(organization_id::text = current_setting(''app.current_organization_id'', true) OR current_setting(''app.is_platform_owner'', true) = ''true'' OR token_hash::text = current_setting(''app.current_invitation_token_hash'', true))';
      check_expr := '(organization_id::text = current_setting(''app.current_organization_id'', true) OR current_setting(''app.is_platform_owner'', true) = ''true'')';
    ELSIF p.tablename IN ('roles', 'ats_skill_aliases', 'ats_skill_taxonomy') THEN
      using_expr := '(organization_id IS NULL OR organization_id::text = current_setting(''app.current_organization_id'', true) OR current_setting(''app.is_platform_owner'', true) = ''true'')';
      check_expr := using_expr;
    ELSE
      using_expr := '(organization_id::text = current_setting(''app.current_organization_id'', true) OR current_setting(''app.is_platform_owner'', true) = ''true'')';
      check_expr := using_expr;
    END IF;
    EXECUTE format(
      'ALTER POLICY %I ON %I.%I TO PUBLIC USING (%s) WITH CHECK (%s)',
      p.policyname, p.schemaname, p.tablename, using_expr, check_expr
    );
  END LOOP;

  EXECUTE 'ALTER TABLE public.approval_history NO FORCE ROW LEVEL SECURITY';
  -- Generate the remaining NO FORCE statements from the captured list of all
  -- 129 organization_id tables that were forced by this exact migration.
END
$rollback$;
COMMIT;
```

This rollback block is not complete enough to execute because the future migration is not defined and the `NO FORCE` table statements intentionally require the exact migration manifest. Private schema/function/role cleanup must also use the migration's recorded object list; do not use `DROP ... CASCADE`.

## Automated and manual acceptance plan

`src/lib/server/rls-qa.integration.test.ts` is a gated integration test harness. It is skipped unless `RUN_RLS_QA_TESTS=1`; it never reads `.env.local`, accepts only the exact operator-confirmed QA pooled hostname, and requires current role `sympowork_app` and database `neondb`. It requires two approved QA organizations, employee fixture IDs, and session token hashes supplied only via protected process environment. Every test transaction is rolled back. The harness was not run because the context functions/migration are not installed and Phase 2A found only one approved QA organization.

Required fixtures/config names (values stay in protected local secret configuration):

- `RLS_QA_DATABASE_URL`
- `RLS_QA_SESSION_HASH_A`, `RLS_QA_SESSION_HASH_B`
- `RLS_QA_ORGANIZATION_A_ID`, `RLS_QA_ORGANIZATION_B_ID`
- `RLS_QA_EMPLOYEE_A_ID`, `RLS_QA_EMPLOYEE_B_ID`
- `RLS_QA_EXPIRED_SESSION_HASH`, `RLS_QA_REVOKED_SESSION_HASH` (for session checks)
- Optional approved platform/non-platform hashes and resource fixture IDs for platform, invitations, documents and worker tests.

Test matrix:

| Test | Expected evidence |
|---|---|
| Runtime role/DB/endpoint preflight | Correct QA host, `neondb`, `sympowork_app`; refuse everything else. |
| Missing context | Current tenant/user helpers return NULL; tenant SELECT returns zero; tenant INSERT/UPDATE fails closed. |
| Tenant A and B context | Each user sees its own approved employee/resource fixture and not the other tenant’s. |
| Forged legacy GUCs | Set old organization/platform GUCs to other-tenant/platform values; protected context remains the session-derived tenant and no extra rows appear. |
| Cross-tenant INSERT | Insert synthetic disposable row with other organization ID is rejected; transaction rollback verified. |
| Cross-tenant UPDATE/DELETE | Other-tenant row is invisible and untouched; moving own row to other tenant fails check; rollback verified. |
| Pool reuse | With pool size one, A transaction ends; no context appears in a fresh transaction; B gets only B context. |
| Session expiry/revocation/membership change | Context bootstrap rejects expired/revoked session and inactive/moved membership. |
| All 129 tables | Catalog check confirms RLS active for `sympowork_app`; require at least one actual cross-tenant fixture per table before calling data-isolation coverage complete. |
| Platform access | Authorized platform role can perform only explicitly permitted operation; organization role is denied direct URL/API and direct policy path. |
| Invitation | Correct token preview/accept succeeds through intended capability; unrelated token and cross-tenant mutation denied. |
| Worker/provisioning | No-context app requests denied; separately authenticated job capability can process only its authorized job. |
| Global/auth tables | Self/session boundaries, non-platform cross-user denial, platform restrictions and token secrecy verified. |
| Private files | API and storage authorization both deny cross-tenant document retrieval; DB RLS alone is not accepted as proof. |

Failed expected-denial writes must run inside an explicit rollback-only transaction with no external side-effect triggers. Tests require disposable QA records and authorization before execution. The generic all-table catalog check alone does not prove every table’s data isolation.

## Blockers and decision request

- Only one approved QA organization is available; a second organization plus active QA account and fixture rows are required for cross-tenant acceptance.
- The safe context/bootstrap function and its non-login owner/policies do not yet exist.
- Current `context.ts` membership bootstrap order conflicts with membership RLS.
- Platform and invitation access need dedicated validated capabilities; job runner identity/hosting is unknown.
- `sympowork_app` has broad DML on all 140 public tables; a complete operation matrix is required before narrowing grants.
- The deployed migration SQL history is not present in the target repository; the target migration directory/configuration must be established without executing schema changes.
- No RLS integration tests, live tenant isolation tests, invitation/platform/job tests, or runtime cutover were executed.

**Approval requested:** approve the next step to finalize the missing source/grant matrix and then, after a separately reviewed SQL package is ready, apply the RLS migration to the isolated `naresh-dev` QA branch and cut the Svelte runtime over to `sympowork_app`. This approval does not include production access, business-record mutations, or production migration.
