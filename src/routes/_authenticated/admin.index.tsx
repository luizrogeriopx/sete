import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Users, Wallet, FileText, Bell, GraduationCap, ChevronRight, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminHome,
});

function AdminHome() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-home-dashboard"],
    queryFn: async () => {
      const [alunosRes, matriculasRes, pagamentosRes, cursosRes] = await Promise.all([
        supabase.from("user_roles").select("id").eq("role", "aluno"),
        supabase.from("matriculas").select("id", { count: "exact" }),
        supabase.from("pagamentos").select("valor, status"),
        supabase.from("cursos").select("id", { count: "exact" }),
      ]);

      const approved = pagamentosRes.data?.filter((p) => p.status === "aprovado") ?? [];
      const pending = pagamentosRes.data?.filter((p) => p.status === "pendente") ?? [];
      const totalRevenue = approved.reduce((sum, p) => sum + Number(p.valor), 0);

      return {
        alunosCount: alunosRes.data?.length ?? 0,
        matriculasCount: matriculasRes.count ?? 0,
        totalRevenue,
        pendingPaymentsCount: pending.length,
        cursosCount: cursosRes.count ?? 0,
      };
    },
  });

  if (isLoading) {
    return <p className="text-muted-foreground p-4">Carregando painel…</p>;
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-gold font-mono">Gestão Administrativa</p>
        <h1 className="mt-1 font-serif text-4xl">Painel Geral da Diretoria</h1>
      </div>

      {/* Cards de Métricas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="relative overflow-hidden">
          <CardContent className="p-6">
            <Users className="absolute right-4 top-4 h-10 w-10 text-gold/20" />
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Alunos Totais</div>
            <div className="mt-2 text-3xl font-bold font-serif text-primary">{data?.alunosCount}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Contas cadastradas como alunos</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardContent className="p-6">
            <BookOpen className="absolute right-4 top-4 h-10 w-10 text-gold/20" />
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Cursos Cadastrados</div>
            <div className="mt-2 text-3xl font-bold font-serif text-primary">{data?.cursosCount}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Disciplinas ativas e inativas</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-gold/30 bg-card">
          <CardContent className="p-6">
            <Wallet className="absolute right-4 top-4 h-10 w-10 text-gold/30" />
            <div className="text-xs uppercase tracking-widest text-gold font-semibold">Receita Total (Pix/Dinheiro)</div>
            <div className="mt-2 text-2xl font-bold font-serif text-primary">
              R$ {(data?.totalRevenue ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Pagamentos aprovados no sistema</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardContent className="p-6">
            <FileText className="absolute right-4 top-4 h-10 w-10 text-gold/20" />
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Cobranças Pendentes</div>
            <div className="mt-2 text-3xl font-bold font-serif text-primary">{data?.pendingPaymentsCount}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Faturas aguardando pagamento</p>
          </CardContent>
        </Card>
      </div>

      {/* Grid de Atalhos Rápidos e Resumos */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Links Administrativos */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="font-serif text-xl">Atalhos Administrativos</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Link to="/admin/cursos">
              <Button variant="outline" className="w-full justify-start gap-2 h-11">
                <BookOpen className="h-4 w-4 text-gold" /> Cadastrar & Editar Cursos
              </Button>
            </Link>
            <Link to="/admin/professores">
              <Button variant="outline" className="w-full justify-start gap-2 h-11">
                <GraduationCap className="h-4 w-4 text-gold" /> Vínculo de Professores
              </Button>
            </Link>
            <Link to="/admin/alunos">
              <Button variant="outline" className="w-full justify-start gap-2 h-11">
                <Users className="h-4 w-4 text-gold" /> Painel de Alunos
              </Button>
            </Link>
            <Link to="/admin/financeiro">
              <Button variant="outline" className="w-full justify-start gap-2 h-11">
                <Wallet className="h-4 w-4 text-gold" /> Conciliação Financeira
              </Button>
            </Link>
            <Link to="/admin/matriculas">
              <Button variant="outline" className="w-full justify-start gap-2 h-11">
                <TrendingUp className="h-4 w-4 text-gold" /> Relatórios Acadêmicos
              </Button>
            </Link>
            <Link to="/admin/notificacoes">
              <Button variant="outline" className="w-full justify-start gap-2 h-11">
                <Bell className="h-4 w-4 text-gold" /> Disparar Avisos Globais
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Visão de Atividades Recentes */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="font-serif text-xl">Resumo do Sistema</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-slate-50 dark:bg-slate-900 border p-4 text-sm text-muted-foreground space-y-3 leading-relaxed">
              <p>
                <strong>Bem-vindo ao Painel SETE!</strong> Como administrador, você possui permissão total sobre o catálogo de cursos, emissão de certificados, lançamento financeiro e comunicados escolares.
              </p>
              <p>
                Para alterar regras de usuários ou atribuir novas contas a cargos de secretaria, professor ou administrador, utilize o menu de <strong>Super Administração</strong> ou solicite ao suporte técnico.
              </p>
            </div>

            <div className="border border-dashed rounded-xl p-4 flex justify-between items-center bg-card">
              <div>
                <h4 className="font-serif font-bold text-sm">Relatório Geral</h4>
                <p className="text-xs text-muted-foreground">Exporte matrículas e finanças no painel consolidado.</p>
              </div>
              <Link to="/admin/financeiro">
                <Button size="xs" className="bg-gold text-gold-foreground hover:bg-gold/90">
                  Ver Finanças
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
