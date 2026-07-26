-- Robust function to handle new user registration and avoid transaction rollbacks on invalid inputs
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_nome_completo TEXT;
  v_data_nascimento DATE;
  v_cpf TEXT;
  v_telefone TEXT;
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

  -- Insert default user role 'aluno' if not exists
  INSERT INTO public.user_roles (user_id, role) 
  VALUES (NEW.id, 'aluno')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END; $$;

-- Backfill profiles for existing users who don't have one
INSERT INTO public.profiles (id, nome_completo, data_nascimento, cpf, telefone)
SELECT 
  u.id,
  COALESCE(
    NULLIF(NULLIF(u.raw_user_meta_data->>'nome_completo', ''), 'null'), 
    u.email, 
    'Usuário sem nome'
  ) AS nome_completo,
  CASE 
    WHEN NULLIF(NULLIF(u.raw_user_meta_data->>'data_nascimento', ''), 'null') IS NOT NULL 
    THEN 
      CASE 
        WHEN u.raw_user_meta_data->>'data_nascimento' ~ '^\d{4}-\d{2}-\d{2}$' 
        THEN (u.raw_user_meta_data->>'data_nascimento')::DATE 
        ELSE NULL 
      END
    ELSE NULL 
  END AS data_nascimento,
  -- Ensure we don't insert duplicate CPFs from metadata during backfill
  CASE 
    WHEN NULLIF(NULLIF(u.raw_user_meta_data->>'cpf', ''), 'null') IS NOT NULL 
         AND NOT EXISTS (
           SELECT 1 FROM public.profiles p2 
           WHERE p2.cpf = NULLIF(NULLIF(u.raw_user_meta_data->>'cpf', ''), 'null')
         )
    THEN NULLIF(NULLIF(u.raw_user_meta_data->>'cpf', ''), 'null')
    ELSE NULL
  END AS cpf,
  NULLIF(NULLIF(u.raw_user_meta_data->>'telefone', ''), 'null') AS telefone
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Backfill roles for existing users who don't have a role
INSERT INTO public.user_roles (user_id, role)
SELECT 
  u.id,
  'aluno'::public.app_role
FROM auth.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
WHERE ur.user_id IS NULL
ON CONFLICT (user_id, role) DO NOTHING;
