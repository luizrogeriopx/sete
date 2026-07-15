import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader, SiteFooter } from "@/components/site/site-chrome";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { GraduationCap, BookOpen, Users, Award } from "lucide-react";

const destaquesQO = queryOptions({
  queryKey: ["cursos-destaque"],
  queryFn: async () => {
    try {
      const { data, error } = await supabase
        .from("cursos")
        .select("id, titulo, slug, descricao_curta, imagem_capa, imagem_card, preco, modalidade, categorias(nome)")
        .eq("ativo", true)
        .eq("destaque", true)
        .limit(6);
      
      if (error) {
        if (error.code === "42703") { // Column does not exist
          const { data: fallbackData, error: fallbackError } = await supabase
            .from("cursos")
            .select("id, titulo, slug, descricao_curta, imagem_capa, preco, modalidade, categorias(nome)")
            .eq("ativo", true)
            .eq("destaque", true)
            .limit(6);
          if (fallbackError) throw fallbackError;
          return fallbackData.map(c => ({ ...c, imagem_card: null }));
        }
        throw error;
      }
      return data;
    } catch (e) {
      console.warn("Falling back to query without imagem_card:", e);
      const { data: fallbackData, error: fallbackError } = await supabase
        .from("cursos")
        .select("id, titulo, slug, descricao_curta, imagem_capa, preco, modalidade, categorias(nome)")
        .eq("ativo", true)
        .eq("destaque", true)
        .limit(6);
      if (fallbackError) throw fallbackError;
      return fallbackData.map(c => ({ ...c, imagem_card: null }));
    }
  },
});

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SETE — Seminário Teológico Esperança" },
      {
        name: "description",
        content:
          "Formação teológica sólida, com cursos online e presenciais. Matricule-se no SETE — Seminário Teológico Esperança.",
      },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(destaquesQO),
  component: Home,
});

function Home() {
  const { data: destaques } = useSuspenseQuery(destaquesQO);
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        {/* HERO */}
        <section className="relative overflow-hidden bg-primary text-primary-foreground">
          <div className="pointer-events-none absolute inset-0 opacity-10 [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:20px_20px]" />
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 md:grid-cols-2 md:py-28">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.25em] text-gold">
                Desde a Palavra, para a Igreja
              </p>
              <h1 className="mt-4 font-serif text-4xl leading-tight md:text-6xl">
                Formação teológica sólida, com o coração pastoral.
              </h1>
              <p className="mt-6 max-w-lg text-lg text-primary-foreground/80">
                No SETE — Seminário Teológico Esperança — preparamos servos e servas do Senhor
                com rigor bíblico, profundidade doutrinária e compromisso missionário.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg" className="bg-gold text-gold-foreground hover:bg-gold/90">
                  <Link to="/cursos">Ver cursos</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10">
                  <Link to="/sobre">Conheça o SETE</Link>
                </Button>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="relative h-full min-h-[320px] rounded-2xl border border-primary-foreground/10 bg-primary-foreground/5 p-8">
                <blockquote className="font-serif text-2xl leading-relaxed text-primary-foreground/90">
                  "Toda a Escritura é divinamente inspirada e proveitosa para ensinar,
                  para redarguir, para corrigir, para instruir em justiça."
                </blockquote>
                <cite className="mt-6 block text-sm uppercase tracking-widest text-gold">
                  2 Timóteo 3:16
                </cite>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section className="mx-auto max-w-6xl px-4 py-16">
          <div className="grid gap-6 md:grid-cols-4">
            {[
              { icon: BookOpen, t: "Currículo Bíblico", d: "Fundamentado nas Escrituras e nas confissões históricas." },
              { icon: GraduationCap, t: "Online & Presencial", d: "Estude no seu ritmo ou junte-se às turmas presenciais." },
              { icon: Users, t: "Corpo Docente", d: "Ministrantes com formação e prática pastoral." },
              { icon: Award, t: "Certificação", d: "Certificados digitais com validação pública." },
            ].map((f) => (
              <div key={f.t} className="rounded-xl border border-border bg-card p-6">
                <f.icon className="h-6 w-6 text-gold" />
                <h3 className="mt-3 font-serif text-xl">{f.t}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{f.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CURSOS DESTAQUE */}
        <section className="bg-secondary/40 py-16">
          <div className="mx-auto max-w-6xl px-4">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.25em] text-gold">Em destaque</p>
                <h2 className="mt-2 font-serif text-4xl">Cursos em destaque</h2>
              </div>
              <Button asChild variant="ghost">
                <Link to="/cursos">Ver todos →</Link>
              </Button>
            </div>

            {destaques.length === 0 ? (
              <p className="mt-8 text-muted-foreground">
                Em breve novos cursos serão publicados.{" "}
                <Link to="/cursos" className="text-primary underline">
                  Ver catálogo
                </Link>
                .
              </p>
            ) : (
              <div className="mt-8 grid gap-6 md:grid-cols-3">
                {destaques.map((c) => (
                  <Link
                    key={c.id}
                    to="/cursos/$slug"
                    params={{ slug: c.slug }}
                    className="group"
                  >
                    <Card className="h-full overflow-hidden transition-all duration-300 hover:shadow-lg flex flex-col">
                      <div className="aspect-[4/5] w-full overflow-hidden bg-slate-950 border-b border-border/10">
                        {c.imagem_card ? (
                          <img
                            src={c.imagem_card}
                            alt={c.titulo}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="h-full w-full bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center p-4">
                            <BookOpen className="h-10 w-10 text-gold/80" />
                          </div>
                        )}
                      </div>
                      <CardContent className="p-5 flex-1 flex flex-col justify-between">
                        <div>
                          <p className="text-xs uppercase tracking-widest text-muted-foreground capitalize">
                            {c.categorias?.nome ?? "Curso"} · {c.modalidade === "hibrido" ? "Semi-presencial" : c.modalidade}
                          </p>
                          <h3 className="mt-2 font-serif text-xl group-hover:text-primary leading-tight">
                            {c.titulo}
                          </h3>
                          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground leading-snug">
                            {c.descricao_curta}
                          </p>
                        </div>
                        <div className="mt-4 pt-3 border-t border-border/40 font-serif text-lg text-primary flex items-center justify-between">
                          <span>
                            {c.preco > 0
                              ? `R$ ${Number(c.preco).toFixed(2).replace(".", ",")}`
                              : "Gratuito"}
                          </span>
                          <span className="text-xs font-sans text-muted-foreground group-hover:text-primary font-medium transition-colors">
                            Conhecer Curso →
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-6xl px-4 py-20 text-center">
          <h2 className="font-serif text-4xl md:text-5xl">Comece hoje sua jornada teológica.</h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Matricule-se em nossos cursos e receba formação de qualidade, à distância ou presencial.
          </p>
          <Button asChild size="lg" className="mt-8 bg-primary">
            <Link to="/cursos">Explorar cursos</Link>
          </Button>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
