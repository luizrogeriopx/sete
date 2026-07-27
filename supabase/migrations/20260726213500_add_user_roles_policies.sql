-- Add RLS policies for user_roles to allow administrators and super administrators to manage roles.
-- Since the helper functions are SECURITY DEFINER, using them avoids infinite recursion.

CREATE POLICY "Admins gerenciam papéis" ON public.user_roles
  FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin')
  );
