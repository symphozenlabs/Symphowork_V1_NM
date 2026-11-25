-- Requires request-context-stage.sql. Install only on the approved QA branch.
BEGIN;
GRANT SELECT (key, value) ON public.system_config TO sympowork_context_owner;
SET LOCAL ROLE sympowork_context_owner;
CREATE FUNCTION app_private.read_platform_configuration()
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
COMMIT;
