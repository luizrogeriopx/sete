import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader, SiteFooter } from "@/components/site/site-chrome";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

const catalogoQO = queryOptions({
  queryKey: ["catalogo-cursos"],
  queryFn: async () => {
    const [{ data: cats }, { data: cursos }] = await Promise.all([
      supabase.from("categorias").select("id, nome, slug").eq("ativa", true).order("ordem"),
      supabase
        .from("cursos")
        .select("id, titulo, slug, descricao_curta, preco, modalidade, categoria_id, categorias(nome)")
        .eq("ativo", true)
        .order("titulo"),
    ]);
    return { categorias: cats ?? [], cursos: cursos ?? [] };
  },
});

export const Route = createFileRoute("/cursos/")({
  head: () => ({
    meta: [
      { title: "Cursos — SETE" },
      {
        name: "description",
        content: "Catálogo completo de cursos do Seminário Teológico Esperança por categoria.",
      },
      { property: "og:title", content: "Cursos — SETE" },
      { property: "og:description", content: "Cursos por categoria — teologia, bíblia, missões, liderança." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(catalogoQO),
  component: CursosPage,
});

function CursosPage() {
  const { data } = useSuspenseQuery(catalogoQO);
  const [ativa, setAtiva] = useState<string | null>(null);
  const cursos = ativa ? data.cursos.filter((c) => c.categoria_id === ativa) : data.cursos;

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-12">
        <p className="text-xs font-medium uppercase tracking-[0.25em] text-gold">Catálogo</p>
        <h1 className="mt-2 font-serif text-5xl">Nossos cursos</h1>

        <div className="mt-6 flex flex-wrap gap-2">
          <button
            onClick={() => setAtiva(null)}
            className={`rounded-full border px-4 py-1.5 text-sm ${!ativa ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-secondary"}`}
          >
            Todos
          </button>
          {data.categorias.map((c) => (
            <button
              key={c.id}
              onClick={() => setAtiva(c.id)}
              className={`rounded-full border px-4 py-1.5 text-sm ${ativa === c.id ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-secondary"}`}
            >
              {c.nome}
            </button>
          ))}
        </div>

        {cursos.length === 0 ? (
          <p className="mt-12 text-muted-foreground">Nenhum curso publicado nesta categoria.</p>
        ) : (
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {cursos.map((c) => (
              <Link key={c.id} to="/cursos/$slug" params={{ slug: c.slug }} className="group">
                <Card className="h-full overflow-hidden transition-shadow hover:shadow-lg">
                  <div className="aspect-[16/10] w-full bg-gradient-to-br from-primary/80 to-primary" />
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{c.categorias?.nome}</Badge>
                      <Badge>{c.modalidade}</Badge>
                    </div>
                    <h3 className="mt-3 font-serif text-xl group-hover:text-primary">{c.titulo}</h3>
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{c.descricao_curta}</p>
                    <div className="mt-4 font-serif text-lg text-primary">
                      {c.preco > 0 ? `R$ ${Number(c.preco).toFixed(2).replace(".", ",")}` : "Gratuito"}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
