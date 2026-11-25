-- Run as the actual runtime login after the full QA cutover.
-- A failure aborts the release gate. This script changes no data.
BEGIN READ ONLY;
DO $gate$
DECLARE
  scoped_count integer;
  required_signature text;
  required_oid oid;
BEGIN
  IF current_user <> 'sympowork_app' OR session_user <> current_user THEN
    RAISE EXCEPTION 'Use a direct runtime login';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE
    (rolsuper OR rolbypassrls OR rolcreaterole OR rolreplication)
    AND pg_catalog.pg_has_role(current_user, oid, 'MEMBER')) THEN
    RAISE EXCEPTION 'Privileged runtime role membership';
  END IF;
  SELECT count(*) INTO scoped_count FROM pg_catalog.pg_class c
  JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
  JOIN pg_catalog.pg_attribute a ON a.attrelid=c.oid AND NOT a.attisdropped
  WHERE n.nspname='public' AND c.relkind IN ('r','p') AND a.attname='organization_id'
    AND pg_catalog.row_security_active(c.oid);
  IF scoped_count <> 129 THEN RAISE EXCEPTION 'Unexpected active tenant RLS coverage: %', scoped_count; END IF;
  -- The login, bootstrap and cleanup paths must all work as the actual runtime.
  FOREACH required_signature IN ARRAY ARRAY[
    'app_private.begin_request_context(text)', 'app_private.current_user_id()',
    'app_private.current_organization_id()', 'app_private.current_request_user()',
    'app_private.end_request_context()'
  ] LOOP
    required_oid := pg_catalog.to_regprocedure(required_signature);
    IF required_oid IS NULL THEN
      RAISE EXCEPTION 'Required request-context function is missing: %', required_signature;
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM pg_catalog.pg_proc p
      JOIN pg_catalog.pg_roles owner_role ON owner_role.oid = p.proowner
      WHERE p.oid = required_oid AND p.prosecdef
        AND owner_role.rolname = 'sympowork_context_owner'
        AND NOT (owner_role.rolcanlogin OR owner_role.rolsuper OR owner_role.rolbypassrls
                 OR owner_role.rolcreaterole OR owner_role.rolcreatedb OR owner_role.rolreplication)
        AND NOT pg_catalog.pg_has_role(current_user, owner_role.oid, 'MEMBER')
        AND 'search_path=pg_catalog' = ANY(p.proconfig)
    ) THEN
      RAISE EXCEPTION 'Unexpected request-context function owner or security attributes: %', required_signature;
    END IF;
    IF NOT pg_catalog.has_schema_privilege(current_user, 'app_private', 'USAGE')
       OR NOT pg_catalog.has_function_privilege(current_user, required_oid, 'EXECUTE') THEN
      RAISE EXCEPTION 'Runtime cannot call required request-context function: %', required_signature;
    END IF;
  END LOOP;
  IF EXISTS (SELECT 1 FROM pg_catalog.pg_policies WHERE schemaname='public'
    AND concat_ws(' ',qual,with_check) ~ 'app\.(current_organization_id|is_platform_owner|current_user_id|current_invitation_token_hash)') THEN
    RAISE EXCEPTION 'Legacy authorization expression present';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='public' AND c.relkind IN ('r','p') AND
    (pg_catalog.has_table_privilege(current_user,c.oid,'TRUNCATE') OR pg_catalog.pg_has_role(current_user,c.relowner,'MEMBER'))) THEN
    RAISE EXCEPTION 'Runtime has ownership or TRUNCATE privileges';
  END IF;
  IF EXISTS (
    SELECT 1 FROM unnest(ARRAY['public.users','public.sessions','public.memberships',
      'public.email_verification_tokens','public.password_reset_tokens']) AS identity_table(name)
    WHERE pg_catalog.has_any_column_privilege(current_user, identity_table.name, 'INSERT, UPDATE')
       OR pg_catalog.has_table_privilege(current_user, identity_table.name, 'DELETE')
  ) THEN
    RAISE EXCEPTION 'Runtime can mutate trusted identity directly';
  END IF;
  IF pg_catalog.has_column_privilege(current_user, 'public.users', 'password_hash', 'SELECT')
    OR pg_catalog.has_column_privilege(current_user, 'public.sessions', 'token_hash', 'SELECT') THEN
    RAISE EXCEPTION 'Runtime can read credential material directly';
  END IF;
  IF pg_catalog.has_any_column_privilege(current_user,'app_private.request_context_key','SELECT, INSERT, UPDATE, REFERENCES')
    OR pg_catalog.has_table_privilege(current_user,'app_private.request_context_key','DELETE, TRUNCATE, TRIGGER')
    OR pg_catalog.has_schema_privilege(current_user,'app_private','CREATE') THEN
    RAISE EXCEPTION 'Runtime can access private signing material or create private objects';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace
    CROSS JOIN LATERAL aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) acl
    WHERE n.nspname='app_private' AND acl.grantee=0 AND acl.privilege_type='EXECUTE') THEN
    RAISE EXCEPTION 'Private routine executable by PUBLIC';
  END IF;
  IF app_private.current_user_id() IS NOT NULL OR app_private.current_organization_id() IS NOT NULL THEN
    RAISE EXCEPTION 'Unexpected identity at checkout';
  END IF;
END
$gate$;
ROLLBACK;
