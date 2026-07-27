
REVOKE EXECUTE ON FUNCTION public.is_squad_coach(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_squad_member(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_squad_coach(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_squad_member(uuid, uuid) TO authenticated, service_role;
