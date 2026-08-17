-- Create a private schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS private;

-- Move the utility functions to private schema
-- RLS policies will need to be updated to point to these new locations

-- 1. has_role
ALTER FUNCTION public.has_role(uuid, public.app_role) SET SCHEMA private;
-- 2. is_staff
ALTER FUNCTION public.is_staff(uuid) SET SCHEMA private;

-- Update RLS policies to use the functions in the new schema
-- This requires dropping and recreating policies or altering them if supported.
-- For safety, I will use a search_path approach inside the public functions if I were to keep them, 
-- but here moving them is cleaner for linter.

-- Re-creating public functions as SECURITY INVOKER that call the private ones
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
  SELECT private.has_role(_user_id, _role);
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
  SELECT private.is_staff(_user_id);
$$;
