import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader, SiteFooter } from "@/components/site/site-chrome";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, User, BookOpen } from "lucide-react";
import { useAuth, hasAnyRole } from "@/hooks/use-auth";
import { toast } from "sonner";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { REGIOES_CONGREGACOES } from "@/lib/congregacoes";

const cursoQO = (slug: string) =>
  queryOptions({
    queryKey: ["curso", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cursos")
        .select("*, categorias(nome, slug), modulos(id, ordem, titulo, descricao)")
        .eq("slug", slug)
        .eq("ativo", true)
        .maybeSingle();
      if (error) throw error;
      if (!data) throw notFound();
      let ministrante: { nome_completo: string } | null = null;
      if (data.ministrante_id) {
        const { data: p } = await supabase
          .from("profiles")
          .select("nome_completo")
          .eq("id", data.ministrante_id)
          .maybeSingle();
        ministrante = p;
      }
      return { ...data, ministrante };
    },
  });

export const Route = createFileRoute("/cursos/$slug")({
  loader: ({ context, params }) => context.queryClient.ensureQueryData(cursoQO(params.slug)),
  head: ({ loaderData }) => {
    if (!loaderData)
      return { meta: [{ title: "Curso não encontrado" }, { name: "robots", content: "noindex" }] };
    return {
      meta: [
        { title: `${loaderData.titulo} — SETE` },
        { name: "description", content: loaderData.descricao_curta ?? loaderData.titulo },
        { property: "og:title", content: `${loaderData.titulo} — SETE` },
        { property: "og:description", content: loaderData.descricao_curta ?? "" },
      ],
    };
  },
  notFoundComponent: () => (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto max-w-3xl flex-1 px-4 py-24 text-center">
        <h1 className="font-serif text-4xl">Curso não encontrado</h1>
        <p className="mt-4 text-muted-foreground">Este curso pode ter sido removido.</p>
        <Button asChild className="mt-6">
          <Link to="/cursos">Ver todos os cursos</Link>
        </Button>
      </main>
      <SiteFooter />
    </div>
  ),
  component: CursoDetail,
});

function CursoDetail() {
  const curso = Route.useLoaderData();
  const { user, roles } = useAuth();
  const navigate = useNavigate();
  const isAdminOrSuper = hasAnyRole(roles, "admin", "super_admin");
  const [isModalityOpen, setIsModalityOpen] = useState(false);
  const [selectedModality, setSelectedModality] = useState("");
  const [isInternalOpen, setIsInternalOpen] = useState(false);
  const [tempModality, setTempModality] = useState("");
  const [selectedRegional, setSelectedRegional] = useState("");
  const [selectedCongregacao, setSelectedCongregacao] = useState("");

  const modulos = [...(curso.modulos ?? [])].sort((a, b) => a.ordem - b.ordem);

  async function salvarMatriculaFinal(escolhida: string, reg: string | null, cong: string | null) {
    const { data: existente } = await supabase
      .from("matriculas")
      .select("id, status")
      .eq("aluno_id", user!.id)
      .eq("curso_id", curso.id)
      .maybeSingle();

    if (existente && (existente.status === "ativa" || existente.status === "concluida")) {
      toast.success("Você já tem acesso a este curso.");
      navigate({ to: "/aluno/curso/$id", params: { id: curso.id } });
      return;
    }

    const novoStatus = isAdminOrSuper ? "ativa" : (Number(curso.preco) > 0 ? "pendente" : "ativa");

    if (!existente) {
      const { error } = await supabase
        .from("matriculas")
        .insert({
          aluno_id: user!.id,
          curso_id: curso.id,
          status: novoStatus,
          modalidade_escolhida: escolhida,
          regional: reg || null,
          congregacao: cong || null,
        });
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase
        .from("matriculas")
        .update({
          status: isAdminOrSuper ? "ativa" : existente.status,
          modalidade_escolhida: escolhida,
          regional: reg || null,
          congregacao: cong || null,
        })
        .eq("id", existente.id);
      if (error) return toast.error(error.message);
    }

    if (!isAdminOrSuper && Number(curso.preco) > 0) {
      navigate({ to: "/checkout/$slug", params: { slug: curso.slug } });
    } else {
      toast.success(isAdminOrSuper ? "Matrícula liberada com isenção administrativa!" : "Matrícula realizada!");
      navigate({ to: "/aluno/curso/$id", params: { id: curso.id } });
    }
  }

  async function confirmarMatricula(escolhida: string) {
    setIsModalityOpen(false);
    setTempModality(escolhida);
    
    if (curso.tipo === "interno") {
      setIsInternalOpen(true);
    } else {
      await salvarMatriculaFinal(escolhida, null, null);
    }
  }

  async function matricular() {
    if (!user) {
      toast.info("Entre para se matricular.");
      navigate({ to: "/auth", search: { redirect: `/cursos/${curso.slug}` } });
      return;
    }

    const opts = curso.modalidades_disponiveis || [curso.modalidade || "online"];
    if (opts.length > 1) {
      setSelectedModality(opts[0]);
      setIsModalityOpen(true);
    } else {
      await confirmarMatricula(opts[0] || "online");
    }
  }

  async function handleConfirmarMembro() {
    if (!selectedRegional) {
      toast.error("Por favor, selecione sua Regional.");
      return;
    }
    if (!selectedCongregacao) {
      toast.error("Por favor, selecione sua Congregação.");
      return;
    }
    setIsInternalOpen(false);
    await salvarMatriculaFinal(tempModality || selectedModality || "online", selectedRegional, selectedCongregacao);
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#f3f0e9] text-[#1c1917]">
      <SiteHeader />
      <main className="flex-1 pb-16">
        {curso.imagem_capa && (
          <div className="w-full bg-[#161922] border-b border-[#232734]">
            <div className="mx-auto max-w-6xl px-4 py-6">
              <div className="aspect-[1584/396] w-full overflow-hidden rounded-2xl bg-black/40 shadow-xl border border-white/10">
                <img
                  src={curso.imagem_capa}
                  alt={curso.titulo}
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          </div>
        )}
        <section className="bg-[#161922] text-white border-b border-[#232734]">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:py-16 md:grid-cols-3">
            <div className="md:col-span-2">
              <div className="flex flex-wrap gap-2">
                {curso.categorias?.nome && (
                  <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">
                    {curso.categorias.nome}
                  </span>
                )}
                <span className="rounded-full bg-[#ff3403] text-white px-3 py-1 text-xs font-black uppercase tracking-wider">
                  {curso.modalidade}
                </span>
                {curso.publico_alvo && curso.publico_alvo !== "ambos" && (
                  <span className="rounded-full bg-white/15 text-white px-3 py-1 text-xs font-semibold capitalize">
                    Público: {curso.publico_alvo}
                  </span>
                )}
              </div>
              <h1 className="mt-4 font-serif text-3xl md:text-5xl font-black text-white leading-tight">
                {curso.titulo}
              </h1>
              <p className="mt-4 text-base md:text-lg text-[#f3f0e9]/80 font-light leading-relaxed">
                {curso.descricao_curta}
              </p>

              <div className="mt-6 flex flex-wrap gap-6 text-sm text-[#f3f0e9]/75 font-medium">
                {curso.carga_horaria && (
                  <span className="flex items-center gap-2"><Clock className="h-4 w-4 text-[#ff3403]" /> {curso.carga_horaria}h</span>
                )}
                {curso.quantidade_modulos && (
                  <span className="flex items-center gap-2"><BookOpen className="h-4 w-4 text-[#ff3403]" /> {curso.quantidade_modulos} {curso.quantidade_modulos === 1 ? "módulo" : "módulos"}</span>
                )}
                {curso.ministrante && (
                  <span className="flex items-center gap-2"><User className="h-4 w-4 text-[#ff3403]" /> {curso.ministrante.nome_completo}</span>
                )}
              </div>
            </div>
            <aside className="rounded-3xl bg-white p-7 text-[#1c1917] shadow-xl border border-[#e2ddd3] flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#66594e] block">
                  Valor da Formação
                </span>
                <div className="font-serif text-3xl font-black text-[#ff3403] mt-1">
                  {isAdminOrSuper ? (
                    <>
                      <span>Isento</span>
                      <span className="text-xs font-sans font-normal text-[#66594e] block mt-1">Acesso administrativo total</span>
                    </>
                  ) : Number(curso.preco) > 0 ? (
                    <>
                      R$ {Number(curso.preco).toFixed(2).replace(".", ",")}
                      {curso.cobranca_por === "modulo" && (
                        <span className="text-xs font-sans font-normal text-[#66594e] block mt-1">por módulo</span>
                      )}
                    </>
                  ) : (
                    "Gratuito"
                  )}
                </div>
                <p className="mt-3 text-xs text-[#66594e] leading-relaxed">
                  {isAdminOrSuper
                    ? "Como administrador, seu acesso a todas as aulas, módulos e materiais é 100% liberado e isento de taxas."
                    : "Acesso ao ambiente de aulas, material didático em PDF e certificação oficial."}
                </p>
              </div>
              <div className="mt-6">
                <Button onClick={matricular} className="w-full rounded-full bg-[#ff3403] text-white hover:bg-[#e02e00] font-bold text-xs uppercase tracking-wider py-3.5 shadow-md" size="lg">
                  {isAdminOrSuper ? "Acessar Curso (Isento)" : "Matricule-se Agora"}
                </Button>
                <p className="mt-3 text-center text-[11px] text-[#66594e]">
                  {isAdminOrSuper ? "Liberação imediata no ambiente do aluno." : "Pagamento online ou presencial na secretaria."}
                </p>
              </div>
            </aside>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-14">
          <div className="grid gap-12 md:grid-cols-3">
            <div className="md:col-span-2 space-y-10">
              {curso.descricao && (
                <div className="rounded-3xl bg-white p-8 border border-[#e2ddd3] shadow-xs">
                  <h2 className="font-serif text-2xl font-black text-[#1c1917] border-b border-[#e2ddd3] pb-3">Sobre o curso</h2>
                  <p className="mt-4 whitespace-pre-line text-[#66594e] leading-relaxed">{curso.descricao}</p>
                </div>
              )}
              {curso.ementa && (
                <div className="rounded-3xl bg-white p-8 border border-[#e2ddd3] shadow-xs">
                  <h2 className="font-serif text-2xl font-black text-[#1c1917] border-b border-[#e2ddd3] pb-3">Ementa</h2>
                  <p className="mt-4 whitespace-pre-line text-[#66594e] leading-relaxed">{curso.ementa}</p>
                </div>
              )}
              {modulos.length > 0 && (
                <div className="rounded-3xl bg-white p-8 border border-[#e2ddd3] shadow-xs">
                  <h2 className="font-serif text-2xl font-black text-[#1c1917] border-b border-[#e2ddd3] pb-3">Grade de Módulos</h2>
                  <ol className="mt-6 space-y-4">
                    {modulos.map((m, idx) => (
                      <li key={m.id} className="rounded-2xl border border-[#e2ddd3] bg-[#f3f0e9]/40 p-5 hover:border-[#ff3403]/40 transition-colors">
                        <div className="text-[11px] font-black uppercase tracking-wider text-[#ff3403]">Módulo {idx + 1}</div>
                        <div className="font-serif text-lg font-black text-[#1c1917] mt-1">{m.titulo}</div>
                        {m.descricao && <p className="mt-2 text-xs text-[#66594e] leading-relaxed">{m.descricao}</p>}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
      {/* Dialog para Escolha de Modalidade */}
      <Dialog open={isModalityOpen} onOpenChange={setIsModalityOpen}>
        <DialogContent className="max-w-sm bg-white rounded-3xl border-[#e2ddd3] p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle>Escolha a Modalidade</DialogTitle>
            <DialogDescription>
              Selecione a modalidade na qual deseja realizar o curso:
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-3">
            {(curso.modalidades_disponiveis || [curso.modalidade || "online"]).map((m: string) => (
              <label
                key={m}
                className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:border-gold/50 transition-all ${
                  selectedModality === m
                    ? "border-gold bg-gold/5 text-gold-foreground font-bold"
                    : "border-slate-800 text-slate-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="modality"
                    value={m}
                    checked={selectedModality === m}
                    onChange={() => setSelectedModality(m)}
                    className="h-4 w-4 text-gold border-slate-700 focus:ring-gold"
                  />
                  <span className="capitalize">{m === "online" ? "Online (AVA)" : m === "hibrido" ? "Semi-presencial" : m}</span>
                </div>
              </label>
            ))}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" className="w-full" onClick={() => setIsModalityOpen(false)}>
              Cancelar
            </Button>
            <Button
              className="w-full bg-gold text-gold-foreground hover:bg-gold/90"
              onClick={() => confirmarMatricula(selectedModality)}
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para Informações de Membro (Curso Interno) */}
      <Dialog open={isInternalOpen} onOpenChange={setIsInternalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Informações de Membro</DialogTitle>
            <DialogDescription>
              Este é um curso **interno**. Para concluir sua matrícula, por favor selecione sua Regional e Congregação:
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold">Sua Regional *</label>
              <Select
                value={selectedRegional}
                onValueChange={(val) => {
                  setSelectedRegional(val);
                  setSelectedCongregacao("");
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione sua Regional" />
                </SelectTrigger>
                <SelectContent>
                  {REGIOES_CONGREGACOES.map((reg) => (
                    <SelectItem key={reg.name} value={reg.name}>
                      {reg.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Sua Congregação *</label>
              <Select
                value={selectedCongregacao}
                onValueChange={(val) => setSelectedCongregacao(val)}
                disabled={!selectedRegional}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={selectedRegional ? "Selecione sua Congregação" : "Selecione uma Regional primeiro"} />
                </SelectTrigger>
                <SelectContent>
                  {(() => {
                    const regData = REGIOES_CONGREGACOES.find(r => r.name === selectedRegional);
                    return regData ? regData.congregacoes.map((cong) => (
                      <SelectItem key={cong} value={cong}>
                        {cong}
                      </SelectItem>
                    )) : [];
                  })()}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" className="w-full" onClick={() => setIsInternalOpen(false)}>
              Cancelar
            </Button>
            <Button
              className="w-full bg-gold text-gold-foreground hover:bg-gold/90"
              onClick={handleConfirmarMembro}
              disabled={!selectedRegional || !selectedCongregacao}
            >
              Confirmar Matrícula
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SiteFooter />
    </div>
  );
}
