-- Alter public.cursos to add publico_alvo column
ALTER TABLE public.cursos
ADD COLUMN IF NOT EXISTS publico_alvo TEXT DEFAULT 'ambos' CHECK (publico_alvo IN ('homens', 'mulheres', 'ambos'));
