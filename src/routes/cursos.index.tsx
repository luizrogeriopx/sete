import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader, SiteFooter } from "@/components/site/site-chrome";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState, useRef } from "react";
import { ChevronLeft, ChevronRight, Play, Info, BookOpen } from "lucide-react";

const catalogoQO = queryOptions({
  queryKey: ["catalogo-cursos"],
  queryFn: async () => {
    try {
      const [{ data: cats }, { data: cursos, error: cursosError }] = await Promise.all([
        supabase.from("categorias").select("id, nome, slug").eq("ativa", true).order("ordem"),
        supabase
          .from("cursos")
          .select("id, titulo, slug, descricao_curta, preco, modalidade, categoria_id, imagem_card, imagem_capa, destaque, categorias(nome)")
          .eq("ativo", true)
          .order("titulo"),
      ]);

      if (cursosError) {
        if (cursosError.code === "42703") { // Column does not exist
          const [{ data: fallbackCats }, { data: fallbackCursos, error: fallbackError }] = await Promise.all([
            supabase.from("categorias").select("id, nome, slug").eq("ativa", true).order("ordem"),
            supabase
              .from("cursos")
              .select("id, titulo, slug, descricao_curta, preco, modalidade, categoria_id, imagem_capa, destaque, categorias(nome)")
              .eq("ativo", true)
              .order("titulo"),
          ]);
          if (fallbackError) throw fallbackError;
          const mappedCursos = (fallbackCursos ?? []).map(c => ({ ...c, imagem_card: null }));
          return { categorias: fallbackCats ?? [], cursos: mappedCursos };
        }
        throw cursosError;
      }

      return { categorias: cats ?? [], cursos: cursos ?? [] };
    } catch (e) {
      console.warn("Falling back to catalog query without imagem_card:", e);
      const [{ data: fallbackCats }, { data: fallbackCursos, error: fallbackError }] = await Promise.all([
        supabase.from("categorias").select("id, nome, slug").eq("ativa", true).order("ordem"),
        supabase
          .from("cursos")
          .select("id, titulo, slug, descricao_curta, preco, modalidade, categoria_id, imagem_capa, destaque, categorias(nome)")
          .eq("ativo", true)
          .order("titulo"),
      ]);
      if (fallbackError) throw fallbackError;
      const mappedCursos = (fallbackCursos ?? []).map(c => ({ ...c, imagem_card: null }));
      return { categorias: fallbackCats ?? [], cursos: mappedCursos };
    }
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

function CategoryRow({
  categoria,
  cursos,
}: {
  categoria: { id: string; nome: string };
  cursos: any[];
}) {
  const rowRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (rowRef.current) {
      const { scrollLeft, clientWidth } = rowRef.current;
      const scrollTo = direction === "left" ? scrollLeft - clientWidth * 0.75 : scrollLeft + clientWidth * 0.75;
      rowRef.current.scrollTo({ left: scrollTo, behavior: "smooth" });
    }
  };

  return (
    <div className="relative group/row my-8">
      <h2 className="font-serif text-2xl font-semibold mb-4 text-white tracking-wide">{categoria.nome}</h2>
      
      {/* Scroll Left Button */}
      <button
        onClick={() => scroll("left")}
        className="absolute left-0 top-[50%] -translate-y-1/2 z-20 bg-black/60 hover:bg-black/80 text-white p-2 rounded-r-lg opacity-0 group-hover/row:opacity-100 transition-opacity hidden md:flex items-center justify-center h-[200px]"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>

      {/* Slider Container */}
      <div
        ref={rowRef}
        className="flex gap-4 overflow-x-auto pb-6 pt-2 no-scrollbar snap-x snap-mandatory scroll-smooth px-2"
      >
        {cursos.map((c) => (
          <CoursePosterCard key={c.id} curso={c} />
        ))}
      </div>

      {/* Scroll Right Button */}
      <button
        onClick={() => scroll("right")}
        className="absolute right-0 top-[50%] -translate-y-1/2 z-20 bg-black/60 hover:bg-black/80 text-white p-2 rounded-l-lg opacity-0 group-hover/row:opacity-100 transition-opacity hidden md:flex items-center justify-center h-[200px]"
      >
        <ChevronRight className="h-6 w-6" />
      </button>
    </div>
  );
}

function CoursePosterCard({ curso }: { curso: any }) {
  return (
    <Link
      to="/cursos/$slug"
      params={{ slug: curso.slug }}
      className="w-[170px] sm:w-[210px] md:w-[240px] flex-shrink-0 snap-start group relative rounded-lg overflow-hidden border border-slate-800 bg-slate-900 aspect-[4/5] transition-all duration-300 ease-out hover:scale-105 hover:shadow-2xl hover:border-gold/50"
    >
      {curso.imagem_card ? (
        <img
          src={curso.imagem_card}
          alt={curso.titulo}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-primary/95 to-slate-900 flex flex-col justify-between p-4 transition-transform duration-500 group-hover:scale-110">
          <BookOpen className="h-8 w-8 text-gold/80" />
          <h4 className="font-serif text-lg text-white font-bold leading-tight line-clamp-3">
            {curso.titulo}
          </h4>
        </div>
      )}

      {/* Hover Overlay Details */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/20 flex flex-col justify-end p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="space-y-2">
          <div className="flex gap-1.5 flex-wrap">
            <Badge variant="outline" className="border-gold/50 text-gold text-[10px] py-0 px-1.5 capitalize">
              {curso.modalidade === "hibrido" ? "Semi-presencial" : curso.modalidade}
            </Badge>
            <Badge variant="secondary" className="bg-slate-800 text-slate-200 text-[10px] py-0 px-1.5 border-none">
              {curso.categorias?.nome}
            </Badge>
          </div>
          
          <h4 className="font-serif text-base text-white font-bold leading-tight">
            {curso.titulo}
          </h4>
          
          <p className="text-[11px] text-slate-300 line-clamp-2 leading-snug">
            {curso.descricao_curta}
          </p>

          <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
            <span className="text-xs font-serif text-gold font-semibold">
              {curso.preco > 0 ? `R$ ${Number(curso.preco).toFixed(2).replace(".", ",")}` : "Gratuito"}
            </span>
            <span className="text-[10px] text-slate-400 font-medium">Ver detalhes</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function CursosPage() {
  const { data } = useSuspenseQuery(catalogoQO);
  const [ativa, setAtiva] = useState<string | null>(null);

  // Filter logic
  const filteredCursos = ativa
    ? data.cursos.filter((c) => c.categoria_id === ativa)
    : data.cursos;

  // Hero Featured Course (find featured or default to first course with a cover image)
  const featured = data.cursos.find((c) => c.destaque && c.imagem_capa) || 
                   data.cursos.find((c) => c.imagem_capa) || 
                   data.cursos[0];

  return (
    <div className="flex min-h-screen flex-col bg-[#080a10] text-slate-100">
      <SiteHeader />
      <main className="flex-1 pb-16">
        
        {/* Netflix Billboard Hero Section */}
        {featured && !ativa && (
          <div className="relative w-full h-[50vh] min-h-[300px] max-h-[500px] overflow-hidden bg-slate-950">
            {featured.imagem_capa ? (
              <img
                src={featured.imagem_capa}
                alt={featured.titulo}
                className="w-full h-full object-cover opacity-60"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-primary to-slate-900 opacity-60" />
            )}
            
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#080a10] via-[#080a10]/50 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#080a10]/90 via-transparent to-transparent" />

            {/* Billboard Text Content */}
            <div className="absolute bottom-0 left-0 right-0 max-w-6xl mx-auto px-4 pb-8 md:pb-12 flex flex-col justify-end h-full">
              <div className="max-w-xl space-y-3">
                <div className="flex gap-2 items-center">
                  <Badge className="bg-gold text-slate-950 font-bold hover:bg-gold px-2.5 py-0.5">
                    DESTAQUE
                  </Badge>
                  <span className="text-xs text-slate-300 font-medium tracking-wide uppercase">
                    {featured.categorias?.nome}
                  </span>
                </div>
                
                <h1 className="font-serif text-3xl md:text-5xl lg:text-6xl text-white leading-none font-bold drop-shadow-md">
                  {featured.titulo}
                </h1>
                
                <p className="text-sm md:text-base text-slate-200 line-clamp-3 drop-shadow">
                  {featured.descricao_curta}
                </p>

                <div className="flex gap-3 pt-2">
                  <Button asChild className="bg-gold hover:bg-gold/90 text-slate-950 font-bold gap-2 shadow-lg">
                    <Link to="/cursos/$slug" params={{ slug: featured.slug }}>
                      <Play className="h-4 w-4 fill-current" /> Matricular-se
                    </Link>
                  </Button>
                  <Button asChild variant="secondary" className="bg-slate-800/80 hover:bg-slate-800 text-white border-none gap-2">
                    <Link to="/cursos/$slug" params={{ slug: featured.slug }}>
                      <Info className="h-4 w-4" /> Mais Informações
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mx-auto w-full max-w-6xl px-4 mt-8">
          
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-slate-900 pb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">Catálogo Acadêmico</p>
              <h1 className="mt-1 font-serif text-3xl md:text-4xl text-white">Nossos Cursos</h1>
            </div>

            {/* Premium Category Filter Buttons */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setAtiva(null)}
                className={`rounded-full border px-4 py-1 text-xs font-medium tracking-wide transition-all ${
                  !ativa
                    ? "border-gold bg-gold text-slate-950 font-bold shadow-md shadow-gold/20"
                    : "border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900/50"
                }`}
              >
                Todos
              </button>
              {data.categorias.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setAtiva(c.id)}
                  className={`rounded-full border px-4 py-1 text-xs font-medium tracking-wide transition-all ${
                    ativa === c.id
                      ? "border-gold bg-gold text-slate-950 font-bold shadow-md shadow-gold/20"
                      : "border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900/50"
                  }`}
                >
                  {c.nome}
                </button>
              ))}
            </div>
          </div>

          {filteredCursos.length === 0 ? (
            <p className="mt-12 text-center text-slate-500 font-medium">Nenhum curso publicado nesta categoria.</p>
          ) : ativa ? (
            /* Vertical grid view when a single category is filtered */
            <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {filteredCursos.map((c) => (
                <div key={c.id} className="flex justify-center">
                  <CoursePosterCard curso={c} />
                </div>
              ))}
            </div>
          ) : (
            /* Netflix horizontal-scrolling category rows when viewing 'Todos' */
            <div className="mt-4 space-y-6">
              {data.categorias.map((cat) => {
                const catCursos = data.cursos.filter((c) => c.categoria_id === cat.id);
                if (catCursos.length === 0) return null;
                return (
                  <CategoryRow
                    key={cat.id}
                    categoria={cat}
                    cursos={catCursos}
                  />
                );
              })}
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
