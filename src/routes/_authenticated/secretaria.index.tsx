import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, FileText, Wallet, BookOpen, Clock, ChevronRight, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/secretaria/")({
  component: SecretariaHome,
});

function SecretariaHome() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["secretaria-home"],
    queryFn: async () => {
      const [alunosRes, matriculasRes, solicitacoesRes, cursosRes] = await Promise.all([
        supabase.from("user_roles").select("id").eq("role", "aluno"),
        supabase.from("matriculas").select("id", { count: "exact" }).eq("status", "ativa"),
        supabase.from("secretaria_solicitacoes").select("*, profiles:aluno_id(nome_completo)").eq("status", "pendente").order("created_at", { ascending: false }).limit(5),
        supabase.from("cursos").select("id", { count: "exact" }),
      ]);

      return {
        alunosCount: alunosRes.data?.length ?? 0,
        matriculasCount: matriculasRes.count ?? 0,
        solicitacoesPendentes: solicitacoesRes.data ?? [],
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
        <p className="text-xs font-medium uppercase tracking-widest text-gold">Secretaria Geral</p>
        <h1 className="mt-1 font-serif text-4xl">Painel de Controle</h1>
      </div>

      {/* Estatísticas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold font-serif text-primary">{data?.alunosCount}</div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground mt-1">Alunos Cadastrados</div>
            </div>
            <Users className="h-8 w-8 text-gold" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold font-serif text-primary">{data?.matriculasCount}</div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground mt-1">Matrículas Ativas</div>
            </div>
            <BookOpen className="h-8 w-8 text-gold" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold font-serif text-primary">
                {data?.solicitacoesPendentes.length}
              </div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground mt-1">Solicitações Pendentes</div>
            </div>
            <FileText className="h-8 w-8 text-gold" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold font-serif text-primary">{data?.cursosCount}</div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground mt-1">Cursos Totais</div>
            </div>
            <BookOpen className="h-8 w-8 text-gold" />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Atalhos Rápidos */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="font-serif text-xl">Atalhos da Secretaria</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Link to="/secretaria/alunos">
              <Button variant="outline" className="w-full justify-start gap-2 h-11">
                <Users className="h-4 w-4 text-gold" /> Gerenciar Alunos
              </Button>
            </Link>
            <Link to="/secretaria/matriculas">
              <Button variant="outline" className="w-full justify-start gap-2 h-11">
                <BookOpen className="h-4 w-4 text-gold" /> Efetuar Matrícula
              </Button>
            </Link>
            <Link to="/secretaria/pagamentos-dinheiro">
              <Button variant="outline" className="w-full justify-start gap-2 h-11">
                <Wallet className="h-4 w-4 text-gold" /> Lançar Pagamento (Dinheiro)
              </Button>
            </Link>
            <Link to="/secretaria/solicitacoes">
              <Button variant="outline" className="w-full justify-start gap-2 h-11">
                <FileText className="h-4 w-4 text-gold" /> Atender Solicitações
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Últimas Solicitações de Alunos */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="font-serif text-xl flex items-center gap-2">
              <Clock className="h-5 w-5 text-gold" /> Solicitações Recentes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data?.solicitacoesPendentes.length === 0 ? (
              <div className="text-center p-6 text-sm text-muted-foreground flex flex-col items-center gap-1">
                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                Nenhuma solicitação acadêmica aguardando atendimento. Tudo em dia!
              </div>
            ) : (
              data?.solicitacoesPendentes.map((s: any) => (
                <div key={s.id} className="flex justify-between items-center p-3 rounded-lg border bg-card hover:bg-slate-50 dark:hover:bg-slate-900 transition">
                  <div>
                    <h4 className="font-serif font-bold text-sm leading-tight">{s.tipo}</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Aluno: {s.profiles?.nome_completo || "Desconhecido"} • {new Date(s.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <Link to="/secretaria/solicitacoes" className="text-xs text-primary font-semibold flex items-center gap-0.5 hover:underline">
                    Responder <ChevronRight className="h-3 w-3" />
                  </Link>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
