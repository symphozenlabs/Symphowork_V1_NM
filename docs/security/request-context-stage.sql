-- DBA review candidate. Stage private objects only.
-- Keep outside the Drizzle journal until the full cutover is approved.
BEGIN;

DO $preflight$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_roles
    WHERE rolname = 'sympowork_app' AND rolcanlogin AND NOT rolsuper AND NOT rolbypassrls
  ) OR EXISTS (
    SELECT 1 FROM pg_catalog.pg_roles
    WHERE (rolsuper OR rolbypassrls OR rolname IN ('pg_read_all_data', 'pg_write_all_data'))
      AND pg_catalog.pg_has_role('sympowork_app', oid, 'MEMBER')
  ) THEN
    RAISE EXCEPTION 'Requires a restricted runtime login without privileged role memberships';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_catalog.pg_roles AS role
    WHERE pg_catalog.pg_has_role('sympowork_app', role.oid, 'MEMBER')
      AND (role.rolcreaterole OR role.rolcreatedb OR role.rolreplication
        OR role.rolname IN ('pg_execute_server_program', 'pg_read_server_files', 'pg_write_server_files'))
  ) OR EXISTS (
    SELECT 1 FROM pg_catalog.pg_class AS rel
    JOIN pg_catalog.pg_namespace AS ns ON ns.oid = rel.relnamespace
    WHERE ns.nspname = 'public' AND rel.relkind IN ('r', 'p')
      AND (pg_catalog.pg_has_role('sympowork_app', rel.relowner, 'MEMBER')
        OR pg_catalog.has_table_privilege('sympowork_app', rel.oid, 'TRUNCATE'))
  ) THEN
    RAISE EXCEPTION 'Runtime role can administer protected data or assume a privileged role';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_extension AS e
    JOIN pg_catalog.pg_namespace AS n ON n.oid = e.extnamespace
    WHERE e.extname = 'pgcrypto' AND n.nspname = 'public'
  ) OR pg_catalog.has_schema_privilege('sympowork_app', 'public', 'CREATE') THEN
    RAISE EXCEPTION 'Requires pgcrypto in public and no runtime CREATE on public';
  END IF;
END;
$preflight$;

CREATE ROLE sympowork_context_owner NOLOGIN NOINHERIT NOSUPERUSER NOBYPASSRLS NOCREATEROLE NOCREATEDB NOREPLICATION;
CREATE SCHEMA app_private AUTHORIZATION sympowork_context_owner;
REVOKE ALL ON SCHEMA app_private FROM PUBLIC;

GRANT USAGE ON SCHEMA public TO sympowork_context_owner;
GRANT SELECT (id, user_id, token_hash, expires_at) ON public.sessions TO sympowork_context_owner;
GRANT SELECT (id, status, platform_role, email, full_name, must_change_password) ON public.users TO sympowork_context_owner;
GRANT SELECT (user_id, organization_id, status) ON public.memberships TO sympowork_context_owner;
GRANT SELECT (id, status) ON public.organizations TO sympowork_context_owner;
CREATE POLICY membership_context_bootstrap ON public.memberships
  FOR SELECT TO sympowork_context_owner USING (true);

SET LOCAL ROLE sympowork_context_owner;

CREATE TABLE app_private.request_context_key (
  singleton boolean PRIMARY KEY CHECK (singleton),
  secret bytea NOT NULL CHECK (octet_length(secret) = 32)
);
INSERT INTO app_private.request_context_key VALUES (true, public.gen_random_bytes(32));
REVOKE ALL ON app_private.request_context_key FROM PUBLIC;

CREATE FUNCTION app_private.begin_request_context(session_token text)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  resolved_context record;
  payload text;
  signing_key bytea;
BEGIN
  IF session_token IS NULL OR length(session_token) <> 43 OR session_token ~ '[^A-Za-z0-9_-]' THEN
    RAISE EXCEPTION 'Invalid request session' USING ERRCODE = '28000';
  END IF;

  SELECT s.id AS session_id, s.token_hash AS session_hash, u.id AS user_id,
         o.id AS organization_id,
         u.platform_role::text AS platform_role
    INTO resolved_context
    FROM public.sessions AS s
    JOIN public.users AS u ON u.id = s.user_id AND u.status = 'active'
    LEFT JOIN public.memberships AS m
      ON m.user_id = u.id AND m.status = 'active' AND u.platform_role = 'NONE'
    LEFT JOIN public.organizations AS o ON o.id = m.organization_id AND o.status = 'active'
    WHERE s.token_hash = encode(sha256(convert_to(session_token, 'UTF8')), 'hex')
      AND s.expires_at > statement_timestamp();

  IF NOT FOUND OR (resolved_context.platform_role = 'NONE' AND resolved_context.organization_id IS NULL) THEN
    RAISE EXCEPTION 'Invalid request session' USING ERRCODE = '28000';
  END IF;

  SELECT key.secret INTO STRICT signing_key FROM app_private.request_context_key AS key;
  payload := concat_ws(':', pg_backend_pid(), pg_current_xact_id(), resolved_context.session_id,
    resolved_context.user_id, coalesce(resolved_context.organization_id::text, '-'));
  PERFORM set_config('app.verified_request_context', payload || ':' ||
    encode(public.hmac('request:v2:' || payload || ':' || resolved_context.platform_role || ':' || resolved_context.session_hash,
      encode(signing_key, 'hex'), 'sha256'), 'hex'), true);
END;
$$;

CREATE FUNCTION app_private.valid_request_context()
RETURNS TABLE (user_id uuid, organization_id uuid, is_platform_owner boolean)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = pg_catalog
AS $$
DECLARE
  envelope text := current_setting('app.verified_request_context', true);
  fields text[];
  signing_key text;
  session_hash text;
  stored_platform_role text;
  expected_tag text;
  bound_org uuid;
BEGIN
  -- Custom settings are writable by the caller. Only the authenticated
  -- envelope is accepted, and only in its original top-level transaction.
  IF envelope IS NULL OR length(envelope) > 220 THEN RETURN; END IF;
  fields := string_to_array(envelope, ':');
  IF cardinality(fields) <> 6
    OR fields[1] IS DISTINCT FROM pg_backend_pid()::text
    OR fields[2] IS DISTINCT FROM pg_current_xact_id_if_assigned()::text
    OR fields[3] !~ '^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$'
    OR fields[4] !~ '^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$'
    OR (fields[5] <> '-' AND fields[5] !~ '^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$')
    OR fields[6] !~ '^[0-9a-f]{64}$'
  THEN RETURN; END IF;

  SELECT session.token_hash, actor.platform_role::text INTO session_hash, stored_platform_role
  FROM public.sessions AS session
  JOIN public.users AS actor ON actor.id = session.user_id AND actor.status = 'active'
  WHERE session.id = fields[3]::uuid AND session.user_id = fields[4]::uuid
    AND session.expires_at > statement_timestamp();
  IF NOT FOUND THEN RETURN; END IF;

  SELECT encode(key.secret, 'hex') INTO signing_key FROM app_private.request_context_key AS key;
  IF NOT FOUND THEN RETURN; END IF;
  expected_tag := encode(public.hmac(
    'request:v2:' || array_to_string(fields[1:5], ':') || ':' || stored_platform_role || ':' || session_hash,
    signing_key, 'sha256'), 'hex');
  -- Compare keyed transforms so comparison timing cannot reveal matching
  -- prefixes of the actual authentication tag.
  IF public.hmac('compare:v1:' || fields[6], signing_key, 'sha256') <>
     public.hmac('compare:v1:' || expected_tag, signing_key, 'sha256')
  THEN RETURN; END IF;

  bound_org := nullif(fields[5], '-')::uuid;
  RETURN QUERY SELECT actor.id, bound_org, actor.platform_role = 'PLATFORM_OWNER'
  FROM public.users AS actor
  WHERE actor.id = fields[4]::uuid AND actor.status = 'active'
    AND (
      (bound_org IS NULL AND actor.platform_role <> 'NONE')
      OR
      (bound_org IS NOT NULL AND actor.platform_role = 'NONE' AND EXISTS (
        SELECT 1 FROM public.memberships AS membership
        JOIN public.organizations AS organization
          ON organization.id = membership.organization_id AND organization.status = 'active'
        WHERE membership.user_id = actor.id AND membership.organization_id = bound_org
          AND membership.status = 'active'
      ))
    );
END;
$$;

CREATE FUNCTION app_private.current_user_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog
AS $$
  SELECT context.user_id FROM app_private.valid_request_context() AS context
$$;

CREATE FUNCTION app_private.current_organization_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog
AS $$
  SELECT context.organization_id FROM app_private.valid_request_context() AS context
$$;

CREATE FUNCTION app_private.is_platform_owner()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog
AS $$
  SELECT coalesce((SELECT context.is_platform_owner FROM app_private.valid_request_context() AS context), false)
$$;

CREATE FUNCTION app_private.current_request_user()
RETURNS TABLE (
  user_id uuid, organization_id uuid, email text, full_name text,
  platform_role text, must_change_password boolean
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog
AS $$
  SELECT actor.id, context.organization_id, actor.email::text, actor.full_name::text,
         actor.platform_role::text, actor.must_change_password
  FROM app_private.valid_request_context() AS context
  JOIN public.users AS actor ON actor.id = context.user_id
$$;

CREATE FUNCTION app_private.end_request_context()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog
AS $$
BEGIN
  PERFORM set_config('app.verified_request_context', '', true);
END;
$$;

REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA app_private FROM PUBLIC;
RESET ROLE;
COMMIT;
