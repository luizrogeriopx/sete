-- Redirect foreign keys pointing to auth.users(id) to public.profiles(id) instead.
-- This allows PostgREST to automatically resolve relationships for join queries like profiles:column(...)

-- 1. public.cursos
ALTER TABLE public.cursos
  DROP CONSTRAINT IF EXISTS cursos_ministrante_id_fkey;
ALTER TABLE public.cursos
  ADD CONSTRAINT cursos_ministrante_id_fkey FOREIGN KEY (ministrante_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 2. public.matriculas
ALTER TABLE public.matriculas
  DROP CONSTRAINT IF EXISTS matriculas_aluno_id_fkey;
ALTER TABLE public.matriculas
  ADD CONSTRAINT matriculas_aluno_id_fkey FOREIGN KEY (aluno_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 3. public.presencas
ALTER TABLE public.presencas
  DROP CONSTRAINT IF EXISTS presencas_registrado_por_fkey;
ALTER TABLE public.presencas
  ADD CONSTRAINT presencas_registrado_por_fkey FOREIGN KEY (registrado_por) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 4. public.pagamentos
ALTER TABLE public.pagamentos
  DROP CONSTRAINT IF EXISTS pagamentos_aluno_id_fkey;
ALTER TABLE public.pagamentos
  ADD CONSTRAINT pagamentos_aluno_id_fkey FOREIGN KEY (aluno_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 5. public.suporte_tickets
ALTER TABLE public.suporte_tickets
  DROP CONSTRAINT IF EXISTS suporte_tickets_aluno_id_fkey,
  DROP CONSTRAINT IF EXISTS suporte_tickets_atendida_por_fkey;
ALTER TABLE public.suporte_tickets
  ADD CONSTRAINT suporte_tickets_aluno_id_fkey FOREIGN KEY (aluno_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  ADD CONSTRAINT suporte_tickets_atendida_por_fkey FOREIGN KEY (atendida_por) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 6. public.suporte_mensagens
ALTER TABLE public.suporte_mensagens
  DROP CONSTRAINT IF EXISTS suporte_mensagens_autor_id_fkey;
ALTER TABLE public.suporte_mensagens
  ADD CONSTRAINT suporte_mensagens_autor_id_fkey FOREIGN KEY (autor_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 7. public.notificacoes
ALTER TABLE public.notificacoes
  DROP CONSTRAINT IF EXISTS notificacoes_destinatario_id_fkey,
  DROP CONSTRAINT IF EXISTS notificacoes_enviada_por_fkey;
ALTER TABLE public.notificacoes
  ADD CONSTRAINT notificacoes_destinatario_id_fkey FOREIGN KEY (destinatario_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  ADD CONSTRAINT notificacoes_enviada_por_fkey FOREIGN KEY (enviada_por) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 8. public.secretaria_solicitacoes
ALTER TABLE public.secretaria_solicitacoes
  DROP CONSTRAINT IF EXISTS secretaria_solicitacoes_aluno_id_fkey,
  DROP CONSTRAINT IF EXISTS secretaria_solicitacoes_atendida_por_fkey;
ALTER TABLE public.secretaria_solicitacoes
  ADD CONSTRAINT secretaria_solicitacoes_aluno_id_fkey FOREIGN KEY (aluno_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  ADD CONSTRAINT secretaria_solicitacoes_atendida_por_fkey FOREIGN KEY (atendida_por) REFERENCES public.profiles(id) ON DELETE SET NULL;
