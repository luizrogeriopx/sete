-- Final fix for "permission denied for function is_staff"
-- The previous grant USAGE ON SCHEMA private TO authenticated might not be enough
-- for PostgREST to execute functions within the schema if the roles aren't correctly configured.
-- We also need to ensure the search_path is absolutely correct at the function level.

-- 1. Grant usage on private schema to all relevant roles
GRANT USAGE ON SCHEMA private TO anon, authenticated, service_role;

-- 2. Explicitly grant EXECUTE on ALL functions in the private schema
-- (Current and future to be safe, though specific is better)
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA private TO authenticated, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA private TO anon; -- RLS often uses these for public reads too

-- 3. Re-define the public wrapper functions with explicit search_path and permissions
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER -- Use DEFINER to ensure it has access to the private schema and user_roles table
SET search_path = public, private
AS $$
  SELECT private.has_role(_user_id, _role);
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER -- Use DEFINER to ensure it has access to the private schema and user_roles table
SET search_path = public, private
AS $$
  SELECT private.is_staff(_user_id);
$$;

-- 4. Final grants on the wrapper functions
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO anon, authenticated, service_role;
