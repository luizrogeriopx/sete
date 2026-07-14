import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wallet, Search, DollarSign, ArrowUpRight, Clock } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/admin/financeiro")({
  component: FinanceiroAdmin,
});

function FinanceiroAdmin() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: financeData, isLoading } = useQuery({
    queryKey: ["admin-financeiro-audit"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pagamentos")
        .select("*, matriculas(id, profiles:aluno_id(nome_completo), cursos(titulo))")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data ?? [];
    },
  });

  const approved = financeData?.filter((p) => p.status === "aprovado") ?? [];
  const pending = financeData?.filter((p) => p.status === "pendente") ?? [];
  const totalApproved = approved.reduce((sum, p) => sum + Number(p.valor), 0);
  const totalPending = pending.reduce((sum, p) => sum + Number(p.valor), 0);

  const filtered = (financeData ?? []).filter((p: any) => {
    const nameMatch = (p.matriculas?.profiles?.nome_completo ?? "")
      .toLowerCase()
      .includes(search.toLowerCase());
    const statusMatch = statusFilter === "all" ? true : p.status === statusFilter;
    return nameMatch && statusMatch;
  });

  if (isLoading) {
    return <p className="text-muted-foreground p-4">Carregando financeiro…</p>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-4xl">Auditoria Financeira</h1>
        <p className="mt-1 text-muted-foreground">Relatório geral de receitas, mensalidades e conciliação de faturas.</p>
      </div>

      {/* Cartões de Caixa */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground">Receita Total Confirmada</div>
              <div className="mt-2 text-3xl font-bold font-serif text-emerald-600">
                R$ {totalApproved.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </div>
            </div>
            <ArrowUpRight className="h-10 w-10 text-emerald-600/30" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground">Cobranças Pendentes</div>
              <div className="mt-2 text-3xl font-bold font-serif text-amber-500">
                R$ {totalPending.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </div>
            </div>
            <Clock className="h-10 w-10 text-amber-500/30" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground">Total de Faturas</div>
              <div className="mt-2 text-3xl font-bold font-serif text-primary">
                {financeData?.length ?? 0}
              </div>
            </div>
            <Wallet className="h-10 w-10 text-gold/30" />
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between">
        <div className="flex items-center gap-2 max-w-sm w-full">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome do aluno..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="max-w-xs w-full">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="aprovado">Aprovados</SelectItem>
              <SelectItem value="pendente">Pendentes</SelectItem>
              <SelectItem value="recusado">Recusados</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabela de Auditoria */}
      <Card className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Aluno</TableHead>
              <TableHead>Curso</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Método</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Pago Em</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((p: any) => (
              <TableRow key={p.id}>
                <TableCell className="font-semibold">{p.matriculas?.profiles?.nome_completo || "Sem Nome"}</TableCell>
                <TableCell className="max-w-[200px] truncate">{p.matriculas?.cursos?.titulo}</TableCell>
                <TableCell className="font-mono text-xs">R$ {Number(p.valor).toFixed(2).replace(".", ",")}</TableCell>
                <TableCell className="uppercase font-semibold text-xs">{p.metodo || "—"}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      p.status === "aprovado"
                        ? "default"
                        : p.status === "pendente"
                        ? "outline"
                        : "destructive"
                    }
                    className={p.status === "aprovado" ? "bg-emerald-600 hover:bg-emerald-600 text-white" : ""}
                  >
                    {p.status === "aprovado"
                      ? "Aprovado"
                      : p.status === "pendente"
                      ? "Pendente"
                      : "Recusado"}
                  </Badge>
                </TableCell>
                <TableCell>{p.pago_em ? new Date(p.pago_em).toLocaleDateString("pt-BR") : "—"}</TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-6">
                  Nenhum registro correspondente aos filtros aplicados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
