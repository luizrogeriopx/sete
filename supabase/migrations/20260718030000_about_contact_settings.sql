-- Enable public read for the site_sobre and site_contato settings
CREATE POLICY "Leitura pública de site_sobre"
ON public.app_settings
FOR SELECT
TO anon, authenticated
USING (chave = 'site_sobre');

CREATE POLICY "Leitura pública de site_contato"
ON public.app_settings
FOR SELECT
TO anon, authenticated
USING (chave = 'site_contato');

-- Enable staff write/manage for site_sobre and site_contato settings
CREATE POLICY "Staff gerencia site_sobre"
ON public.app_settings
FOR ALL
TO authenticated
USING (public.is_staff(auth.uid()) AND chave = 'site_sobre')
WITH CHECK (public.is_staff(auth.uid()) AND chave = 'site_sobre');

CREATE POLICY "Staff gerencia site_contato"
ON public.app_settings
FOR ALL
TO authenticated
USING (public.is_staff(auth.uid()) AND chave = 'site_contato')
WITH CHECK (public.is_staff(auth.uid()) AND chave = 'site_contato');

-- Insert default site_sobre values
INSERT INTO public.app_settings (chave, valor)
VALUES (
  'site_sobre',
  '{
    "tagline": "Institucional",
    "title": "Sobre o SETE",
    "intro": "O Seminário Teológico Esperança (SETE) é uma instituição comprometida com a formação bíblica, teológica e ministerial de servos e servas do Senhor. Nosso propósito é preparar líderes que amem a Palavra, sirvam à Igreja e alcancem o mundo com o Evangelho.",
    "mission_title": "Missão",
    "mission_text": "Formar cristãos com base bíblica sólida, discernimento teológico e coração pastoral, capacitando-os para o serviço à Igreja e à sociedade.",
    "vision_title": "Visão",
    "vision_text": "Ser referência em educação teológica acessível, unindo excelência acadêmica, fidelidade doutrinária e paixão missionária.",
    "values_title": "Valores",
    "values": [
      "Fidelidade às Escrituras",
      "Amor à Igreja",
      "Excelência acadêmica",
      "Formação integral",
      "Serviço com humildade"
    ]
  }'::jsonb
)
ON CONFLICT (chave) DO UPDATE
SET valor = EXCLUDED.valor;

-- Insert default site_contato values
INSERT INTO public.app_settings (chave, valor)
VALUES (
  'site_contato',
  '{
    "tagline": "Fale conosco",
    "title": "Contato",
    "description": "Tem dúvidas sobre matrículas, cursos ou o funcionamento do seminário? Fale com a nossa secretaria.",
    "email": "contato@sete.edu.br",
    "phone": "(00) 0000-0000",
    "address": "Sede do seminário — a definir"
  }'::jsonb
)
ON CONFLICT (chave) DO UPDATE
SET valor = EXCLUDED.valor;
