# SETE — Seminário Teológico Esperança

Plataforma completa: site institucional + LMS + gestão acadêmica/financeira com 6 painéis por perfil, PWA e integração Mercado Pago.

## Stack e infraestrutura
- TanStack Start (já configurado) + Tailwind + shadcn/ui
- Lovable Cloud (Postgres + Auth + Storage) — auth por e-mail/senha
- Sistema de roles via tabela `user_roles` (enum: `super_admin`, `admin`, `secretaria`, `professor`, `aluno`) + função `has_role` (security definer)
- PWA (manifest + service worker guardado) instalável em todos os painéis
- Mercado Pago: credenciais (access token + public key) cadastradas pelo Super Admin em runtime (tabela `app_settings` criptografada) — não via secrets fixos
- Vídeos: embed YouTube/Vimeo (URL colada no cadastro do módulo)
- Notificações: in-app (tabela + realtime) + toast

## Design system
Identidade **SETE — Seminário Teológico Esperança**: paleta sóbria e acadêmica (azul-marinho profundo, dourado suave, off-white, cinza-pedra), tipografia serifada nos títulos (ex: Playfair/Cormorant) + sans humanista no corpo (Inter). Tokens semânticos em `src/styles.css`, sem cores hardcoded.

## Modelo de dados (principais tabelas)
- `profiles` (id→auth.users, nome, cpf, telefone, foto, endereço)
- `user_roles` (user_id, role)
- `categorias` (nome, slug, descrição)
- `cursos` (título, slug, categoria_id, descrição, ementa, carga_horária, preço, modalidade [online/presencial], imagem_capa, ministrante_id, ativo)
- `modulos` (curso_id, ordem, título, descrição)
- `aulas` (modulo_id, ordem, título, video_url, material_url, texto)
- `avaliacoes` + `questoes` + `respostas_aluno`
- `matriculas` (aluno_id, curso_id, status, forma_pagamento, data_matricula, progresso)
- `pagamentos` (matricula_id, valor, status, mp_payment_id, método, comprovante_url)
- `presencas` (aula_id/data, aluno_id, status: presente/falta/justificada, observação)
- `cronograma` (curso_id, data, tópico, local)
- `certificados` (aluno_id, curso_id, código_validação, emitido_em, layout_id)
- `layouts_certificado` (nome, html/template, curso_id opcional)
- `notificacoes` (destinatário/role, título, mensagem, lida, link)
- `suporte_tickets` + `ticket_mensagens`
- `secretaria_solicitacoes` (aluno_id, tipo, descrição, status, resposta)
- `app_settings` (chave/valor — credenciais MP, config geral)
- `carteirinhas` (aluno_id, número, validade, qr_code)

Todas com RLS + GRANTs para `authenticated`/`service_role` conforme padrão.

## Rotas e páginas

### Site institucional (público)
- `/` — landing SETE (missão, destaques, cursos em destaque, CTA)
- `/sobre`, `/contato`
- `/cursos` — lista por categoria (filtros)
- `/cursos/$slug` — landing do curso (ementa, ministrante, preço, botão matricular)
- `/checkout/$cursoSlug` — checkout Mercado Pago (Checkout Pro/Bricks)
- `/auth` — login/cadastro
- `/certificado/validar/$codigo` — validação pública

### `_authenticated/aluno/*`
- `dashboard` — visão geral, próximas aulas, avisos
- `meus-cursos` — cursos matriculados (progresso)
- `curso/$id` — módulos, aulas (player embed), materiais, avaliações
- `avaliacao/$id` — realizar prova
- `certificados` — cursos concluídos + download PDF
- `carteirinha` — carteirinha digital com QR
- `financeiro` — cobranças, histórico, comprovantes
- `secretaria` — solicitações (2ª via, declarações, etc.)
- `suporte` — abrir/ver tickets
- `notificacoes`
- `cursos-disponiveis` — matricular-se em novos

### `_authenticated/professor/*`
- `dashboard`, `meus-cursos`, `curso/$id/alunos`, `curso/$id/chamada`, `curso/$id/cronograma`, `curso/$id/materiais`

### `_authenticated/secretaria/*`
- `matriculas` — cadastrar matrícula manual (pagamento em dinheiro)
- `pagamentos-dinheiro` — registrar quitações
- `solicitacoes` — atender pedidos dos alunos
- `alunos`

### `_authenticated/admin/*`
- `dashboard` (KPIs)
- `relatorio-financeiro` (com export PDF)
- `relatorio-matriculas` (export PDF)
- `alunos`
- `cursos` — CRUD cursos, módulos, aulas, materiais, avaliações
- `certificados/layouts` — editor de layouts
- `notificacoes/enviar`
- `professores` — CRUD

### `_authenticated/super-admin/*`
- Tudo do admin +
- `usuarios` — CRUD todos usuários e roles
- `configuracoes` — credenciais Mercado Pago, config geral
- `suporte-global` — atender todos tickets
- `logs` / `relatorios-avancados`

## Fluxos-chave
1. **Matrícula online**: aluno → landing curso → checkout → Mercado Pago (Preference API via server function) → webhook `/api/public/webhooks/mercadopago` valida assinatura → cria matrícula + libera acesso + notifica.
2. **Matrícula em dinheiro**: secretaria cadastra aluno (ou seleciona), registra pagamento, libera matrícula.
3. **Certificado**: ao concluir 100% + aprovação nas avaliações → gera certificado PDF (react-pdf) com código de validação público.
4. **Chamada**: professor marca presença por data de aula; aluno vê no painel.
5. **Notificações**: admin envia por role/curso/aluno; realtime via Supabase channel.

## Server functions e endpoints
- `createPaymentPreference` (auth aluno) — cria preference MP
- `getMPCredentials` (server-only, lê `app_settings`)
- `/api/public/webhooks/mercadopago` — recebe webhook, valida, atualiza pagamento/matrícula
- `generateCertificatePDF`, `exportReportPDF` (financeiro/matrículas)
- `enrollStudentManual` (secretaria)

## Entregas por fase (dentro do mesmo projeto)
Dada a magnitude, entregarei em ondas sequenciais mas todas no mesmo build:
1. **Fundação**: Cloud, schema completo, roles, auth, layouts protegidos, design system, PWA, site institucional + páginas de curso.
2. **Painel Aluno** completo (cursos, aulas, avaliações, certificados, carteirinha, financeiro, suporte, secretaria, notificações).
3. **Painéis Admin + Super Admin** (CRUDs, relatórios PDF, config MP, notificações).
4. **Painel Professor + Secretaria** (chamada, cronograma, matrícula dinheiro).
5. **Integração Mercado Pago** (checkout + webhook) usando credenciais do painel Super Admin.

## Detalhes técnicos
- PDFs: `@react-pdf/renderer` server-side em server functions
- QR code carteirinha: `qrcode` lib
- Mercado Pago: SDK REST direta (fetch), credenciais lidas de `app_settings` dentro de handlers
- Webhooks em `/api/public/*` com verificação de assinatura x-signature MP
- Storage buckets: `materiais` (privado), `capas-cursos` (público), `comprovantes` (privado), `fotos-perfil` (público)
- Export PDF de relatórios via server function + download

## Observações
- Escopo enorme; a primeira entrega focará fundação + site + painel aluno navegável. Iteraremos os demais painéis nas próximas mensagens sem quebrar o que já existe.
- Credenciais MP: você as insere no painel Super Admin depois que o sistema estiver no ar.
