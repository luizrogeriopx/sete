import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader, SiteFooter } from "@/components/site/site-chrome";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, Play, Info, BookOpen } from "lucide-react";
import { z } from "zod";
import { cn } from "@/lib/utils";

const catalogoQO = queryOptions({
  queryKey: ["catalogo-cursos"],
  queryFn: async () => {
    try {
      const [{ data: cats }, { data: cursos, error: cursosError }] = await Promise.all([
        supabase.from("categorias").select("id, nome, slug, ordem").eq("ativa", true).order("ordem", { ascending: true }),
        supabase
          .from("cursos")
          .select("id, titulo, slug, descricao_curta, preco, cobranca_por, publico_alvo, modalidade, categoria_id, imagem_card, imagem_capa, destaque, quantidade_modulos, ordem, categorias(nome)")
          .eq("ativo", true)
          .order("ordem", { ascending: true })
          .order("titulo"),
      ]);

      if (cursosError) {
        if (cursosError.code === "42703") { // Column does not exist fallback
          const [{ data: fallbackCats }, { data: fallbackCursos, error: fallbackError }] = await Promise.all([
            supabase.from("categorias").select("id, nome, slug, ordem").eq("ativa", true).order("ordem", { ascending: true }),
            supabase
              .from("cursos")
              .select("id, titulo, slug, descricao_curta, preco, cobranca_por, publico_alvo, modalidade, categoria_id, imagem_capa, destaque, quantidade_modulos, categorias(nome)")
              .eq("ativo", true)
              .order("titulo"),
          ]);
          if (fallbackError) throw fallbackError;
          const mappedCursos = (fallbackCursos ?? []).map(c => ({ ...c, imagem_card: null, ordem: 0 }));
          return { categorias: fallbackCats ?? [], cursos: mappedCursos };
        }
        throw cursosError;
      }

      return { categorias: cats ?? [], cursos: cursos ?? [] };
    } catch (e) {
      console.warn("Falling back to catalog query without imagem_card/ordem:", e);
      const [{ data: fallbackCats }, { data: fallbackCursos, error: fallbackError }] = await Promise.all([
        supabase.from("categorias").select("id, nome, slug, ordem").eq("ativa", true).order("ordem", { ascending: true }),
        supabase
          .from("cursos")
          .select("id, titulo, slug, descricao_curta, preco, cobranca_por, publico_alvo, modalidade, categoria_id, imagem_capa, destaque, quantidade_modulos, categorias(nome)")
          .eq("ativo", true)
          .order("titulo"),
      ]);
      if (fallbackError) throw fallbackError;
      const mappedCursos = (fallbackCursos ?? []).map(c => ({ ...c, imagem_card: null, ordem: 0 }));
      return { categorias: fallbackCats ?? [], cursos: mappedCursos };
    }
  },
});

const searchSchema = z.object({
  categoria: z.string().optional(),
});

export const Route = createFileRoute("/cursos/")({
  validateSearch: searchSchema,
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
      <h2 className="font-serif text-2xl font-black mb-4 text-[#1c1917] tracking-tight">{categoria.nome}</h2>
      
      {/* Scroll Left Button */}
      <button
        onClick={() => scroll("left")}
        className="absolute left-0 top-[50%] -translate-y-1/2 z-20 bg-black/60 hover:bg-[#ff3403] text-white p-2 rounded-r-xl opacity-0 group-hover/row:opacity-100 transition-all hidden md:flex items-center justify-center h-[200px]"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>

      {/* Slider Container */}
      <div
        ref={rowRef}
        className="flex gap-5 sm:gap-6 overflow-x-auto pb-6 pt-3 no-scrollbar snap-x snap-mandatory scroll-smooth px-2"
      >
        {cursos.map((c) => (
          <CoursePosterCard
            key={c.id}
            curso={c}
            className="w-[170px] sm:w-[210px] md:w-[240px] flex-shrink-0 snap-start"
          />
        ))}
      </div>

      {/* Scroll Right Button */}
      <button
        onClick={() => scroll("right")}
        className="absolute right-0 top-[50%] -translate-y-1/2 z-20 bg-black/60 hover:bg-[#ff3403] text-white p-2 rounded-l-xl opacity-0 group-hover/row:opacity-100 transition-all hidden md:flex items-center justify-center h-[200px]"
      >
        <ChevronRight className="h-6 w-6" />
      </button>
    </div>
  );
}

function CoursePosterCard({ curso, className }: { curso: any; className?: string }) {
  return (
    <Link
      to="/cursos/$slug"
      params={{ slug: curso.slug }}
      className={cn(
        "group relative rounded-2xl overflow-hidden border border-[#e2ddd3] bg-white aspect-[4/5] transition-all duration-300 ease-out hover:scale-102 hover:shadow-xl hover:border-[#ff3403]",
        className
      )}
    >
      {curso.imagem_card ? (
        <img
          src={curso.imagem_card}
          alt={curso.titulo}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-[#161922] to-[#490905] flex flex-col justify-between p-5 transition-transform duration-500 group-hover:scale-105">
          <div className="h-10 w-10 rounded-full bg-[#ff3403] flex items-center justify-center text-white">
            <BookOpen className="h-5 w-5" />
          </div>
          <h4 className="font-serif text-lg text-white font-bold leading-tight line-clamp-3">
            {curso.titulo}
          </h4>
        </div>
      )}

      {/* Hover Overlay Details */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent flex flex-col justify-end p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="space-y-2">
          <div className="flex gap-1.5 flex-wrap">
            <span className="rounded-full bg-[#ff3403] text-white text-[10px] font-bold py-0.5 px-2 capitalize">
              {curso.modalidade === "hibrido" ? "Semi-presencial" : curso.modalidade}
            </span>
            <span className="rounded-full bg-white/20 backdrop-blur-xs text-white text-[10px] font-bold py-0.5 px-2">
              {curso.categorias?.nome}
            </span>
          </div>
          
          <h4 className="font-serif text-base text-white font-bold leading-tight">
            {curso.titulo}
          </h4>
          
          <p className="text-[11px] text-white/80 line-clamp-2 leading-snug font-light">
            {curso.descricao_curta}
          </p>

          <div className="flex items-center justify-between pt-2 border-t border-white/20">
            <span className="text-xs font-serif text-[#ff3403] font-bold">
              {curso.preco > 0 ? (
                <>
                  R$ {Number(curso.preco).toFixed(2).replace(".", ",")}
                  {curso.cobranca_por === "modulo" && " /mód."}
                </>
              ) : "Gratuito"}
            </span>
            {curso.quantidade_modulos ? (
              <span className="text-[10px] text-white/70 font-medium">
                {curso.quantidade_modulos} {curso.quantidade_modulos === 1 ? "módulo" : "módulos"}
              </span>
            ) : (
              <span className="text-[10px] text-white/70 font-medium">Ver detalhes</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

function CursosPage() {
  const { data } = useSuspenseQuery(catalogoQO);
  const search = Route.useSearch();
  const [ativa, setAtiva] = useState<string | null>(null);

  // Sync search param with local state
  useEffect(() => {
    if (search.categoria) {
      const cat = data.categorias.find((c: any) => c.slug === search.categoria);
      if (cat) {
        setAtiva(cat.id);
      }
    } else {
      setAtiva(null);
    }
  }, [search.categoria, data.categorias]);

  // Filter logic
  const filteredCursos = ativa
    ? data.cursos.filter((c) => c.categoria_id === ativa)
    : data.cursos;

  // Hero Featured Course (find featured or default to first course with a cover image)
  const featured = data.cursos.find((c) => c.destaque && c.imagem_capa) || 
                   data.cursos.find((c) => c.imagem_capa) || 
                   data.cursos[0];

  return (
    <div className="flex min-h-screen flex-col bg-[#f3f0e9] text-[#1c1917]">
      <SiteHeader />
      <main className="flex-1 pb-16">
        
        {/* Billboard Hero Section */}
        {featured && !ativa && (
          <div className="relative w-full h-[50vh] min-h-[320px] max-h-[500px] overflow-hidden bg-[#161922]">
            {featured.imagem_capa ? (
              <img
                src={featured.imagem_capa}
                alt={featured.titulo}
                className="w-full h-full object-cover opacity-50"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-[#490905] to-[#161922] opacity-70" />
            )}
            
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#161922] via-[#161922]/50 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#161922]/95 via-transparent to-transparent" />

            {/* Billboard Text Content */}
            <div className="absolute bottom-0 left-0 right-0 max-w-6xl mx-auto px-4 pb-8 md:pb-12 flex flex-col justify-end h-full">
              <div className="max-w-xl space-y-3">
                <div className="flex gap-2 items-center">
                  <span className="rounded-full bg-[#ff3403] text-white font-black text-[10px] uppercase tracking-wider px-3 py-1">
                    DESTAQUE ACADÊMICO
                  </span>
                  <span className="text-xs text-[#f3f0e9]/80 font-bold tracking-wide uppercase">
                    {featured.categorias?.nome}
                  </span>
                </div>
                
                <h1 className="font-serif text-3xl md:text-5xl lg:text-6xl text-white leading-none font-black drop-shadow-md">
                  {featured.titulo}
                </h1>
                
                <p className="text-sm md:text-base text-[#f3f0e9]/85 line-clamp-3 font-light">
                  {featured.descricao_curta}
                </p>

                <div className="flex gap-3 pt-2">
                  <Button asChild className="rounded-full bg-[#ff3403] hover:bg-[#e02e00] text-white font-bold text-xs uppercase tracking-wider px-6 py-3 gap-2 shadow-lg">
                    <Link to="/cursos/$slug" params={{ slug: featured.slug }}>
                      <Play className="h-4 w-4 fill-current" /> Matricular-se
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="rounded-full border-white/30 hover:bg-white/10 text-white font-bold text-xs uppercase tracking-wider px-6 py-3 gap-2">
                    <Link to="/cursos/$slug" params={{ slug: featured.slug }}>
                      <Info className="h-4 w-4" /> Mais Informações
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mx-auto w-full max-w-6xl px-4 mt-10">
          
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-[#e2ddd3] pb-5">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-[#ff3403]">Catálogo Acadêmico</p>
              <h1 className="mt-1 font-serif text-3xl md:text-4xl text-[#1c1917] font-black">Nossos Cursos</h1>
            </div>

            {/* Premium Category Filter Buttons — Pílulas FTSA */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setAtiva(null)}
                className={`rounded-full border px-5 py-2 text-xs font-bold tracking-wider uppercase transition-all cursor-pointer ${
                  !ativa
                    ? "border-[#ff3403] bg-[#ff3403] text-white shadow-sm"
                    : "border-[#e2ddd3] bg-white text-[#1c1917] hover:border-[#ff3403]/60 hover:bg-[#f3f0e9]"
                }`}
              >
                Todos
              </button>
              {data.categorias.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setAtiva(c.id)}
                  className={`rounded-full border px-5 py-2 text-xs font-bold tracking-wider uppercase transition-all cursor-pointer ${
                    ativa === c.id
                      ? "border-[#ff3403] bg-[#ff3403] text-white shadow-sm"
                      : "border-[#e2ddd3] bg-white text-[#1c1917] hover:border-[#ff3403]/60 hover:bg-[#f3f0e9]"
                  }`}
                >
                  {c.nome}
                </button>
              ))}
            </div>
          </div>

          {filteredCursos.length === 0 ? (
            <p className="mt-12 text-center text-[#66594e] font-medium">Nenhum curso publicado nesta categoria.</p>
          ) : ativa ? (
            /* Vertical grid view when a single category is filtered */
            <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
              {filteredCursos.map((c) => (
                <CoursePosterCard key={c.id} curso={c} className="w-full" />
              ))}
            </div>
          ) : (
            /* Horizontal-scrolling category rows when viewing 'Todos' */
            <div className="mt-4 space-y-8">
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
