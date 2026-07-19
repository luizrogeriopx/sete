-- Alter public.cursos to add quantidade_modulos column
ALTER TABLE public.cursos
ADD COLUMN IF NOT EXISTS quantidade_modulos INTEGER;
