-- Fix for "permission denied for function is_staff"
-- This migration ensures that the private schema and security functions are accessible to the necessary roles.

-- 1. Grant usage on the private schema
GRANT USAGE ON SCHEMA private TO authenticated;
GRANT USAGE ON SCHEMA private TO service_role;

-- 2. Ensure functions in private schema have correct permissions
-- They should be SECURITY DEFINER to bypass RLS and access user_roles directly
-- We already moved them there, but let's make sure they are correct and accessible
ALTER FUNCTION private.has_role(uuid, public.app_role) SECURITY DEFINER;
ALTER FUNCTION private.is_staff(uuid) SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO service_role;
GRANT EXECUTE ON FUNCTION private.is_staff(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_staff(uuid) TO service_role;

-- 3. Ensure public wrapper functions have correct permissions and search_path
-- These are SECURITY INVOKER by design, they just call the private ones.
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, private
AS $$
  SELECT private.has_role(_user_id, _role);
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, private
AS $$
  SELECT private.is_staff(_user_id);
$$;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;
GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO service_role;
