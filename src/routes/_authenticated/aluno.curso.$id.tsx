import { createFileRoute, useParams, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle2, Circle, FileText, HelpCircle, Loader2 } from "lucide-react";
import { useState } from "react";
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

  // Active Assessment State
  const [activeEval, setActiveEval] = useState<any | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [isEvalStarted, setIsEvalStarted] = useState(false);
  const [evalResult, setEvalResult] = useState<any | null>(null);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["curso-aluno", id, user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [{ data: matricula }, { data: curso }, { data: progresso }, { data: tentativas }] = await Promise.all([
        supabase.from("matriculas").select("id, status").eq("curso_id", id).eq("aluno_id", user!.id).maybeSingle(),
        supabase.from("cursos").select("id, titulo, descricao, modulos(id, ordem, titulo, aulas(id, ordem, titulo, video_url, material_url, conteudo), avaliacoes(id, titulo, descricao, nota_minima, questionario_id, quantidade_questoes))").eq("id", id).maybeSingle(),
        supabase.from("progresso_aula").select("aula_id, concluida").eq("matricula_id", (await supabase.from("matriculas").select("id").eq("curso_id", id).eq("aluno_id", user!.id).maybeSingle()).data?.id ?? ""),
        supabase.from("tentativas_avaliacao").select("avaliacao_id, nota, aprovado, realizada_em").eq("aluno_id", user!.id),
      ]);
      return { matricula, curso, progresso: progresso ?? [], tentativas: tentativas ?? [] };
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

  const iniciarAvaliacao = async (evalObj: any) => {
    setActiveEval(evalObj);
    setLoadingQuestions(true);
    setIsEvalStarted(true);
    setEvalResult(null);
    setSelectedAnswers({});
    
    try {
      const { data: allQuestions, error } = await supabase
        .from("questoes_questionario")
        .select("*")
        .eq("questionario_id", evalObj.questionario_id);

      if (error) throw error;
      if (!allQuestions || allQuestions.length === 0) {
        throw new Error("Este questionário ainda não tem questões cadastradas.");
      }

      const limit = evalObj.quantidade_questoes || 10;
      const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, limit);
      
      const questionsWithShuffledAlternatives = selected.map(q => {
        const alts = Array.isArray(q.alternativas) ? [...q.alternativas] : [];
        const shuffledAlts = alts.sort(() => Math.random() - 0.5);
        return {
          ...q,
          shuffledAlternatives: shuffledAlts
        };
      });

      setQuestions(questionsWithShuffledAlternatives);
    } catch (err: any) {
      toast.error(err.message || "Erro ao carregar questões.");
      setIsEvalStarted(false);
      setActiveEval(null);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const submeterAvaliacao = useMutation({
    mutationFn: async () => {
      const unanswered = questions.filter(q => !selectedAnswers[q.id]);
      if (unanswered.length > 0) {
        throw new Error("Por favor, responda todas as questões antes de enviar.");
      }

      let correctCount = 0;
      questions.forEach((q) => {
        if (selectedAnswers[q.id] === q.resposta_correta) {
          correctCount++;
        }
      });

      const notaFinal = (correctCount / questions.length) * 10;
      const aprovado = notaFinal >= (activeEval.nota_minima || 6.0);

      const { error } = await supabase
        .from("tentativas_avaliacao")
        .insert({
          aluno_id: user!.id,
          avaliacao_id: activeEval.id,
          nota: parseFloat(notaFinal.toFixed(1)),
          aprovado,
          respostas: selectedAnswers,
        });

      if (error) throw error;

      return {
        nota: parseFloat(notaFinal.toFixed(1)),
        aprovado,
        corretas: correctCount,
        total: questions.length
      };
    },
    onSuccess: (res) => {
      setEvalResult(res);
      qc.invalidateQueries({ queryKey: ["curso-aluno", id] });
      if (res.aprovado) {
        toast.success(`Parabéns! Você foi aprovado com nota ${res.nota}!`);
      } else {
        toast.error(`Você tirou nota ${res.nota}. A nota mínima é ${activeEval.nota_minima}. Tente novamente.`);
      }
    },
    onError: (err: any) => {
      toast.error(err.message || "Erro ao salvar avaliação.");
    }
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

  const tentativasMap = new Map();
  (data?.tentativas ?? []).forEach((t) => {
    const existing = tentativasMap.get(t.avaliacao_id);
    if (!existing || t.nota > existing.nota) {
      tentativasMap.set(t.avaliacao_id, t);
    }
  });

  return (
    <div className="space-y-8">
      <div>
        <Link to="/aluno/meus-cursos" className="text-xs text-muted-foreground underline">← Meus cursos</Link>
        <h1 className="mt-2 font-serif text-4xl">{curso?.titulo}</h1>
      </div>

      {modulos.map((m, i) => {
        const aulas = [...(m.aulas ?? [])].sort((a, b) => a.ordem - b.ordem);
        const avaliacoes = m.avaliacoes ?? [];

        return (
          <div key={m.id} className="space-y-4">
            <h2 className="font-serif text-2xl">Módulo {i + 1} · {m.titulo}</h2>
            
            {/* Aulas */}
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

            {/* Avaliações */}
            {avaliacoes.length > 0 && (
              <div className="mt-4 pt-2 border-t border-dashed border-border space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <HelpCircle className="h-4 w-4 text-gold" /> Avaliações do Módulo
                </h3>
                <div className="grid gap-3">
                  {avaliacoes.map((e: any) => {
                    const tentativa = tentativasMap.get(e.id);
                    const aprovado = tentativa?.aprovado;
                    const nota = tentativa?.nota;

                    return (
                      <Card key={e.id} className="border-gold/30 bg-gold/5">
                        <CardContent className="p-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-start gap-3">
                            <div className="h-10 w-10 rounded-full bg-gold/10 flex items-center justify-center">
                              <HelpCircle className="h-5 w-5 text-gold" />
                            </div>
                            <div>
                              <h4 className="font-serif text-lg font-bold text-slate-100">{e.titulo}</h4>
                              <p className="text-xs text-muted-foreground">{e.descricao || "Orientação geral da prova."}</p>
                              <div className="flex gap-2 mt-2">
                                <Badge variant="outline" className="text-[10px] py-0 text-gold-foreground border-gold/20 bg-transparent">
                                  Mínimo: {Number(e.nota_minima).toFixed(1)}
                                </Badge>
                                {tentativa && (
                                  <Badge className={aprovado ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] py-0" : "bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] py-0"}>
                                    {aprovado ? `Aprovado - Nota ${nota}` : `Reprovado - Nota ${nota}`}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>

                          <Button
                            onClick={() => iniciarAvaliacao(e)}
                            variant={aprovado ? "outline" : "default"}
                            className={aprovado ? "border-gold/30 text-gold" : "bg-gold text-gold-foreground hover:bg-gold/90"}
                          >
                            {aprovado ? "Ver Nota / Refazer" : tentativa ? "Refazer Prova" : "Iniciar Prova"}
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* EXAM PLAYER DIALOG */}
      <Dialog
        open={isEvalStarted}
        onOpenChange={(open) => {
          if (!open) {
            if (evalResult || confirm("Sua tentativa atual será perdida. Deseja mesmo sair?")) {
              setIsEvalStarted(false);
              setActiveEval(null);
              setQuestions([]);
              setEvalResult(null);
            }
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl text-gold">{activeEval?.titulo}</DialogTitle>
            <DialogDescription>{activeEval?.descricao || "Responda as questões abaixo atentamente."}</DialogDescription>
          </DialogHeader>

          {loadingQuestions ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-gold" />
              <span className="text-sm text-muted-foreground">Sorteando e embaralhando questões...</span>
            </div>
          ) : evalResult ? (
            /* Results Screen */
            <div className="py-6 text-center space-y-4">
              <div className="mx-auto h-16 w-16 rounded-full flex items-center justify-center bg-gold/10">
                <HelpCircle className="h-8 w-8 text-gold" />
              </div>
              <h3 className="font-serif text-2xl font-bold">
                {evalResult.aprovado ? "Parabéns, você foi Aprovado(a)!" : "Você não alcançou a média."}
              </h3>
              <p className="text-muted-foreground text-sm max-w-md mx-auto">
                {evalResult.aprovado 
                  ? "Sua nota foi registrada com sucesso no sistema acadêmico. Você já pode continuar seus estudos." 
                  : `Você tirou nota ${evalResult.nota}. A nota mínima exigida para este módulo é ${activeEval?.nota_minima}.`}
              </p>
              
              <div className="py-4 border rounded-lg bg-slate-950/20 max-w-sm mx-auto grid grid-cols-2 gap-4">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Nota Final</div>
                  <div className="text-3xl font-bold text-gold mt-1">{evalResult.nota}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Respostas</div>
                  <div className="text-3xl font-bold mt-1 text-slate-100">{evalResult.corretas} / {evalResult.total}</div>
                </div>
              </div>

              <div className="pt-4 flex gap-2">
                <Button className="w-full" variant="outline" onClick={() => setIsEvalStarted(false)}>
                  Fechar
                </Button>
                {!evalResult.aprovado && (
                  <Button className="w-full bg-gold text-gold-foreground hover:bg-gold/90" onClick={() => iniciarAvaliacao(activeEval)}>
                    Tentar Novamente
                  </Button>
                )}
              </div>
            </div>
          ) : (
            /* Questions Form Screen */
            <div className="space-y-6 py-2">
              {questions.map((q, idx) => (
                <div key={q.id} className="p-4 border rounded-lg bg-slate-950/10 space-y-3">
                  <div className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Questão {idx + 1} de {questions.length}</div>
                  <p className="font-medium text-slate-100">{q.enunciado}</p>
                  
                  <div className="grid gap-2 pt-2">
                    {(q.shuffledAlternatives ?? []).map((alt: string, aIdx: number) => {
                      const isSelected = selectedAnswers[q.id] === alt;
                      return (
                        <button
                          key={aIdx}
                          type="button"
                          onClick={() => setSelectedAnswers(prev => ({ ...prev, [q.id]: alt }))}
                          className={`w-full text-left p-3 rounded-lg border text-sm font-medium transition flex items-center justify-between ${
                            isSelected 
                              ? "border-gold bg-gold/5 text-gold" 
                              : "border-border hover:border-slate-700 hover:bg-slate-900/50 text-slate-300"
                          }`}
                        >
                          <span>{alt}</span>
                          <div className={`h-4 w-4 rounded-full border flex items-center justify-center ${isSelected ? "border-gold bg-gold" : "border-muted-foreground"}`}>
                            {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-slate-950" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              <div className="pt-4 flex gap-2">
                <Button variant="outline" className="w-full" onClick={() => setIsEvalStarted(false)}>
                  Cancelar Prova
                </Button>
                <Button
                  className="w-full bg-gold text-gold-foreground hover:bg-gold/90"
                  onClick={() => submeterAvaliacao.mutate()}
                  disabled={submeterAvaliacao.isPending}
                >
                  {submeterAvaliacao.isPending ? "Corrigindo..." : "Enviar Respostas"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
