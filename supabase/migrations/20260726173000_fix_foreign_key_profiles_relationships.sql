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
  DROP CONSTRAINT IF EXISTS presencas_registrada_por_fkey,
  DROP CONSTRAINT IF EXISTS presencas_aluno_id_fkey;
ALTER TABLE public.presencas
  ADD CONSTRAINT presencas_registrada_por_fkey FOREIGN KEY (registrada_por) REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD CONSTRAINT presencas_aluno_id_fkey FOREIGN KEY (aluno_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 4. public.pagamentos
ALTER TABLE public.pagamentos
  DROP CONSTRAINT IF EXISTS pagamentos_registrado_por_fkey;
ALTER TABLE public.pagamentos
  ADD CONSTRAINT pagamentos_registrado_por_fkey FOREIGN KEY (registrado_por) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 5. public.carteirinhas
ALTER TABLE public.carteirinhas
  DROP CONSTRAINT IF EXISTS carteirinhas_aluno_id_fkey;
ALTER TABLE public.carteirinhas
  ADD CONSTRAINT carteirinhas_aluno_id_fkey FOREIGN KEY (aluno_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 6. public.suporte_tickets
ALTER TABLE public.suporte_tickets
  DROP CONSTRAINT IF EXISTS suporte_tickets_usuario_id_fkey;
ALTER TABLE public.suporte_tickets
  ADD CONSTRAINT suporte_tickets_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 7. public.ticket_mensagens
ALTER TABLE public.ticket_mensagens
  DROP CONSTRAINT IF EXISTS ticket_mensagens_autor_id_fkey;
ALTER TABLE public.ticket_mensagens
  ADD CONSTRAINT ticket_mensagens_autor_id_fkey FOREIGN KEY (autor_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 8. public.notificacoes
ALTER TABLE public.notificacoes
  DROP CONSTRAINT IF EXISTS notificacoes_destinatario_id_fkey,
  DROP CONSTRAINT IF EXISTS notificacoes_enviada_por_fkey;
ALTER TABLE public.notificacoes
  ADD CONSTRAINT notificacoes_destinatario_id_fkey FOREIGN KEY (destinatario_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  ADD CONSTRAINT notificacoes_enviada_por_fkey FOREIGN KEY (enviada_por) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 9. public.secretaria_solicitacoes
ALTER TABLE public.secretaria_solicitacoes
  DROP CONSTRAINT IF EXISTS secretaria_solicitacoes_aluno_id_fkey,
  DROP CONSTRAINT IF EXISTS secretaria_solicitacoes_atendida_por_fkey;
ALTER TABLE public.secretaria_solicitacoes
  ADD CONSTRAINT secretaria_solicitacoes_aluno_id_fkey FOREIGN KEY (aluno_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  ADD CONSTRAINT secretaria_solicitacoes_atendida_por_fkey FOREIGN KEY (atendida_por) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 10. public.app_settings
ALTER TABLE public.app_settings
  DROP CONSTRAINT IF EXISTS app_settings_updated_by_fkey;
ALTER TABLE public.app_settings
  ADD CONSTRAINT app_settings_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
