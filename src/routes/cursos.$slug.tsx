import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader, SiteFooter } from "@/components/site/site-chrome";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, User, BookOpen } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
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
  const { user } = useAuth();
  const navigate = useNavigate();
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

    if (existente && existente.status === "ativa") {
      toast.success("Você já está matriculado.");
      navigate({ to: "/aluno/curso/$id", params: { id: curso.id } });
      return;
    }

    if (!existente) {
      const { error } = await supabase
        .from("matriculas")
        .insert({
          aluno_id: user!.id,
          curso_id: curso.id,
          status: "pendente",
          modalidade_escolhida: escolhida,
          regional: reg || null,
          congregacao: cong || null,
        });
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase
        .from("matriculas")
        .update({
          modalidade_escolhida: escolhida,
          regional: reg || null,
          congregacao: cong || null,
        })
        .eq("id", existente.id);
      if (error) return toast.error(error.message);
    }

    if (Number(curso.preco) > 0) {
      navigate({ to: "/checkout/$slug", params: { slug: curso.slug } });
    } else {
      toast.success("Matrícula realizada!");
      navigate({ to: "/aluno" });
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
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 pb-12">
        {curso.imagem_capa && (
          <div className="w-full bg-slate-950 border-b border-slate-900">
            <div className="mx-auto max-w-6xl px-4 py-4">
              <div className="aspect-[1584/396] w-full overflow-hidden rounded-xl md:rounded-2xl bg-slate-900 shadow-lg border border-slate-800/60">
                <img
                  src={curso.imagem_capa}
                  alt={curso.titulo}
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          </div>
        )}
        <section className="bg-primary text-primary-foreground">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:py-16 md:grid-cols-3">
            <div className="md:col-span-2">
              <div className="flex flex-wrap gap-2">
                {curso.categorias?.nome && (
                  <Badge variant="outline" className="border-primary-foreground/30 text-primary-foreground">
                    {curso.categorias.nome}
                  </Badge>
                )}
                <Badge className="bg-gold text-gold-foreground">{curso.modalidade}</Badge>
              </div>
              <h1 className="mt-4 font-serif text-4xl md:text-5xl">{curso.titulo}</h1>
              <p className="mt-4 text-lg text-primary-foreground/80">{curso.descricao_curta}</p>

              <div className="mt-6 flex flex-wrap gap-6 text-sm text-primary-foreground/70">
                {curso.carga_horaria && (
                  <span className="flex items-center gap-2"><Clock className="h-4 w-4" /> {curso.carga_horaria}h</span>
                )}
                {curso.quantidade_modulos && (
                  <span className="flex items-center gap-2"><BookOpen className="h-4 w-4" /> {curso.quantidade_modulos} {curso.quantidade_modulos === 1 ? "módulo" : "módulos"}</span>
                )}
                {curso.ministrante && (
                  <span className="flex items-center gap-2"><User className="h-4 w-4" /> {curso.ministrante.nome_completo}</span>
                )}
              </div>
            </div>
            <aside className="rounded-2xl bg-card p-6 text-card-foreground shadow-xl">
              <div className="font-serif text-3xl text-primary">
                {Number(curso.preco) > 0 ? (
                  <>
                    R$ {Number(curso.preco).toFixed(2).replace(".", ",")}
                    {curso.cobranca_por === "modulo" && (
                      <span className="text-xs font-sans font-normal text-muted-foreground block mt-1">por módulo</span>
                    )}
                  </>
                ) : (
                  "Gratuito"
                )}
              </div>
              <Button onClick={matricular} className="mt-4 w-full bg-gold text-gold-foreground hover:bg-gold/90" size="lg">
                Matricule-se
              </Button>
              <p className="mt-3 text-xs text-muted-foreground">
                Pagamento online via Mercado Pago ou presencial na secretaria.
              </p>
            </aside>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-12">
          <div className="grid gap-12 md:grid-cols-3">
            <div className="md:col-span-2 space-y-8">
              {curso.descricao && (
                <div>
                  <h2 className="font-serif text-2xl">Sobre o curso</h2>
                  <p className="mt-3 whitespace-pre-line text-muted-foreground">{curso.descricao}</p>
                </div>
              )}
              {curso.ementa && (
                <div>
                  <h2 className="font-serif text-2xl">Ementa</h2>
                  <p className="mt-3 whitespace-pre-line text-muted-foreground">{curso.ementa}</p>
                </div>
              )}
              {modulos.length > 0 && (
                <div>
                  <h2 className="font-serif text-2xl">Módulos</h2>
                  <ol className="mt-4 space-y-3">
                    {modulos.map((m, idx) => (
                      <li key={m.id} className="rounded-lg border border-border bg-card p-4">
                        <div className="text-xs text-muted-foreground">Módulo {idx + 1}</div>
                        <div className="font-serif text-lg">{m.titulo}</div>
                        {m.descricao && <p className="mt-1 text-sm text-muted-foreground">{m.descricao}</p>}
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
        <DialogContent className="max-w-sm">
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
