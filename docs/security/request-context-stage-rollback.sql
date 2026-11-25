-- DBA review candidate. Reverse only the standalone staging migration.
-- This rollback is for staging before any application or policy cutover.
BEGIN;
DROP POLICY membership_context_bootstrap ON public.memberships;
DROP FUNCTION app_private.end_request_context();
DROP FUNCTION app_private.current_request_user();
DROP FUNCTION app_private.is_platform_owner();
DROP FUNCTION app_private.current_organization_id();
DROP FUNCTION app_private.current_user_id();
DROP FUNCTION app_private.begin_request_context(text);
DROP FUNCTION app_private.valid_request_context();
DROP TABLE app_private.request_context_key;
DROP SCHEMA app_private;
REVOKE SELECT (id, user_id, token_hash, expires_at) ON public.sessions FROM sympowork_context_owner;
REVOKE SELECT (id, status, platform_role, email, full_name, must_change_password) ON public.users FROM sympowork_context_owner;
REVOKE SELECT (user_id, organization_id, status) ON public.memberships FROM sympowork_context_owner;
REVOKE SELECT (id, status) ON public.organizations FROM sympowork_context_owner;
REVOKE USAGE ON SCHEMA public FROM sympowork_context_owner;
DROP ROLE sympowork_context_owner;
COMMIT;
