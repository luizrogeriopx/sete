import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader, SiteFooter } from "@/components/site/site-chrome";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, User } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

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

  const modulos = [...(curso.modulos ?? [])].sort((a, b) => a.ordem - b.ordem);

  async function matricular() {
    if (!user) {
      toast.info("Entre para se matricular.");
      navigate({ to: "/auth", search: { redirect: `/cursos/${curso.slug}` } });
      return;
    }
    // Cria matrícula pendente e redireciona para checkout
    const { data: existente } = await supabase
      .from("matriculas")
      .select("id, status")
      .eq("aluno_id", user.id)
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
        .insert({ aluno_id: user.id, curso_id: curso.id, status: "pendente" });
      if (error) return toast.error(error.message);
    }
    if (Number(curso.preco) > 0) {
      navigate({ to: "/checkout/$slug", params: { slug: curso.slug } });
    } else {
      toast.success("Matrícula realizada!");
      navigate({ to: "/aluno" });
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="bg-primary text-primary-foreground">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-16 md:grid-cols-3">
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
                {curso.ministrante && (
                  <span className="flex items-center gap-2"><User className="h-4 w-4" /> {curso.ministrante.nome_completo}</span>
                )}
              </div>
            </div>
            <aside className="rounded-2xl bg-card p-6 text-card-foreground shadow-xl">
              <div className="font-serif text-3xl text-primary">
                {Number(curso.preco) > 0
                  ? `R$ ${Number(curso.preco).toFixed(2).replace(".", ",")}`
                  : "Gratuito"}
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
      <SiteFooter />
    </div>
  );
}
