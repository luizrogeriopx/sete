import { createFileRoute, useParams, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, FileText } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/aluno/curso/$id")({
  component: CursoAluno,
});

function getEmbedUrl(url: string | null): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com")) {
      const id = u.searchParams.get("v");
      return id ? `https://www.youtube.com/embed/${id}` : url;
    }
    if (u.hostname === "youtu.be") return `https://www.youtube.com/embed${u.pathname}`;
    if (u.hostname.includes("vimeo.com")) return `https://player.vimeo.com/video${u.pathname}`;
  } catch { /* noop */ }
  return url;
}

function CursoAluno() {
  const { id } = useParams({ from: "/_authenticated/aluno/curso/$id" });
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["curso-aluno", id, user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [{ data: matricula }, { data: curso }, { data: progresso }] = await Promise.all([
        supabase.from("matriculas").select("id, status").eq("curso_id", id).eq("aluno_id", user!.id).maybeSingle(),
        supabase.from("cursos").select("id, titulo, descricao, modulos(id, ordem, titulo, aulas(id, ordem, titulo, video_url, material_url, conteudo))").eq("id", id).maybeSingle(),
        supabase.from("progresso_aula").select("aula_id, concluida").eq("matricula_id", (await supabase.from("matriculas").select("id").eq("curso_id", id).eq("aluno_id", user!.id).maybeSingle()).data?.id ?? ""),
      ]);
      return { matricula, curso, progresso: progresso ?? [] };
    },
  });

  const marcarConcluida = useMutation({
    mutationFn: async ({ aulaId, concluida }: { aulaId: string; concluida: boolean }) => {
      const matriculaId = data?.matricula?.id;
      if (!matriculaId) throw new Error("Matrícula não encontrada");
      const { error } = await supabase.from("progresso_aula").upsert({
        matricula_id: matriculaId,
        aula_id: aulaId,
        concluida,
        concluida_em: concluida ? new Date().toISOString() : null,
      }, { onConflict: "matricula_id,aula_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["curso-aluno", id] });
      toast.success("Progresso atualizado");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <p>Carregando…</p>;
  if (!data?.matricula) return (
    <div className="rounded-lg border border-dashed p-8 text-center">
      <p>Você não está matriculado neste curso.</p>
      <Button asChild className="mt-3"><Link to="/aluno/cursos-disponiveis">Ver cursos</Link></Button>
    </div>
  );
  if (data.matricula.status !== "ativa") return (
    <div className="rounded-lg border border-dashed p-8 text-center">
      <p>Sua matrícula está <strong>{data.matricula.status}</strong>.</p>
      <p className="mt-2 text-sm text-muted-foreground">Regularize pagamento em <Link to="/aluno/financeiro" className="text-primary underline">Financeiro</Link>.</p>
    </div>
  );

  const curso = data.curso;
  const doneMap = new Map(data.progresso.map((p) => [p.aula_id, p.concluida]));
  const modulos = [...(curso?.modulos ?? [])].sort((a, b) => a.ordem - b.ordem);

  return (
    <div className="space-y-8">
      <div>
        <Link to="/aluno/meus-cursos" className="text-xs text-muted-foreground underline">← Meus cursos</Link>
        <h1 className="mt-2 font-serif text-4xl">{curso?.titulo}</h1>
      </div>

      {modulos.map((m, i) => {
        const aulas = [...(m.aulas ?? [])].sort((a, b) => a.ordem - b.ordem);
        return (
          <div key={m.id}>
            <h2 className="font-serif text-2xl">Módulo {i + 1} · {m.titulo}</h2>
            <div className="mt-3 space-y-3">
              {aulas.map((a) => {
                const done = !!doneMap.get(a.id);
                const embed = getEmbedUrl(a.video_url);
                return (
                  <Card key={a.id}>
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="font-serif text-lg">{a.titulo}</div>
                          {embed && (
                            <div className="mt-3 aspect-video overflow-hidden rounded-md bg-black">
                              <iframe src={embed} className="h-full w-full" allowFullScreen title={a.titulo} />
                            </div>
                          )}
                          {a.conteudo && (
                            <p className="mt-3 whitespace-pre-line text-sm text-muted-foreground">{a.conteudo}</p>
                          )}
                          {a.material_url && (
                            <a href={a.material_url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 text-sm text-primary underline">
                              <FileText className="h-4 w-4" /> Material da aula
                            </a>
                          )}
                        </div>
                        <Button
                          variant={done ? "secondary" : "outline"}
                          size="sm"
                          onClick={() => marcarConcluida.mutate({ aulaId: a.id, concluida: !done })}
                        >
                          {done ? <CheckCircle2 className="mr-2 h-4 w-4" /> : <Circle className="mr-2 h-4 w-4" />}
                          {done ? "Concluída" : "Marcar concluída"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
