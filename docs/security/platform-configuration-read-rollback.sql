BEGIN;
DROP FUNCTION app_private.read_platform_configuration();
REVOKE SELECT (key, value) ON public.system_config FROM sympowork_context_owner;
COMMIT;
