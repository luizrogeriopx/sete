import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Mail, Phone, Book } from "lucide-react";

export const Route = createFileRoute("/_authenticated/professor/alunos")({
  component: AlunosProfessor,
});

function AlunosProfessor() {
  const { user } = useAuth();

  const { data: alunos, isLoading } = useQuery({
    queryKey: ["professor-alunos", user?.id],
    enabled: !!user,
    queryFn: async () => {
      // 1. Get courses for this teacher
      const { data: courses } = await supabase
        .from("cursos")
        .select("id, titulo")
        .eq("ministrante_id", user!.id);

      const courseIds = (courses ?? []).map((c) => c.id);
      if (courseIds.length === 0) return [];

      // 2. Get enrollments for these courses, join profiles
      const { data: matriculas, error } = await supabase
        .from("matriculas")
        .select(`
          id,
          status,
          progresso,
          aluno_id,
          cursos(titulo),
          profiles:aluno_id(nome_completo, foto_url, telefone)
        `)
        .in("curso_id", courseIds)
        .order("status", { ascending: true });

      if (error) throw error;
      return matriculas ?? [];
    },
  });

  if (isLoading) {
    return <p className="text-muted-foreground p-4">Carregando alunos…</p>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-4xl">Alunos</h1>
        <p className="mt-1 text-muted-foreground">Monitore o progresso e dados de contato de seus estudantes.</p>
      </div>

      {alunos?.length === 0 ? (
        <Card className="border-dashed p-8 text-center text-muted-foreground">
          <Users className="mx-auto h-12 w-12 text-muted-foreground/45" />
          <p className="mt-4">Nenhum aluno matriculado nas suas matérias até o momento.</p>
        </Card>
      ) : (
        <Card className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Aluno</TableHead>
                <TableHead>Curso</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Status da Matrícula</TableHead>
                <TableHead>Progresso do Curso</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {alunos?.map((m: any) => {
                const profile = m.profiles;
                const iniciais = profile?.nome_completo
                  ? profile.nome_completo
                      .split(" ")
                      .map((n: string) => n[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()
                  : "AL";

                return (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium whitespace-nowrap flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={profile?.foto_url ?? ""} />
                        <AvatarFallback className="bg-slate-200 dark:bg-slate-800 text-[10px]">
                          {iniciais}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-sm font-semibold">{profile?.nome_completo || "Sem Nome"}</div>
                        <div className="text-[10px] text-muted-foreground">ID: {m.aluno_id.slice(0, 8)}</div>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate" title={m.cursos?.titulo ?? ""}>
                      {m.cursos?.titulo}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs space-y-1">
                      {profile?.telefone && (
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3 text-muted-foreground" /> {profile.telefone}
                        </div>
                      )}
                      {!profile?.telefone && <span className="text-muted-foreground italic">Sem telefone</span>}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={m.status === "ativa" ? "default" : m.status === "concluida" ? "secondary" : "outline"}
                        className={m.status === "ativa" ? "bg-emerald-600 hover:bg-emerald-600" : ""}
                      >
                        {m.status === "ativa"
                          ? "Ativa"
                          : m.status === "concluida"
                          ? "Concluída"
                          : m.status === "pendente"
                          ? "Pendente"
                          : m.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="min-w-[150px]">
                      <div className="flex items-center gap-2">
                        <Progress value={m.progresso || 0} className="h-2 w-24" />
                        <span className="text-xs font-mono font-semibold">{m.progresso || 0}%</span>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
