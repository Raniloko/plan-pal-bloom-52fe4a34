CREATE OR REPLACE FUNCTION public.admin_list_sessions(p_user_id uuid)
RETURNS TABLE(id uuid, created_at timestamptz, updated_at timestamptz, refreshed_at timestamp, user_agent text, ip text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, auth AS $$
  SELECT s.id, s.created_at, s.updated_at, s.refreshed_at, s.user_agent, host(s.ip)
  FROM auth.sessions s WHERE s.user_id = p_user_id
  ORDER BY COALESCE(s.refreshed_at, s.updated_at::timestamp) DESC;
$$;
CREATE OR REPLACE FUNCTION public.admin_revoke_session(p_user_id uuid, p_session_id uuid)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
DECLARE n int;
BEGIN
  DELETE FROM auth.sessions s WHERE s.id = p_session_id AND s.user_id = p_user_id;
  GET DIAGNOSTICS n = ROW_COUNT; RETURN n;
END; $$;
CREATE OR REPLACE FUNCTION public.admin_revoke_other_sessions(p_user_id uuid, p_keep uuid)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
DECLARE n int;
BEGIN
  DELETE FROM auth.sessions s WHERE s.user_id = p_user_id AND s.id <> p_keep;
  GET DIAGNOSTICS n = ROW_COUNT; RETURN n;
END; $$;
REVOKE ALL ON FUNCTION public.admin_list_sessions(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_revoke_session(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_revoke_other_sessions(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_sessions(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_revoke_session(uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_revoke_other_sessions(uuid, uuid) TO service_role;