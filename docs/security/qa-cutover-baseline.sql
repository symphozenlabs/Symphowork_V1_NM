-- Run with psql on the approved disposable QA branch. Read-only.
-- Compare the ledger's hashes with the exact historical migration bytes.
-- Absence from the ledger cannot exclude an unjournaled manual execution.
BEGIN READ ONLY;
SELECT current_database(), current_user, session_user;
SELECT to_regclass('drizzle.__drizzle_migrations') IS NOT NULL AS has_ledger \gset
\if :has_ledger
SELECT id, hash, created_at FROM drizzle.__drizzle_migrations ORDER BY id;
\endif
SELECT schemaname, tablename, policyname, cmd, roles, qual, with_check
FROM pg_catalog.pg_policies WHERE schemaname = 'public'
ORDER BY tablename, policyname;
SELECT table_name, column_name, privilege_type
FROM information_schema.column_privileges
WHERE table_schema = 'public' AND grantee IN ('PUBLIC','sympowork_app')
ORDER BY table_name, column_name, privilege_type;
SELECT n.nspname, c.relname, pg_get_userbyid(c.relowner) AS owner,
       c.relrowsecurity, c.relforcerowsecurity,
       has_table_privilege('sympowork_app', c.oid, 'TRUNCATE') AS runtime_truncate,
       pg_has_role('sympowork_app', c.relowner, 'MEMBER') AS runtime_can_assume_owner
FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind IN ('r','p') ORDER BY c.relname;
ROLLBACK;
