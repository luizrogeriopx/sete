import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, GraduationCap, TrendingUp, CheckCircle, Clock } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/admin/matriculas")({
  component: MatriculasAdmin,
});

function MatriculasAdmin() {
  const [search, setSearch] = useState("");

  const { data: matriculas, isLoading } = useQuery({
    queryKey: ["admin-matriculas-dashboard-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("matriculas")
        .select("*, profiles:aluno_id(nome_completo), cursos(titulo)")
        .order("data_matricula", { ascending: false });

      if (error) throw error;
      return data ?? [];
    },
  });

  const activeCount = matriculas?.filter((m) => m.status === "ativa").length ?? 0;
  const pendingCount = matriculas?.filter((m) => m.status === "pendente").length ?? 0;
  const concludedCount = matriculas?.filter((m) => m.status === "concluida").length ?? 0;

  const filtered = (matriculas ?? []).filter((m: any) =>
    (m.profiles?.nome_completo ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (m.cursos?.titulo ?? "").toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return <p className="text-muted-foreground p-4">Carregando matrículas…</p>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-4xl">Relatório de Matrículas</h1>
        <p className="mt-1 text-muted-foreground">Monitore o índice de engajamento, matrículas ativas e conclusão de cursos.</p>
      </div>

      {/* Estatísticas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground">Matrículas Totais</div>
              <div className="mt-2 text-3xl font-bold font-serif text-primary">
                {matriculas?.length ?? 0}
              </div>
            </div>
            <GraduationCap className="h-10 w-10 text-gold/30" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground">Matrículas Ativas</div>
              <div className="mt-2 text-3xl font-bold font-serif text-emerald-600">
                {activeCount}
              </div>
            </div>
            <TrendingUp className="h-10 w-10 text-emerald-600/30" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground">Matrículas Pendentes</div>
              <div className="mt-2 text-3xl font-bold font-serif text-amber-500">
                {pendingCount}
              </div>
            </div>
            <Clock className="h-10 w-10 text-amber-500/30" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground">Cursos Concluídos</div>
              <div className="mt-2 text-3xl font-bold font-serif text-indigo-600">
                {concludedCount}
              </div>
            </div>
            <CheckCircle className="h-10 w-10 text-indigo-600/30" />
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-2 max-w-sm">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome do aluno ou curso..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Card className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Aluno</TableHead>
              <TableHead>Curso</TableHead>
              <TableHead>Data de Matrícula</TableHead>
              <TableHead>Progresso Acadêmico</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((m: any) => (
              <TableRow key={m.id}>
                <TableCell className="font-semibold">{m.profiles?.nome_completo || "Sem Nome"}</TableCell>
                <TableCell>{m.cursos?.titulo}</TableCell>
                <TableCell>{new Date(m.data_matricula).toLocaleDateString("pt-BR")}</TableCell>
                <TableCell className="font-mono text-xs font-bold">{m.progresso}%</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      m.status === "ativa"
                        ? "default"
                        : m.status === "concluida"
                        ? "secondary"
                        : "outline"
                    }
                    className={m.status === "ativa" ? "bg-emerald-600 hover:bg-emerald-600 text-white" : ""}
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
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
