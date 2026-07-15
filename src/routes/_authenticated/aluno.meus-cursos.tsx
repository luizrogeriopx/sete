import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/_authenticated/aluno/meus-cursos")({
  component: MeusCursos,
});

function MeusCursos() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["meus-cursos", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("matriculas")
        .select("id, status, progresso, modalidade_escolhida, cursos(id, titulo, slug, imagem_card, imagem_capa, modalidade)")
        .eq("aluno_id", user!.id)
        .order("data_matricula", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div>
      <h1 className="font-serif text-4xl">Meus cursos</h1>
      <p className="mt-1 text-muted-foreground">Continue de onde parou.</p>

      {isLoading ? (
        <p className="mt-8 text-muted-foreground">Carregando…</p>
      ) : (data ?? []).length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground">Você ainda não tem matrículas.</p>
          <Link to="/aluno/cursos-disponiveis" className="mt-3 inline-block text-primary underline">
            Ver cursos disponíveis
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data!.map((m) => (
            <Link key={m.id} to="/aluno/curso/$id" params={{ id: m.cursos?.id ?? "" }}>
              <Card className="h-full transition hover:shadow-md overflow-hidden">
                <div className="aspect-[4/5] relative bg-slate-950 overflow-hidden">
                  {m.cursos?.imagem_card ? (
                    <img
                      src={m.cursos.imagem_card}
                      alt={m.cursos.titulo}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center p-4 text-center">
                      <span className="font-serif text-sm font-bold text-white leading-tight line-clamp-3">
                        {m.cursos?.titulo}
                      </span>
                    </div>
                  )}
                </div>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">
                      {m.modalidade_escolhida === "online" ? "Online (AVA)" : m.modalidade_escolhida === "hibrido" ? "Semi-presencial" : m.modalidade_escolhida || (m.cursos?.modalidade === "hibrido" ? "Semi-presencial" : m.cursos?.modalidade)}
                    </Badge>
                    <Badge>{m.status}</Badge>
                  </div>
                  <h3 className="mt-2 font-serif text-lg">{m.cursos?.titulo}</h3>
                  <div className="mt-3">
                    <Progress value={Number(m.progresso ?? 0)} />
                    <div className="mt-1 text-xs text-muted-foreground">
                      {Number(m.progresso ?? 0).toFixed(0)}% concluído
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
