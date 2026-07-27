-- Simplify the user_roles write policy to allow any staff member to manage user roles
DROP POLICY IF EXISTS "Admins gerenciam papéis" ON public.user_roles;

CREATE POLICY "Staff gerencia papéis" ON public.user_roles
  FOR ALL
  TO authenticated
  USING (
    public.is_staff(auth.uid())
  )
  WITH CHECK (
    public.is_staff(auth.uid())
  );
