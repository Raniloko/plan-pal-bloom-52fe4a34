REVOKE ALL ON FUNCTION public.reserve_atomic(uuid, date, text, integer, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.reserve_atomic(uuid, date, text, integer, jsonb) FROM anon;
REVOKE ALL ON FUNCTION public.reserve_atomic(uuid, date, text, integer, jsonb) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_atomic(uuid, date, text, integer, jsonb) TO service_role;

REVOKE ALL ON FUNCTION public.reserve_billard_auto(date, text, integer, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.reserve_billard_auto(date, text, integer, jsonb) FROM anon;
REVOKE ALL ON FUNCTION public.reserve_billard_auto(date, text, integer, jsonb) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_billard_auto(date, text, integer, jsonb) TO service_role;