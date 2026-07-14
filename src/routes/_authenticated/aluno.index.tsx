import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Award, Bell } from "lucide-react";

export const Route = createFileRoute("/_authenticated/aluno/")({
  component: AlunoHome,
});

function AlunoHome() {
  const { user } = useAuth();
  const { data } = useQuery({
    queryKey: ["aluno-home", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [m, c, n] = await Promise.all([
        supabase.from("matriculas").select("id, status").eq("aluno_id", user!.id),
        supabase.from("certificados").select("id").eq("aluno_id", user!.id),
        supabase.from("notificacoes").select("id").eq("destinatario_id", user!.id).eq("lida", false),
      ]);
      return {
        matriculas: m.data?.length ?? 0,
        ativas: m.data?.filter((x) => x.status === "ativa").length ?? 0,
        certificados: c.data?.length ?? 0,
        naoLidas: n.data?.length ?? 0,
      };
    },
  });

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-gold">Bem-vindo</p>
        <h1 className="mt-1 font-serif text-4xl">Seu portal SETE</h1>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <Stat icon={BookOpen} label="Cursos ativos" value={data?.ativas ?? "—"} />
        <Stat icon={BookOpen} label="Matrículas totais" value={data?.matriculas ?? "—"} />
        <Stat icon={Award} label="Certificados" value={data?.certificados ?? "—"} />
        <Stat icon={Bell} label="Não lidas" value={data?.naoLidas ?? "—"} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Link to="/aluno/meus-cursos">
          <Card className="transition hover:shadow-md">
            <CardContent className="p-6">
              <div className="font-serif text-xl">Continuar estudando</div>
              <p className="mt-1 text-sm text-muted-foreground">Acesse seus cursos matriculados.</p>
            </CardContent>
          </Card>
        </Link>
        <Link to="/aluno/cursos-disponiveis">
          <Card className="transition hover:shadow-md">
            <CardContent className="p-6">
              <div className="font-serif text-xl">Novos cursos</div>
              <p className="mt-1 text-sm text-muted-foreground">Explore o catálogo e matricule-se.</p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: number | string }) {
  return (
    <Card>
      <CardContent className="p-6">
        <Icon className="h-5 w-5 text-gold" />
        <div className="mt-3 font-serif text-3xl text-primary">{value}</div>
        <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
      </CardContent>
    </Card>
  );
}
