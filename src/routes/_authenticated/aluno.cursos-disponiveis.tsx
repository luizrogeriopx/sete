import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/aluno/cursos-disponiveis")({
  component: Page,
});

function Page() {
  const { user } = useAuth();
  const { data } = useQuery({
    queryKey: ["disponiveis", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [{ data: cursos }, { data: minhas }] = await Promise.all([
        supabase.from("cursos").select("id, titulo, slug, descricao_curta, preco, cobranca_por, modalidade, modalidades_disponiveis, imagem_card, categorias(nome)").eq("ativo", true),
        supabase.from("matriculas").select("curso_id").eq("aluno_id", user!.id),
      ]);
      const jaMatriculadoSet = new Set((minhas ?? []).map((m) => m.curso_id));
      const mapped = (cursos ?? []).map((c) => ({
        ...c,
        jaMatriculado: jaMatriculadoSet.has(c.id)
      }));
      mapped.sort((a, b) => (a.jaMatriculado ? 1 : 0) - (b.jaMatriculado ? 1 : 0));
      return mapped;
    },
  });

  return (
    <div>
      <h1 className="font-serif text-4xl">Cursos disponíveis</h1>
      <p className="mt-1 text-muted-foreground">Amplie sua formação — matricule-se em novos cursos.</p>

      <div className="mt-8 grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {(data ?? []).map((c) => {
          const CardElement = (
            <Card className={`h-full transition flex flex-col justify-between overflow-hidden ${
              c.jaMatriculado 
                ? "grayscale opacity-50 border-slate-800 pointer-events-none select-none bg-slate-900/50" 
                : "hover:shadow-md cursor-pointer"
            }`}>
              <div>
                <div className="aspect-[4/5] relative bg-slate-950 overflow-hidden">
                  {c.imagem_card ? (
                    <img
                      src={c.imagem_card}
                      alt={c.titulo}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center p-4 text-center">
                      <span className="font-serif text-xs font-bold text-white leading-tight line-clamp-3">
                        {c.titulo}
                      </span>
                    </div>
                  )}
                  {c.jaMatriculado && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <Badge className="bg-slate-700 text-slate-100 font-bold uppercase tracking-wider text-[9px] px-2 py-0.5 border-none">
                        Matriculado
                      </Badge>
                    </div>
                  )}
                </div>
                <CardContent className="p-3">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Badge variant="outline" className="text-[9px] py-0 px-1">{c.categorias?.nome}</Badge>
                    <Badge className="capitalize text-[9px] py-0 px-1">
                      {c.modalidades_disponiveis && c.modalidades_disponiveis.length > 0
                        ? c.modalidades_disponiveis.map((m: string) => m === "online" ? "Online (AVA)" : m === "hibrido" ? "Semi-presencial" : m).join(" / ")
                        : (c.modalidade === "hibrido" ? "Semi-presencial" : c.modalidade)}
                    </Badge>
                  </div>
                  <h3 className="mt-1.5 font-serif text-sm font-bold line-clamp-1 text-slate-100">{c.titulo}</h3>
                  <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground leading-normal">{c.descricao_curta}</p>
                </CardContent>
              </div>
              <CardContent className="p-3 pt-0">
                <div className="font-serif text-xs text-primary font-bold">
                  {c.jaMatriculado ? (
                    "Acesso Liberado"
                  ) : Number(c.preco) > 0 ? (
                    <>
                      R$ {Number(c.preco).toFixed(2).replace(".", ",")}
                      {c.cobranca_por === "modulo" && " /mód."}
                    </>
                  ) : (
                    "Gratuito"
                  )}
                </div>
              </CardContent>
            </Card>
          );

          if (c.jaMatriculado) {
            return <div key={c.id} className="h-full">{CardElement}</div>;
          }

          return (
            <Link key={c.id} to="/cursos/$slug" params={{ slug: c.slug }} className="h-full">
              {CardElement}
            </Link>
          );
        })}
      </div>
      {data && data.length > 0 && data.every((c) => c.jaMatriculado) && (
        <p className="mt-6 text-muted-foreground text-sm text-center">Você já está matriculado em todos os nossos cursos!</p>
      )}
    </div>
  );
}
