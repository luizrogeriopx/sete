-- Update handle_new_user trigger to atomically assign the user's role from signup metadata.
-- This avoids client-side delays/RLS/foreign key errors when assigning roles immediately after signup.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_nome_completo TEXT;
  v_data_nascimento DATE;
  v_cpf TEXT;
  v_telefone TEXT;
  v_role public.app_role;
BEGIN
  -- Safe name fallback
  v_nome_completo := COALESCE(
    NULLIF(NULLIF(NEW.raw_user_meta_data->>'nome_completo', ''), 'null'),
    NEW.email,
    'Usuário sem nome'
  );

  -- Safe date of birth conversion
  BEGIN
    v_data_nascimento := NULLIF(NULLIF(NEW.raw_user_meta_data->>'data_nascimento', ''), 'null')::DATE;
  EXCEPTION WHEN OTHERS THEN
    v_data_nascimento := NULL;
  END;

  -- Safe CPF extraction
  v_cpf := NULLIF(NULLIF(NEW.raw_user_meta_data->>'cpf', ''), 'null');

  -- Safe Telefone extraction
  v_telefone := NULLIF(NULLIF(NEW.raw_user_meta_data->>'telefone', ''), 'null');

  -- Check if CPF is already used. If it is, set it to NULL to prevent unique constraint crash
  IF v_cpf IS NOT NULL AND EXISTS (SELECT 1 FROM public.profiles WHERE cpf = v_cpf) THEN
    v_cpf := NULL;
  END IF;

  -- Safe role resolution (reads role from metadata, defaults to 'aluno')
  BEGIN
    v_role := COALESCE(
      (NEW.raw_user_meta_data->>'role')::public.app_role,
      'aluno'::public.app_role
    );
  EXCEPTION WHEN OTHERS THEN
    v_role := 'aluno'::public.app_role;
  END;

  -- Insert profile if not exists
  INSERT INTO public.profiles (id, nome_completo, data_nascimento, cpf, telefone)
  VALUES (
    NEW.id, 
    v_nome_completo,
    v_data_nascimento,
    v_cpf,
    v_telefone
  )
  ON CONFLICT (id) DO UPDATE SET
    nome_completo = EXCLUDED.nome_completo,
    data_nascimento = COALESCE(profiles.data_nascimento, EXCLUDED.data_nascimento),
    cpf = COALESCE(profiles.cpf, EXCLUDED.cpf),
    telefone = COALESCE(profiles.telefone, EXCLUDED.telefone);

  -- Insert user role atomically
  INSERT INTO public.user_roles (user_id, role) 
  VALUES (NEW.id, v_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END; $$;
