# SEC-02 live inventory snapshot

Captured 2026-11-24 from NM's configured PostgreSQL endpoint using the application login and a read-only transaction. The effective role was `sympowork_app`; the relation, policy and column grant extracts are in the adjacent CSV files. No database writes or migrations were run.

## Relation inventory

The catalog returned 141 non-system relations: 140 public tables and the Drizzle migration journal table. There were no views, materialized views, partitioned tables or foreign tables in this inventory. Of the public tables, 129 contain tenant-owned data and have RLS enabled; all 129 lack FORCE RLS. The 12 RLS-disabled relations are the 11 public shared/identity tables listed below and `drizzle.__drizzle_migrations`, which is migration metadata and is not accessible to the runtime role.

| Public RLS-disabled relation | Classification | Current disposition |
|---|---|---|
| `email_verification_tokens` | Identity token data | RLS/grants and a narrow identity operation are required |
| `organizations` | Shared tenant metadata | Needs verified tenant read and operation-specific platform access |
| `password_reset_tokens` | Identity token data | RLS/grants and a narrow identity operation are required |
| `permissions` | Shared authorization catalog | Needs explicit authenticated read and restricted writes |
| `plan_features` | Shared commercial metadata | Needs server authorization and restricted writes |
| `plans` | Shared commercial metadata | Needs server authorization and restricted writes |
| `platform_feature_flags` | Platform metadata | Needs explicit platform authorization |
| `role_permissions` | Shared authorization catalog | Needs explicit authenticated read and restricted writes |
| `sessions` | Session credential data | Direct runtime access must be replaced by verified session operations |
| `system_config` | Platform metadata | Needs explicit platform authorization |
| `users` | Identity and credential data | Direct runtime access must be replaced by narrow identity operations |

These are classifications, not justifications for leaving the current policies/grants in place. The application currently has effective SELECT, INSERT, UPDATE and DELETE privileges on all 140 public tables, including all 11 RLS-disabled tables. `sympowork_app` has no TRUNCATE privilege.

## Runtime role

PostgreSQL reported `current_user = session_user = sympowork_app`, `SUPERUSER = false`, `BYPASSRLS = false`, and no membership in another role. The role also lacks CREATEROLE, CREATEDB, REPLICATION, public-schema CREATE, table ownership and TRUNCATE. The complete effective relation privileges and 6,634 applicable column-level grants are recorded in `sec02-live-relations.csv` and `sec02-live-column-grants.csv`; 1,943 column SELECT grants and 17 column UPDATE grants apply through PUBLIC, alongside direct `sympowork_app` grants.

## Policy and function findings

All 129 current public policies still use legacy mutable settings. Of these, 127 explicitly combine `app.current_organization_id` with `app.is_platform_owner`; the membership and invitation policies use additional legacy context settings. No `app_private` schema or verified-context functions were present. The catalog exposed no application-defined routines in non-system schemas, so there were no current application SECURITY DEFINER functions to approve; the staged request-context functions remain uninstalled. The complete policy snapshot is in `sec02-live-policies.csv`.

## Verification boundary

The query ran read only and did not inspect or export application rows. The target role is restricted, but catalog results do not prove tenant isolation while current policies trust mutable GUCs. This snapshot is not an approval to apply DDL. The database cutover requires a separately authorized DDL identity, coordinated identity-operation and caller migration, reviewed grants and policies, and two-tenant QA acceptance. FORCE RLS and the RLS-disabled table policies remain unresolved.
