import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, BookOpen, AlertCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/secretaria/matriculas")({
  component: MatriculasSecretaria,
});

function MatriculasSecretaria() {
  const qc = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [alunoId, setAlunoId] = useState("");
  const [cursoId, setCursoId] = useState("");
  const [status, setStatus] = useState<"ativa" | "pendente">("ativa");
  const [modalidadeEscolhida, setModalidadeEscolhida] = useState("");

  const selectedCourseObj = cursos?.find((c) => c.id === cursoId);
  const modalities = selectedCourseObj?.modalidades_disponiveis || (selectedCourseObj?.modalidade ? [selectedCourseObj.modalidade] : ["online"]);

  const handleCursoChange = (cid: string) => {
    setCursoId(cid);
    const selected = cursos?.find((c) => c.id === cid);
    const opts = selected?.modalidades_disponiveis || (selected?.modalidade ? [selected.modalidade] : ["online"]);
    setModalidadeEscolhida(opts[0] || "online");
  };

  // Fetch all enrollments
  const { data: matriculas, isLoading } = useQuery({
    queryKey: ["secretaria-matriculas-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("matriculas")
        .select("*, profiles:aluno_id(nome_completo), cursos(titulo)")
        .order("data_matricula", { ascending: false });

      if (error) throw error;
      return data ?? [];
    },
  });

  // Fetch student profiles for select
  const { data: alunos } = useQuery({
    queryKey: ["secretaria-alunos-select"],
    queryFn: async () => {
      const { data: roleData } = await supabase.from("user_roles").select("user_id").eq("role", "aluno");
      const uids = (roleData ?? []).map((r) => r.user_id);
      if (uids.length === 0) return [];

      const { data } = await supabase.from("profiles").select("id, nome_completo").in("id", uids).order("nome_completo");
      return data ?? [];
    },
  });

  // Fetch active courses for select
  const { data: cursos } = useQuery({
    queryKey: ["secretaria-cursos-select"],
    queryFn: async () => {
      const { data } = await supabase.from("cursos").select("id, titulo, modalidade, modalidades_disponiveis").eq("ativo", true).order("titulo");
      return data ?? [];
    },
  });

  const matricularAluno = useMutation({
    mutationFn: async () => {
      if (!alunoId || !cursoId) throw new Error("Selecione o aluno e o curso.");

      // Check if already enrolled
      const { data: existing } = await supabase
        .from("matriculas")
        .select("id")
        .eq("aluno_id", alunoId)
        .eq("curso_id", cursoId)
        .maybeSingle();

      if (existing) throw new Error("O aluno já possui matrícula neste curso.");

      // Insert enrollment
      const { data: mat, error: matError } = await supabase
        .from("matriculas")
        .insert({
          aluno_id: alunoId,
          curso_id: cursoId,
          status,
          progresso: 0,
          modalidade_escolhida: modalidadeEscolhida || null,
        })
        .select("id, status, valor:curso_id")
        .single();

      if (matError) throw matError;

      // Get course price to generate billing if pending or active
      const courseDetails = cursos?.find((c) => c.id === cursoId);
      const { data: courseFull } = await supabase.from("cursos").select("preco").eq("id", cursoId).single();
      const preco = courseFull?.preco ?? 0;

      if (preco > 0) {
        // Insert a pending payment bill
        const { error: payError } = await supabase
          .from("pagamentos")
          .insert({
            matricula_id: mat.id,
            valor: preco,
            status: status === "ativa" ? "aprovado" : "pendente",
            metodo: status === "ativa" ? "dinheiro" : "pix",
            pago_em: status === "ativa" ? new Date().toISOString() : null,
            observacao: status === "ativa" ? "Matrícula paga no ato" : "Fatura de matrícula gerada",
          });
        if (payError) throw payError;
      }

      return mat;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["secretaria-matriculas-list"] });
      toast.success("Aluno matriculado com sucesso!");
      setIsAddOpen(false);
      setAlunoId("");
      setCursoId("");
      setStatus("ativa");
      setModalidadeEscolhida("");
    },
    onError: (err: Error) => {
      toast.error(`Erro ao matricular: ${err.message}`);
    },
  });

  const alterarStatus = useMutation({
    mutationFn: async ({
      id,
      novoStatus,
      alunoId,
      cursoId,
    }: {
      id: string;
      novoStatus: any;
      alunoId: string;
      cursoId: string;
    }) => {
      const { error } = await supabase
        .from("matriculas")
        .update({ status: novoStatus })
        .eq("id", id);
      if (error) throw error;

      if (novoStatus === "concluida") {
        // Find layout for this course
        const { data: layout } = await supabase
          .from("layouts_certificado")
          .select("id")
          .eq("curso_id", cursoId)
          .maybeSingle();

        let layoutId = layout?.id;
        if (!layoutId) {
          const { data: defaultLayout } = await supabase
            .from("layouts_certificado")
            .select("id")
            .eq("padrao", true)
            .maybeSingle();
          layoutId = defaultLayout?.id;
        }

        const { error: certError } = await supabase
          .from("certificados")
          .insert({
            aluno_id: alunoId,
            curso_id: cursoId,
            layout_id: layoutId || null,
          });

        if (certError && !certError.message.includes("duplicate key")) {
          throw certError;
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["secretaria-matriculas-list"] });
      toast.success("Status de matrícula atualizado!");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  if (isLoading) {
    return <p className="text-muted-foreground p-4">Carregando matrículas…</p>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-4xl">Matrículas</h1>
          <p className="mt-1 text-muted-foreground">Registre e gerencie as inscrições dos alunos nos cursos do SETE.</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gold text-gold-foreground hover:bg-gold/90 flex items-center gap-2">
              <Plus className="h-4 w-4" /> Nova Matrícula
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Matricular Aluno</DialogTitle>
              <DialogDescription>Increva um aluno existente em um dos cursos ativos.</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <label className="text-sm font-semibold">Aluno</label>
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
                <label className="text-sm font-semibold">Curso</label>
                <Select value={cursoId} onValueChange={handleCursoChange}>
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

              {cursoId && (
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Modalidade</label>
                  <Select value={modalidadeEscolhida} onValueChange={setModalidadeEscolhida}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {modalities.map((m: string) => (
                        <SelectItem key={m} value={m}>
                          {m === "online" ? "Online (AVA)" : m === "presencial" ? "Presencial" : m === "hibrido" ? "Semi-presencial" : m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-semibold">Status de Início</label>
                <Select value={status} onValueChange={(val: any) => setStatus(val)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativa">Ativa (Acesso Imediato)</SelectItem>
                    <SelectItem value="pendente">Pendente (Aguardando Pagamento)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="w-full" onClick={() => setIsAddOpen(false)}>
                Cancelar
              </Button>
              <Button
                className="w-full bg-gold text-gold-foreground hover:bg-gold/90"
                onClick={() => matricularAluno.mutate()}
                disabled={matricularAluno.isPending}
              >
                {matricularAluno.isPending ? "Matriculando..." : "Confirmar Matrícula"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {(!matriculas || matriculas.length === 0) ? (
        <Card className="border-dashed p-8 text-center text-muted-foreground">
          <BookOpen className="mx-auto h-12 w-12 text-muted-foreground/40" />
          <p className="mt-4">Nenhuma matrícula registrada no sistema.</p>
        </Card>
      ) : (
        <Card className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Aluno</TableHead>
                <TableHead>Curso</TableHead>
                <TableHead>Modalidade</TableHead>
                <TableHead>Data de Matrícula</TableHead>
                <TableHead>Progresso</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {matriculas.map((m: any) => (
                <TableRow key={m.id}>
                  <TableCell className="font-semibold">{m.profiles?.nome_completo}</TableCell>
                  <TableCell>{m.cursos?.titulo}</TableCell>
                  <TableCell className="capitalize">
                    <Badge variant="outline">
                      {m.modalidade_escolhida === "online" ? "Online (AVA)" : m.modalidade_escolhida === "hibrido" ? "Semi-presencial" : m.modalidade_escolhida || (m.cursos?.modalidade === "hibrido" ? "Semi-presencial" : m.cursos?.modalidade)}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(m.data_matricula).toLocaleDateString("pt-BR")}</TableCell>
                  <TableCell className="font-mono text-xs">{m.progresso}%</TableCell>
                  <TableCell>
                    <Badge
                      variant={m.status === "ativa" ? "default" : "outline"}
                      className={m.status === "ativa" ? "bg-emerald-600 hover:bg-emerald-600 text-white" : ""}
                    >
                      {m.status === "ativa" ? "Ativa" : m.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap space-x-1">
                    {m.status !== "ativa" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => alterarStatus.mutate({ id: m.id, novoStatus: "ativa", alunoId: m.aluno_id, cursoId: m.curso_id })}
                      >
                        Ativar
                      </Button>
                    )}
                    {m.status === "ativa" && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-amber-50 text-amber-700 hover:bg-amber-100 hover:text-amber-800 border-amber-200"
                          onClick={() => alterarStatus.mutate({ id: m.id, novoStatus: "concluida", alunoId: m.aluno_id, cursoId: m.curso_id })}
                        >
                          Concluir
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => alterarStatus.mutate({ id: m.id, novoStatus: "cancelada", alunoId: m.aluno_id, cursoId: m.curso_id })}
                        >
                          Cancelar
                        </Button>
                      </>
                    )}
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
