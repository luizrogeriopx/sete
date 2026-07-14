import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Award, Download } from "lucide-react";
import { Button } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/aluno/certificados")({
  component: Page,
});

function Page() {
  const { user } = useAuth();
  const { data } = useQuery({
    queryKey: ["certificados-aluno", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("certificados")
        .select("id, codigo_validacao, emitido_em, cursos(titulo)")
        .eq("aluno_id", user!.id);
      return data ?? [];
    },
  });

  return (
    <div>
      <h1 className="font-serif text-4xl">Meus certificados</h1>
      <p className="mt-1 text-muted-foreground">Cursos concluídos com aprovação.</p>

      {(data ?? []).length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          Você ainda não concluiu cursos.
        </div>
      ) : (
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {data!.map((c) => (
            <Card key={c.id}>
              <CardContent className="p-6">
                <Award className="h-6 w-6 text-gold" />
                <div className="mt-2 font-serif text-lg">{c.cursos?.titulo}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Emitido em {new Date(c.emitido_em).toLocaleDateString("pt-BR")}
                </div>
                <div className="mt-3 text-xs">
                  Código: <code>{c.codigo_validacao}</code>
                </div>
                <div className="mt-4">
                  <Link
                    to="/certificado/validar/$codigo"
                    params={{ codigo: c.codigo_validacao }}
                    className="text-primary underline text-sm"
                  >
                    Página pública de validação
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
