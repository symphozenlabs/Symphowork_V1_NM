BEGIN;
GRANT INSERT (action, resource) ON public.audit_logs TO sympowork_context_owner;
CREATE POLICY failed_login_append ON public.audit_logs
  FOR INSERT TO sympowork_context_owner WITH CHECK (
    action = 'failed_login' AND resource = 'user' AND organization_id IS NULL
    AND actor_user_id IS NULL AND resource_id IS NULL AND metadata IS NULL
  );
SET LOCAL ROLE sympowork_context_owner;
CREATE FUNCTION app_private.append_failed_login()
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = pg_catalog
AS $function$
  INSERT INTO public.audit_logs(action, resource) VALUES ('failed_login', 'user')
$function$;
REVOKE ALL ON FUNCTION app_private.append_failed_login() FROM PUBLIC;
RESET ROLE;
COMMIT;
