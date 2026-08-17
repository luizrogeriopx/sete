-- Setting search_path for the newly created public functions
ALTER FUNCTION public.has_role(uuid, public.app_role) SET search_path = public, private;
ALTER FUNCTION public.is_staff(uuid) SET search_path = public, private;
