import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Wallet, CheckCircle2, AlertCircle, Clock, ExternalLink } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/aluno/financeiro")({
  component: FinanceiroAluno,
});

function FinanceiroAluno() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["financeiro-aluno", user?.id],
    enabled: !!user,
    queryFn: async () => {
      // Fetch all matriculas and their pagamentos
      const { data: matriculas, error: mError } = await supabase
        .from("matriculas")
        .select("id, status, cursos(id, titulo)")
        .eq("aluno_id", user!.id);

      if (mError) throw mError;

      const ids = (matriculas ?? []).map((m) => m.id);
      if (ids.length === 0) {
        return { matriculas: [], pagamentos: [] };
      }

      const { data: pagamentos, error: pError } = await supabase
        .from("pagamentos")
        .select("*, matriculas(id, cursos(titulo))")
        .in("matricula_id", ids)
        .order("created_at", { ascending: false });

      if (pError) throw pError;

      return {
        matriculas: matriculas ?? [],
        pagamentos: pagamentos ?? [],
      };
    },
  });

  const pagarSimulado = useMutation({
    mutationFn: async (pagamentoId: string) => {
      const { data, error } = await supabase
        .from("pagamentos")
        .update({
          status: "aprovado",
          pago_em: new Date().toISOString(),
          metodo: "pix",
          observacao: "Simulação de pagamento pelo portal do aluno",
        })
        .eq("id", pagamentoId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ["financeiro-aluno", user?.id] });
      // Invalidate meus-cursos as well in case the status of enrollment changes (e.g. if the backend has triggers, or to refresh client queries)
      qc.invalidateQueries({ queryKey: ["meus-cursos", user?.id] });
      toast.success("Pagamento aprovado com sucesso (Ambiente de Testes)!");
      setSelectedInvoice(null);
    },
    onError: (err: Error) => {
      toast.error(`Erro ao pagar: ${err.message}`);
    },
  });

  if (isLoading) {
    return <p className="text-muted-foreground p-4">Carregando financeiro…</p>;
  }

  const pagamentos = data?.pagamentos ?? [];
  const matriculas = data?.matriculas ?? [];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-serif text-4xl">Financeiro</h1>
          <p className="mt-1 text-muted-foreground">Acompanhe suas mensalidades e realize pagamentos.</p>
        </div>
      </div>

      {pagamentos.length === 0 ? (
        <Card className="p-8 text-center border-dashed">
          <Wallet className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 font-serif text-lg">Nenhuma cobrança encontrada</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Você ainda não possui faturas geradas ou não está matriculado em nenhum curso pago.
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Faturas Pendentes */}
          <div className="space-y-4">
            <h2 className="font-serif text-2xl">Cobranças Pendentes</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {pagamentos
                .filter((p) => p.status === "pendente")
                .map((p) => (
                  <Card key={p.id} className="border-gold/30 bg-card">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <Badge variant="outline" className="text-gold border-gold">
                            Pendente
                          </Badge>
                          <h4 className="mt-2 font-serif text-lg leading-tight">
                            {p.matriculas?.cursos?.titulo ?? "Mensalidade / Curso"}
                          </h4>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Vencimento: {new Date(p.created_at).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold font-serif text-primary">
                            R$ {Number(p.valor).toFixed(2).replace(".", ",")}
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 flex gap-2">
                        <Dialog open={selectedInvoice?.id === p.id} onOpenChange={(open) => setSelectedInvoice(open ? p : null)}>
                          <DialogTrigger asChild>
                            <Button className="w-full bg-gold text-gold-foreground hover:bg-gold/90">
                              Pagar Agora
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle>Simulador de Pagamento</DialogTitle>
                              <DialogDescription>
                                Você está prestes a realizar o pagamento de sua parcela no ambiente de simulação do SETE.
                              </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-4 py-4">
                              <div className="rounded-lg bg-slate-100 p-4 dark:bg-slate-900">
                                <div className="text-xs uppercase text-muted-foreground">Curso</div>
                                <div className="font-serif text-base font-semibold">
                                  {p.matriculas?.cursos?.titulo}
                                </div>
                                <div className="mt-2 flex justify-between">
                                  <span className="text-sm">Valor total:</span>
                                  <span className="font-bold text-primary">
                                    R$ {Number(p.valor).toFixed(2).replace(".", ",")}
                                  </span>
                                </div>
                              </div>

                              <div className="flex flex-col items-center gap-2 border border-dashed rounded-lg p-4">
                                <span className="text-sm font-semibold">Pagamento Instantâneo via Pix</span>
                                <img
                                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=00020101021226870014br.gov.bcb.pix2565pix-qrcode-fake-sete@seminario.edu.br5204000053039865406${p.valor}5802BR5915SETE_SEMINARIO6009SAO_PAULO62070503***6304`}
                                  alt="Pix QR Code Simulado"
                                  className="h-32 w-32"
                                />
                                <code className="text-[10px] bg-slate-100 dark:bg-slate-900 p-2 rounded block truncate w-full text-center">
                                  00020101021226870014br.gov.bcb.pix2565pix-qrcode-fake-sete@seminario.edu.br52040000...
                                </code>
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => setSelectedInvoice(null)}
                              >
                                Cancelar
                              </Button>
                              <Button
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                                onClick={() => pagarSimulado.mutate(p.id)}
                                disabled={pagarSimulado.isPending}
                              >
                                {pagarSimulado.isPending ? "Processando..." : "Confirmar Pagamento"}
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              {pagamentos.filter((p) => p.status === "pendente").length === 0 && (
                <div className="col-span-2 text-sm text-muted-foreground p-4 bg-slate-50 dark:bg-slate-900 rounded-lg flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  Nenhuma cobrança pendente. Parabéns! Suas mensalidades estão em dia.
                </div>
              )}
            </div>
          </div>

          {/* Histórico Completo */}
          <div className="space-y-4">
            <h2 className="font-serif text-2xl">Histórico de Transações</h2>
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Curso</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Vencimento / Registro</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead>Pago em</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagamentos.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">
                        {p.matriculas?.cursos?.titulo ?? "Mensalidade Geral"}
                      </TableCell>
                      <TableCell>R$ {Number(p.valor).toFixed(2).replace(".", ",")}</TableCell>
                      <TableCell>{new Date(p.created_at).toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            p.status === "aprovado"
                              ? "default"
                              : p.status === "pendente"
                              ? "outline"
                              : "destructive"
                          }
                          className={p.status === "aprovado" ? "bg-emerald-600 hover:bg-emerald-600" : ""}
                        >
                          {p.status === "aprovado"
                            ? "Aprovado"
                            : p.status === "pendente"
                            ? "Pendente"
                            : "Recusado"}
                        </Badge>
                      </TableCell>
                      <TableCell className="uppercase font-semibold text-xs">
                        {p.metodo || "—"}
                      </TableCell>
                      <TableCell>
                        {p.pago_em ? new Date(p.pago_em).toLocaleDateString("pt-BR") : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
