
-- ========== ENUMS ==========
CREATE TYPE public.app_role AS ENUM ('super_admin','admin','secretaria','professor','aluno');
CREATE TYPE public.curso_modalidade AS ENUM ('online','presencial','hibrido');
CREATE TYPE public.matricula_status AS ENUM ('pendente','ativa','concluida','cancelada','trancada');
CREATE TYPE public.pagamento_status AS ENUM ('pendente','aprovado','recusado','estornado');
CREATE TYPE public.pagamento_metodo AS ENUM ('mercadopago','dinheiro','pix','boleto','cartao');
CREATE TYPE public.presenca_status AS ENUM ('presente','falta','justificada');
CREATE TYPE public.ticket_status AS ENUM ('aberto','em_andamento','resolvido','fechado');
CREATE TYPE public.solicitacao_status AS ENUM ('pendente','em_analise','deferida','indeferida');

-- ========== PROFILES ==========
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome_completo TEXT NOT NULL,
  cpf TEXT UNIQUE,
  telefone TEXT,
  data_nascimento DATE,
  foto_url TEXT,
  endereco JSONB,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ========== USER ROLES ==========
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('super_admin','admin','secretaria')) $$;

-- Profile policies
CREATE POLICY "Usuários veem seu próprio perfil" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id OR public.is_staff(auth.uid()) OR public.has_role(auth.uid(),'professor'));
CREATE POLICY "Usuários criam próprio perfil" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Usuários atualizam próprio perfil" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id OR public.is_staff(auth.uid()));

-- Role policies
CREATE POLICY "Usuário vê próprios papéis" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_staff(auth.uid()));

-- ========== UPDATED_AT TRIGGER ==========
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ========== SIGNUP HOOK: cria profile + role aluno ==========
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, nome_completo)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nome_completo', NEW.email));
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'aluno');
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ========== CATEGORIAS ==========
CREATE TABLE public.categorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  descricao TEXT,
  ordem INT DEFAULT 0,
  ativa BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categorias TO anon, authenticated;
GRANT ALL ON public.categorias TO service_role;
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Categorias públicas" ON public.categorias FOR SELECT TO anon, authenticated USING (ativa = true OR public.is_staff(auth.uid()));
CREATE POLICY "Admin gerencia categorias" ON public.categorias FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- ========== CURSOS ==========
CREATE TABLE public.cursos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  categoria_id UUID REFERENCES public.categorias(id) ON DELETE SET NULL,
  descricao_curta TEXT,
  descricao TEXT,
  ementa TEXT,
  carga_horaria INT,
  preco NUMERIC(10,2) NOT NULL DEFAULT 0,
  modalidade curso_modalidade NOT NULL DEFAULT 'online',
  imagem_capa TEXT,
  ministrante_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  destaque BOOLEAN NOT NULL DEFAULT false,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.cursos TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.cursos TO authenticated;
GRANT ALL ON public.cursos TO service_role;
ALTER TABLE public.cursos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Cursos ativos públicos" ON public.cursos FOR SELECT TO anon, authenticated USING (ativo = true OR public.is_staff(auth.uid()) OR ministrante_id = auth.uid());
CREATE POLICY "Admin gerencia cursos" ON public.cursos FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER trg_cursos_updated BEFORE UPDATE ON public.cursos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ========== MODULOS ==========
CREATE TABLE public.modulos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  curso_id UUID NOT NULL REFERENCES public.cursos(id) ON DELETE CASCADE,
  ordem INT NOT NULL DEFAULT 0,
  titulo TEXT NOT NULL,
  descricao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.modulos TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.modulos TO authenticated;
GRANT ALL ON public.modulos TO service_role;
ALTER TABLE public.modulos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Módulos visíveis" ON public.modulos FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admin gerencia módulos" ON public.modulos FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- ========== AULAS ==========
CREATE TABLE public.aulas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  modulo_id UUID NOT NULL REFERENCES public.modulos(id) ON DELETE CASCADE,
  ordem INT NOT NULL DEFAULT 0,
  titulo TEXT NOT NULL,
  descricao TEXT,
  video_url TEXT,
  material_url TEXT,
  conteudo TEXT,
  duracao_minutos INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.aulas TO authenticated;
GRANT ALL ON public.aulas TO service_role;
ALTER TABLE public.aulas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Aulas visíveis a autenticados" ON public.aulas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin gerencia aulas" ON public.aulas FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- ========== AVALIACOES ==========
CREATE TABLE public.avaliacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  curso_id UUID NOT NULL REFERENCES public.cursos(id) ON DELETE CASCADE,
  modulo_id UUID REFERENCES public.modulos(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descricao TEXT,
  nota_minima NUMERIC(5,2) NOT NULL DEFAULT 6.0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.avaliacoes TO authenticated;
GRANT ALL ON public.avaliacoes TO service_role;
ALTER TABLE public.avaliacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Avaliações visíveis" ON public.avaliacoes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin gerencia avaliações" ON public.avaliacoes FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE TABLE public.questoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  avaliacao_id UUID NOT NULL REFERENCES public.avaliacoes(id) ON DELETE CASCADE,
  ordem INT NOT NULL DEFAULT 0,
  enunciado TEXT NOT NULL,
  alternativas JSONB NOT NULL,
  resposta_correta TEXT NOT NULL,
  peso NUMERIC(5,2) NOT NULL DEFAULT 1.0
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.questoes TO authenticated;
GRANT ALL ON public.questoes TO service_role;
ALTER TABLE public.questoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Questões visíveis a autenticados" ON public.questoes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin gerencia questões" ON public.questoes FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE TABLE public.tentativas_avaliacao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  avaliacao_id UUID NOT NULL REFERENCES public.avaliacoes(id) ON DELETE CASCADE,
  aluno_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  respostas JSONB NOT NULL,
  nota NUMERIC(5,2) NOT NULL DEFAULT 0,
  aprovado BOOLEAN NOT NULL DEFAULT false,
  realizada_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.tentativas_avaliacao TO authenticated;
GRANT ALL ON public.tentativas_avaliacao TO service_role;
ALTER TABLE public.tentativas_avaliacao ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Aluno vê próprias tentativas" ON public.tentativas_avaliacao FOR SELECT TO authenticated USING (aluno_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "Aluno insere tentativas" ON public.tentativas_avaliacao FOR INSERT TO authenticated WITH CHECK (aluno_id = auth.uid());

-- ========== MATRICULAS ==========
CREATE TABLE public.matriculas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  curso_id UUID NOT NULL REFERENCES public.cursos(id) ON DELETE CASCADE,
  status matricula_status NOT NULL DEFAULT 'pendente',
  progresso NUMERIC(5,2) NOT NULL DEFAULT 0,
  data_matricula TIMESTAMPTZ NOT NULL DEFAULT now(),
  data_conclusao TIMESTAMPTZ,
  observacao TEXT,
  UNIQUE(aluno_id, curso_id)
);
GRANT SELECT, INSERT, UPDATE ON public.matriculas TO authenticated;
GRANT ALL ON public.matriculas TO service_role;
ALTER TABLE public.matriculas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Aluno vê próprias matrículas" ON public.matriculas FOR SELECT TO authenticated USING (aluno_id = auth.uid() OR public.is_staff(auth.uid()) OR EXISTS (SELECT 1 FROM public.cursos c WHERE c.id = curso_id AND c.ministrante_id = auth.uid()));
CREATE POLICY "Staff gerencia matrículas" ON public.matriculas FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE TABLE public.progresso_aula (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  matricula_id UUID NOT NULL REFERENCES public.matriculas(id) ON DELETE CASCADE,
  aula_id UUID NOT NULL REFERENCES public.aulas(id) ON DELETE CASCADE,
  concluida BOOLEAN NOT NULL DEFAULT false,
  concluida_em TIMESTAMPTZ,
  UNIQUE(matricula_id, aula_id)
);
GRANT SELECT, INSERT, UPDATE ON public.progresso_aula TO authenticated;
GRANT ALL ON public.progresso_aula TO service_role;
ALTER TABLE public.progresso_aula ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Aluno gerencia progresso" ON public.progresso_aula FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.matriculas m WHERE m.id = matricula_id AND (m.aluno_id = auth.uid() OR public.is_staff(auth.uid())))) WITH CHECK (EXISTS (SELECT 1 FROM public.matriculas m WHERE m.id = matricula_id AND m.aluno_id = auth.uid()));

-- ========== PAGAMENTOS ==========
CREATE TABLE public.pagamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  matricula_id UUID NOT NULL REFERENCES public.matriculas(id) ON DELETE CASCADE,
  valor NUMERIC(10,2) NOT NULL,
  status pagamento_status NOT NULL DEFAULT 'pendente',
  metodo pagamento_metodo NOT NULL,
  mp_payment_id TEXT,
  mp_preference_id TEXT,
  comprovante_url TEXT,
  registrado_por UUID REFERENCES auth.users(id),
  observacao TEXT,
  pago_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.pagamentos TO authenticated;
GRANT ALL ON public.pagamentos TO service_role;
ALTER TABLE public.pagamentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Aluno vê próprios pagamentos" ON public.pagamentos FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.matriculas m WHERE m.id = matricula_id AND (m.aluno_id = auth.uid() OR public.is_staff(auth.uid()))));
CREATE POLICY "Staff gerencia pagamentos" ON public.pagamentos FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER trg_pagamentos_updated BEFORE UPDATE ON public.pagamentos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ========== PRESENCAS + CRONOGRAMA ==========
CREATE TABLE public.cronograma (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  curso_id UUID NOT NULL REFERENCES public.cursos(id) ON DELETE CASCADE,
  data DATE NOT NULL,
  hora_inicio TIME,
  hora_fim TIME,
  topico TEXT NOT NULL,
  local TEXT,
  observacao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cronograma TO authenticated;
GRANT ALL ON public.cronograma TO service_role;
ALTER TABLE public.cronograma ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Cronograma visível" ON public.cronograma FOR SELECT TO authenticated USING (true);
CREATE POLICY "Prof/staff edita cronograma" ON public.cronograma FOR ALL TO authenticated USING (public.is_staff(auth.uid()) OR EXISTS (SELECT 1 FROM public.cursos c WHERE c.id = curso_id AND c.ministrante_id = auth.uid())) WITH CHECK (public.is_staff(auth.uid()) OR EXISTS (SELECT 1 FROM public.cursos c WHERE c.id = curso_id AND c.ministrante_id = auth.uid()));

CREATE TABLE public.presencas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cronograma_id UUID NOT NULL REFERENCES public.cronograma(id) ON DELETE CASCADE,
  aluno_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status presenca_status NOT NULL DEFAULT 'presente',
  justificativa TEXT,
  registrada_por UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(cronograma_id, aluno_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.presencas TO authenticated;
GRANT ALL ON public.presencas TO service_role;
ALTER TABLE public.presencas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Aluno vê próprias presenças" ON public.presencas FOR SELECT TO authenticated USING (aluno_id = auth.uid() OR public.is_staff(auth.uid()) OR EXISTS (SELECT 1 FROM public.cronograma cr JOIN public.cursos c ON c.id = cr.curso_id WHERE cr.id = cronograma_id AND c.ministrante_id = auth.uid()));
CREATE POLICY "Prof/staff gerencia presenças" ON public.presencas FOR ALL TO authenticated USING (public.is_staff(auth.uid()) OR EXISTS (SELECT 1 FROM public.cronograma cr JOIN public.cursos c ON c.id = cr.curso_id WHERE cr.id = cronograma_id AND c.ministrante_id = auth.uid())) WITH CHECK (public.is_staff(auth.uid()) OR EXISTS (SELECT 1 FROM public.cronograma cr JOIN public.cursos c ON c.id = cr.curso_id WHERE cr.id = cronograma_id AND c.ministrante_id = auth.uid()));

-- ========== CERTIFICADOS ==========
CREATE TABLE public.layouts_certificado (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  template_html TEXT NOT NULL,
  curso_id UUID REFERENCES public.cursos(id) ON DELETE SET NULL,
  padrao BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.layouts_certificado TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.layouts_certificado TO authenticated;
GRANT ALL ON public.layouts_certificado TO service_role;
ALTER TABLE public.layouts_certificado ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Layouts visíveis" ON public.layouts_certificado FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin gerencia layouts" ON public.layouts_certificado FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE TABLE public.certificados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  curso_id UUID NOT NULL REFERENCES public.cursos(id) ON DELETE CASCADE,
  codigo_validacao TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(12),'hex'),
  layout_id UUID REFERENCES public.layouts_certificado(id),
  emitido_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(aluno_id, curso_id)
);
GRANT SELECT ON public.certificados TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.certificados TO authenticated;
GRANT ALL ON public.certificados TO service_role;
ALTER TABLE public.certificados ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Certificados públicos p/ validação" ON public.certificados FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admin gerencia certificados" ON public.certificados FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- ========== CARTEIRINHAS ==========
CREATE TABLE public.carteirinhas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  numero TEXT NOT NULL UNIQUE,
  validade DATE NOT NULL,
  emitida_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.carteirinhas TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.carteirinhas TO authenticated;
GRANT ALL ON public.carteirinhas TO service_role;
ALTER TABLE public.carteirinhas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Aluno vê própria carteirinha" ON public.carteirinhas FOR SELECT TO authenticated USING (aluno_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "Staff gerencia carteirinhas" ON public.carteirinhas FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- ========== NOTIFICACOES ==========
CREATE TABLE public.notificacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  destinatario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  destinatario_role app_role,
  titulo TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  link TEXT,
  lida BOOLEAN NOT NULL DEFAULT false,
  enviada_por UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.notificacoes TO authenticated;
GRANT ALL ON public.notificacoes TO service_role;
ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuário vê suas notificações" ON public.notificacoes FOR SELECT TO authenticated USING (destinatario_id = auth.uid() OR (destinatario_role IS NOT NULL AND public.has_role(auth.uid(), destinatario_role)) OR public.is_staff(auth.uid()));
CREATE POLICY "Usuário atualiza suas notificações" ON public.notificacoes FOR UPDATE TO authenticated USING (destinatario_id = auth.uid());
CREATE POLICY "Staff envia notificações" ON public.notificacoes FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));

-- ========== SUPORTE ==========
CREATE TABLE public.suporte_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assunto TEXT NOT NULL,
  categoria TEXT,
  status ticket_status NOT NULL DEFAULT 'aberto',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.suporte_tickets TO authenticated;
GRANT ALL ON public.suporte_tickets TO service_role;
ALTER TABLE public.suporte_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuário vê próprios tickets" ON public.suporte_tickets FOR SELECT TO authenticated USING (usuario_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "Usuário cria tickets" ON public.suporte_tickets FOR INSERT TO authenticated WITH CHECK (usuario_id = auth.uid());
CREATE POLICY "Staff/dono atualiza tickets" ON public.suporte_tickets FOR UPDATE TO authenticated USING (usuario_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE TRIGGER trg_tickets_updated BEFORE UPDATE ON public.suporte_tickets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.ticket_mensagens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.suporte_tickets(id) ON DELETE CASCADE,
  autor_id UUID NOT NULL REFERENCES auth.users(id),
  mensagem TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.ticket_mensagens TO authenticated;
GRANT ALL ON public.ticket_mensagens TO service_role;
ALTER TABLE public.ticket_mensagens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Vê msgs de tickets acessíveis" ON public.ticket_mensagens FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.suporte_tickets t WHERE t.id = ticket_id AND (t.usuario_id = auth.uid() OR public.is_staff(auth.uid()))));
CREATE POLICY "Envia msg em tickets acessíveis" ON public.ticket_mensagens FOR INSERT TO authenticated WITH CHECK (autor_id = auth.uid() AND EXISTS (SELECT 1 FROM public.suporte_tickets t WHERE t.id = ticket_id AND (t.usuario_id = auth.uid() OR public.is_staff(auth.uid()))));

-- ========== SECRETARIA SOLICITACOES ==========
CREATE TABLE public.secretaria_solicitacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  descricao TEXT,
  status solicitacao_status NOT NULL DEFAULT 'pendente',
  resposta TEXT,
  atendida_por UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.secretaria_solicitacoes TO authenticated;
GRANT ALL ON public.secretaria_solicitacoes TO service_role;
ALTER TABLE public.secretaria_solicitacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Aluno vê próprias solicitações" ON public.secretaria_solicitacoes FOR SELECT TO authenticated USING (aluno_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "Aluno cria solicitação" ON public.secretaria_solicitacoes FOR INSERT TO authenticated WITH CHECK (aluno_id = auth.uid());
CREATE POLICY "Staff atualiza solicitação" ON public.secretaria_solicitacoes FOR UPDATE TO authenticated USING (public.is_staff(auth.uid()));
CREATE TRIGGER trg_solic_updated BEFORE UPDATE ON public.secretaria_solicitacoes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ========== APP SETTINGS ==========
CREATE TABLE public.app_settings (
  chave TEXT PRIMARY KEY,
  valor JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);
GRANT SELECT ON public.app_settings TO authenticated;
GRANT ALL ON public.app_settings TO service_role;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Super admin gerencia settings" ON public.app_settings FOR ALL TO authenticated USING (public.has_role(auth.uid(),'super_admin')) WITH CHECK (public.has_role(auth.uid(),'super_admin'));

-- ========== SEEDS ==========
INSERT INTO public.categorias (nome, slug, descricao, ordem) VALUES
  ('Teologia', 'teologia', 'Estudos teológicos fundamentais', 1),
  ('Bíblia', 'biblia', 'Estudos bíblicos e exegese', 2),
  ('Missões', 'missoes', 'Formação missionária', 3),
  ('Liderança', 'lideranca', 'Liderança cristã e ministerial', 4),
  ('Aconselhamento', 'aconselhamento', 'Aconselhamento pastoral e familiar', 5);
