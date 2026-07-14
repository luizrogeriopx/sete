import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, HelpCircle, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/secretaria/solicitacoes")({
  component: SolicitacoesSecretaria,
});

function SolicitacoesSecretaria() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [selectedReq, setSelectedReq] = useState<any>(null);
  const [resposta, setResposta] = useState("");
  const [status, setStatus] = useState<"deferida" | "indeferida" | "em_analise">("deferida");

  // Fetch all requests
  const { data: solicitacoes, isLoading } = useQuery({
    queryKey: ["secretaria-solicitacoes-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("secretaria_solicitacoes")
        .select("*, profiles:aluno_id(nome_completo)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data ?? [];
    },
  });

  const responderSolicitacao = useMutation({
    mutationFn: async () => {
      if (!selectedReq || !resposta) throw new Error("Por favor, preencha a resposta.");

      const { error } = await supabase
        .from("secretaria_solicitacoes")
        .update({
          status,
          resposta,
          atendida_por: user!.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedReq.id);

      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["secretaria-solicitacoes-list"] });
      qc.invalidateQueries({ queryKey: ["secretaria-home"] });
      toast.success("Solicitação respondida com sucesso!");
      setSelectedReq(null);
      setResposta("");
    },
    onError: (err: Error) => {
      toast.error(`Erro ao responder: ${err.message}`);
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

  function openResponder(req: any) {
    setSelectedReq(req);
    setResposta(req.resposta || "");
    setStatus((req.status === "pendente" || req.status === "em_analise") ? "deferida" : req.status);
  }

  if (isLoading) {
    return <p className="text-muted-foreground p-4">Carregando solicitações…</p>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-4xl">Solicitações Acadêmicas</h1>
        <p className="mt-1 text-muted-foreground">Responda aos pedidos de documentos, trancamento e declarações dos alunos.</p>
      </div>

      <Card className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Aluno</TableHead>
              <TableHead>Tipo de Solicitação</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Abertura</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {solicitacoes?.map((s: any) => (
              <TableRow key={s.id} className="align-top">
                <TableCell className="font-semibold whitespace-nowrap">{s.profiles?.nome_completo}</TableCell>
                <TableCell className="font-medium whitespace-nowrap">{s.tipo}</TableCell>
                <TableCell className="max-w-xs text-xs" title={s.descricao ?? ""}>
                  {s.descricao}
                </TableCell>
                <TableCell className="whitespace-nowrap">{new Date(s.created_at).toLocaleDateString("pt-BR")}</TableCell>
                <TableCell>{getStatusBadge(s.status)}</TableCell>
                <TableCell className="text-right">
                  <Dialog open={selectedReq?.id === s.id} onOpenChange={(open) => !open && setSelectedReq(null)}>
                    <DialogTrigger asChild>
                      <Button size="xs" variant="outline" onClick={() => openResponder(s)}>
                        {s.status === "pendente" ? "Responder" : "Ver / Alterar"}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Atender Solicitação Acadêmica</DialogTitle>
                        <DialogDescription>
                          Analise o pedido e forneça a resposta ou documento correspondente.
                        </DialogDescription>
                      </DialogHeader>

                      <div className="space-y-4 py-2">
                        <div className="rounded-lg bg-slate-50 dark:bg-slate-900 p-4 border text-xs space-y-1">
                          <div><strong>Aluno:</strong> {s.profiles?.nome_completo}</div>
                          <div><strong>Tipo:</strong> {s.tipo}</div>
                          <div><strong>Descrição do Aluno:</strong> {s.descricao}</div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-semibold">Resposta da Secretaria / Parecer</label>
                          <Textarea
                            placeholder="Escreva a resposta ou cole o link do documento gerado (Google Drive, etc)..."
                            rows={4}
                            value={resposta}
                            onChange={(e) => setResposta(e.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-semibold">Status do Processo</label>
                          <Select value={status} onValueChange={(val: any) => setStatus(val)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="deferida">Deferida (Aprovada)</SelectItem>
                              <SelectItem value="indeferida">Indeferida (Reprovada)</SelectItem>
                              <SelectItem value="em_analise">Em Análise</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button variant="outline" className="w-full" onClick={() => setSelectedReq(null)}>
                          Cancelar
                        </Button>
                        <Button
                          className="w-full bg-gold text-gold-foreground hover:bg-gold/90"
                          onClick={() => responderSolicitacao.mutate()}
                          disabled={responderSolicitacao.isPending}
                        >
                          {responderSolicitacao.isPending ? "Salvando..." : "Salvar Resposta"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </TableCell>
              </TableRow>
            ))}
            {solicitacoes?.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-6">
                  Nenhuma solicitação acadêmica registrada no momento.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
