BEGIN;
GRANT DELETE ON public.sessions TO sympowork_context_owner;
SET LOCAL ROLE sympowork_context_owner;
CREATE FUNCTION app_private.revoke_presented_session(session_token text)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = pg_catalog
AS $function$
  DELETE FROM public.sessions AS s
  WHERE length(session_token) = 43 AND session_token !~ '[^A-Za-z0-9_-]'
    AND s.token_hash = encode(sha256(convert_to(session_token, 'UTF8')), 'hex')
$function$;
REVOKE ALL ON FUNCTION app_private.revoke_presented_session(text) FROM PUBLIC;
RESET ROLE;
COMMIT;
