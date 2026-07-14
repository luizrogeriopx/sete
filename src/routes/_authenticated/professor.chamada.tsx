import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckSquare, Save, Users, AlertCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/professor/chamada")({
  component: ChamadaProfessor,
});

function ChamadaProfessor() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [selectedAulaId, setSelectedAulaId] = useState<string>("");
  const [presencasLocais, setPresencasLocais] = useState<Record<string, { status: "presente" | "falta" | "justificada"; justificativa?: string }>>({});

  // 1. Get courses for this teacher
  const { data: courses } = useQuery({
    queryKey: ["professor-courses-chamada", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("cursos")
        .select("id, titulo")
        .eq("ministrante_id", user!.id);
      return data ?? [];
    },
  });

  // 2. Get schedule slots for these courses
  const { data: aulas } = useQuery({
    queryKey: ["professor-aulas-chamada", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const courseIds = (courses ?? []).map((c) => c.id);
      if (courseIds.length === 0) return [];

      const { data } = await supabase
        .from("cronograma")
        .select("*, cursos(titulo)")
        .in("curso_id", courseIds)
        .order("data", { ascending: false });
      return data ?? [];
    },
  });

  const aulaSelecionada = aulas?.find((a) => a.id === selectedAulaId);

  // 3. Get students and existing presencas for selected aula
  const { data: studentList, isLoading: isStudentsLoading } = useQuery({
    queryKey: ["chamada-students", selectedAulaId],
    enabled: !!selectedAulaId && !!aulaSelecionada,
    queryFn: async () => {
      // 3.1. Fetch students enrolled in course
      const { data: matriculas, error: mError } = await supabase
        .from("matriculas")
        .select("aluno_id, profiles:aluno_id(nome_completo)")
        .eq("curso_id", aulaSelecionada!.curso_id)
        .eq("status", "ativa");

      if (mError) throw mError;

      // 3.2. Fetch existing presencas for this class slot
      const { data: presencasExistentes, error: pError } = await supabase
        .from("presencas")
        .select("*")
        .eq("cronograma_id", selectedAulaId);

      if (pError) throw pError;

      // Convert existing presencas to a map
      const presencasMap: Record<string, { status: "presente" | "falta" | "justificada"; justificativa?: string }> = {};
      presencasExistentes?.forEach((p) => {
        presencasMap[p.aluno_id] = {
          status: p.status as any,
          justificativa: p.justificativa ?? "",
        };
      });

      // Initialize state for attendance
      const localMap: Record<string, { status: "presente" | "falta" | "justificada"; justificativa?: string }> = {};
      matriculas?.forEach((m) => {
        localMap[m.aluno_id] = presencasMap[m.aluno_id] ?? { status: "presente", justificativa: "" };
      });
      setPresencasLocais(localMap);

      return matriculas ?? [];
    },
  });

  const salvarChamada = useMutation({
    mutationFn: async () => {
      if (!selectedAulaId) return;

      const records = Object.entries(presencasLocais).map(([alunoId, val]) => ({
        cronograma_id: selectedAulaId,
        aluno_id: alunoId,
        status: val.status,
        justificativa: val.status === "justificada" ? val.justificativa || null : null,
        registrada_por: user!.id,
      }));

      if (records.length === 0) return;

      // Perform upsert for each record
      for (const record of records) {
        const { error } = await supabase
          .from("presencas")
          .upsert(record, { onConflict: "aluno_id,cronograma_id" });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["chamada-students", selectedAulaId] });
      toast.success("Folha de chamada salva com sucesso!");
    },
    onError: (err: Error) => {
      toast.error(`Erro ao salvar chamada: ${err.message}`);
    },
  });

  function updateStatus(alunoId: string, status: "presente" | "falta" | "justificada") {
    setPresencasLocais((prev) => ({
      ...prev,
      [alunoId]: {
        ...prev[alunoId],
        status,
      },
    }));
  }

  function updateJustificativa(alunoId: string, justificativa: string) {
    setPresencasLocais((prev) => ({
      ...prev,
      [alunoId]: {
        ...prev[alunoId],
        justificativa,
      },
    }));
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-4xl">Chamada Diária</h1>
        <p className="mt-1 text-muted-foreground">Registre o comparecimento dos alunos às aulas.</p>
      </div>

      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="max-w-md space-y-2">
            <label className="text-sm font-semibold">Selecione o encontro / aula agendada</label>
            <Select value={selectedAulaId} onValueChange={setSelectedAulaId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a aula..." />
              </SelectTrigger>
              <SelectContent>
                {aulas?.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {new Date(a.data).toLocaleDateString("pt-BR")} - {a.topico} ({a.cursos?.titulo})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {selectedAulaId && (
        <div className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="font-serif text-2xl flex items-center gap-2">
              <Users className="h-6 w-6 text-gold" /> Lista de Presença
            </h2>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2"
              onClick={() => salvarChamada.mutate()}
              disabled={salvarChamada.isPending}
            >
              <Save className="h-4 w-4" />
              {salvarChamada.isPending ? "Salvando..." : "Salvar Chamada"}
            </Button>
          </div>

          {isStudentsLoading ? (
            <p className="text-sm text-muted-foreground">Buscando alunos matriculados...</p>
          ) : !studentList || studentList.length === 0 ? (
            <div className="p-8 text-center border rounded-lg bg-slate-50 dark:bg-slate-900 flex flex-col items-center gap-2">
              <AlertCircle className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Não há alunos ativos matriculados neste curso.</p>
            </div>
          ) : (
            <Card className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Aluno</TableHead>
                    <TableHead>Falta / Presença</TableHead>
                    <TableHead>Justificativa (Se aplicável)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentList.map((m: any) => {
                    const alunoId = m.aluno_id;
                    const val = presencasLocais[alunoId] ?? { status: "presente", justificativa: "" };

                    return (
                      <TableRow key={alunoId}>
                        <TableCell className="font-medium">
                          {m.profiles?.nome_completo || "Nome não cadastrado"}
                        </TableCell>
                        <TableCell>
                          <RadioGroup
                            value={val.status}
                            onValueChange={(status: any) => updateStatus(alunoId, status)}
                            className="flex gap-4"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="presente" id={`pres-${alunoId}`} />
                              <Label htmlFor={`pres-${alunoId}`} className="cursor-pointer text-xs font-semibold text-emerald-600">
                                Presente
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="falta" id={`falt-${alunoId}`} />
                              <Label htmlFor={`falt-${alunoId}`} className="cursor-pointer text-xs font-semibold text-rose-600">
                                Falta
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="justificada" id={`just-${alunoId}`} />
                              <Label htmlFor={`just-${alunoId}`} className="cursor-pointer text-xs font-semibold text-amber-600">
                                Justificada
                              </Label>
                            </div>
                          </RadioGroup>
                        </TableCell>
                        <TableCell>
                          {val.status === "justificada" && (
                            <Input
                              placeholder="Motivo da falta..."
                              className="max-w-xs h-8 text-xs"
                              value={val.justificativa || ""}
                              onChange={(e) => updateJustificativa(alunoId, e.target.value)}
                            />
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
