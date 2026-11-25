-- ============================================================================
-- STATUS: NOT APPROVED, NOT COMPLETE, AND NOT DEPLOYABLE.
-- DO NOT EXECUTE. This file is a draft artifact retained for review only.
-- A prior attempt failed with SQLSTATE 42501 at SET LOCAL ROLE
-- sympowork_context_owner. The deployment identity's membership/SET capability
-- was not established. This file also omits the required access design for the
-- 11 public relations without RLS and several authentication/invitation
-- capabilities. Passing its existing preflight would not make it safe to run.
-- ============================================================================

BEGIN;

DO $blocked$
BEGIN
  RAISE EXCEPTION 'NOT DEPLOYABLE: complete the operation contract and rollback review before removing this guard';
END;
$blocked$;

-- Ensure pgcrypto extension is installed in public schema
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;

-- SECTION 1: REQUEST CONTEXT SCHEMA & CORE FUNCTIONS
-- Complete atomic database security cutover for SymphoWork V1.
-- Creates app_private schema, restricted context-owner role, and signing functions.

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

DO $role$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = 'sympowork_context_owner') THEN
    CREATE ROLE sympowork_context_owner NOLOGIN NOINHERIT NOSUPERUSER NOBYPASSRLS NOCREATEROLE NOCREATEDB NOREPLICATION;
  END IF;
END;
$role$;
-- PostgreSQL 18 gives the CREATEROLE creator ADMIN on a role it creates,
-- but defaults SET and INHERIT to false. Keep the deployment identity's
-- non-inheriting administrative membership and add only the SET capability
-- required for this script's SET LOCAL ROLE. This is never granted to runtime.
GRANT sympowork_context_owner TO CURRENT_USER WITH SET TRUE, INHERIT FALSE;
CREATE SCHEMA IF NOT EXISTS app_private AUTHORIZATION sympowork_context_owner;
REVOKE ALL ON SCHEMA app_private FROM PUBLIC;

GRANT USAGE ON SCHEMA public TO sympowork_context_owner;
GRANT SELECT (id, user_id, token_hash, expires_at) ON public.sessions TO sympowork_context_owner;
GRANT SELECT (id, status, platform_role, email, full_name, must_change_password) ON public.users TO sympowork_context_owner;
GRANT SELECT (user_id, organization_id, status) ON public.memberships TO sympowork_context_owner;
GRANT SELECT (id, status) ON public.organizations TO sympowork_context_owner;
DROP POLICY IF EXISTS membership_context_bootstrap ON public.memberships;
CREATE POLICY membership_context_bootstrap ON public.memberships
  FOR SELECT TO sympowork_context_owner USING (true);

SET LOCAL ROLE sympowork_context_owner;

CREATE TABLE IF NOT EXISTS app_private.request_context_key (
  singleton boolean PRIMARY KEY CHECK (singleton),
  secret bytea NOT NULL CHECK (octet_length(secret) = 32)
);
INSERT INTO app_private.request_context_key VALUES (true, public.gen_random_bytes(32))
  ON CONFLICT (singleton) DO NOTHING;
REVOKE ALL ON app_private.request_context_key FROM PUBLIC;

CREATE OR REPLACE FUNCTION app_private.begin_request_context(session_token text)
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

CREATE OR REPLACE FUNCTION app_private.valid_request_context()
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

CREATE OR REPLACE FUNCTION app_private.current_user_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog
AS $$
  SELECT context.user_id FROM app_private.valid_request_context() AS context
$$;

CREATE OR REPLACE FUNCTION app_private.current_organization_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog
AS $$
  SELECT context.organization_id FROM app_private.valid_request_context() AS context
$$;

CREATE OR REPLACE FUNCTION app_private.is_platform_owner()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog
AS $$
  SELECT coalesce((SELECT context.is_platform_owner FROM app_private.valid_request_context() AS context), false)
$$;

CREATE OR REPLACE FUNCTION app_private.current_request_user()
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

CREATE OR REPLACE FUNCTION app_private.end_request_context()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog
AS $$
BEGIN
  PERFORM set_config('app.verified_request_context', '', true);
END;
$$;

REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA app_private FROM PUBLIC;
RESET ROLE;

-- SECTION 2: FAILED LOGIN AUDIT STAGE
GRANT INSERT (action, resource) ON public.audit_logs TO sympowork_context_owner;
DROP POLICY IF EXISTS failed_login_append ON public.audit_logs;
CREATE POLICY failed_login_append ON public.audit_logs
  FOR INSERT TO sympowork_context_owner WITH CHECK (
    action = 'failed_login' AND resource = 'user' AND organization_id IS NULL
    AND actor_user_id IS NULL AND resource_id IS NULL AND metadata IS NULL
  );
SET LOCAL ROLE sympowork_context_owner;
CREATE OR REPLACE FUNCTION app_private.append_failed_login()
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = pg_catalog
AS $function$
  INSERT INTO public.audit_logs(action, resource) VALUES ('failed_login', 'user')
$function$;
REVOKE ALL ON FUNCTION app_private.append_failed_login() FROM PUBLIC;
RESET ROLE;

-- SECTION 3: SESSION REVOCATION STAGE
GRANT DELETE ON public.sessions TO sympowork_context_owner;
SET LOCAL ROLE sympowork_context_owner;
CREATE OR REPLACE FUNCTION app_private.revoke_presented_session(session_token text)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = pg_catalog
AS $function$
  DELETE FROM public.sessions AS s
  WHERE length(session_token) = 43 AND session_token !~ '[^A-Za-z0-9_-]'
    AND s.token_hash = encode(sha256(convert_to(session_token, 'UTF8')), 'hex')
$function$;
REVOKE ALL ON FUNCTION app_private.revoke_presented_session(text) FROM PUBLIC;
RESET ROLE;

-- SECTION 4: PLATFORM CONFIGURATION READ STAGE
-- Installs secure platform config reader using context functions from Section 1.
GRANT SELECT (key, value) ON public.system_config TO sympowork_context_owner;
SET LOCAL ROLE sympowork_context_owner;
CREATE OR REPLACE FUNCTION app_private.read_platform_configuration()
RETURNS TABLE (key text, value text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = pg_catalog
AS $function$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM app_private.current_request_user() AS actor
    WHERE actor.organization_id IS NULL AND NOT actor.must_change_password
      AND actor.platform_role IN ('PRODUCT_OWNER', 'PLATFORM_OWNER', 'PLATFORM_ADMIN')
  ) THEN
    RAISE insufficient_privilege USING MESSAGE = 'Platform configuration permission required';
  END IF;
  RETURN QUERY SELECT c.key::text, c.value::text
    FROM public.system_config AS c
    WHERE c.key IN ('platform.display_name', 'platform.default_timezone',
                    'platform.default_currency', 'platform.support_contact');
END;
$function$;
REVOKE ALL ON FUNCTION app_private.read_platform_configuration() FROM PUBLIC;
RESET ROLE;

-- SECTION 5: REPLACE 129 TENANT POLICIES WITH VERIFIED CONTEXT POLICIES
-- AUDIT LOGS: Granular least-privilege policies.
-- SELECT: Read audit records belonging to the active organization.
-- INSERT: Append audit records belonging to the active organization.
-- UPDATE/DELETE: Denied (no policy exists, audit records are append-only/immutable).
DROP POLICY IF EXISTS "audit_logs_tenant_isolation" ON public."audit_logs";
DROP POLICY IF EXISTS "audit_logs_tenant_select" ON public."audit_logs";
DROP POLICY IF EXISTS "audit_logs_tenant_insert" ON public."audit_logs";
CREATE POLICY "audit_logs_tenant_select" ON public."audit_logs"
  FOR SELECT TO sympowork_app
  USING (organization_id = (SELECT app_private.current_organization_id()));
CREATE POLICY "audit_logs_tenant_insert" ON public."audit_logs"
  FOR INSERT TO sympowork_app
  WITH CHECK (organization_id = (SELECT app_private.current_organization_id()));

ALTER POLICY "invitations_tenant_isolation" ON public."invitations" TO sympowork_app USING (organization_id = (SELECT app_private.current_organization_id())) WITH CHECK (organization_id = (SELECT app_private.current_organization_id()));

-- MEMBERSHIPS: Scoped organization-wide policies.
-- SELECT: Read memberships belonging to the active organization (allows directory & team lookups).
-- INSERT: Create memberships belonging to the active organization (allows invitation acceptance).
-- UPDATE: Update membership role/status within the active organization (allows role updates).
-- DELETE: Denied (no policy exists; memberships are deactivated, never deleted).
DROP POLICY IF EXISTS "memberships_tenant_isolation" ON public."memberships";
DROP POLICY IF EXISTS "memberships_tenant_select" ON public."memberships";
DROP POLICY IF EXISTS "memberships_tenant_insert" ON public."memberships";
DROP POLICY IF EXISTS "memberships_tenant_update" ON public."memberships";
CREATE POLICY "memberships_tenant_select" ON public."memberships"
  FOR SELECT TO sympowork_app
  USING (organization_id = (SELECT app_private.current_organization_id()));
CREATE POLICY "memberships_tenant_insert" ON public."memberships"
  FOR INSERT TO sympowork_app
  WITH CHECK (organization_id = (SELECT app_private.current_organization_id()));
CREATE POLICY "memberships_tenant_update" ON public."memberships"
  FOR UPDATE TO sympowork_app
  USING (organization_id = (SELECT app_private.current_organization_id()))
  WITH CHECK (organization_id = (SELECT app_private.current_organization_id()));

ALTER POLICY "platform_support_notes_platform_isolation" ON public."platform_support_notes" TO sympowork_app USING (false) WITH CHECK (false);
ALTER POLICY "provisioning_jobs_platform_isolation" ON public."provisioning_jobs" TO sympowork_app USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "ats_skill_aliases_tenant_isolation" ON public."ats_skill_aliases";
DROP POLICY IF EXISTS "verified_global_read" ON public."ats_skill_aliases";
CREATE POLICY "ats_skill_aliases_tenant_isolation" ON public."ats_skill_aliases" TO sympowork_app USING (organization_id = (SELECT app_private.current_organization_id())) WITH CHECK (organization_id = (SELECT app_private.current_organization_id()));
CREATE POLICY "verified_global_read" ON public."ats_skill_aliases" FOR SELECT TO sympowork_app USING (organization_id IS NULL AND (SELECT app_private.current_user_id()) IS NOT NULL);

DROP POLICY IF EXISTS "ats_skill_taxonomy_tenant_isolation" ON public."ats_skill_taxonomy";
DROP POLICY IF EXISTS "verified_global_read" ON public."ats_skill_taxonomy";
CREATE POLICY "ats_skill_taxonomy_tenant_isolation" ON public."ats_skill_taxonomy" TO sympowork_app USING (organization_id = (SELECT app_private.current_organization_id())) WITH CHECK (organization_id = (SELECT app_private.current_organization_id()));
CREATE POLICY "verified_global_read" ON public."ats_skill_taxonomy" FOR SELECT TO sympowork_app USING (organization_id IS NULL AND (SELECT app_private.current_user_id()) IS NOT NULL);

DROP POLICY IF EXISTS "roles_tenant_isolation" ON public."roles";
DROP POLICY IF EXISTS "verified_global_read" ON public."roles";
CREATE POLICY "roles_tenant_isolation" ON public."roles" TO sympowork_app USING (organization_id = (SELECT app_private.current_organization_id())) WITH CHECK (organization_id = (SELECT app_private.current_organization_id()));
CREATE POLICY "verified_global_read" ON public."roles" FOR SELECT TO sympowork_app USING (organization_id IS NULL AND (SELECT app_private.current_user_id()) IS NOT NULL);
ALTER POLICY "approval_history_tenant_isolation" ON public."approval_history" TO sympowork_app USING (organization_id = (SELECT app_private.current_organization_id())) WITH CHECK (organization_id = (SELECT app_private.current_organization_id()));
ALTER POLICY "approval_tasks_tenant_isolation" ON public."approval_tasks" TO sympowork_app USING (organization_id = (SELECT app_private.current_organization_id())) WITH CHECK (organization_id = (SELECT app_private.current_organization_id()));
ALTER POLICY "ats_application_stage_history_tenant_isolation" ON public."ats_application_stage_history" TO sympowork_app USING (organization_id = (SELECT app_private.current_organization_id())) WITH CHECK (organization_id = (SELECT app_private.current_organization_id()));
ALTER POLICY "ats_applications_tenant_isolation" ON public."ats_applications" TO sympowork_app USING (organization_id = (SELECT app_private.current_organization_id())) WITH CHECK (organization_id = (SELECT app_private.current_organization_id()));
ALTER POLICY "ats_assessment_types_tenant_isolation" ON public."ats_assessment_types" TO sympowork_app USING (organization_id = (SELECT app_private.current_organization_id())) WITH CHECK (organization_id = (SELECT app_private.current_organization_id()));
ALTER POLICY "ats_assessments_tenant_isolation" ON public."ats_assessments" TO sympowork_app USING (organization_id = (SELECT app_private.current_organization_id())) WITH CHECK (organization_id = (SELECT app_private.current_organization_id()));
ALTER POLICY "ats_candidate_activities_tenant_isolation" ON public."ats_candidate_activities" TO sympowork_app USING (organization_id = (SELECT app_private.current_organization_id())) WITH CHECK (organization_id = (SELECT app_private.current_organization_id()));
ALTER POLICY "ats_candidate_certifications_tenant_isolation" ON public."ats_candidate_certifications" TO sympowork_app USING (organization_id = (SELECT app_private.current_organization_id())) WITH CHECK (organization_id = (SELECT app_private.current_organization_id()));
ALTER POLICY "ats_candidate_documents_tenant_isolation" ON public."ats_candidate_documents" TO sympowork_app USING (organization_id = (SELECT app_private.current_organization_id())) WITH CHECK (organization_id = (SELECT app_private.current_organization_id()));
ALTER POLICY "ats_candidate_education_tenant_isolation" ON public."ats_candidate_education" TO sympowork_app USING (organization_id = (SELECT app_private.current_organization_id())) WITH CHECK (organization_id = (SELECT app_private.current_organization_id()));
ALTER POLICY "ats_candidate_experience_tenant_isolation" ON public."ats_candidate_experience" TO sympowork_app USING (organization_id = (SELECT app_private.current_organization_id())) WITH CHECK (organization_id = (SELECT app_private.current_organization_id()));
ALTER POLICY "ats_candidate_field_provenance_tenant_isolation" ON public."ats_candidate_field_provenance" TO sympowork_app USING (organization_id = (SELECT app_private.current_organization_id())) WITH CHECK (organization_id = (SELECT app_private.current_organization_id()));
ALTER POLICY "ats_candidate_languages_tenant_isolation" ON public."ats_candidate_languages" TO sympowork_app USING (organization_id = (SELECT app_private.current_organization_id())) WITH CHECK (organization_id = (SELECT app_private.current_organization_id()));
ALTER POLICY "ats_candidate_links_tenant_isolation" ON public."ats_candidate_links" TO sympowork_app USING (organization_id = (SELECT app_private.current_organization_id())) WITH CHECK (organization_id = (SELECT app_private.current_organization_id()));
ALTER POLICY "ats_candidate_notes_tenant_isolation" ON public."ats_candidate_notes" TO sympowork_app USING (organization_id = (SELECT app_private.current_organization_id())) WITH CHECK (organization_id = (SELECT app_private.current_organization_id()));
ALTER POLICY "ats_candidate_number_counters_tenant_isolation" ON public."ats_candidate_number_counters" TO sympowork_app USING (organization_id = (SELECT app_private.current_organization_id())) WITH CHECK (organization_id = (SELECT app_private.current_organization_id()));
ALTER POLICY "ats_candidate_projects_tenant_isolation" ON public."ats_candidate_projects" TO sympowork_app USING (organization_id = (SELECT app_private.current_organization_id())) WITH CHECK (organization_id = (SELECT app_private.current_organization_id()));
ALTER POLICY "ats_candidate_skills_tenant_isolation" ON public."ats_candidate_skills" TO sympowork_app USING (organization_id = (SELECT app_private.current_organization_id())) WITH CHECK (organization_id = (SELECT app_private.current_organization_id()));
ALTER POLICY "ats_candidate_sources_tenant_isolation" ON public."ats_candidate_sources" TO sympowork_app USING (organization_id = (SELECT app_private.current_organization_id())) WITH CHECK (organization_id = (SELECT app_private.current_organization_id()));
ALTER POLICY "ats_candidate_tag_links_tenant_isolation" ON public."ats_candidate_tag_links" TO sympowork_app USING (organization_id = (SELECT app_private.current_organization_id())) WITH CHECK (organization_id = (SELECT app_private.current_organization_id()));
ALTER POLICY "ats_candidate_tags_tenant_isolation" ON public."ats_candidate_tags" TO sympowork_app USING (organization_id = (SELECT app_private.current_organization_id())) WITH CHECK (organization_id = (SELECT app_private.current_organization_id()));
ALTER POLICY "ats_candidates_tenant_isolation" ON public."ats_candidates" TO sympowork_app USING (organization_id = (SELECT app_private.current_organization_id())) WITH CHECK (organization_id = (SELECT app_private.current_organization_id()));
ALTER POLICY "ats_communications_tenant_isolation" ON public."ats_communications" TO sympowork_app USING (organization_id = (SELECT app_private.current_organization_id())) WITH CHECK (organization_id = (SELECT app_private.current_organization_id()));
ALTER POLICY "ats_embedding_jobs_tenant_isolation" ON public."ats_embedding_jobs" TO sympowork_app USING (organization_id = (SELECT app_private.current_organization_id())) WITH CHECK (organization_id = (SELECT app_private.current_organization_id()));
ALTER POLICY "ats_embeddings_tenant_isolation" ON public."ats_embeddings" TO sympowork_app USING (organization_id = (SELECT app_private.current_organization_id())) WITH CHECK (organization_id = (SELECT app_private.current_organization_id()));
ALTER POLICY "ats_interview_feedback_tenant_isolation" ON public."ats_interview_feedback" TO sympowork_app USING (organization_id = (SELECT app_private.current_organization_id())) WITH CHECK (organization_id = (SELECT app_private.current_organization_id()));
ALTER POLICY "ats_interviewers_tenant_isolation" ON public."ats_interviewers" TO sympowork_app USING (organization_id = (SELECT app_private.current_organization_id())) WITH CHECK (organization_id = (SELECT app_private.current_organization_id()));
ALTER POLICY "ats_interviews_tenant_isolation" ON public."ats_interviews" TO sympowork_app USING (organization_id = (SELECT app_private.current_organization_id())) WITH CHECK (organization_id = (SELECT app_private.current_organization_id()));
ALTER POLICY "ats_job_requirements_tenant_isolation" ON public."ats_job_requirements" TO sympowork_app USING (organization_id = (SELECT app_private.current_organization_id())) WITH CHECK (organization_id = (SELECT app_private.current_organization_id()));
ALTER POLICY "ats_jobs_tenant_isolation" ON public."ats_jobs" TO sympowork_app USING (organization_id = (SELECT app_private.current_organization_id())) WITH CHECK (organization_id = (SELECT app_private.current_organization_id()));
ALTER POLICY "ats_match_results_tenant_isolation" ON public."ats_match_results" TO sympowork_app USING (organization_id = (SELECT app_private.current_organization_id())) WITH CHECK (organization_id = (SELECT app_private.current_organization_id()));
ALTER POLICY "ats_pipeline_stages_tenant_isolation" ON public."ats_pipeline_stages" TO sympowork_app USING (organization_id = (SELECT app_private.current_organization_id())) WITH CHECK (organization_id = (SELECT app_private.current_organization_id()));
ALTER POLICY "ats_pipelines_tenant_isolation" ON public."ats_pipelines" TO sympowork_app USING (organization_id = (SELECT app_private.current_organization_id())) WITH CHECK (organization_id = (SELECT app_private.current_organization_id()));
ALTER POLICY "ats_requisition_number_counters_tenant_isolation" ON public."ats_requisition_number_counters" TO sympowork_app USING (organization_id = (SELECT app_private.current_organization_id())) WITH CHECK (organization_id = (SELECT app_private.current_organization_id()));
ALTER POLICY "ats_requisitions_tenant_isolation" ON public."ats_requisitions" TO sympowork_app USING (organization_id = (SELECT app_private.current_organization_id())) WITH CHECK (organization_id = (SELECT app_private.current_organization_id()));
ALTER POLICY "ats_resume_conflicts_tenant_isolation" ON public."ats_resume_conflicts" TO sympowork_app USING (organization_id = (SELECT app_private.current_organization_id())) WITH CHECK (organization_id = (SELECT app_private.current_organization_id()));
ALTER POLICY "ats_resume_extraction_fields_tenant_isolation" ON public."ats_resume_extraction_fields" TO sympowork_app USING (organization_id = (SELECT app_private.current_organization_id())) WITH CHECK (organization_id = (SELECT app_private.current_organization_id()));
ALTER POLICY "ats_resume_extractions_tenant_isolation" ON public."ats_resume_extractions" TO sympowork_app USING (organization_id = (SELECT app_private.current_organization_id())) WITH CHECK (organization_id = (SELECT app_private.current_organization_id()));
ALTER POLICY "ats_resume_processing_attempts_tenant_isolation" ON public."ats_resume_processing_attempts" TO sympowork_app USING (organization_id = (SELECT app_private.current_organization_id())) WITH CHECK (organization_id = (SELECT app_private.current_organization_id()));
ALTER POLICY "ats_resume_processing_configs_tenant_isolation" ON public."ats_resume_processing_configs" TO sympowork_app USING (organization_id = (SELECT app_private.current_organization_id())) WITH CHECK (organization_id = (SELECT app_private.current_organization_id()));
ALTER POLICY "ats_resume_processing_jobs_tenant_isolation" ON public."ats_resume_processing_jobs" TO sympowork_app USING (organization_id = (SELECT app_private.current_organization_id())) WITH CHECK (organization_id = (SELECT app_private.current_organization_id()));
ALTER POLICY "ats_saved_searches_tenant_isolation" ON public."ats_saved_searches" TO sympowork_app USING (organization_id = (SELECT app_private.current_organization_id())) WITH CHECK (organization_id = (SELECT app_private.current_organization_id()));
ALTER POLICY "ats_semantic_configs_tenant_isolation" ON public."ats_semantic_configs" TO sympowork_app USING (organization_id = (SELECT app_private.current_organization_id())) WITH CHECK (organization_id = (SELECT app_private.current_organization_id()));
ALTER POLICY "ats_semantic_search_queries_tenant_isolation" ON public."ats_semantic_search_queries" TO sympowork_app USING (organization_id = (SELECT app_private.current_organization_id())) WITH CHECK (organization_id = (SELECT app_private.current_organization_id()));
ALTER POLICY "ats_talent_pool_members_tenant_isolation" ON public."ats_talent_pool_members" TO sympowork_app USING (organization_id = (SELECT app_private.current_organization_id())) WITH CHECK (organization_id = (SELECT app_private.current_organization_id()));
ALTER POLICY "ats_talent_pools_tenant_isolation" ON public."ats_talent_pools" TO sympowork_app USING (organization_id = (SELECT app_private.current_organization_id())) WITH CHECK (organization_id = (SELECT app_private.current_organization_id()));
ALTER POLICY "attendance_policies_tenant_isolation" ON public."attendance_policies" TO sympowork_app USING (organization_id = (SELECT app_private.current_organization_id())) WITH CHECK (organization_id = (SELECT app_private.current_organization_id()));
ALTER POLICY "attendance_punches_tenant_isolation" ON public."attendance_punches" TO sympowork_app USING (organization_id = (SELECT app_private.current_organization_id())) WITH CHECK (organization_id = (SELECT app_private.current_organization_id()));
ALTER POLICY "attendance_records_tenant_isolation" ON public."attendance_records" TO sympowork_app USING (organization_id = (SELECT app_private.current_organization_id())) WITH CHECK (organization_id = (SELECT app_private.current_organization_id()));
ALTER POLICY "attendance_regularization_requests_tenant_isolation" ON public."attendance_regularization_requests" TO sympowork_app USING (organization_id = (SELECT app_private.current_organization_id())) WITH CHECK (organization_id = (SELECT app_private.current_organization_id()));
ALTER POLICY "billing_usage_tenant_isolation" ON public."billing_usage" TO sympowork_app USING (organization_id = (SELECT app_private.current_organization_id())) WITH CHECK (organization_id = (SELECT app_private.current_organization_id()));
ALTER POLICY "collaboration_activity_tenant_isolation" ON public."collaboration_activity" TO sympowork_app USING (organization_id = (SELECT app_private.current_organization_id())) WITH CHECK (organization_id = (SELECT app_private.current_organization_id()));
ALTER POLICY "collaboration_attachments_tenant_isolation" ON public."collaboration_attachments" TO sympowork_app USING (organization_id = (SELECT app_private.current_organization_id())) WITH CHECK (organization_id = (SELECT app_private.current_organization_id()));
ALTER POLICY "collaboration_conversation_members_tenant_isolation" ON public."collaboration_conversation_members" TO sympowork_app USING (organization_id = (SELECT app_private.current_organization_id())) WITH CHECK (organization_id = (SELECT app_private.current_organization_id()));
ALTER POLICY "collaboration_conversations_tenant_isolation" ON public."collaboration_conversations" TO sympowork_app USING (organization_id = (SELECT app_private.current_organization_id())) WITH CHECK (organization_id = (SELECT app_private.current_organization_id()));
ALTER POLICY "collaboration_mentions_tenant_isolation" ON public."collaboration_mentions" TO sympowork_app USING (organization_id = (SELECT app_private.current_organization_id())) WITH CHECK (organization_id = (SELECT app_private.current_organization_id()));
ALTER POLICY "collaboration_message_reactions_tenant_isolation" ON public."collaboration_message_reactions" TO sympowork_app USING (organization_id = (SELECT app_private.current_organization_id())) WITH CHECK (organization_id = (SELECT app_private.current_organization_id()));
ALTER POLICY "collaboration_message_task_links_tenant_isolation" ON public."collaboration_message_task_links" TO sympowork_app USING (organization_id = (SELECT app_private.current_organization_id())) WITH CHECK (organization_id = (SELECT app_private.current_organization_id()));
ALTER POLICY "collaboration_messages_tenant_isolation" ON public."collaboration_messages" TO sympowork_app USING (organization_id = (SELECT app_private.current_organization_id())) WITH CHECK (organization_id = (SELECT app_private.current_organization_id()));
ALTER POLICY "collaboration_presence_tenant_isolation" ON public."collaboration_presence" TO sympowork_app USING (organization_id = (SELECT app_private.current_organization_id())) WITH CHECK (organization_id = (SELECT app_private.current_organization_id()));
ALTER POLICY "collaboration_project_members_tenant_isolation" ON public."collaboration_project_members" TO sympowork_app USING (organization_id = (SELECT app_private.current_organization_id())) WITH CHECK (organization_id = (SELECT app_private.current_organization_id()));
ALTER POLICY "collaboration_projects_tenant_isolation" ON public."collaboration_projects" TO sympowork_app USING (organization_id = (SELECT app_private.current_organization_id())) WITH CHECK (organization_id = (SELECT app_private.current_organization_id()));
ALTER POLICY "collaboration_task_comments_tenant_isolation" ON public."collaboration_task_comments" TO sympowork_app USING (organization_id = (SELECT app_private.current_organization_id())) WITH CHECK (organization_id = (SELECT app_private.current_organization_id()));
ALTER POLICY "collaboration_task_dependencies_tenant_isolation" ON public."collaboration_task_dependencies" TO sympowork_app USING (organization_id = (SELECT app_private.current_organization_id())) WITH CHECK (organization_id = (SELECT app_private.current_organization_id()));
ALTER POLICY "collaboration_task_label_links_tenant_isolation" ON public."collaboration_task_label_links" TO sympowork_app USING (organization_id = (SELECT app_private.current_organization_id())) WITH CHECK (organization_id = (SELECT app_private.current_organization_id()));
ALTER POLICY "collaboration_task_labels_tenant_isolation" ON public."collaboration_task_labels" TO sympowork_app USING (organization_id = (SELECT app_private.current_organization_id())) WITH CHECK (organization_id = (SELECT app_private.current_organization_id()));
ALTER POLICY "collaboration_task_watchers_tenant_isolation" ON public."collaboration_task_watchers" TO sympowork_app USING (organization_id = (SELECT app_private.current_organization_id())) WITH CHECK (organization_id = (SELECT app_private.current_organization_id()));
ALTER POLICY "collaboration_tasks_tenant_isolation" ON public."collaboration_tasks" TO sympowork_app USING (organization_id = (SELECT app_private.current_organization_id())) WITH CHECK (organization_id = (SELECT app_private.current_organization_id()));
ALTER POLICY "departments_tenant_isolation" ON public."departments" TO sympowork_app USING (organization_id = (SELECT app_private.current_organization_id())) WITH CHECK (organization_id = (SELECT app_private.current_organization_id()));
ALTER POLICY "designations_tenant_isolation" ON public."designations" TO sympowork_app USING (organization_id = (SELECT app_private.current_organization_id())) WITH CHECK (organization_id = (SELECT app_private.current_organization_id()));
ALTER POLICY "document_history_tenant_isolation" ON public."document_history" TO sympowork_app USING (organization_id = (SELECT app_private.current_organization_id())) WITH CHECK (organization_id = (SELECT app_private.current_organization_id()));
ALTER POLICY "document_types_tenant_isolation" ON public."document_types" TO sympowork_app USING (organization_id = (SELECT app_private.current_organization_id())) WITH CHECK (organization_id = (SELECT app_private.current_organization_id()));
ALTER POLICY "employee_documents_tenant_isolation" ON public."employee_documents" TO sympowork_app USING (organization_id = (SELECT app_private.current_organization_id())) WITH CHECK (organization_id = (SELECT app_private.current_organization_id()));
ALTER POLICY "employee_history_tenant_isolation" ON public."employee_history" TO sympowork_app USING (organization_id = (SELECT app_private.current_organization_id())) WITH CHECK (organization_id = (SELECT app_private.current_organization_id()));
ALTER POLICY "employee_payroll_profiles_tenant_isolation" ON public."employee_payroll_profiles" TO sympowork_app USING (organization_id = (SELECT app_private.current_organization_id())) WITH CHECK (organization_id = (SELECT app_private.current_organization_id()));
ALTER POLICY "employee_salary_assignments_tenant_isolation" ON public."employee_salary_assignments" TO sympowork_app USING (organization_id = (SELECT app_private.current_organization_id())) WITH CHECK (organization_id = (SELECT app_private.current_organization_id()));
ALTER POLICY "employees_tenant_isolation" ON public."employees" TO sympowork_app USING (organization_id = (SELECT app_private.current_organization_id())) WITH CHECK (organization_id = (SELECT app_private.current_organization_id()));
ALTER POLICY "employment_types_tenant_isolation" ON public."employment_types" TO sympowork_app USING (organization_id = (SELECT app_private.current_organization_id())) WITH CHECK (organization_id = (SELECT app_private.current_organization_id()));
ALTER POLICY "expense_categories_tenant_isolation" ON public."expense_categories" TO sympowork_app USING (organization_id = (SELECT app_private.current_organization_id())) WITH CHECK (organization_id = (SELECT app_private.current_organization_id()));
ALTER POLICY "expense_claims_tenant_isolation" ON public."expense_claims" TO sympowork_app USING (organization_id = (SELECT app_private.current_organization_id())) WITH CHECK (organization_id = (SELECT app_private.current_organization_id()));
ALTER POLICY "expense_history_tenant_isolation" ON public."expense_history" TO sympowork_app USING (organization_id = (SELECT app_private.current_organization_id())) WITH CHECK (organization_id = (SELECT app_private.current_organization_id()));
ALTER POLICY "expense_items_tenant_isolation" ON public."expense_items" TO sympowork_app USING (organization_id = (SELECT app_private.current_organization_id())) WITH CHECK (organization_id = (SELECT app_private.current_organization_id()));
ALTER POLICY "expense_number_counters_tenant_isolation" ON public."expense_number_counters" TO sympowork_app USING (organization_id = (SELECT app_private.current_organization_id())) WITH CHECK (organization_id = (SELECT app_private.current_organization_id()));
ALTER POLICY "expense_policies_tenant_isolation" ON public."expense_policies" TO sympowork_app USING (organization_id = (SELECT app_private.current_organization_id())) WITH CHECK (organization_id = (SELECT app_private.current_organization_id()));
ALTER POLICY "expense_receipts_tenant_isolation" ON public."expense_receipts" TO sympowork_app USING (organization_id = (SELECT app_private.current_organization_id())) WITH CHECK (organization_id = (SELECT app_private.current_organization_id()));
ALTER POLICY "holidays_tenant_isolation" ON public."holidays" TO sympowork_app USING (organization_id = (SELECT app_private.current_organization_id())) WITH CHECK (organization_id = (SELECT app_private.current_organization_id()));
ALTER POLICY "leave_applications_tenant_isolation" ON public."leave_applications" TO sympowork_app USING (organization_id = (SELECT app_private.current_organization_id())) WITH CHECK (organization_id = (SELECT app_private.current_organization_id()));
ALTER POLICY "leave_balances_tenant_isolation" ON public."leave_balances" TO sympowork_app USING (organization_id = (SELECT app_private.current_organization_id())) WITH CHECK (organization_id = (SELECT app_private.current_organization_id()));
ALTER POLICY "leave_policies_tenant_isolation" ON public."leave_policies" TO sympowork_app USING (organization_id = (SELECT app_private.current_organization_id())) WITH CHECK (organization_id = (SELECT app_private.current_organization_id()));
ALTER POLICY "leave_transactions_tenant_isolation" ON public."leave_transactions" TO sympowork_app USING (organization_id = (SELECT app_private.current_organization_id())) WITH CHECK (organization_id = (SELECT app_private.current_organization_id()));
ALTER POLICY "leave_types_tenant_isolation" ON public."leave_types" TO sympowork_app USING (organization_id = (SELECT app_private.current_organization_id())) WITH CHECK (organization_id = (SELECT app_private.current_organization_id()));
ALTER POLICY "locations_tenant_isolation" ON public."locations" TO sympowork_app USING (organization_id = (SELECT app_private.current_organization_id())) WITH CHECK (organization_id = (SELECT app_private.current_organization_id()));
ALTER POLICY "notification_deliveries_tenant_isolation" ON public."notification_deliveries" TO sympowork_app USING (organization_id = (SELECT app_private.current_organization_id())) WITH CHECK (organization_id = (SELECT app_private.current_organization_id()));
ALTER POLICY "notification_outbox_tenant_isolation" ON public."notification_outbox" TO sympowork_app USING (organization_id = (SELECT app_private.current_organization_id())) WITH CHECK (organization_id = (SELECT app_private.current_organization_id()));
ALTER POLICY "notification_preferences_tenant_isolation" ON public."notification_preferences" TO sympowork_app USING (organization_id = (SELECT app_private.current_organization_id())) WITH CHECK (organization_id = (SELECT app_private.current_organization_id()));
ALTER POLICY "notification_templates_tenant_isolation" ON public."notification_templates" TO sympowork_app USING (organization_id = (SELECT app_private.current_organization_id())) WITH CHECK (organization_id = (SELECT app_private.current_organization_id()));
ALTER POLICY "notifications_tenant_isolation" ON public."notifications" TO sympowork_app USING (organization_id = (SELECT app_private.current_organization_id())) WITH CHECK (organization_id = (SELECT app_private.current_organization_id()));
ALTER POLICY "onboarding_tenant_isolation" ON public."onboarding" TO sympowork_app USING (organization_id = (SELECT app_private.current_organization_id())) WITH CHECK (organization_id = (SELECT app_private.current_organization_id()));
ALTER POLICY "onboarding_items_tenant_isolation" ON public."onboarding_checklist_items" TO sympowork_app USING (organization_id = (SELECT app_private.current_organization_id())) WITH CHECK (organization_id = (SELECT app_private.current_organization_id()));
ALTER POLICY "payroll_adjustments_tenant_isolation" ON public."payroll_adjustments" TO sympowork_app USING (organization_id = (SELECT app_private.current_organization_id())) WITH CHECK (organization_id = (SELECT app_private.current_organization_id()));
ALTER POLICY "payroll_calculation_snapshots_tenant_isolation" ON public."payroll_calculation_snapshots" TO sympowork_app USING (organization_id = (SELECT app_private.current_organization_id())) WITH CHECK (organization_id = (SELECT app_private.current_organization_id()));
ALTER POLICY "payroll_line_items_tenant_isolation" ON public."payroll_line_items" TO sympowork_app USING (organization_id = (SELECT app_private.current_organization_id())) WITH CHECK (organization_id = (SELECT app_private.current_organization_id()));
ALTER POLICY "payroll_payslips_tenant_isolation" ON public."payroll_payslips" TO sympowork_app USING (organization_id = (SELECT app_private.current_organization_id())) WITH CHECK (organization_id = (SELECT app_private.current_organization_id()));
ALTER POLICY "payroll_periods_tenant_isolation" ON public."payroll_periods" TO sympowork_app USING (organization_id = (SELECT app_private.current_organization_id())) WITH CHECK (organization_id = (SELECT app_private.current_organization_id()));
ALTER POLICY "payroll_run_employees_tenant_isolation" ON public."payroll_run_employees" TO sympowork_app USING (organization_id = (SELECT app_private.current_organization_id())) WITH CHECK (organization_id = (SELECT app_private.current_organization_id()));
ALTER POLICY "payroll_runs_tenant_isolation" ON public."payroll_runs" TO sympowork_app USING (organization_id = (SELECT app_private.current_organization_id())) WITH CHECK (organization_id = (SELECT app_private.current_organization_id()));
ALTER POLICY "payroll_statutory_configurations_tenant_isolation" ON public."payroll_statutory_configurations" TO sympowork_app USING (organization_id = (SELECT app_private.current_organization_id())) WITH CHECK (organization_id = (SELECT app_private.current_organization_id()));
ALTER POLICY "payroll_tax_configurations_tenant_isolation" ON public."payroll_tax_configurations" TO sympowork_app USING (organization_id = (SELECT app_private.current_organization_id())) WITH CHECK (organization_id = (SELECT app_private.current_organization_id()));
ALTER POLICY "project_number_counters_tenant_isolation" ON public."project_number_counters" TO sympowork_app USING (organization_id = (SELECT app_private.current_organization_id())) WITH CHECK (organization_id = (SELECT app_private.current_organization_id()));
ALTER POLICY "salary_components_tenant_isolation" ON public."salary_components" TO sympowork_app USING (organization_id = (SELECT app_private.current_organization_id())) WITH CHECK (organization_id = (SELECT app_private.current_organization_id()));
ALTER POLICY "salary_structure_components_tenant_isolation" ON public."salary_structure_components" TO sympowork_app USING (organization_id = (SELECT app_private.current_organization_id())) WITH CHECK (organization_id = (SELECT app_private.current_organization_id()));
ALTER POLICY "salary_structures_tenant_isolation" ON public."salary_structures" TO sympowork_app USING (organization_id = (SELECT app_private.current_organization_id())) WITH CHECK (organization_id = (SELECT app_private.current_organization_id()));
ALTER POLICY "shifts_tenant_isolation" ON public."shifts" TO sympowork_app USING (organization_id = (SELECT app_private.current_organization_id())) WITH CHECK (organization_id = (SELECT app_private.current_organization_id()));
ALTER POLICY "subscriptions_tenant_isolation" ON public."subscriptions" TO sympowork_app USING (organization_id = (SELECT app_private.current_organization_id())) WITH CHECK (organization_id = (SELECT app_private.current_organization_id()));
ALTER POLICY "task_number_counters_tenant_isolation" ON public."task_number_counters" TO sympowork_app USING (organization_id = (SELECT app_private.current_organization_id())) WITH CHECK (organization_id = (SELECT app_private.current_organization_id()));
ALTER POLICY "teams_tenant_isolation" ON public."teams" TO sympowork_app USING (organization_id = (SELECT app_private.current_organization_id())) WITH CHECK (organization_id = (SELECT app_private.current_organization_id()));
ALTER POLICY "workflow_definitions_tenant_isolation" ON public."workflow_definitions" TO sympowork_app USING (organization_id = (SELECT app_private.current_organization_id())) WITH CHECK (organization_id = (SELECT app_private.current_organization_id()));
ALTER POLICY "workflow_instances_tenant_isolation" ON public."workflow_instances" TO sympowork_app USING (organization_id = (SELECT app_private.current_organization_id())) WITH CHECK (organization_id = (SELECT app_private.current_organization_id()));
ALTER POLICY "workflow_steps_tenant_isolation" ON public."workflow_steps" TO sympowork_app USING (organization_id = (SELECT app_private.current_organization_id())) WITH CHECK (organization_id = (SELECT app_private.current_organization_id()));
ALTER POLICY "workflow_versions_tenant_isolation" ON public."workflow_versions" TO sympowork_app USING (organization_id = (SELECT app_private.current_organization_id())) WITH CHECK (organization_id = (SELECT app_private.current_organization_id()));
ALTER POLICY "working_days_tenant_isolation" ON public."working_days" TO sympowork_app USING (organization_id = (SELECT app_private.current_organization_id())) WITH CHECK (organization_id = (SELECT app_private.current_organization_id()));



-- SECTION 6: RUNTIME ROLE EXECUTE & USAGE GRANTS
GRANT USAGE ON SCHEMA app_private TO sympowork_app;
GRANT EXECUTE ON FUNCTION app_private.begin_request_context(text) TO sympowork_app;
GRANT EXECUTE ON FUNCTION app_private.valid_request_context() TO sympowork_app;
GRANT EXECUTE ON FUNCTION app_private.current_user_id() TO sympowork_app;
GRANT EXECUTE ON FUNCTION app_private.current_organization_id() TO sympowork_app;
GRANT EXECUTE ON FUNCTION app_private.is_platform_owner() TO sympowork_app;
GRANT EXECUTE ON FUNCTION app_private.current_request_user() TO sympowork_app;
GRANT EXECUTE ON FUNCTION app_private.end_request_context() TO sympowork_app;
GRANT EXECUTE ON FUNCTION app_private.append_failed_login() TO sympowork_app;
GRANT EXECUTE ON FUNCTION app_private.revoke_presented_session(text) TO sympowork_app;
GRANT EXECUTE ON FUNCTION app_private.read_platform_configuration() TO sympowork_app;


COMMIT;
