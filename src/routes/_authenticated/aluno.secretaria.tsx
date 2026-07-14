import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, PlusCircle, CheckCircle, AlertTriangle, HelpCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/aluno/secretaria")({
  component: SecretariaAluno,
});

const SOLICITACAO_TIPOS = [
  "Declaração de Matrícula",
  "Histórico Escolar",
  "Segunda Via de Documento",
  "Trancamento de Matrícula",
  "Ajuste Financeiro",
  "Outros",
];

function SecretariaAluno() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [tipo, setTipo] = useState("");
  const [descricao, setDescricao] = useState("");

  const { data: solicitacoes, isLoading } = useQuery({
    queryKey: ["solicitacoes-aluno", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("secretaria_solicitacoes")
        .select("*")
        .eq("aluno_id", user!.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data ?? [];
    },
  });

  const criarSolicitacao = useMutation({
    mutationFn: async () => {
      if (!tipo || !descricao) throw new Error("Preencha todos os campos");

      const { data, error } = await supabase
        .from("secretaria_solicitacoes")
        .insert({
          aluno_id: user!.id,
          tipo,
          descricao,
          status: "pendente",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["solicitacoes-aluno", user?.id] });
      toast.success("Solicitação enviada com sucesso!");
      setTipo("");
      setDescricao("");
    },
    onError: (err: Error) => {
      toast.error(`Erro ao criar solicitação: ${err.message}`);
    },
  });

  function getStatusBadge(status: string) {
    switch (status) {
      case "deferida":
        return <Badge className="bg-emerald-600 hover:bg-emerald-600">Deferida</Badge>;
      case "indeferida":
        return <Badge variant="destructive">Indeferida</Badge>;
      case "em_analise":
        return <Badge className="bg-amber-500 hover:bg-amber-500 text-white">Em Análise</Badge>;
      default:
        return <Badge variant="outline">Pendente</Badge>;
    }
  }

  if (isLoading) {
    return <p className="text-muted-foreground p-4">Carregando secretaria…</p>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-4xl">Secretaria</h1>
        <p className="mt-1 text-muted-foreground">Abra solicitações acadêmicas e acompanhe o andamento dos processos.</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Formulário de Nova Solicitação */}
        <Card className="lg:col-span-1 h-fit">
          <CardHeader>
            <CardTitle className="font-serif text-xl">Nova Solicitação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold">Tipo de Solicitação</label>
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo..." />
                </SelectTrigger>
                <SelectContent>
                  {SOLICITACAO_TIPOS.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Descrição / Detalhes</label>
              <Textarea
                placeholder="Detalhe o seu pedido aqui..."
                rows={4}
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
              />
            </div>

            <Button
              className="w-full bg-gold text-gold-foreground hover:bg-gold/90"
              onClick={() => criarSolicitacao.mutate()}
              disabled={criarSolicitacao.isPending}
            >
              {criarSolicitacao.isPending ? "Enviando..." : "Enviar Solicitação"}
            </Button>
          </CardContent>
        </Card>

        {/* Histórico de Solicitações */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="font-serif text-2xl">Minhas Solicitações</h2>
          {(!solicitacoes || solicitacoes.length === 0) ? (
            <Card className="border-dashed p-8 text-center text-muted-foreground">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4">Você ainda não realizou nenhuma solicitação acadêmica.</p>
            </Card>
          ) : (
            <Card className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data de Abertura</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Resposta</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {solicitacoes.map((s) => (
                    <TableRow key={s.id} className="align-top">
                      <TableCell className="font-medium whitespace-nowrap">{s.tipo}</TableCell>
                      <TableCell>{getStatusBadge(s.status)}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {new Date(s.created_at).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-xs" title={s.descricao ?? ""}>
                        {s.descricao}
                      </TableCell>
                      <TableCell className="text-xs text-primary max-w-xs">
                        {s.resposta ? (
                          <div className="rounded bg-slate-50 dark:bg-slate-900 p-2 border border-border">
                            {s.resposta}
                          </div>
                        ) : (
                          <span className="text-muted-foreground italic">Aguardando resposta...</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
