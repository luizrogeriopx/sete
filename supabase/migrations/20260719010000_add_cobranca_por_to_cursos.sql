-- Alter public.cursos to add cobranca_por column
ALTER TABLE public.cursos
ADD COLUMN IF NOT EXISTS cobranca_por TEXT DEFAULT 'curso' CHECK (cobranca_por IN ('curso', 'modulo'));
