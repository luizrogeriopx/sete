import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { BarChart, FileText, Download, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/_authenticated/super-admin/relatorios")({
  component: RelatoriosSuperAdmin,
});

function RelatoriosSuperAdmin() {
  const { data, isLoading } = useQuery({
    queryKey: ["super-admin-relatorios-consolidados"],
    queryFn: async () => {
      const [matriculasRes, pagamentosRes, cursosRes] = await Promise.all([
        supabase.from("matriculas").select("status, progresso"),
        supabase.from("pagamentos").select("valor, status, metodo"),
        supabase.from("cursos").select("id, titulo, modalidade"),
      ]);

      const approved = pagamentosRes.data?.filter((p) => p.status === "aprovado") ?? [];
      const totalRevenue = approved.reduce((sum, p) => sum + Number(p.valor), 0);

      const progressSum = matriculasRes.data?.reduce((sum, m) => sum + (m.progresso || 0), 0) ?? 0;
      const progressCount = matriculasRes.data?.length ?? 0;
      const avgProgress = progressCount > 0 ? progressSum / progressCount : 0;

      return {
        totalRevenue,
        avgProgress,
        enrollmentCount: progressCount,
        coursesCount: cursosRes.data?.length ?? 0,
      };
    },
  });

  if (isLoading) {
    return <p className="text-muted-foreground p-4">Carregando relatórios…</p>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-4xl">Relatórios Gerais</h1>
          <p className="mt-1 text-muted-foreground">Consolidação estatística dos dados escolares e financeiros do SETE.</p>
        </div>
        <Button size="sm" variant="outline" className="flex items-center gap-1.5" onClick={() => window.print()}>
          <Download className="h-4 w-4" /> Imprimir Relatório
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-lg">Métricas Escolares</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between border-b pb-2">
              <span className="text-sm text-muted-foreground">Matrículas registradas:</span>
              <span className="font-bold text-primary">{data?.enrollmentCount}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-sm text-muted-foreground">Cursos ativos:</span>
              <span className="font-bold text-primary">{data?.coursesCount}</span>
            </div>
            <div className="flex justify-between pb-2">
              <span className="text-sm text-muted-foreground">Média de progresso:</span>
              <span className="font-bold text-emerald-600">{data?.avgProgress.toFixed(1)}%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-lg">Métricas de Faturamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between border-b pb-2">
              <span className="text-sm text-muted-foreground">Receita líquida total:</span>
              <span className="font-bold text-primary">
                R$ {(data?.totalRevenue ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-sm text-muted-foreground">Status do caixa:</span>
              <span className="font-bold text-emerald-600">Equilibrado</span>
            </div>
            <div className="flex justify-between pb-2">
              <span className="text-sm text-muted-foreground">Tarifa Mercado Pago:</span>
              <span className="font-bold text-muted-foreground">Simulada</span>
            </div>
          </CardContent>
        </Card>

        <Card className="flex flex-col justify-center items-center text-center p-6 border-dashed">
          <TrendingUp className="h-10 w-10 text-gold mb-2" />
          <h4 className="font-serif font-bold text-sm">Atualizações Contínuas</h4>
          <p className="text-xs text-muted-foreground max-w-xs mt-1">
            Os relatórios são gerados dinamicamente com base nas tabelas em tempo real do banco de dados PostgreSQL.
          </p>
        </Card>
      </div>
    </div>
  );
}
