-- Run only the read-only inventory on the approved QA branch.
-- Its output is review material, not an executable release migration.
BEGIN READ ONLY;

WITH legacy AS (
  SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
  FROM pg_catalog.pg_policies
  WHERE schemaname = 'public'
    AND concat_ws(' ', qual, with_check) LIKE '%current_setting(%'
    AND concat_ws(' ', qual, with_check) ~ 'app\.(current_organization_id|is_platform_owner|current_user_id|current_invitation_token_hash)'
), classified AS (
  SELECT *,
    CASE
      WHEN permissive <> 'PERMISSIVE' OR roles <> ARRAY['public']::name[] OR cmd <> 'ALL' THEN 'unclassified'
      WHEN tablename = 'memberships' THEN 'membership'
      WHEN tablename IN ('roles', 'ats_skill_aliases', 'ats_skill_taxonomy') THEN 'shared'
      WHEN tablename = 'invitations' THEN 'invitation'
      WHEN tablename IN ('platform_support_notes', 'provisioning_jobs') THEN 'platform'
      WHEN tablename = 'audit_logs' THEN 'audit'
      WHEN permissive = 'PERMISSIVE' AND roles = ARRAY['public']::name[] AND cmd = 'ALL'
        AND with_check IS NULL
        AND qual = $predicate$(((organization_id)::text = current_setting('app.current_organization_id'::text, true)) OR (current_setting('app.is_platform_owner'::text, true) = 'true'::text))$predicate$
        THEN 'standard tenant'
      ELSE 'unclassified'
    END AS policy_group
  FROM legacy
)
SELECT schemaname, tablename, policyname, policy_group, permissive, roles, cmd, qual, with_check,
  CASE policy_group
    WHEN 'membership' THEN 'Verified tenant policy and SELECT-only self predicate; separate context owner bootstrap'
    WHEN 'shared' THEN 'Authenticated global SELECT; tenant-scoped mutations; separate global capability'
    WHEN 'invitation' THEN 'Organization rules plus dedicated token-scoped lookup and acceptance'
    WHEN 'platform' THEN 'Explicit database-verified platform capability per operation'
    WHEN 'audit' THEN 'Verified tenant access plus narrowly granted append-only pre-auth operation'
    WHEN 'standard tenant' THEN 'Verified organization equality for visibility and writes'
    ELSE 'Review baseline drift before generating replacement'
  END AS replacement_rule,
  CASE policy_group
    WHEN 'membership' THEN 'Session bootstrap, membership reads and membership management'
    WHEN 'shared' THEN 'Role catalog and ATS taxonomy services'
    WHEN 'invitation' THEN 'Invitation acceptance, membership provisioning and audit'
    WHEN 'platform' THEN 'Provisioning and support services'
    WHEN 'audit' THEN 'Pre-authentication login audit and scoped audit history'
    WHEN 'standard tenant' THEN 'All route and job callers listed for this table in the source-operation inventory'
    ELSE 'Identify all callers before cutover'
  END AS required_caller,
  CASE policy_group
    WHEN 'membership' THEN 'Own membership visible; same-org other user and other-org rows excluded from self scope'
    WHEN 'shared' THEN 'Global authenticated reads; foreign tenant and ordinary global writes denied'
    WHEN 'invitation' THEN 'Accept valid token; deny expired, revoked, consumed and mismatched credentials'
    WHEN 'platform' THEN 'Allow authorized capabilities; deny ordinary tenant and unrelated platform roles'
    WHEN 'audit' THEN 'Allow sanitized append; deny pre-auth reads, updates and unrelated tenant attribution'
    WHEN 'standard tenant' THEN 'Two-tenant own and foreign read/write assertions through SQL and service layer'
    ELSE 'Add explicit positive and negative coverage'
  END AS required_test,
  CASE
    WHEN policy_group IN ('standard tenant', 'invitation') THEN format(
      'ALTER POLICY %I ON %I.%I TO sympowork_app USING (organization_id = (SELECT app_private.current_organization_id())) WITH CHECK (organization_id = (SELECT app_private.current_organization_id()));',
      policyname, schemaname, tablename)
    WHEN policy_group = 'membership' THEN format(
      'DROP POLICY %1$I ON %2$I.%3$I; CREATE POLICY %1$I ON %2$I.%3$I FOR SELECT TO sympowork_app USING (organization_id = (SELECT app_private.current_organization_id()) AND user_id = (SELECT app_private.current_user_id()));',
      policyname, schemaname, tablename)
    WHEN policy_group = 'shared' THEN format(
      'DROP POLICY %1$I ON %2$I.%3$I; CREATE POLICY %1$I ON %2$I.%3$I TO sympowork_app USING (organization_id = (SELECT app_private.current_organization_id())) WITH CHECK (organization_id = (SELECT app_private.current_organization_id())); CREATE POLICY verified_global_read ON %2$I.%3$I FOR SELECT TO sympowork_app USING (organization_id IS NULL AND (SELECT app_private.current_user_id()) IS NOT NULL);',
      policyname, schemaname, tablename)
    WHEN policy_group = 'audit' THEN format(
      'DROP POLICY %1$I ON %2$I.%3$I; CREATE POLICY %1$I ON %2$I.%3$I FOR SELECT TO sympowork_app USING (organization_id = (SELECT app_private.current_organization_id()));',
      policyname, schemaname, tablename)
    WHEN policy_group = 'platform' THEN format(
      'ALTER POLICY %I ON %I.%I TO sympowork_app USING (false) WITH CHECK (false);',
      policyname, schemaname, tablename)
  END AS restricted_proposal,
  CASE WHEN policy_group <> 'unclassified' THEN format(
    '%sDROP POLICY %I ON %I.%I; CREATE POLICY %I ON %I.%I AS %s FOR %s TO %s%s%s;',
    CASE WHEN policy_group = 'shared' THEN format('DROP POLICY verified_global_read ON %I.%I; ', schemaname, tablename)
      ELSE '' END,
    policyname, schemaname, tablename, policyname, schemaname, tablename, permissive, cmd,
    (SELECT string_agg(CASE WHEN role_name = 'public' THEN 'PUBLIC' ELSE quote_ident(role_name) END, ', ')
     FROM unnest(roles) AS role_name),
    CASE WHEN qual IS NULL THEN '' ELSE format(' USING (%s)', qual) END,
    CASE WHEN with_check IS NULL THEN '' ELSE format(' WITH CHECK (%s)', with_check) END
  ) END AS captured_rollback
FROM classified
ORDER BY policy_group, tablename, policyname;

SELECT c.relname AS table_name, pg_get_userbyid(c.relowner) AS owner,
  c.relrowsecurity AS rls_enabled, c.relforcerowsecurity AS rls_forced,
  has_table_privilege('sympowork_app', c.oid, 'SELECT') AS can_select,
  has_table_privilege('sympowork_app', c.oid, 'INSERT') AS can_insert,
  has_table_privilege('sympowork_app', c.oid, 'UPDATE') AS can_update,
  has_table_privilege('sympowork_app', c.oid, 'DELETE') AS can_delete,
  has_table_privilege('sympowork_app', c.oid, 'TRUNCATE') AS can_truncate
FROM pg_catalog.pg_class AS c
JOIN pg_catalog.pg_namespace AS n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p')
ORDER BY c.relname;

ROLLBACK;
