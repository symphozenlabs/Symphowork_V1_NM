BEGIN;
DROP FUNCTION app_private.revoke_presented_session(text);
REVOKE DELETE ON public.sessions FROM sympowork_context_owner;
COMMIT;
