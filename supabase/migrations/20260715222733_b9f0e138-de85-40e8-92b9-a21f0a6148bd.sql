
ALTER TABLE public.cursos ADD COLUMN IF NOT EXISTS duracao text;

CREATE POLICY "Cursos images public read"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'cursos');

CREATE POLICY "Staff manage cursos images"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'cursos' AND public.is_staff(auth.uid()))
WITH CHECK (bucket_id = 'cursos' AND public.is_staff(auth.uid()));
