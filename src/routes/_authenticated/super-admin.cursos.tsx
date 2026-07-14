import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BookOpen } from "lucide-react";

export const Route = createFileRoute("/_authenticated/super-admin/cursos")({
  component: CursosSuperAdmin,
});

function CursosSuperAdmin() {
  const { data: cursos, isLoading } = useQuery({
    queryKey: ["super-admin-cursos-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cursos")
        .select("*, profiles:ministrante_id(nome_completo)")
        .order("titulo");

      if (error) throw error;
      return data ?? [];
    },
  });

  if (isLoading) {
    return <p className="text-muted-foreground p-4">Carregando catálogo…</p>;
  }

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
            {cursos?.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-semibold">{c.titulo}</TableCell>
                <TableCell className="capitalize">{c.modalidade}</TableCell>
                <TableCell>{c.carga_horaria || 0}h</TableCell>
                <TableCell>
                  {c.profiles?.nome_completo ? (
                    <Badge variant="outline">🎓 {c.profiles.nome_completo}</Badge>
                  ) : (
                    <span className="text-muted-foreground text-xs italic">Sem professor</span>
                  )}
                </TableCell>
                <TableCell>R$ {Number(c.preco).toFixed(2).replace(".", ",")}</TableCell>
                <TableCell>
                  <Badge variant={c.ativo ? "default" : "outline"}>
                    {c.ativo ? "Ativo" : "Inativo"}
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
