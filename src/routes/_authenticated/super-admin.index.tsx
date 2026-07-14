import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Users, LifeBuoy, BookOpen, Settings, FileText, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/_authenticated/super-admin/")({
  component: SuperAdminHome,
});

function SuperAdminHome() {
  const { data, isLoading } = useQuery({
    queryKey: ["super-admin-home-dashboard"],
    queryFn: async () => {
      const [usersRes, ticketsRes, coursesRes, settingsRes] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact" }),
        supabase.from("suporte_tickets").select("id").or("status.eq.aberto,status.eq.em_andamento"),
        supabase.from("cursos").select("id", { count: "exact" }),
        supabase.from("app_settings").select("chave"),
      ]);

      return {
        usersCount: usersRes.count ?? 0,
        activeTicketsCount: ticketsRes.data?.length ?? 0,
        coursesCount: coursesRes.count ?? 0,
        settingsCount: settingsRes.data?.length ?? 0,
      };
    },
  });

  if (isLoading) {
    return <p className="text-muted-foreground p-4">Carregando painel…</p>;
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-gold font-mono">Painel Superior</p>
        <h1 className="mt-1 font-serif text-4xl flex items-center gap-2">
          <Shield className="h-9 w-9 text-gold" /> Super Administração
        </h1>
      </div>

      {/* Cards de Métricas Globais */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold font-serif text-primary">{data?.usersCount}</div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground mt-1">Total de Usuários</div>
            </div>
            <Users className="h-8 w-8 text-gold" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold font-serif text-amber-500">{data?.activeTicketsCount}</div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground mt-1">Tickets de Suporte Ativos</div>
            </div>
            <LifeBuoy className="h-8 w-8 text-amber-500" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold font-serif text-primary">{data?.coursesCount}</div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground mt-1">Cursos Cadastrados</div>
            </div>
            <BookOpen className="h-8 w-8 text-gold" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold font-serif text-primary">{data?.settingsCount}</div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground mt-1">Configurações Ativas</div>
            </div>
            <Settings className="h-8 w-8 text-gold" />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Links do Super Admin */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="font-serif text-xl">Gestão Operacional</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Link to="/super-admin/usuarios">
              <Button variant="outline" className="w-full justify-start gap-2 h-11">
                <Users className="h-4 w-4 text-gold" /> Controle de Permissões
              </Button>
            </Link>
            <Link to="/super-admin/cursos">
              <Button variant="outline" className="w-full justify-start gap-2 h-11">
                <BookOpen className="h-4 w-4 text-gold" /> Catálogo Geral de Cursos
              </Button>
            </Link>
            <Link to="/super-admin/relatorios">
              <Button variant="outline" className="w-full justify-start gap-2 h-11">
                <FileText className="h-4 w-4 text-gold" /> Relatórios Consolidados
              </Button>
            </Link>
            <Link to="/super-admin/suporte">
              <Button variant="outline" className="w-full justify-start gap-2 h-11">
                <LifeBuoy className="h-4 w-4 text-gold" /> Atendimento de Suporte
              </Button>
            </Link>
            <Link to="/super-admin/configuracoes">
              <Button variant="outline" className="w-full justify-start gap-2 h-11">
                <Settings className="h-4 w-4 text-gold" /> Integrações e Credenciais
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Console de Monitoramento */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="font-serif text-xl">Monitoramento e Segurança</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-slate-900 border p-5 text-sm text-slate-300 leading-relaxed font-mono">
              <p className="text-emerald-400 font-bold"># STATUS DO CONSOLE: SEGURO</p>
              <p className="mt-2">• Banco de dados conectado via Supabase Client</p>
              <p className="mt-1">• Variáveis de ambiente carregadas</p>
              <p className="mt-1">• Nível de acesso: SUPER_ADMINISTRADOR</p>
            </div>

            <div className="border border-dashed rounded-xl p-4 flex justify-between items-center bg-card">
              <div>
                <h4 className="font-serif font-bold text-sm">Tickets Pendentes</h4>
                <p className="text-xs text-muted-foreground">Responda aos chamados abertos pelos alunos e professores.</p>
              </div>
              <Link to="/super-admin/suporte">
                <Button size="sm" className="bg-gold text-gold-foreground hover:bg-gold/90 flex items-center gap-0.5">
                  Ver chamados <ChevronRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
