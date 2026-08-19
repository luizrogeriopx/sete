import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader, SiteFooter } from "@/components/site/site-chrome";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";
import {
  BookOpen,
  GraduationCap,
  Users,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Compass,
  Layers,
  ChevronRight,
  Flame,
  Check,
  BookMarked,
  Scroll,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SETE — Seminário Teológico Esperança" },
      {
        name: "description",
        content:
          "Formação Teológica, Formação Ministerial de Obreiros e Cursos de Extensão. Conheça as opções do Seminário Teológico Esperança.",
      },
    ],
  }),
  component: Home,
});

type FormacaoTab = "teologica" | "ministerial" | "extensao";

const DISCIPLINAS_BASICO = [
  { numero: "01", nome: "Introdução ao Antigo Testamento", tag: "Bíblia" },
  { numero: "02", nome: "Introdução ao Novo Testamento", tag: "Bíblia" },
  { numero: "03", nome: "Hermenêutica", tag: "Interpretação" },
  { numero: "04", nome: "Homilética", tag: "Pregação" },
  { numero: "05", nome: "Teologia Sistemática", tag: "Doutrina" },
  { numero: "06", nome: "Pneumatologia", tag: "Espírito Santo" },
  { numero: "07", nome: "Escatologia", tag: "Fim dos Tempos" },
  { numero: "08", nome: "História da Igreja", tag: "História" },
  { numero: "09", nome: "Teologia Pastoral", tag: "Pastoreio" },
  { numero: "10", nome: "Aconselhamento Bíblico", tag: "Cuidado" },
  { numero: "11", nome: "Ética Cristã", tag: "Vida Cristã" },
  { numero: "12", nome: "Seitas e Religiões", tag: "Apologética" },
];

const PILARES_MINISTERIAL = [
  {
    titulo: "Fundamentos e Valores",
    descricao: "Doutrina bíblica sólida, confissão de fé, história e princípios éticos que sustentam o ministério.",
    badge: "Base Doutrinária",
  },
  {
    titulo: "Prática Ministerial",
    descricao: "Liturgia, ministração nos cultos, condução de ordenanças sagradas e atuação adaptada à sua função.",
    badge: "Aplicação Prática",
  },
  {
    titulo: "Liderança",
    descricao: "Maturidade espiritual, discipulado, gestão de equipes, visão pastoral e cuidado com as pessoas.",
    badge: "Desenvolvimento de Líderes",
  },
];

const PERCURSOS_OBREIROS = [
  {
    cargo: "Diáconos e Diaconisas",
    slug: "di-conos-e-diaconisas",
    resumo: "Formação focada no serviço prático, suporte ao altar, acolhimento e assistência à comunidade.",
    destaque: "Serviço & Acolhimento",
    icone: ShieldCheck,
  },
  {
    cargo: "Presbíteros",
    slug: "presb-teros",
    resumo: "Capacitação para o governo espiritual, aconselhamento, ensino e auxílio ao corpo pastoral.",
    destaque: "Governo & Ensino",
    icone: BookMarked,
  },
  {
    cargo: "Evangelistas e Missionárias",
    slug: "evangelistas-e-mission-rias",
    resumo: "Preparação para a proclamação do evangelho, plantação de congregações e expansão do Reino.",
    destaque: "Missões & Evangelismo",
    icone: Flame,
  },
  {
    cargo: "Pastores e Pastoras",
    slug: "pastores-e-pastoras",
    resumo: "Aprofundamento integral em pastoreio de almas, liderança estratégica, unção e ministério pastoral.",
    destaque: "Pastoreio & Liderança",
    icone: Scroll,
  },
];

const EXTENSAO_INFO = [
  {
    titulo: "Escola de Líderes de Célula",
    slug: "escola-de-l-deres-de-c-lula",
    subtitulo: "Capacitação completa para liderança, cuidado pastoral e multiplicação de pequenos grupos.",
    duracao: "10 Módulos",
    modalidade: "Online / Semi-presencial",
    formato: "Vídeoaulas + Material de Estudo + Avaliações Práticas",
    publico: "Líderes de célula, anfitriões e membros em treinamento ministerial.",
  },
  {
    titulo: "Ativação Profética",
    slug: "ativa-o-prof-tica",
    subtitulo: "Fundamentação bíblica, sensibilidade espiritual e exercício responsável dos dons.",
    duracao: "7 Módulos",
    modalidade: "Online",
    formato: "Estudos bíblicos temáticos + Aulas expositivas + Questionários",
    publico: "Cristãos que desejam discernimento e maturidade no exercício dos dons espirituais.",
  },
];

function Home() {
  const [formacaoAtiva, setFormacaoAtiva] = useState<FormacaoTab>("teologica");
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [quizSelection, setQuizSelection] = useState<string | null>(null);

  // Load real courses data from Supabase (prices, images, details)
  const { data: cursosDB } = useQuery({
    queryKey: ["home-cursos-catalogo"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cursos")
        .select("id, titulo, slug, descricao_curta, preco, cobranca_por, modalidade, carga_horaria, imagem_card, imagem_capa, categorias(nome)")
        .eq("ativo", true);
      if (error) {
        console.warn("Erro ao buscar cursos:", error);
        return [];
      }
      return data ?? [];
    },
  });

  const getCurso = (slug: string) => {
    return cursosDB?.find((c) => c.slug === slug);
  };

  const cursoBasico = getCurso("curso-b-sico-de-teologia");
  const cursoLideres = getCurso("escola-de-l-deres-de-c-lula");
  const cursoProfetico = getCurso("ativa-o-prof-tica");

  function handleSelectFromQuiz(tab: FormacaoTab) {
    setFormacaoAtiva(tab);
    setIsQuizOpen(false);
    // Smooth scroll to content
    const el = document.getElementById("area-formacao-conteudo");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <SiteHeader />

      <main className="flex-1">
        {/* HERO HEADER */}
        <section className="relative overflow-hidden bg-slate-950 text-white border-b border-border/40 py-16 md:py-20">
          <div className="pointer-events-none absolute inset-0 opacity-15 [background-image:radial-gradient(circle_at_1px_1px,#d4af37_1px,transparent_0)] [background-size:24px_24px]" />
          <div className="relative mx-auto max-w-6xl px-4 text-center">
            <Badge
              variant="outline"
              className="border-gold/40 bg-gold/10 text-gold text-xs uppercase tracking-[0.3em] px-3.5 py-1 mb-4"
            >
              SEMINÁRIO TEOLÓGICO ESPERANÇA
            </Badge>

            <h1 className="font-serif text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight text-slate-100 max-w-4xl mx-auto leading-tight">
              Ensino que Transforma, <br className="hidden sm:inline" />
              <span className="text-gold">Ministérios que Edificam</span>
            </h1>

            <p className="mt-4 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed font-light">
              Escolha uma das três áreas de formação para conhecer a grade curricular, percursos ministeriais e requisitos.
            </p>

            {/* OS TRÊS GRANDES CARDS */}
            <div className="mt-12 grid gap-6 sm:grid-cols-3 text-left">
              {/* CARD 1: FORMAÇÃO TEOLÓGICA */}
              <button
                type="button"
                onClick={() => setFormacaoAtiva("teologica")}
                className={cn(
                  "relative rounded-2xl p-6 sm:p-7 border-2 text-left transition-all duration-300 cursor-pointer flex flex-col justify-between group",
                  formacaoAtiva === "teologica"
                    ? "bg-slate-900 border-gold shadow-[0_0_25px_rgba(212,175,55,0.25)] ring-1 ring-gold"
                    : "bg-slate-900/60 border-slate-800 hover:border-gold/50 hover:bg-slate-900/90"
                )}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div
                      className={cn(
                        "h-12 w-12 rounded-xl flex items-center justify-center transition-colors",
                        formacaoAtiva === "teologica"
                          ? "bg-gold text-slate-950"
                          : "bg-slate-800 text-gold group-hover:bg-gold/20"
                      )}
                    >
                      <GraduationCap className="h-6 w-6" />
                    </div>
                    {formacaoAtiva === "teologica" && (
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-gold uppercase tracking-wider bg-gold/10 px-2.5 py-0.5 rounded-full border border-gold/30">
                        Selecionado
                      </span>
                    )}
                  </div>

                  <p className="mt-5 text-xs uppercase tracking-widest text-gold font-semibold">
                    Área Acadêmica
                  </p>
                  <h3 className="mt-1 font-serif text-xl sm:text-2xl font-bold text-white group-hover:text-gold transition-colors">
                    FORMAÇÃO TEOLÓGICA
                  </h3>
                  <p className="mt-2 text-sm text-slate-300 font-medium">
                    Curso Básico de Teologia
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Grade curricular com 12 disciplinas bíblicas e doutrinárias.
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold text-gold">
                  <span>Ver 12 Disciplinas</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </button>

              {/* CARD 2: FORMAÇÃO MINISTERIAL */}
              <button
                type="button"
                onClick={() => setFormacaoAtiva("ministerial")}
                className={cn(
                  "relative rounded-2xl p-6 sm:p-7 border-2 text-left transition-all duration-300 cursor-pointer flex flex-col justify-between group",
                  formacaoAtiva === "ministerial"
                    ? "bg-slate-900 border-gold shadow-[0_0_25px_rgba(212,175,55,0.25)] ring-1 ring-gold"
                    : "bg-slate-900/60 border-slate-800 hover:border-gold/50 hover:bg-slate-900/90"
                )}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div
                      className={cn(
                        "h-12 w-12 rounded-xl flex items-center justify-center transition-colors",
                        formacaoAtiva === "ministerial"
                          ? "bg-gold text-slate-950"
                          : "bg-slate-800 text-gold group-hover:bg-gold/20"
                      )}
                    >
                      <Users className="h-6 w-6" />
                    </div>
                    {formacaoAtiva === "ministerial" && (
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-gold uppercase tracking-wider bg-gold/10 px-2.5 py-0.5 rounded-full border border-gold/30">
                        Selecionado
                      </span>
                    )}
                  </div>

                  <p className="mt-5 text-xs uppercase tracking-widest text-gold font-semibold">
                    Área Eclesiástica
                  </p>
                  <h3 className="mt-1 font-serif text-xl sm:text-2xl font-bold text-white group-hover:text-gold transition-colors">
                    FORMAÇÃO MINISTERIAL
                  </h3>
                  <p className="mt-2 text-sm text-slate-300 font-medium">
                    Formação de Obreiros
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    3 Pilares fundamentais divididos em 4 percursos ministeriais.
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold text-gold">
                  <span>Ver Pilares & Percursos</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </button>

              {/* CARD 3: CURSOS DE EXTENSÃO */}
              <button
                type="button"
                onClick={() => setFormacaoAtiva("extensao")}
                className={cn(
                  "relative rounded-2xl p-6 sm:p-7 border-2 text-left transition-all duration-300 cursor-pointer flex flex-col justify-between group",
                  formacaoAtiva === "extensao"
                    ? "bg-slate-900 border-gold shadow-[0_0_25px_rgba(212,175,55,0.25)] ring-1 ring-gold"
                    : "bg-slate-900/60 border-slate-800 hover:border-gold/50 hover:bg-slate-900/90"
                )}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div
                      className={cn(
                        "h-12 w-12 rounded-xl flex items-center justify-center transition-colors",
                        formacaoAtiva === "extensao"
                          ? "bg-gold text-slate-950"
                          : "bg-slate-800 text-gold group-hover:bg-gold/20"
                      )}
                    >
                      <Sparkles className="h-6 w-6" />
                    </div>
                    {formacaoAtiva === "extensao" && (
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-gold uppercase tracking-wider bg-gold/10 px-2.5 py-0.5 rounded-full border border-gold/30">
                        Selecionado
                      </span>
                    )}
                  </div>

                  <p className="mt-5 text-xs uppercase tracking-widest text-gold font-semibold">
                    Capacitação Contínua
                  </p>
                  <h3 className="mt-1 font-serif text-xl sm:text-2xl font-bold text-white group-hover:text-gold transition-colors">
                    CURSOS DE EXTENSÃO
                  </h3>
                  <div className="mt-2 space-y-0.5 text-xs text-slate-300">
                    <p className="font-medium">• Escola de Líderes de Célula</p>
                    <p className="font-medium">• Ativação Profética</p>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold text-gold">
                  <span>Conhecer Cursos</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </button>
            </div>

            {/* BOTÃO QUAL FORMAÇÃO É PARA MIM? */}
            <div className="mt-10 flex justify-center">
              <Button
                onClick={() => setIsQuizOpen(true)}
                size="lg"
                className="bg-gold text-slate-950 hover:bg-gold/90 font-semibold px-8 py-6 rounded-full shadow-lg shadow-gold/20 hover:shadow-gold/30 text-sm sm:text-base flex items-center gap-2 group transition-all"
              >
                <Compass className="h-5 w-5 text-slate-950 transition-transform group-hover:rotate-45" />
                <span>Qual formação é para mim?</span>
                <ChevronRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
          </div>
        </section>

        {/* ÁREA DE CONTEÚDO DINÂMICO CONFORME O CARD CLICADO */}
        <section id="area-formacao-conteudo" className="py-16 md:py-20">
          <div className="mx-auto max-w-6xl px-4">
            {/* ======================================================== */}
            {/* SEÇÃO 1: FORMAÇÃO TEOLÓGICA (Curso Básico + 12 Disciplinas) */}
            {/* ======================================================== */}
            {formacaoAtiva === "teologica" && (
              <div className="space-y-12 animate-in fade-in-50 duration-300">
                {/* Header da Formação */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-border">
                  <div>
                    <div className="flex items-center gap-2 text-gold font-medium text-xs uppercase tracking-widest">
                      <GraduationCap className="h-4 w-4" /> Formação Acadêmica Principal
                    </div>
                    <h2 className="mt-2 font-serif text-3xl sm:text-4xl font-bold text-foreground">
                      Curso Básico de Teologia
                    </h2>
                    <p className="mt-2 text-muted-foreground max-w-2xl">
                      Estruturado para fornecer uma base sólida, histórica e bíblica. O curso é composto por <strong>12 disciplinas fundamentais</strong> essenciais para qualquer cristão e líder.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <Button asChild size="lg" className="bg-gold text-slate-950 hover:bg-gold/90 font-semibold">
                      <Link to="/cursos/$slug" params={{ slug: "curso-b-sico-de-teologia" }}>
                        Inscrever-se no Curso Básico
                      </Link>
                    </Button>
                  </div>
                </div>

                {/* AS 12 DISCIPLINAS EM DESTAQUE */}
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="font-serif text-2xl font-bold flex items-center gap-2">
                        <BookOpen className="h-6 w-6 text-gold" /> As 12 Disciplinas do Curso
                      </h3>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        Conheça o conteúdo completo ministrado ao longo da formação teológica:
                      </p>
                    </div>
                    <Badge variant="outline" className="border-gold/40 text-gold text-xs hidden sm:inline-flex">
                      12 Módulos Completos
                    </Badge>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {DISCIPLINAS_BASICO.map((d) => (
                      <div
                        key={d.numero}
                        className="group relative rounded-xl border border-border bg-card p-5 transition-all duration-200 hover:border-gold/50 hover:shadow-md hover:-translate-y-0.5"
                      >
                        <div className="flex items-start justify-between">
                          <span className="font-mono text-2xl font-bold text-gold/60 group-hover:text-gold transition-colors">
                            {d.numero}
                          </span>
                          <Badge variant="secondary" className="text-[10px] uppercase tracking-wider font-semibold">
                            {d.tag}
                          </Badge>
                        </div>
                        <h4 className="mt-3 font-serif text-lg font-bold text-foreground leading-snug group-hover:text-primary transition-colors">
                          {d.nome}
                        </h4>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Vídeoaulas, material de apoio em PDF e avaliação de fixação.
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Box de Informações Práticas do Curso Básico */}
                <div className="rounded-2xl border border-gold/30 bg-slate-900 text-white p-8">
                  <div className="grid gap-8 md:grid-cols-3 items-center">
                    <div className="space-y-2">
                      <p className="text-xs uppercase tracking-widest text-gold font-semibold">Modalidade</p>
                      <h4 className="font-serif text-2xl font-bold">100% Online</h4>
                      <p className="text-xs text-slate-300">
                        Estude no seu ritmo, de qualquer lugar, com acesso vitalício aos materiais gravados.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs uppercase tracking-widest text-gold font-semibold">Certificação</p>
                      <h4 className="font-serif text-2xl font-bold">Certificado SETE</h4>
                      <p className="text-xs text-slate-300">
                        Certificado digital com código de validação pública e carteirinha de estudante.
                      </p>
                    </div>

                    <div className="space-y-4 md:border-l md:border-slate-800 md:pl-8">
                      <div>
                        <p className="text-xs uppercase tracking-widest text-gold font-semibold">Investimento</p>
                        <div className="text-3xl font-serif font-bold text-gold">
                          {cursoBasico && Number(cursoBasico.preco) > 0
                            ? `R$ ${Number(cursoBasico.preco).toFixed(2).replace(".", ",")}`
                            : "R$ 180,00"}
                        </div>
                        <p className="text-[11px] text-slate-400">Acesso completo às 12 disciplinas.</p>
                      </div>

                      <Button asChild className="w-full bg-gold text-slate-950 hover:bg-gold/90 font-semibold">
                        <Link to="/cursos/$slug" params={{ slug: "curso-b-sico-de-teologia" }}>
                          Quero me Matricular no Básico →
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* SEÇÃO 2: FORMAÇÃO MINISTERIAL (3 Pilares + 4 Percursos) */}
            {/* ======================================================== */}
            {formacaoAtiva === "ministerial" && (
              <div className="space-y-12 animate-in fade-in-50 duration-300">
                {/* Header da Formação Ministerial */}
                <div className="pb-6 border-b border-border">
                  <div className="flex items-center gap-2 text-gold font-medium text-xs uppercase tracking-widest">
                    <Users className="h-4 w-4" /> Capacitação para o Altar e a Igreja Local
                  </div>
                  <h2 className="mt-2 font-serif text-3xl sm:text-4xl font-bold text-foreground">
                    Formação de Obreiros
                  </h2>
                  <p className="mt-2 text-muted-foreground max-w-3xl leading-relaxed">
                    A Formação Ministerial é desenhada para preparar obreiros e líderes segundo a sua ordenação e chamado.
                    Todos os obreiros compartilham os mesmos <strong>3 pilares essenciais</strong>, mas o conteúdo de <em>Prática Ministerial</em> e <em>Liderança</em> é adaptado à função exercida.
                  </p>
                </div>

                {/* 1º NÍVEL: OS TRÊS PILARES DA FORMAÇÃO MINISTERIAL */}
                <div>
                  <div className="mb-6">
                    <span className="text-xs font-bold uppercase tracking-widest text-gold">
                      1º Nível — Estrutura Formativa
                    </span>
                    <h3 className="mt-1 font-serif text-2xl font-bold flex items-center gap-2">
                      <Layers className="h-6 w-6 text-gold" /> Os Três Pilares da Formação Ministerial
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      As três disciplinas são a base comum de toda a formação ministerial:
                    </p>
                  </div>

                  <div className="grid gap-6 md:grid-cols-3">
                    {PILARES_MINISTERIAL.map((p, idx) => (
                      <div
                        key={p.titulo}
                        className="rounded-2xl border-2 border-slate-800 bg-slate-900/40 p-6 flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-sm font-bold text-gold">
                              Pilar 0{idx + 1}
                            </span>
                            <Badge variant="outline" className="border-gold/30 text-gold text-[10px]">
                              {p.badge}
                            </Badge>
                          </div>
                          <h4 className="mt-3 font-serif text-xl font-bold text-foreground">
                            {p.titulo}
                          </h4>
                          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                            {p.descricao}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 rounded-xl border border-gold/30 bg-gold/5 p-4 text-xs sm:text-sm text-foreground flex items-center gap-3">
                    <ShieldCheck className="h-5 w-5 text-gold shrink-0" />
                    <span>
                      <strong>Importante:</strong> Embora os 3 pilares sejam a espinha dorsal comum, a <em>Prática Ministerial</em> e a <em>Liderança</em> são ministradas de acordo com as atribuições de cada função eclesiástica.
                    </span>
                  </div>
                </div>

                {/* 2º NÍVEL: OS QUATRO PERCURSOS ESPECÍFICOS */}
                <div className="pt-6">
                  <div className="mb-6">
                    <span className="text-xs font-bold uppercase tracking-widest text-gold">
                      2º Nível — Escolha o Seu Percurso
                    </span>
                    <h3 className="mt-1 font-serif text-2xl font-bold flex items-center gap-2">
                      <Compass className="h-6 w-6 text-gold" /> Os Quatro Percursos de Obreiros
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Selecione a formação correspondente ao seu chamado e cargo ministerial:
                    </p>
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2">
                    {PERCURSOS_OBREIROS.map((percurso) => {
                      const dadosCurso = getCurso(percurso.slug);
                      const Icon = percurso.icone;
                      return (
                        <Card
                          key={percurso.slug}
                          className="rounded-2xl border border-border bg-card p-6 flex flex-col justify-between transition-all hover:border-gold/50 hover:shadow-lg"
                        >
                          <div>
                            <div className="flex items-start justify-between">
                              <div className="h-11 w-11 rounded-xl bg-gold/10 text-gold flex items-center justify-center">
                                <Icon className="h-5 w-5" />
                              </div>
                              <Badge variant="outline" className="text-xs border-gold/30 text-gold">
                                {percurso.destaque}
                              </Badge>
                            </div>

                            <h4 className="mt-4 font-serif text-2xl font-bold text-foreground">
                              {percurso.cargo}
                            </h4>

                            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                              {percurso.resumo}
                            </p>

                            <div className="mt-4 pt-3 border-t border-border/60 flex items-center gap-4 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5 text-gold" /> 4 Módulos Estruturados
                              </span>
                              <span className="flex items-center gap-1">
                                <GraduationCap className="h-3.5 w-3.5 text-gold" /> Certificado de Obreiro
                              </span>
                            </div>
                          </div>

                          <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
                            <div>
                              <span className="text-[10px] uppercase tracking-wider text-muted-foreground block">
                                Investimento
                              </span>
                              <span className="font-serif text-lg font-bold text-gold">
                                {dadosCurso && Number(dadosCurso.preco) > 0
                                  ? `R$ ${Number(dadosCurso.preco).toFixed(2).replace(".", ",")}`
                                  : "R$ 160,00"}
                              </span>
                            </div>

                            <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
                              <Link to="/cursos/$slug" params={{ slug: percurso.slug }}>
                                Acessar Percurso →
                              </Link>
                            </Button>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* SEÇÃO 3: CURSOS DE EXTENSÃO (Escola de Líderes + Ativação) */}
            {/* ======================================================== */}
            {formacaoAtiva === "extensao" && (
              <div className="space-y-12 animate-in fade-in-50 duration-300">
                {/* Header Cursos de Extensão */}
                <div className="pb-6 border-b border-border">
                  <div className="flex items-center gap-2 text-gold font-medium text-xs uppercase tracking-widest">
                    <Sparkles className="h-4 w-4" /> Especializações e Treinamentos Práticos
                  </div>
                  <h2 className="mt-2 font-serif text-3xl sm:text-4xl font-bold text-foreground">
                    Cursos de Extensão
                  </h2>
                  <p className="mt-2 text-muted-foreground max-w-2xl">
                    Cursos práticos e objetivos para capacitação em ministérios específicos, liderança de células e dons espirituais.
                  </p>
                </div>

                {/* DOIS CARDS OBJETIVOS */}
                <div className="grid gap-8 md:grid-cols-2">
                  {EXTENSAO_INFO.map((ext) => {
                    const cursoObj = getCurso(ext.slug);
                    return (
                      <Card
                        key={ext.slug}
                        className="rounded-2xl border-2 border-border bg-card p-7 flex flex-col justify-between transition-all hover:border-gold/50 hover:shadow-xl"
                      >
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <Badge className="bg-gold text-slate-950 font-semibold text-xs">
                              Curso de Extensão
                            </Badge>
                            <span className="text-xs font-medium text-muted-foreground">
                              {ext.duracao}
                            </span>
                          </div>

                          <h3 className="font-serif text-2xl font-bold text-foreground">
                            {ext.titulo}
                          </h3>

                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {ext.subtitulo}
                          </p>

                          <div className="space-y-2.5 pt-4 border-t border-border text-xs text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-foreground">Modalidade:</span>
                              <span>{ext.modalidade}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-foreground">Formato:</span>
                              <span>{ext.formato}</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <span className="font-semibold text-foreground shrink-0">Público-alvo:</span>
                              <span>{ext.publico}</span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-8 pt-5 border-t border-border flex items-center justify-between">
                          <div>
                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground block">
                              Investimento
                            </span>
                            <span className="font-serif text-2xl font-bold text-gold">
                              {cursoObj && Number(cursoObj.preco) > 0
                                ? `R$ ${Number(cursoObj.preco).toFixed(2).replace(".", ",")}`
                                : "R$ 100,00"}
                            </span>
                          </div>

                          <Button asChild size="lg" className="bg-gold text-slate-950 hover:bg-gold/90 font-semibold">
                            <Link to="/cursos/$slug" params={{ slug: ext.slug }}>
                              Fazer Inscrição →
                            </Link>
                          </Button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* SEÇÃO INSTITUCIONAL / BANNER INFERIOR */}
        <section className="bg-slate-950 text-white py-16 border-t border-border/40">
          <div className="mx-auto max-w-6xl px-4 text-center">
            <h2 className="font-serif text-3xl sm:text-4xl font-bold">
              Inicie Hoje a Sua Jornada no SETE
            </h2>
            <p className="mt-3 text-slate-300 max-w-xl mx-auto text-sm sm:text-base">
              Acesse o catálogo completo ou entre em contato com nossa secretaria acadêmica para tirar dúvidas sobre inscrições.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Button asChild size="lg" className="bg-gold text-slate-950 hover:bg-gold/90 font-semibold">
                <Link to="/cursos">Ver Catálogo Completo</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-slate-700 text-white hover:bg-slate-900">
                <Link to="/sobre">Conheça Nossa História</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />

      {/* MODAL / ASSISTENTE: QUAL FORMAÇÃO É PARA MIM? */}
      <Dialog open={isQuizOpen} onOpenChange={setIsQuizOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2 text-gold font-medium text-xs uppercase tracking-widest mb-1">
              <Compass className="h-4 w-4" /> Orientação Vocacional SETE
            </div>
            <DialogTitle className="font-serif text-2xl font-bold">
              Qual formação é ideal para você?
            </DialogTitle>
            <DialogDescription>
              Selecione o objetivo que mais descreve o seu momento e chamado espiritual:
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-3">
            {/* Opção 1: Formação Teológica */}
            <button
              type="button"
              onClick={() => handleSelectFromQuiz("teologica")}
              className="w-full text-left p-4 rounded-xl border border-border bg-card hover:border-gold/60 hover:bg-gold/5 transition-all cursor-pointer group flex items-start gap-3.5"
            >
              <div className="h-10 w-10 rounded-lg bg-gold/10 text-gold flex items-center justify-center shrink-0 group-hover:bg-gold group-hover:text-slate-950 transition-colors">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h4 className="font-serif font-bold text-base text-foreground group-hover:text-gold transition-colors">
                  Quero uma base teológica sólida e bíblica
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Recomendado: <strong>Formação Teológica (Curso Básico)</strong> com as 12 disciplinas essenciais de teologia sistemática, hermenêutica e história.
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-gold group-hover:translate-x-1 transition-all mt-1" />
            </button>

            {/* Opção 2: Formação Ministerial */}
            <button
              type="button"
              onClick={() => handleSelectFromQuiz("ministerial")}
              className="w-full text-left p-4 rounded-xl border border-border bg-card hover:border-gold/60 hover:bg-gold/5 transition-all cursor-pointer group flex items-start gap-3.5"
            >
              <div className="h-10 w-10 rounded-lg bg-gold/10 text-gold flex items-center justify-center shrink-0 group-hover:bg-gold group-hover:text-slate-950 transition-colors">
                <Users className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h4 className="font-serif font-bold text-base text-foreground group-hover:text-gold transition-colors">
                  Fui chamado ou atuo no ministério da igreja local
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Recomendado: <strong>Formação Ministerial (Formação de Obreiros)</strong> para Diáconos, Presbíteros, Evangelistas/Missionárias ou Pastores.
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-gold group-hover:translate-x-1 transition-all mt-1" />
            </button>

            {/* Opção 3: Extensão - Líder de Célula */}
            <button
              type="button"
              onClick={() => handleSelectFromQuiz("extensao")}
              className="w-full text-left p-4 rounded-xl border border-border bg-card hover:border-gold/60 hover:bg-gold/5 transition-all cursor-pointer group flex items-start gap-3.5"
            >
              <div className="h-10 w-10 rounded-lg bg-gold/10 text-gold flex items-center justify-center shrink-0 group-hover:bg-gold group-hover:text-slate-950 transition-colors">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h4 className="font-serif font-bold text-base text-foreground group-hover:text-gold transition-colors">
                  Quero liderar células ou desenvolver dons espirituais
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Recomendado: <strong>Cursos de Extensão</strong> (Escola de Líderes de Célula ou Ativação Profética).
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-gold group-hover:translate-x-1 transition-all mt-1" />
            </button>
          </div>

          <div className="pt-2 text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsQuizOpen(false)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Fechar Guia
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
