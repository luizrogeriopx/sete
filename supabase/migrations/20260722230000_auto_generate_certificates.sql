-- Function to automatically generate certificates when enrollment status is set to 'concluida'
CREATE OR REPLACE FUNCTION public.handle_matricula_concluida()
RETURNS TRIGGER AS $$
DECLARE
  v_layout_id UUID;
BEGIN
  IF NEW.status = 'concluida' AND (OLD.status IS DISTINCT FROM 'concluida' OR OLD.status IS NULL) THEN
    -- 1. Find a layout linked to the course
    SELECT id INTO v_layout_id 
    FROM public.layouts_certificado 
    WHERE curso_id = NEW.curso_id 
    LIMIT 1;

    -- 2. If not found, find a default layout
    IF v_layout_id IS NULL THEN
      SELECT id INTO v_layout_id 
      FROM public.layouts_certificado 
      WHERE padrao = true 
      LIMIT 1;
    END IF;

    -- 3. Insert the certificate
    INSERT INTO public.certificados (aluno_id, curso_id, layout_id, emitido_em)
    VALUES (NEW.aluno_id, NEW.curso_id, v_layout_id, now())
    ON CONFLICT (aluno_id, curso_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger on public.matriculas for updates
CREATE OR REPLACE TRIGGER trg_matricula_concluida
  AFTER UPDATE OF status ON public.matriculas
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_matricula_concluida();

-- Trigger on public.matriculas for inserts
CREATE OR REPLACE TRIGGER trg_matricula_concluida_insert
  AFTER INSERT ON public.matriculas
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_matricula_concluida();

-- Backfill certificates for existing completed enrollments
INSERT INTO public.certificados (aluno_id, curso_id, layout_id, emitido_em)
SELECT 
  m.aluno_id, 
  m.curso_id, 
  COALESCE(
    (SELECT id FROM public.layouts_certificado WHERE curso_id = m.curso_id LIMIT 1),
    (SELECT id FROM public.layouts_certificado WHERE padrao = true LIMIT 1)
  ),
  now()
FROM public.matriculas m
WHERE m.status = 'concluida'
ON CONFLICT (aluno_id, curso_id) DO NOTHING;
