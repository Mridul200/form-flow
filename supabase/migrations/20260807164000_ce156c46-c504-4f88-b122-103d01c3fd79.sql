REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.has_active_link(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_request_participant(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_active_link(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_request_participant(uuid, uuid) TO authenticated;