import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Calendar, Users } from "lucide-react";

export const Route = createFileRoute("/_authenticated/professor/cursos")({
  component: CursosProfessor,
});

function CursosProfessor() {
  const { user } = useAuth();

  const { data: cursos, isLoading } = useQuery({
    queryKey: ["professor-cursos", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cursos")
        .select("*, categorias(nome)")
        .eq("ministrante_id", user!.id);

      if (error) throw error;
      return data ?? [];
    },
  });

  if (isLoading) {
    return <p className="text-muted-foreground p-4">Carregando cursos…</p>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-4xl">Meus Cursos</h1>
        <p className="mt-1 text-muted-foreground">Catálogo de matérias e disciplinas atribuídas a você.</p>
      </div>

      {cursos?.length === 0 ? (
        <Card className="p-8 text-center border-dashed">
          <BookOpen className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <p className="mt-4 text-sm text-muted-foreground">
            Nenhum curso cadastrado sob sua ministração no momento.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {cursos?.map((c) => (
            <Card key={c.id} className="h-full transition hover:shadow-md flex flex-col justify-between">
              <div>
                <div className="aspect-[16/9] bg-gradient-to-br from-indigo-900 to-slate-950 p-4 flex flex-col justify-between rounded-t-xl text-white">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-white border-white/30">
                      {c.categorias?.nome ?? "Sem categoria"}
                    </Badge>
                    <Badge className="bg-gold text-slate-950 hover:bg-gold">{c.modalidade}</Badge>
                  </div>
                  <h3 className="font-serif text-lg text-gold font-bold line-clamp-2 leading-tight">
                    {c.titulo}
                  </h3>
                </div>
                <CardContent className="p-4 space-y-3">
                  <p className="line-clamp-3 text-xs text-muted-foreground leading-relaxed">
                    {c.descricao_curta || "Sem descrição curta cadastrada."}
                  </p>
                  <div className="flex justify-between text-xs text-muted-foreground pt-2 border-t">
                    <span>⏱ Carga Horária: {c.carga_horaria || 0}h</span>
                    <span>💰 R$ {Number(c.preco).toFixed(2).replace(".", ",")}</span>
                  </div>
                </CardContent>
              </div>

              <div className="p-4 border-t bg-slate-50 dark:bg-slate-900 rounded-b-xl flex gap-2">
                <Link to="/professor/cronograma" className="w-full">
                  <Button variant="outline" size="sm" className="w-full text-xs flex items-center justify-center gap-1">
                    <Calendar className="h-3 w-3" /> Cronograma
                  </Button>
                </Link>
                <Link to="/professor/alunos" className="w-full">
                  <Button size="sm" className="w-full text-xs bg-gold text-gold-foreground hover:bg-gold/90 flex items-center justify-center gap-1">
                    <Users className="h-3 w-3" /> Alunos
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
