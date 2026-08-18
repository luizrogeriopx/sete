-- Adicionar coluna ordem na tabela cursos para ordenação personalizada
ALTER TABLE public.cursos ADD COLUMN IF NOT EXISTS ordem INT NOT NULL DEFAULT 0;

-- Criar índice para performance de ordenação
CREATE INDEX IF NOT EXISTS idx_cursos_ordem ON public.cursos(ordem);
