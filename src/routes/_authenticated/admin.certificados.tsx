import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Award, Plus, FileText, QrCode } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/certificados")({
  component: CertificadosAdmin,
});

function CertificadosAdmin() {
  const qc = useQueryClient();
  const [isIssueOpen, setIsIssueOpen] = useState(false);
  const [alunoId, setAlunoId] = useState("");
  const [cursoId, setCursoId] = useState("");

  // Fetch issued certificates
  const { data: certificados, isLoading } = useQuery({
    queryKey: ["admin-certificados-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("certificados")
        .select("*, profiles:aluno_id(nome_completo), cursos(titulo)")
        .order("emitido_em", { ascending: false });

      if (error) throw error;
      return data ?? [];
    },
  });

  // Fetch student profiles for select
  const { data: alunos } = useQuery({
    queryKey: ["admin-alunos-select-certificados"],
    queryFn: async () => {
      const { data: roleData } = await supabase.from("user_roles").select("user_id").eq("role", "aluno");
      const uids = (roleData ?? []).map((r) => r.user_id);
      if (uids.length === 0) return [];

      const { data } = await supabase.from("profiles").select("id, nome_completo").in("id", uids).order("nome_completo");
      return data ?? [];
    },
  });

  // Fetch courses for select
  const { data: cursos } = useQuery({
    queryKey: ["admin-cursos-select-certificados"],
    queryFn: async () => {
      const { data } = await supabase.from("cursos").select("id, titulo").order("titulo");
      return data ?? [];
    },
  });

  const emitirCertificado = useMutation({
    mutationFn: async () => {
      if (!alunoId || !cursoId) throw new Error("Selecione o aluno e o curso.");

      // Check if already issued
      const { data: existing } = await supabase
        .from("certificados")
        .select("id")
        .eq("aluno_id", alunoId)
        .eq("curso_id", cursoId)
        .maybeSingle();

      if (existing) throw new Error("O aluno já possui um certificado emitido para este curso.");

      const hashRandom = Math.random().toString(36).substring(2, 8).toUpperCase();
      const codigoValidacao = `SETE-${hashRandom}-${Math.floor(1000 + Math.random() * 9000)}`;

      const { data, error } = await supabase
        .from("certificados")
        .insert({
          aluno_id: alunoId,
          curso_id: cursoId,
          codigo_validacao: codigoValidacao,
        });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-certificados-list"] });
      toast.success("Certificado emitido e registrado com sucesso!");
      setIsIssueOpen(false);
      setAlunoId("");
      setCursoId("");
    },
    onError: (err: Error) => {
      toast.error(`Erro ao emitir: ${err.message}`);
    },
  });

  if (isLoading) {
    return <p className="text-muted-foreground p-4">Carregando certificados…</p>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-4xl">Certificados</h1>
          <p className="mt-1 text-muted-foreground">Registre, visualize e emita certificados acadêmicos de conclusão.</p>
        </div>
        <Dialog open={isIssueOpen} onOpenChange={setIsIssueOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gold text-gold-foreground hover:bg-gold/90 flex items-center gap-2">
              <Plus className="h-4 w-4" /> Emitir Certificado
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Emitir Certificado Acadêmico</DialogTitle>
              <DialogDescription>
                Selecione o concluinte e o curso para emissão imediata da folha de registro.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <label className="text-sm font-semibold">Aluno Concluinte</label>
                <Select value={alunoId} onValueChange={setAlunoId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o aluno..." />
                  </SelectTrigger>
                  <SelectContent>
                    {alunos?.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.nome_completo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold">Curso Realizado</label>
                <Select value={cursoId} onValueChange={setCursoId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o curso..." />
                  </SelectTrigger>
                  <SelectContent>
                    {cursos?.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.titulo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="w-full" onClick={() => setIsIssueOpen(false)}>
                Cancelar
              </Button>
              <Button
                className="w-full bg-gold text-gold-foreground hover:bg-gold/90"
                onClick={() => emitirCertificado.mutate()}
                disabled={emitirCertificado.isPending}
              >
                {emitirCertificado.isPending ? "Emitindo..." : "Confirmar Emissão"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {(!certificados || certificados.length === 0) ? (
        <Card className="border-dashed p-8 text-center text-muted-foreground">
          <Award className="mx-auto h-12 w-12 text-muted-foreground/40" />
          <p className="mt-4">Nenhum certificado emitido no sistema ainda.</p>
        </Card>
      ) : (
        <Card className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Concluinte</TableHead>
                <TableHead>Curso</TableHead>
                <TableHead>Data de Emissão</TableHead>
                <TableHead>Chave de Validação</TableHead>
                <TableHead className="text-right">Validação Pública</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {certificados.map((c: any) => (
                <TableRow key={c.id}>
                  <TableCell className="font-semibold">{c.profiles?.nome_completo}</TableCell>
                  <TableCell>{c.cursos?.titulo}</TableCell>
                  <TableCell>{new Date(c.emitido_em).toLocaleDateString("pt-BR")}</TableCell>
                  <TableCell>
                    <code className="text-xs">{c.codigo_validacao}</code>
                  </TableCell>
                  <TableCell className="text-right">
                    <a
                      href={`/certificado/validar/${c.codigo_validacao}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary underline text-xs font-semibold"
                    >
                      Página de Validação
                    </a>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
