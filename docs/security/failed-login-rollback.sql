BEGIN;
DROP FUNCTION app_private.append_failed_login();
DROP POLICY failed_login_append ON public.audit_logs;
REVOKE INSERT (action, resource) ON public.audit_logs FROM sympowork_context_owner;
COMMIT;
