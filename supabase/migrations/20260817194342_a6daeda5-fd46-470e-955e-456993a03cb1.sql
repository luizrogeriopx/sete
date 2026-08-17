-- addressing linter warnings for SECURITY DEFINER functions

-- 1. handle_matricula_concluida (trigger function)
REVOKE EXECUTE ON FUNCTION public.handle_matricula_concluida() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_matricula_concluida() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_matricula_concluida() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.handle_matricula_concluida() TO service_role;

-- 2. handle_new_user (trigger function - ensuring it's restricted)
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

-- 3. has_role (utility function - used in RLS, needs authenticated access)
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;

-- 4. is_staff (utility function - used in RLS, needs authenticated access)
REVOKE EXECUTE ON FUNCTION public.is_staff(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_staff(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO service_role;
