-- Modifica o trigger de criação de usuário para dar a role 'super_admin' ao email luizrogeriopx@gmail.com
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, nome_completo)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nome_completo', NEW.email));

  IF NEW.email = 'luizrogeriopx@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'super_admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'aluno');
  END IF;

  RETURN NEW;
END; $$;

-- Atualiza o usuário existente no banco de dados se ele já estiver cadastrado
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'super_admin'::public.app_role
FROM auth.users
WHERE email = 'luizrogeriopx@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;
