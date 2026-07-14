import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Plus, MapPin, Clock, Edit3 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/professor/cronograma")({
  component: CronogramaProfessor,
});

function CronogramaProfessor() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [cursoId, setCursoId] = useState("");
  const [topico, setTopico] = useState("");
  const [data, setData] = useState("");
  const [horaInicio, setHoraInicio] = useState("");
  const [horaFim, setHoraFim] = useState("");
  const [local, setLocal] = useState("");
  const [observacao, setObservacao] = useState("");

  // Get courses
  const { data: courses } = useQuery({
    queryKey: ["professor-courses-select", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("cursos")
        .select("id, titulo")
        .eq("ministrante_id", user!.id);
      return data ?? [];
    },
  });

  // Get cronograma list
  const { data: cronograma, isLoading } = useQuery({
    queryKey: ["professor-cronograma", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const courseIds = (courses ?? []).map((c) => c.id);
      if (courseIds.length === 0) {
        // Fallback: fetch courses first synchronously if possible or return empty
        const { data: fallbackCourses } = await supabase
          .from("cursos")
          .select("id")
          .eq("ministrante_id", user!.id);

        const ids = (fallbackCourses ?? []).map((c) => c.id);
        if (ids.length === 0) return [];

        const { data, error } = await supabase
          .from("cronograma")
          .select("*, cursos(titulo)")
          .in("curso_id", ids)
          .order("data", { ascending: true });

        if (error) throw error;
        return data ?? [];
      }

      const { data, error } = await supabase
        .from("cronograma")
        .select("*, cursos(titulo)")
        .in("curso_id", courseIds)
        .order("data", { ascending: true });

      if (error) throw error;
      return data ?? [];
    },
  });

  const criarAula = useMutation({
    mutationFn: async () => {
      if (!cursoId || !topico || !data) {
        throw new Error("Por favor, preencha os campos obrigatórios (Curso, Tópico e Data).");
      }

      const { data: inserted, error } = await supabase
        .from("cronograma")
        .insert({
          curso_id: cursoId,
          topico,
          data,
          hora_inicio: horaInicio || null,
          hora_fim: horaFim || null,
          local: local || null,
          observacao: observacao || null,
        })
        .select()
        .single();

      if (error) throw error;
      return inserted;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["professor-cronograma", user?.id] });
      qc.invalidateQueries({ queryKey: ["professor-home", user?.id] });
      toast.success("Aula adicionada ao cronograma!");
      setIsAddOpen(false);
      // Reset form
      setCursoId("");
      setTopico("");
      setData("");
      setHoraInicio("");
      setHoraFim("");
      setLocal("");
      setObservacao("");
    },
    onError: (err: Error) => {
      toast.error(`Erro: ${err.message}`);
    },
  });

  if (isLoading) {
    return <p className="text-muted-foreground p-4">Carregando cronograma…</p>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-4xl">Cronograma de Aulas</h1>
          <p className="mt-1 text-muted-foreground">Programe encontros, tópicos e horários das suas disciplinas.</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gold text-gold-foreground hover:bg-gold/90 flex items-center gap-2">
              <Plus className="h-4 w-4" /> Agendar Aula
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Agendar Aula / Encontro</DialogTitle>
              <DialogDescription>Preencha os dados do encontro para o cronograma oficial.</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <label className="text-sm font-semibold">Curso *</label>
                <Select value={cursoId} onValueChange={setCursoId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o curso..." />
                  </SelectTrigger>
                  <SelectContent>
                    {courses?.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.titulo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold">Tópico / Título da Aula *</label>
                <Input
                  placeholder="Ex: Introdução à Hermenêutica"
                  value={topico}
                  onChange={(e) => setTopico(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-2 col-span-1">
                  <label className="text-sm font-semibold">Data *</label>
                  <Input type="date" value={data} onChange={(e) => setData(e.target.value)} />
                </div>
                <div className="space-y-2 col-span-1">
                  <label className="text-sm font-semibold">Início</label>
                  <Input type="time" value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)} />
                </div>
                <div className="space-y-2 col-span-1">
                  <label className="text-sm font-semibold">Fim</label>
                  <Input type="time" value={horaFim} onChange={(e) => setHoraFim(e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold">Local / Link Virtual</label>
                <Input
                  placeholder="Ex: Sala 3 ou Link Zoom"
                  value={local}
                  onChange={(e) => setLocal(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold">Observações (opcional)</label>
                <Input
                  placeholder="Requisitos de leitura ou recados..."
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="w-full" onClick={() => setIsAddOpen(false)}>
                Cancelar
              </Button>
              <Button
                className="w-full bg-gold text-gold-foreground hover:bg-gold/90"
                onClick={() => criarAula.mutate()}
                disabled={criarAula.isPending}
              >
                {criarAula.isPending ? "Agendando..." : "Confirmar Encontro"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {(!cronograma || cronograma.length === 0) ? (
        <Card className="border-dashed p-8 text-center text-muted-foreground">
          <Calendar className="mx-auto h-12 w-12 text-muted-foreground/45" />
          <p className="mt-4">Nenhum evento no cronograma. Comece agendando uma aula.</p>
        </Card>
      ) : (
        <Card className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Curso</TableHead>
                <TableHead>Tópico / Aula</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Horário</TableHead>
                <TableHead>Local</TableHead>
                <TableHead>Observação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cronograma.map((c: any) => (
                <TableRow key={c.id}>
                  <TableCell className="font-semibold text-xs max-w-[200px] truncate" title={c.cursos?.titulo ?? ""}>
                    {c.cursos?.titulo}
                  </TableCell>
                  <TableCell className="font-medium">{c.topico}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    {new Date(c.data).toLocaleDateString("pt-BR")}
                  </TableCell>
                  <TableCell className="whitespace-nowrap font-mono text-xs">
                    {c.hora_inicio ? `${c.hora_inicio.slice(0, 5)}h` : "—"}
                    {c.hora_fim ? ` às ${c.hora_fim.slice(0, 5)}h` : ""}
                  </TableCell>
                  <TableCell className="text-xs max-w-[120px] truncate" title={c.local ?? ""}>
                    {c.local || "—"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate" title={c.observacao ?? ""}>
                    {c.observacao || "—"}
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
