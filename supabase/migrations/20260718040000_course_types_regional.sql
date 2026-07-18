-- Alter public.cursos to add tipo column
ALTER TABLE public.cursos
ADD COLUMN IF NOT EXISTS tipo TEXT DEFAULT 'livre' CHECK (tipo IN ('livre', 'interno'));

-- Alter public.matriculas to add regional and congregacao columns
ALTER TABLE public.matriculas
ADD COLUMN IF NOT EXISTS regional TEXT,
ADD COLUMN IF NOT EXISTS congregacao TEXT;
