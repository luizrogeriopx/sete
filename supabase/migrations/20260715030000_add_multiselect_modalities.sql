-- Adiciona coluna modalidades_disponiveis (array de texto) na tabela cursos
ALTER TABLE public.cursos ADD COLUMN IF NOT EXISTS modalidades_disponiveis TEXT[] DEFAULT ARRAY['online'];

-- Atualiza a coluna modalidades_disponiveis com o valor atual de modalidade (compatibilidade)
UPDATE public.cursos SET modalidades_disponiveis = ARRAY[modalidade::text] WHERE modalidades_disponiveis IS NULL OR modalidades_disponiveis = '{}';

-- Adiciona coluna modalidade_escolhida (texto) na tabela matriculas
ALTER TABLE public.matriculas ADD COLUMN IF NOT EXISTS modalidade_escolhida TEXT;

-- Atualiza a coluna modalidade_escolhida com a modalidade do curso para as matriculas existentes
UPDATE public.matriculas m
SET modalidade_escolhida = c.modalidade::text
FROM public.cursos c
WHERE m.curso_id = c.id AND m.modalidade_escolhida IS NULL;
