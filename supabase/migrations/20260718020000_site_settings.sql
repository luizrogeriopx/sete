-- Grant select to anon and authenticated
GRANT SELECT ON public.app_settings TO anon;

-- Enable public read for the landing_hero setting
CREATE POLICY "Leitura pública de landing_hero"
ON public.app_settings
FOR SELECT
TO anon, authenticated
USING (chave = 'landing_hero');

-- Enable staff write/manage for the landing_hero setting
CREATE POLICY "Staff gerencia landing_hero"
ON public.app_settings
FOR ALL
TO authenticated
USING (public.is_staff(auth.uid()) AND chave = 'landing_hero')
WITH CHECK (public.is_staff(auth.uid()) AND chave = 'landing_hero');

-- Insert default landing hero values
INSERT INTO public.app_settings (chave, valor)
VALUES (
  'landing_hero',
  '{
    "badge": "SEMINÁRIO TEOLÓGICO ESPERANÇA",
    "title": "Ensino que transforma\nMinistérios que edificam",
    "description": "Teologia fundamentada, formação prática e comunidade que apoia seu chamado."
  }'::jsonb
)
ON CONFLICT (chave) DO UPDATE
SET valor = EXCLUDED.valor;
