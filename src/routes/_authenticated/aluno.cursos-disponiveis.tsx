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
        supabase.from("cursos").select("id, titulo, slug, descricao_curta, preco, modalidade, modalidades_disponiveis, categorias(nome)").eq("ativo", true),
        supabase.from("matriculas").select("curso_id").eq("aluno_id", user!.id),
      ]);
      const jaMatriculado = new Set((minhas ?? []).map((m) => m.curso_id));
      return (cursos ?? []).filter((c) => !jaMatriculado.has(c.id));
    },
  });

  return (
    <div>
      <h1 className="font-serif text-4xl">Cursos disponíveis</h1>
      <p className="mt-1 text-muted-foreground">Amplie sua formação — matricule-se em novos cursos.</p>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {(data ?? []).map((c) => (
          <Link key={c.id} to="/cursos/$slug" params={{ slug: c.slug }}>
            <Card className="h-full transition hover:shadow-md">
              <div className="aspect-[16/9] bg-gradient-to-br from-primary/80 to-primary" />
              <CardContent className="p-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline">{c.categorias?.nome}</Badge>
                  <Badge className="capitalize">
                    {c.modalidades_disponiveis && c.modalidades_disponiveis.length > 0
                      ? c.modalidades_disponiveis.map((m: string) => m === "online" ? "Online (AVA)" : m === "hibrido" ? "Semi-presencial" : m).join(" / ")
                      : (c.modalidade === "hibrido" ? "Semi-presencial" : c.modalidade)}
                  </Badge>
                </div>
                <h3 className="mt-2 font-serif text-lg">{c.titulo}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{c.descricao_curta}</p>
                <div className="mt-3 font-serif text-primary">
                  {Number(c.preco) > 0 ? `R$ ${Number(c.preco).toFixed(2).replace(".", ",")}` : "Gratuito"}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
        {data && data.length === 0 && (
          <p className="text-muted-foreground md:col-span-3">Você já está matriculado em todos os cursos disponíveis!</p>
        )}
      </div>
    </div>
  );
}
