import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/super-admin/cursos")({
  component: CursosSuperAdmin,
});

function CursosSuperAdmin() {
  const { data, isLoading } = useQuery({
    queryKey: ["super-admin-cursos-list"],
    queryFn: async () => {
      // 1. Fetch courses
      const { data: cursos, error: cError } = await supabase
        .from("cursos")
        .select("*")
        .order("titulo");

      if (cError) throw cError;

      // 2. Fetch profiles of teachers
      const teacherIds = Array.from(new Set(cursos.map((c) => c.ministrante_id).filter((id): id is string => !!id)));

      const profilesMap: Record<string, string> = {};
      if (teacherIds.length > 0) {
        const { data: profiles, error: prError } = await supabase
          .from("profiles")
          .select("id, nome_completo")
          .in("id", teacherIds);

        if (prError) throw prError;

        profiles?.forEach((p) => {
          profilesMap[p.id] = p.nome_completo;
        });
      }

      return {
        cursos,
        profilesMap,
      };
    },
  });

  if (isLoading) {
    return <p className="text-muted-foreground p-4">Carregando catálogo…</p>;
  }

  const cursos = data?.cursos ?? [];
  const profilesMap = data?.profilesMap ?? {};

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-4xl">Catálogo Geral de Cursos</h1>
        <p className="mt-1 text-muted-foreground">Listagem de todas as disciplinas registradas no banco de dados.</p>
      </div>

      <Card className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Modalidade</TableHead>
              <TableHead>Carga Horária</TableHead>
              <TableHead>Professor</TableHead>
              <TableHead>Preço</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cursos.map((c) => {
              const teacherName = c.ministrante_id ? profilesMap[c.ministrante_id] : null;
              return (
                <TableRow key={c.id}>
                  <TableCell className="font-semibold">{c.titulo}</TableCell>
                  <TableCell className="capitalize">{c.modalidade}</TableCell>
                  <TableCell>{c.carga_horaria || 0}h</TableCell>
                  <TableCell>
                    {teacherName ? (
                      <Badge variant="outline">🎓 {teacherName}</Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs italic">Sem professor</span>
                    )}
                  </TableCell>
                  <TableCell>
                    R$ {Number(c.preco).toFixed(2).replace(".", ",")}
                    {c.cobranca_por === "modulo" && (
                      <span className="text-[10px] text-muted-foreground block font-normal">por módulo</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={c.ativo ? "default" : "outline"}>
                      {c.ativo ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
