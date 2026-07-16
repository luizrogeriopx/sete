-- ========== QUESTIONARIOS ==========
CREATE TABLE IF NOT EXISTS public.questionarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descricao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Habilita RLS e permissões
GRANT SELECT, INSERT, UPDATE, DELETE ON public.questionarios TO authenticated;
GRANT ALL ON public.questionarios TO service_role;
ALTER TABLE public.questionarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Questionários visíveis a autenticados" ON public.questionarios 
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin gerencia questionários" ON public.questionarios 
FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- ========== QUESTOES DE QUESTIONARIOS ==========
CREATE TABLE IF NOT EXISTS public.questoes_questionario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  questionario_id UUID NOT NULL REFERENCES public.questionarios(id) ON DELETE CASCADE,
  enunciado TEXT NOT NULL,
  alternativas JSONB NOT NULL,
  resposta_correta TEXT NOT NULL,
  peso NUMERIC(5,2) NOT NULL DEFAULT 1.0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Habilita RLS e permissões
GRANT SELECT, INSERT, UPDATE, DELETE ON public.questoes_questionario TO authenticated;
GRANT ALL ON public.questoes_questionario TO service_role;
ALTER TABLE public.questoes_questionario ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Questões visíveis a autenticados" ON public.questoes_questionario 
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin gerencia questões" ON public.questoes_questionario 
FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- ========== ALTERA AVALIACOES PARA SUPORTAR VINCULO COM QUESTIONARIOS ==========
ALTER TABLE public.avaliacoes 
ADD COLUMN IF NOT EXISTS questionario_id UUID REFERENCES public.questionarios(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS quantidade_questoes INT DEFAULT 10;
