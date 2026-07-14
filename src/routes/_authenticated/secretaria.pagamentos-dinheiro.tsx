import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Wallet, HelpCircle, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/secretaria/pagamentos-dinheiro")({
  component: PagamentosDinheiroSecretaria,
});

function PagamentosDinheiroSecretaria() {
  const qc = useQueryClient();
  const [selectedPayId, setSelectedPayId] = useState("");
  const [observacao, setObservacao] = useState("");
  const [valorPago, setValorPago] = useState("");

  // Get pending payments
  const { data: pendentes, isLoading } = useQuery({
    queryKey: ["secretaria-pagamentos-pendentes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pagamentos")
        .select("*, matriculas(id, aluno_id, status, profiles:aluno_id(nome_completo), cursos(titulo))")
        .eq("status", "pendente")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data ?? [];
    },
  });

  const quitarPagamento = useMutation({
    mutationFn: async () => {
      if (!selectedPayId) throw new Error("Selecione uma cobrança pendente.");

      const item = pendentes?.find((p) => p.id === selectedPayId);
      if (!item) throw new Error("Fatura não localizada.");

      const valorFinal = valorPago ? parseFloat(valorPago) : item.valor;

      // 1. Update payment to Approved
      const { error: payError } = await supabase
        .from("pagamentos")
        .update({
          status: "aprovado",
          metodo: "dinheiro",
          valor: valorFinal,
          pago_em: new Date().toISOString(),
          observacao: observacao || "Pagamento presencial recebido em dinheiro.",
        })
        .eq("id", selectedPayId);

      if (payError) throw payError;

      // 2. Activate the corresponding student enrollment
      const matriculaId = item.matricula_id;
      const { error: matError } = await supabase
        .from("matriculas")
        .update({ status: "ativa" })
        .eq("id", matriculaId);

      if (matError) throw matError;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["secretaria-pagamentos-pendentes"] });
      qc.invalidateQueries({ queryKey: ["secretaria-home"] });
      toast.success("Pagamento registrado com sucesso! Matrícula ativada.");
      setSelectedPayId("");
      setObservacao("");
      setValorPago("");
    },
    onError: (err: Error) => {
      toast.error(`Erro ao registrar: ${err.message}`);
    },
  });

  function selectPayItem(item: any) {
    setSelectedPayId(item.id);
    setValorPago(item.valor.toString());
    setObservacao(`Quitado presencialmente na secretaria por dinheiro.`);
  }

  if (isLoading) {
    return <p className="text-muted-foreground p-4">Carregando faturas…</p>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-4xl">Pagamentos Presenciais</h1>
        <p className="mt-1 text-muted-foreground">Registre quitações presenciais em dinheiro/espécie recebidas na secretaria.</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Formulário de Quitação */}
        <Card className="lg:col-span-1 h-fit">
          <CardHeader>
            <CardTitle className="font-serif text-xl">Lançar Recebimento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedPayId ? (
              <>
                <div className="rounded-lg bg-slate-50 dark:bg-slate-900 p-4 border text-xs space-y-1">
                  <div><strong>Aluno:</strong> {pendentes?.find((p) => p.id === selectedPayId)?.matriculas?.profiles?.nome_completo}</div>
                  <div><strong>Curso:</strong> {pendentes?.find((p) => p.id === selectedPayId)?.matriculas?.cursos?.titulo}</div>
                  <div><strong>Fatura ID:</strong> {selectedPayId.slice(0, 8)}</div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold">Valor Recebido (R$)</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={valorPago}
                    onChange={(e) => setValorPago(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold">Observações / Recibo</label>
                  <Textarea
                    placeholder="Adicione observações adicionais..."
                    value={observacao}
                    onChange={(e) => setObservacao(e.target.value)}
                  />
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" className="w-full text-xs" onClick={() => setSelectedPayId("")}>
                    Voltar
                  </Button>
                  <Button
                    className="w-full text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() => quitarPagamento.mutate()}
                    disabled={quitarPagamento.isPending}
                  >
                    Confirmar Dinheiro
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center p-6 text-muted-foreground text-xs flex flex-col items-center gap-2">
                <HelpCircle className="h-8 w-8 text-muted-foreground/50 animate-bounce" />
                <p>Selecione uma fatura pendente na tabela ao lado para dar baixa no recebimento presencial.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabela de Pendentes */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="font-serif text-2xl">Cobranças Pendentes</h2>
          {(!pendentes || pendentes.length === 0) ? (
            <Card className="border-dashed p-8 text-center text-muted-foreground">
              <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
              <p className="mt-4">Nenhuma cobrança em aberto no momento. Todos os alunos estão em dia!</p>
            </Card>
          ) : (
            <Card className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Aluno</TableHead>
                    <TableHead>Curso</TableHead>
                    <TableHead>Valor Pendente</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead className="text-right">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendentes.map((p: any) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-semibold">{p.matriculas?.profiles?.nome_completo}</TableCell>
                      <TableCell className="max-w-[150px] truncate">{p.matriculas?.cursos?.titulo}</TableCell>
                      <TableCell className="font-mono text-xs">R$ {Number(p.valor).toFixed(2).replace(".", ",")}</TableCell>
                      <TableCell>{new Date(p.created_at).toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="xs"
                          className="bg-gold text-gold-foreground hover:bg-gold/90 text-[10px]"
                          onClick={() => selectPayItem(p)}
                        >
                          Selecionar
                        </Button>
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
