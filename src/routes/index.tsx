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
    <div className="flex min-h-screen flex-col bg-[#f3f0e9] text-[#1c1917]">
      <SiteHeader />

      <main className="flex-1">
        {/* HERO HEADER — ESTILO FTSA */}
        <section className="relative overflow-hidden bg-[#f3f0e9] text-[#1c1917] border-b border-[#e2ddd3] py-16 md:py-22">
          <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_1px_1px,#66594e_1px,transparent_0)] [background-size:28px_28px]" />
          <div className="relative mx-auto max-w-6xl px-4 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#ff3403]/30 bg-[#ff3403]/10 text-[#ff3403] text-xs font-black uppercase tracking-[0.25em] px-4 py-1.5 mb-5 shadow-xs">
              SEMINÁRIO TEOLÓGICO ESPERANÇA
            </div>

            <h1 className="font-serif text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-[#1c1917] max-w-4xl mx-auto leading-[1.15]">
              Ensino que Transforma, <br className="hidden sm:inline" />
              <span className="text-[#ff3403]">Ministérios que Edificam</span>
            </h1>

            <p className="mt-5 text-base sm:text-lg text-[#66594e] max-w-2xl mx-auto leading-relaxed font-medium">
              Escolha uma das três áreas de formação para conhecer a grade curricular, percursos ministeriais e requisitos.
            </p>

            {/* OS TRÊS GRANDES CARDS ESTILO FTSA */}
            <div className="mt-12 grid gap-6 sm:grid-cols-3 text-left">
              {/* CARD 1: FORMAÇÃO TEOLÓGICA */}
              <button
                type="button"
                onClick={() => setFormacaoAtiva("teologica")}
                className={cn(
                  "relative rounded-3xl p-7 border-2 text-left transition-all duration-300 cursor-pointer flex flex-col justify-between group bg-white shadow-xs hover:shadow-md",
                  formacaoAtiva === "teologica"
                    ? "border-[#ff3403] shadow-md ring-4 ring-[#ff3403]/15"
                    : "border-[#e2ddd3] hover:border-[#ff3403]/50"
                )}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div
                      className={cn(
                        "h-13 w-13 rounded-2xl flex items-center justify-center transition-colors shadow-xs",
                        formacaoAtiva === "teologica"
                          ? "bg-[#ff3403] text-white"
                          : "bg-[#f3f0e9] text-[#ff3403] group-hover:bg-[#ff3403] group-hover:text-white"
                      )}
                    >
                      <GraduationCap className="h-6 w-6" />
                    </div>
                    {formacaoAtiva === "teologica" && (
                      <span className="flex items-center gap-1 text-[10px] font-black text-white uppercase tracking-wider bg-[#ff3403] px-3 py-1 rounded-full">
                        Selecionado
                      </span>
                    )}
                  </div>

                  <p className="mt-6 text-xs uppercase tracking-widest text-[#ff3403] font-black">
                    Área Acadêmica
                  </p>
                  <h3 className="mt-1 font-serif text-xl sm:text-2xl font-black text-[#1c1917] group-hover:text-[#ff3403] transition-colors">
                    FORMAÇÃO TEOLÓGICA
                  </h3>
                  <p className="mt-2 text-sm text-[#1c1917] font-semibold">
                    Curso Básico de Teologia
                  </p>
                  <p className="mt-1 text-xs text-[#66594e] leading-relaxed">
                    Grade curricular com 12 disciplinas bíblicas e doutrinárias essenciais.
                  </p>
                </div>

                <div className="mt-8 pt-4 border-t border-[#e2ddd3] flex items-center justify-between text-xs font-black uppercase tracking-wider text-[#ff3403]">
                  <span>Ver 12 Disciplinas</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </button>

              {/* CARD 2: FORMAÇÃO MINISTERIAL */}
              <button
                type="button"
                onClick={() => setFormacaoAtiva("ministerial")}
                className={cn(
                  "relative rounded-3xl p-7 border-2 text-left transition-all duration-300 cursor-pointer flex flex-col justify-between group bg-white shadow-xs hover:shadow-md",
                  formacaoAtiva === "ministerial"
                    ? "border-[#ff3403] shadow-md ring-4 ring-[#ff3403]/15"
                    : "border-[#e2ddd3] hover:border-[#ff3403]/50"
                )}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div
                      className={cn(
                        "h-13 w-13 rounded-2xl flex items-center justify-center transition-colors shadow-xs",
                        formacaoAtiva === "ministerial"
                          ? "bg-[#ff3403] text-white"
                          : "bg-[#f3f0e9] text-[#ff3403] group-hover:bg-[#ff3403] group-hover:text-white"
                      )}
                    >
                      <Users className="h-6 w-6" />
                    </div>
                    {formacaoAtiva === "ministerial" && (
                      <span className="flex items-center gap-1 text-[10px] font-black text-white uppercase tracking-wider bg-[#ff3403] px-3 py-1 rounded-full">
                        Selecionado
                      </span>
                    )}
                  </div>

                  <p className="mt-6 text-xs uppercase tracking-widest text-[#ff3403] font-black">
                    Área Eclesiástica
                  </p>
                  <h3 className="mt-1 font-serif text-xl sm:text-2xl font-black text-[#1c1917] group-hover:text-[#ff3403] transition-colors">
                    FORMAÇÃO MINISTERIAL
                  </h3>
                  <p className="mt-2 text-sm text-[#1c1917] font-semibold">
                    Formação de Obreiros
                  </p>
                  <p className="mt-1 text-xs text-[#66594e] leading-relaxed">
                    3 Pilares fundamentais divididos em 4 percursos ministeriais.
                  </p>
                </div>

                <div className="mt-8 pt-4 border-t border-[#e2ddd3] flex items-center justify-between text-xs font-black uppercase tracking-wider text-[#ff3403]">
                  <span>Ver Pilares & Percursos</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </button>

              {/* CARD 3: CURSOS DE EXTENSÃO */}
              <button
                type="button"
                onClick={() => setFormacaoAtiva("extensao")}
                className={cn(
                  "relative rounded-3xl p-7 border-2 text-left transition-all duration-300 cursor-pointer flex flex-col justify-between group bg-white shadow-xs hover:shadow-md",
                  formacaoAtiva === "extensao"
                    ? "border-[#ff3403] shadow-md ring-4 ring-[#ff3403]/15"
                    : "border-[#e2ddd3] hover:border-[#ff3403]/50"
                )}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div
                      className={cn(
                        "h-13 w-13 rounded-2xl flex items-center justify-center transition-colors shadow-xs",
                        formacaoAtiva === "extensao"
                          ? "bg-[#ff3403] text-white"
                          : "bg-[#f3f0e9] text-[#ff3403] group-hover:bg-[#ff3403] group-hover:text-white"
                      )}
                    >
                      <Sparkles className="h-6 w-6" />
                    </div>
                    {formacaoAtiva === "extensao" && (
                      <span className="flex items-center gap-1 text-[10px] font-black text-white uppercase tracking-wider bg-[#ff3403] px-3 py-1 rounded-full">
                        Selecionado
                      </span>
                    )}
                  </div>

                  <p className="mt-6 text-xs uppercase tracking-widest text-[#ff3403] font-black">
                    Capacitação Contínua
                  </p>
                  <h3 className="mt-1 font-serif text-xl sm:text-2xl font-black text-[#1c1917] group-hover:text-[#ff3403] transition-colors">
                    CURSOS DE EXTENSÃO
                  </h3>
                  <div className="mt-2 space-y-0.5 text-xs text-[#1c1917] font-medium">
                    <p>• Escola de Líderes de Célula</p>
                    <p>• Ativação Profética</p>
                  </div>
                </div>

                <div className="mt-8 pt-4 border-t border-[#e2ddd3] flex items-center justify-between text-xs font-black uppercase tracking-wider text-[#ff3403]">
                  <span>Conhecer Cursos</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </button>
            </div>

            {/* BOTÃO QUAL FORMAÇÃO É PARA MIM? — ESTILO PÍLULA FTSA */}
            <div className="mt-12 flex justify-center">
              <Button
                onClick={() => setIsQuizOpen(true)}
                size="lg"
                className="rounded-full bg-[#ff3403] text-white hover:bg-[#e02e00] font-bold px-9 py-6.5 shadow-md hover:shadow-lg text-sm sm:text-base flex items-center gap-2.5 group transition-all cursor-pointer uppercase tracking-wider"
              >
                <Compass className="h-5 w-5 text-white transition-transform group-hover:rotate-45" />
                <span>Qual formação é para mim?</span>
                <ChevronRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
          </div>
        </section>

        {/* ÁREA DE CONTEÚDO DINÂMICO CONFORME O CARD CLICADO */}
        <section id="area-formacao-conteudo" className="py-16 md:py-20 bg-[#f3f0e9]">
          <div className="mx-auto max-w-6xl px-4">
            {/* ======================================================== */}
            {/* SEÇÃO 1: FORMAÇÃO TEOLÓGICA (Curso Básico + 12 Disciplinas) */}
            {/* ======================================================== */}
            {formacaoAtiva === "teologica" && (
              <div className="space-y-12 animate-in fade-in-50 duration-300">
                {/* Header da Formação */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#e2ddd3]">
                  <div>
                    <div className="flex items-center gap-2 text-[#ff3403] font-black text-xs uppercase tracking-widest">
                      <GraduationCap className="h-4 w-4" /> Formação Acadêmica Principal
                    </div>
                    <h2 className="mt-2 font-serif text-3xl sm:text-4xl font-black text-[#1c1917]">
                      Curso Básico de Teologia
                    </h2>
                    <p className="mt-2 text-[#66594e] max-w-2xl leading-relaxed font-medium">
                      Estruturado para fornecer uma base sólida, histórica e bíblica. O curso é composto por <strong>12 disciplinas fundamentais</strong> essenciais para qualquer cristão e líder.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <Button asChild size="lg" className="rounded-full bg-[#ff3403] text-white hover:bg-[#e02e00] font-bold text-xs uppercase tracking-wider px-7 py-3.5 shadow-sm">
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
                      <h3 className="font-serif text-2xl font-black text-[#1c1917] flex items-center gap-2.5">
                        <BookOpen className="h-6 w-6 text-[#ff3403]" /> As 12 Disciplinas do Curso
                      </h3>
                      <p className="text-sm text-[#66594e] mt-1 font-medium">
                        Conheça o conteúdo completo ministrado ao longo da formação teológica:
                      </p>
                    </div>
                    <span className="rounded-full border border-[#ff3403]/30 bg-[#ff3403]/10 text-[#ff3403] text-xs font-bold uppercase tracking-wider px-3.5 py-1 hidden sm:inline-flex">
                      12 Módulos Completos
                    </span>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {DISCIPLINAS_BASICO.map((d) => (
                      <div
                        key={d.numero}
                        className="group relative rounded-2xl border border-[#e2ddd3] bg-white p-5 transition-all duration-200 hover:border-[#ff3403] hover:shadow-md hover:-translate-y-0.5 shadow-xs"
                      >
                        <div className="flex items-start justify-between">
                          <span className="font-mono text-2xl font-black text-[#ff3403] transition-transform group-hover:scale-105">
                            {d.numero}
                          </span>
                          <span className="rounded-full bg-[#f3f0e9] border border-[#e2ddd3] text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 text-[#66594e]">
                            {d.tag}
                          </span>
                        </div>
                        <h4 className="mt-3 font-serif text-lg font-black text-[#1c1917] leading-snug group-hover:text-[#ff3403] transition-colors">
                          {d.nome}
                        </h4>
                        <p className="mt-1 text-xs text-[#66594e] leading-relaxed">
                          Vídeoaulas, material de apoio em PDF e avaliação de fixação.
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Box de Informações Práticas do Curso Básico — FTSA DEEP WINE */}
                <div className="rounded-3xl border border-white/10 bg-[#490905] text-white p-8 sm:p-10 shadow-xl">
                  <div className="grid gap-8 md:grid-cols-3 items-center">
                    <div className="space-y-2">
                      <p className="text-xs uppercase tracking-widest text-[#ff3403] font-black">Modalidade</p>
                      <h4 className="font-serif text-2xl font-black text-white">100% Online</h4>
                      <p className="text-xs text-[#f3f0e9]/80 font-normal leading-relaxed">
                        Estude no seu ritmo, de qualquer lugar, com acesso contínuo aos materiais didáticos gravados.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs uppercase tracking-widest text-[#ff3403] font-black">Certificação</p>
                      <h4 className="font-serif text-2xl font-black text-white">Certificado SETE</h4>
                      <p className="text-xs text-[#f3f0e9]/80 font-normal leading-relaxed">
                        Certificado digital com código de validação pública e carteirinha de estudante.
                      </p>
                    </div>

                    <div className="space-y-4 md:border-l md:border-white/15 md:pl-8">
                      <div>
                        <p className="text-xs uppercase tracking-widest text-[#ff3403] font-black">Investimento</p>
                        <div className="text-3xl font-serif font-black text-white">
                          {cursoBasico && Number(cursoBasico.preco) > 0
                            ? `R$ ${Number(cursoBasico.preco).toFixed(2).replace(".", ",")}`
                            : "R$ 180,00"}
                        </div>
                        <p className="text-[11px] text-[#f3f0e9]/70">Acesso completo às 12 disciplinas.</p>
                      </div>

                      <Button asChild className="w-full rounded-full bg-[#ff3403] text-white hover:bg-[#e02e00] font-bold text-xs uppercase tracking-wider py-3.5 shadow-md">
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
                <div className="pb-6 border-b border-[#e2ddd3]">
                  <div className="flex items-center gap-2 text-[#ff3403] font-black text-xs uppercase tracking-widest">
                    <Users className="h-4 w-4" /> Capacitação para o Altar e a Igreja Local
                  </div>
                  <h2 className="mt-2 font-serif text-3xl sm:text-4xl font-black text-[#1c1917]">
                    Formação de Obreiros
                  </h2>
                  <p className="mt-2 text-[#66594e] max-w-3xl leading-relaxed font-medium">
                    A Formação Ministerial é desenhada para preparar obreiros e líderes segundo a sua ordenação e chamado.
                    Todos os obreiros compartilham os mesmos <strong>3 pilares essenciais</strong>, mas o conteúdo de <em>Prática Ministerial</em> e <em>Liderança</em> é adaptado à função exercida.
                  </p>
                </div>

                {/* 1º NÍVEL: OS TRÊS PILARES DA FORMAÇÃO MINISTERIAL */}
                <div>
                  <div className="mb-6">
                    <span className="text-xs font-black uppercase tracking-widest text-[#ff3403]">
                      1º Nível — Estrutura Formativa
                    </span>
                    <h3 className="mt-1 font-serif text-2xl font-black text-[#1c1917] flex items-center gap-2.5">
                      <Layers className="h-6 w-6 text-[#ff3403]" /> Os Três Pilares da Formação Ministerial
                    </h3>
                    <p className="text-sm text-[#66594e] mt-1 font-medium">
                      As três disciplinas são a base comum de toda a formação ministerial:
                    </p>
                  </div>

                  <div className="grid gap-6 md:grid-cols-3">
                    {PILARES_MINISTERIAL.map((p, idx) => (
                      <div
                        key={p.titulo}
                        className="rounded-3xl border border-[#e2ddd3] bg-white p-7 flex flex-col justify-between shadow-xs hover:border-[#ff3403]/40 transition-colors"
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-xs font-black text-[#ff3403] uppercase tracking-wider">
                              Pilar 0{idx + 1}
                            </span>
                            <span className="rounded-full bg-[#ff3403]/10 text-[#ff3403] border border-[#ff3403]/20 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5">
                              {p.badge}
                            </span>
                          </div>
                          <h4 className="mt-4 font-serif text-xl font-black text-[#1c1917]">
                            {p.titulo}
                          </h4>
                          <p className="mt-2 text-sm text-[#66594e] leading-relaxed">
                            {p.descricao}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 rounded-2xl border border-[#ff3403]/30 bg-white p-5 text-xs sm:text-sm text-[#1c1917] flex items-center gap-3.5 shadow-xs">
                    <ShieldCheck className="h-5 w-5 text-[#ff3403] shrink-0" />
                    <span>
                      <strong>Importante:</strong> Embora os 3 pilares sejam a espinha dorsal comum, a <em>Prática Ministerial</em> e a <em>Liderança</em> são ministradas de acordo com as atribuições de cada função eclesiástica.
                    </span>
                  </div>
                </div>

                {/* 2º NÍVEL: OS QUATRO PERCURSOS ESPECÍFICOS */}
                <div className="pt-6">
                  <div className="mb-6">
                    <span className="text-xs font-black uppercase tracking-widest text-[#ff3403]">
                      2º Nível — Escolha o Seu Percurso
                    </span>
                    <h3 className="mt-1 font-serif text-2xl font-black text-[#1c1917] flex items-center gap-2.5">
                      <Compass className="h-6 w-6 text-[#ff3403]" /> Os Quatro Percursos de Obreiros
                    </h3>
                    <p className="text-sm text-[#66594e] mt-1 font-medium">
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
                          className="rounded-3xl border border-[#e2ddd3] bg-white p-7 flex flex-col justify-between transition-all hover:border-[#ff3403] hover:shadow-lg shadow-xs"
                        >
                          <div>
                            <div className="flex items-start justify-between">
                              <div className="h-12 w-12 rounded-2xl bg-[#ff3403]/10 text-[#ff3403] flex items-center justify-center">
                                <Icon className="h-6 w-6" />
                              </div>
                              <span className="rounded-full bg-[#f3f0e9] border border-[#e2ddd3] text-xs font-bold text-[#66594e] px-3 py-1">
                                {percurso.destaque}
                              </span>
                            </div>

                            <h4 className="mt-5 font-serif text-2xl font-black text-[#1c1917]">
                              {percurso.cargo}
                            </h4>

                            <p className="mt-2 text-sm text-[#66594e] leading-relaxed font-normal">
                              {percurso.resumo}
                            </p>

                            <div className="mt-5 pt-4 border-t border-[#e2ddd3] flex items-center gap-4 text-xs text-[#66594e]">
                              <span className="flex items-center gap-1 font-medium">
                                <Clock className="h-3.5 w-3.5 text-[#ff3403]" /> 4 Módulos Estruturados
                              </span>
                              <span className="flex items-center gap-1 font-medium">
                                <GraduationCap className="h-3.5 w-3.5 text-[#ff3403]" /> Certificado de Obreiro
                              </span>
                            </div>
                          </div>

                          <div className="mt-8 pt-5 border-t border-[#e2ddd3] flex items-center justify-between">
                            <div>
                              <span className="text-[10px] uppercase tracking-wider text-[#66594e] block font-bold">
                                Investimento
                              </span>
                              <span className="font-serif text-xl font-black text-[#ff3403]">
                                {dadosCurso && Number(dadosCurso.preco) > 0
                                  ? `R$ ${Number(dadosCurso.preco).toFixed(2).replace(".", ",")}`
                                  : "R$ 160,00"}
                              </span>
                            </div>

                            <Button asChild className="rounded-full bg-[#ff3403] text-white hover:bg-[#e02e00] font-bold text-xs uppercase tracking-wider px-6 py-2.5 shadow-sm">
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
                <div className="pb-6 border-b border-[#e2ddd3]">
                  <div className="flex items-center gap-2 text-[#ff3403] font-black text-xs uppercase tracking-widest">
                    <Sparkles className="h-4 w-4" /> Especializações e Treinamentos Práticos
                  </div>
                  <h2 className="mt-2 font-serif text-3xl sm:text-4xl font-black text-[#1c1917]">
                    Cursos de Extensão
                  </h2>
                  <p className="mt-2 text-[#66594e] max-w-2xl leading-relaxed font-medium">
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
                        className="rounded-3xl border-2 border-[#e2ddd3] bg-white p-7 sm:p-8 flex flex-col justify-between transition-all hover:border-[#ff3403] hover:shadow-xl shadow-xs"
                      >
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="rounded-full bg-[#ff3403] text-white font-bold text-xs px-3.5 py-1 uppercase tracking-wider">
                              Curso de Extensão
                            </span>
                            <span className="text-xs font-semibold text-[#66594e]">
                              {ext.duracao}
                            </span>
                          </div>

                          <h3 className="font-serif text-2xl font-black text-[#1c1917]">
                            {ext.titulo}
                          </h3>

                          <p className="text-sm text-[#66594e] leading-relaxed">
                            {ext.subtitulo}
                          </p>

                          <div className="space-y-2.5 pt-4 border-t border-[#e2ddd3] text-xs text-[#66594e]">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-[#1c1917]">Modalidade:</span>
                              <span>{ext.modalidade}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-[#1c1917]">Formato:</span>
                              <span>{ext.formato}</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <span className="font-bold text-[#1c1917] shrink-0">Público-alvo:</span>
                              <span>{ext.publico}</span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-8 pt-5 border-t border-[#e2ddd3] flex items-center justify-between">
                          <div>
                            <span className="text-[10px] uppercase tracking-wider text-[#66594e] block font-bold">
                              Investimento
                            </span>
                            <span className="font-serif text-2xl font-black text-[#ff3403]">
                              {cursoObj && Number(cursoObj.preco) > 0
                                ? `R$ ${Number(cursoObj.preco).toFixed(2).replace(".", ",")}`
                                : "R$ 100,00"}
                            </span>
                          </div>

                          <Button asChild size="lg" className="rounded-full bg-[#ff3403] text-white hover:bg-[#e02e00] font-bold text-xs uppercase tracking-wider px-7 py-3.5 shadow-sm">
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

        {/* SEÇÃO INSPIRADA NA FTSA: COMUNIDADE & FORMAÇÃO MINISTERIAL */}
        <section className="bg-[#490905] text-white py-18 border-t border-b border-white/10">
          <div className="mx-auto max-w-6xl px-4">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <span className="inline-block text-xs font-black uppercase tracking-[0.25em] text-[#ff3403] bg-white/10 px-4 py-1.5 rounded-full mb-3">
                VIDA E MINISTÉRIO NO SETE
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl font-black text-white">
                Preparando Vidas Para Servir o Reino de Deus
              </h2>
              <p className="mt-3 text-sm sm:text-base text-[#f3f0e9]/80 leading-relaxed font-light">
                Nossa proposta integra formação teológica bíblica rigorosa, cuidado pastoral, discipulado e exercício responsável da liderança cristã.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <div className="rounded-3xl bg-black/20 border border-white/10 p-7 space-y-4">
                <div className="h-10 w-10 rounded-full bg-[#ff3403] flex items-center justify-center text-white font-bold">
                  01
                </div>
                <h3 className="font-serif text-xl font-bold text-white">Bases Bíblicas Firmes</h3>
                <p className="text-xs text-[#f3f0e9]/75 leading-relaxed font-light">
                  Aprofunde seus conhecimentos nas Escrituras com disciplinas expositivas de Antigo e Novo Testamento, Teologia Sistemática e História da Igreja.
                </p>
              </div>

              <div className="rounded-3xl bg-black/20 border border-white/10 p-7 space-y-4">
                <div className="h-10 w-10 rounded-full bg-[#ff3403] flex items-center justify-center text-white font-bold">
                  02
                </div>
                <h3 className="font-serif text-xl font-bold text-white">Prática no Altar & Comunidade</h3>
                <p className="text-xs text-[#f3f0e9]/75 leading-relaxed font-light">
                  Capacitação direta para o serviço eclesiástico de diáconos, presbíteros, evangelistas e pastores, aliando teoria teológica à prática pastoral.
                </p>
              </div>

              <div className="rounded-3xl bg-black/20 border border-white/10 p-7 space-y-4">
                <div className="h-10 w-10 rounded-full bg-[#ff3403] flex items-center justify-center text-white font-bold">
                  03
                </div>
                <h3 className="font-serif text-xl font-bold text-white">Flexibilidade & Certificação</h3>
                <p className="text-xs text-[#f3f0e9]/75 leading-relaxed font-light">
                  Aulas 100% online com ambiente virtual exclusivo, materiais em PDF para download, avaliações práticas e certificado com validação pública.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SEÇÃO INSTITUCIONAL / BANNER INFERIOR — GRAFITE FTSA */}
        <section className="bg-[#161922] text-white py-18 border-t border-[#232734]">
          <div className="mx-auto max-w-6xl px-4 text-center">
            <h2 className="font-serif text-3xl sm:text-4xl font-black text-white">
              Inicie Hoje a Sua Jornada no SETE
            </h2>
            <p className="mt-3 text-[#f3f0e9]/70 max-w-xl mx-auto text-sm sm:text-base font-light">
              Acesse o catálogo completo de cursos ou entre em contato com nossa secretaria acadêmica para tirar dúvidas sobre matrículas e percursos.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Button asChild size="lg" className="rounded-full bg-[#ff3403] text-white hover:bg-[#e02e00] font-bold uppercase tracking-wider text-xs px-8 py-3.5 shadow-md">
                <Link to="/cursos">Ver Catálogo Completo</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full border-white/20 text-white hover:bg-white/10 font-bold uppercase tracking-wider text-xs px-8 py-3.5">
                <Link to="/sobre">Conheça Nossa História</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />

      {/* MODAL / ASSISTENTE: QUAL FORMAÇÃO É PARA MIM? — ESTILO FTSA */}
      <Dialog open={isQuizOpen} onOpenChange={setIsQuizOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto bg-white border-[#e2ddd3] rounded-3xl p-6 sm:p-8 shadow-2xl">
          <DialogHeader>
            <div className="flex items-center gap-2 text-[#ff3403] font-black text-xs uppercase tracking-widest mb-1">
              <Compass className="h-4 w-4" /> Orientação Vocacional SETE
            </div>
            <DialogTitle className="font-serif text-2xl font-black text-[#1c1917]">
              Qual formação é ideal para você?
            </DialogTitle>
            <DialogDescription className="text-[#66594e] text-sm">
              Selecione o objetivo que mais descreve o seu momento e chamado espiritual:
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-3">
            {/* Opção 1: Formação Teológica */}
            <button
              type="button"
              onClick={() => handleSelectFromQuiz("teologica")}
              className="w-full text-left p-4 rounded-2xl border border-[#e2ddd3] bg-white hover:border-[#ff3403] hover:bg-[#f3f0e9]/50 transition-all cursor-pointer group flex items-start gap-3.5 shadow-xs"
            >
              <div className="h-10 w-10 rounded-xl bg-[#ff3403]/10 text-[#ff3403] flex items-center justify-center shrink-0 group-hover:bg-[#ff3403] group-hover:text-white transition-colors">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h4 className="font-serif font-bold text-base text-[#1c1917] group-hover:text-[#ff3403] transition-colors">
                  Quero uma base teológica sólida e bíblica
                </h4>
                <p className="text-xs text-[#66594e] mt-0.5 leading-relaxed">
                  Recomendado: <strong>Formação Teológica (Curso Básico)</strong> com as 12 disciplinas essenciais de teologia sistemática, hermenêutica e história.
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-[#66594e] group-hover:text-[#ff3403] group-hover:translate-x-1 transition-all mt-1" />
            </button>

            {/* Opção 2: Formação Ministerial */}
            <button
              type="button"
              onClick={() => handleSelectFromQuiz("ministerial")}
              className="w-full text-left p-4 rounded-2xl border border-[#e2ddd3] bg-white hover:border-[#ff3403] hover:bg-[#f3f0e9]/50 transition-all cursor-pointer group flex items-start gap-3.5 shadow-xs"
            >
              <div className="h-10 w-10 rounded-xl bg-[#ff3403]/10 text-[#ff3403] flex items-center justify-center shrink-0 group-hover:bg-[#ff3403] group-hover:text-white transition-colors">
                <Users className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h4 className="font-serif font-bold text-base text-[#1c1917] group-hover:text-[#ff3403] transition-colors">
                  Fui chamado ou atuo no ministério da igreja local
                </h4>
                <p className="text-xs text-[#66594e] mt-0.5 leading-relaxed">
                  Recomendado: <strong>Formação Ministerial (Formação de Obreiros)</strong> para Diáconos, Presbíteros, Evangelistas/Missionárias ou Pastores.
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-[#66594e] group-hover:text-[#ff3403] group-hover:translate-x-1 transition-all mt-1" />
            </button>

            {/* Opção 3: Extensão - Líder de Célula */}
            <button
              type="button"
              onClick={() => handleSelectFromQuiz("extensao")}
              className="w-full text-left p-4 rounded-2xl border border-[#e2ddd3] bg-white hover:border-[#ff3403] hover:bg-[#f3f0e9]/50 transition-all cursor-pointer group flex items-start gap-3.5 shadow-xs"
            >
              <div className="h-10 w-10 rounded-xl bg-[#ff3403]/10 text-[#ff3403] flex items-center justify-center shrink-0 group-hover:bg-[#ff3403] group-hover:text-white transition-colors">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h4 className="font-serif font-bold text-base text-[#1c1917] group-hover:text-[#ff3403] transition-colors">
                  Quero liderar células ou desenvolver dons espirituais
                </h4>
                <p className="text-xs text-[#66594e] mt-0.5 leading-relaxed">
                  Recomendado: <strong>Cursos de Extensão</strong> (Escola de Líderes de Célula ou Ativação Profética).
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-[#66594e] group-hover:text-[#ff3403] group-hover:translate-x-1 transition-all mt-1" />
            </button>
          </div>

          <div className="pt-2 text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsQuizOpen(false)}
              className="rounded-full text-xs text-[#66594e] hover:text-[#1c1917] font-semibold px-4"
            >
              Fechar Guia
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
