
-- Add image URL column, make template_html optional, add orientation
ALTER TABLE public.layouts_certificado
  ADD COLUMN IF NOT EXISTS imagem_url text,
  ADD COLUMN IF NOT EXISTS orientacao text NOT NULL DEFAULT 'paisagem',
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.layouts_certificado ALTER COLUMN template_html DROP NOT NULL;

-- Storage policies for certificado-layouts (staff manages; alunos read via signed URL server-side)
CREATE POLICY "Staff manage layout files"
  ON storage.objects FOR ALL
  TO authenticated
  USING (bucket_id = 'certificado-layouts' AND public.is_staff(auth.uid()))
  WITH CHECK (bucket_id = 'certificado-layouts' AND public.is_staff(auth.uid()));

CREATE POLICY "Authenticated read layout files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'certificado-layouts');
