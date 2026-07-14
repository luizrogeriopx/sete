import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Users, Calendar, Clock, GraduationCap, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/_authenticated/professor/")({
  component: ProfessorHome,
});

function ProfessorHome() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["professor-home", user?.id],
    enabled: !!user,
    queryFn: async () => {
      // 1. Fetch courses taught by the professor
      const { data: courses, error: cError } = await supabase
        .from("cursos")
        .select("id, titulo, modalidade")
        .eq("ministrante_id", user!.id);

      if (cError) throw cError;

      const courseIds = (courses ?? []).map((c) => c.id);

      if (courseIds.length === 0) {
        return { courses: [], totalAlunos: 0, cronograma: [] };
      }

      // 2. Fetch total matriculas for these courses
      const { data: matriculas, error: mError } = await supabase
        .from("matriculas")
        .select("id")
        .in("curso_id", courseIds)
        .eq("status", "ativa");

      if (mError) throw mError;

      // 3. Fetch upcoming cronograma events
      const { data: cronograma, error: croError } = await supabase
        .from("cronograma")
        .select("*, cursos(titulo)")
        .in("curso_id", courseIds)
        .gte("data", new Date().toISOString().split("T")[0])
        .order("data", { ascending: true })
        .limit(5);

      if (croError) throw croError;

      return {
        courses: courses ?? [],
        totalAlunos: matriculas?.length ?? 0,
        cronograma: cronograma ?? [],
      };
    },
  });

  if (isLoading) {
    return <p className="text-muted-foreground p-4">Carregando painel...</p>;
  }

  const courses = data?.courses ?? [];
  const totalAlunos = data?.totalAlunos ?? 0;
  const cronograma = data?.cronograma ?? [];

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-gold">Portal do Docente</p>
        <h1 className="mt-1 font-serif text-4xl">Painel do Professor</h1>
      </div>

      {/* Cards de Métricas */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold font-serif text-primary">{courses.length}</div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground mt-1">Cursos Ministrados</div>
            </div>
            <BookOpen className="h-10 w-10 text-gold opacity-85" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold font-serif text-primary">{totalAlunos}</div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground mt-1">Alunos Ativos</div>
            </div>
            <Users className="h-10 w-10 text-gold opacity-85" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold font-serif text-primary">{cronograma.length}</div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground mt-1">Aulas Agendadas</div>
            </div>
            <Calendar className="h-10 w-10 text-gold opacity-85" />
          </CardContent>
        </Card>
      </div>

      {/* Seção Principal */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Próximas Aulas */}
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-xl flex items-center gap-2">
              <Clock className="h-5 w-5 text-gold" /> Próximas Aulas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {cronograma.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma aula programada nos próximos dias.</p>
            ) : (
              cronograma.map((c) => (
                <div key={c.id} className="flex justify-between items-center p-3 rounded-lg border bg-card">
                  <div>
                    <h4 className="font-serif font-bold text-sm leading-tight">{c.topico}</h4>
                    <p className="text-xs text-muted-foreground mt-1">{c.cursos?.titulo}</p>
                    <div className="flex items-center gap-2 mt-2 text-[10px] text-muted-foreground">
                      <span>📅 {new Date(c.data).toLocaleDateString("pt-BR")}</span>
                      {c.hora_inicio && <span>🕒 {c.hora_inicio.slice(0, 5)}h</span>}
                      {c.local && <span>📍 {c.local}</span>}
                    </div>
                  </div>
                  <Link to="/professor/chamada" className="text-xs text-primary font-semibold hover:underline flex items-center gap-0.5">
                    Chamada <ChevronRight className="h-3 w-3" />
                  </Link>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Links Rápidos */}
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-xl flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-gold" /> Atalhos Rápidos
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <Link to="/professor/cursos">
              <div className="p-4 border rounded-xl hover:shadow-md transition text-center space-y-2 cursor-pointer h-full">
                <BookOpen className="mx-auto h-6 w-6 text-gold" />
                <div className="font-serif text-sm font-semibold">Meus Cursos</div>
                <p className="text-xs text-muted-foreground">Ver matérias atribuídas</p>
              </div>
            </Link>
            <Link to="/professor/alunos">
              <div className="p-4 border rounded-xl hover:shadow-md transition text-center space-y-2 cursor-pointer h-full">
                <Users className="mx-auto h-6 w-6 text-gold" />
                <div className="font-serif text-sm font-semibold">Lista de Alunos</div>
                <p className="text-xs text-muted-foreground">Consultar notas e progresso</p>
              </div>
            </Link>
            <Link to="/professor/cronograma">
              <div className="p-4 border rounded-xl hover:shadow-md transition text-center space-y-2 cursor-pointer h-full">
                <Calendar className="mx-auto h-6 w-6 text-gold" />
                <div className="font-serif text-sm font-semibold">Cronograma</div>
                <p className="text-xs text-muted-foreground">Agendar datas e encontros</p>
              </div>
            </Link>
            <Link to="/professor/chamada">
              <div className="p-4 border rounded-xl hover:shadow-md transition text-center space-y-2 cursor-pointer h-full">
                <Clock className="mx-auto h-6 w-6 text-gold" />
                <div className="font-serif text-sm font-semibold">Realizar Chamada</div>
                <p className="text-xs text-muted-foreground">Lançar presenças e faltas</p>
              </div>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
