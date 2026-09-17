import { createFileRoute, useParams, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, hasAnyRole } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  CheckCircle2,
  Circle,
  FileText,
  HelpCircle,
  Loader2,
  ChevronDown,
  Video,
  BookOpen,
  Image as ImageIcon,
  Lock,
} from "lucide-react";
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
  const { user, roles } = useAuth();
  const qc = useQueryClient();
  const isAdminOrSuper = hasAnyRole(roles, "admin", "super_admin");

  // Active Assessment State
  const [activeEval, setActiveEval] = useState<any | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [isEvalStarted, setIsEvalStarted] = useState(false);
  const [evalResult, setEvalResult] = useState<any | null>(null);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  // Estados de acordeão: módulos e aulas fechados por padrão
  const [openModules, setOpenModules] = useState<Record<string, boolean>>({});
  const [openAulas, setOpenAulas] = useState<Record<string, boolean>>({});

  const { data, isLoading } = useQuery({
    queryKey: ["curso-aluno", id, user?.id, isAdminOrSuper],
    enabled: !!user,
    queryFn: async () => {
      let { data: matricula } = await supabase
        .from("matriculas")
        .select("id, status")
        .eq("curso_id", id)
        .eq("aluno_id", user!.id)
        .maybeSingle();

      // Admins e Super Admins nunca são cobrados e possuem acesso irrestrito
      if (isAdminOrSuper) {
        if (!matricula) {
          const { data: novaMatricula } = await supabase
            .from("matriculas")
            .insert({
              aluno_id: user!.id,
              curso_id: id,
              status: "ativa",
              progresso: 0,
              modalidade_escolhida: "online",
            })
            .select("id, status")
            .single();
          matricula = novaMatricula;
        } else if (matricula.status === "pendente") {
          await supabase
            .from("matriculas")
            .update({ status: "ativa" })
            .eq("id", matricula.id);
          matricula = { ...matricula, status: "ativa" };
        }
      }

      const [{ data: curso }, { data: progresso }, { data: tentativas }] = await Promise.all([
        supabase.from("cursos").select("id, titulo, descricao, modulos(id, ordem, titulo, aulas(*), avaliacoes(id, titulo, descricao, nota_minima, questionario_id, quantidade_questoes))").eq("id", id).maybeSingle(),
        matricula?.id
          ? supabase.from("progresso_aula").select("aula_id, concluida").eq("matricula_id", matricula.id)
          : Promise.resolve({ data: [] }),
        supabase.from("tentativas_avaliacao").select("avaliacao_id, nota, aprovado, realizada_em").eq("aluno_id", user!.id),
      ]);
      return { matricula, curso, progresso: progresso ?? [], tentativas: tentativas ?? [] };
    },
  });

  const marcarConcluida = useMutation({
    mutationFn: async ({ aulaId, concluida }: { aulaId: string; concluida: boolean }) => {
      let matriculaId = data?.matricula?.id;
      if (!matriculaId && isAdminOrSuper) {
        const { data: nova } = await supabase.from("matriculas").insert({
          aluno_id: user!.id,
          curso_id: id,
          status: "ativa",
          progresso: 0,
          modalidade_escolhida: "online",
        }).select("id").single();
        matriculaId = nova?.id;
      }
      if (!matriculaId) throw new Error("Matrícula não encontrada");
      const { error } = await supabase.from("progresso_aula").upsert({
        matricula_id: matriculaId,
        aula_id: aulaId,
        concluida,
        concluida_em: concluida ? new Date().toISOString() : null,
      }, { onConflict: "matricula_id,aula_id" });
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["curso-aluno", id] });
      if (variables.concluida) {
        toast.success("Aula concluída com sucesso! Próxima aula liberada.");
      } else {
        toast.info("Status da aula desmarcado.");
      }
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

  const matricula = data?.matricula;
  const curso = data?.curso;

  if (!matricula && !isAdminOrSuper) return (
    <div className="rounded-lg border border-dashed p-8 text-center">
      <p>Você não está matriculado neste curso.</p>
      <Button asChild className="mt-3"><Link to="/aluno/cursos-disponiveis">Ver cursos</Link></Button>
    </div>
  );

  const status = matricula?.status;
  // Acesso liberado: Admin/Super Admin sempre tem acesso; alunos têm acesso se a matrícula for 'ativa' ou 'concluida'
  const isLiberado = isAdminOrSuper || status === "ativa" || status === "concluida";

  if (!isLiberado) {
    if (status === "pendente") {
      return (
        <div className="rounded-lg border border-dashed p-8 text-center max-w-md mx-auto my-12 space-y-3">
          <p className="font-semibold text-lg">Matrícula Pendente</p>
          <p className="text-sm text-muted-foreground">
            Sua matrícula está aguardando confirmação de pagamento.
          </p>
          <p className="text-sm text-muted-foreground">
            Regularize o pagamento em <Link to="/aluno/financeiro" className="text-primary underline font-medium">Financeiro</Link> para liberar o acesso às aulas e materiais.
          </p>
          <Button asChild className="mt-2">
            <Link to="/aluno/financeiro">Ir para o Financeiro</Link>
          </Button>
        </div>
      );
    }
    if (status === "trancada") {
      return (
        <div className="rounded-lg border border-dashed p-8 text-center max-w-md mx-auto my-12 space-y-3">
          <p className="font-semibold text-lg">Matrícula Trancada</p>
          <p className="text-sm text-muted-foreground">
            Sua matrícula neste curso está trancada.
          </p>
          <p className="text-sm text-muted-foreground">
            Entre em contato com a secretaria do seminário para solicitar o destrancamento.
          </p>
        </div>
      );
    }
    if (status === "cancelada") {
      return (
        <div className="rounded-lg border border-dashed p-8 text-center max-w-md mx-auto my-12 space-y-3">
          <p className="font-semibold text-lg">Matrícula Cancelada</p>
          <p className="text-sm text-muted-foreground">
            Esta matrícula foi cancelada. Entre em contato com a secretaria caso tenha dúvidas.
          </p>
        </div>
      );
    }
    return (
      <div className="rounded-lg border border-dashed p-8 text-center max-w-md mx-auto my-12 space-y-3">
        <p>Sua matrícula está <strong>{status || "inativa"}</strong>.</p>
        <p className="text-sm text-muted-foreground">
          Entre em contato com a secretaria do seminário para mais informações.
        </p>
      </div>
    );
  }

  const doneMap = new Map(data.progresso.map((p) => [p.aula_id, p.concluida]));
  const modulos = [...(curso?.modulos ?? [])].sort((a, b) => a.ordem - b.ordem);

  const tentativasMap = new Map();
  (data?.tentativas ?? []).forEach((t) => {
    const existing = tentativasMap.get(t.avaliacao_id);
    if (!existing || t.nota > existing.nota) {
      tentativasMap.set(t.avaliacao_id, t);
    }
  });

  // Se o aluno já concluiu a formação completa ou é Admin/Super, tudo fica 100% liberado para consulta
  const isExemptFromLock = isAdminOrSuper || status === "concluida";

  // Verifica se um determinado módulo está 100% concluído (todas as aulas marcadas e provas aprovadas)
  const isModuleCompleted = (m: any) => {
    const aList = m.aulas ?? [];
    const evList = m.avaliacoes ?? [];
    const aulasDone = aList.length === 0 || aList.every((a: any) => !!doneMap.get(a.id));
    const evalsDone = evList.length === 0 || evList.every((ev: any) => tentativasMap.get(ev.id)?.aprovado);
    return aulasDone && evalsDone;
  };

  // Verifica se o módulo está liberado (o 1º módulo sempre é liberado; os seguintes exigem a conclusão dos anteriores)
  const isModuleUnlocked = (modIndex: number) => {
    if (isExemptFromLock) return true;
    if (modIndex === 0) return true;
    for (let k = 0; k < modIndex; k++) {
      if (!isModuleCompleted(modulos[k])) {
        return false;
      }
    }
    return true;
  };

  // Verifica se uma aula específica está liberada para o aluno
  const isAulaUnlocked = (
    modIndex: number,
    aulaIndex: number,
    aula: any,
    moduleAulas: any[]
  ) => {
    if (isExemptFromLock) return true;
    if (!isModuleUnlocked(modIndex)) return false;
    if (doneMap.get(aula.id)) return true; // Já concluída anteriormente, permanece acessível para consulta
    if (aulaIndex === 0) return true; // 1ª aula do módulo desbloqueado
    // Liberada apenas se a aula anterior neste módulo foi concluída
    const prevAula = moduleAulas[aulaIndex - 1];
    return !!doneMap.get(prevAula?.id);
  };

  // Verifica se as avaliações do módulo estão liberadas (apenas após concluir todas as aulas daquele módulo)
  const areModuleEvaluationsUnlocked = (
    modIndex: number,
    moduleAulas: any[]
  ) => {
    if (isExemptFromLock) return true;
    if (!isModuleUnlocked(modIndex)) return false;
    return moduleAulas.length === 0 || moduleAulas.every((a: any) => !!doneMap.get(a.id));
  };

  const handleToggleModulo = (moduloId: string, unlocked: boolean, modIndex: number) => {
    if (!unlocked) {
      toast.info(`O Módulo ${modIndex + 1} está bloqueado. Conclua todas as aulas e avaliações do módulo anterior para desbloqueá-lo.`);
      return;
    }
    setOpenModules((prev) => ({
      ...prev,
      [moduloId]: !prev[moduloId],
    }));
  };

  const handleToggleAula = (aulaId: string, unlocked: boolean) => {
    if (!unlocked) {
      toast.info("Esta aula está bloqueada. Conclua a aula anterior para ter acesso.");
      return;
    }
    setOpenAulas((prev) => ({
      ...prev,
      [aulaId]: !prev[aulaId],
    }));
  };

  const handleExpandAll = () => {
    const allMods: Record<string, boolean> = {};
    const allAulas: Record<string, boolean> = {};
    modulos.forEach((m, mIdx) => {
      if (isModuleUnlocked(mIdx)) {
        allMods[m.id] = true;
        const mAulas = [...(m.aulas ?? [])].sort((a, b) => a.ordem - b.ordem);
        mAulas.forEach((a, aIdx) => {
          if (isAulaUnlocked(mIdx, aIdx, a, mAulas)) {
            allAulas[a.id] = true;
          }
        });
      }
    });
    setOpenModules(allMods);
    setOpenAulas(allAulas);
  };

  const handleCollapseAll = () => {
    setOpenModules({});
    setOpenAulas({});
  };

  return (
    <div className="space-y-8">
      <div>
        <Link to="/aluno/meus-cursos" className="text-xs text-muted-foreground underline">← Meus cursos</Link>
        <div className="mt-2 flex items-center gap-3 flex-wrap">
          <h1 className="font-serif text-4xl">{curso?.titulo}</h1>
          {status === "concluida" && (
            <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white font-semibold">
              Curso Concluído
            </Badge>
          )}
          {isAdminOrSuper && (
            <Badge variant="outline" className="border-primary text-primary font-medium">
              Acesso Administrativo (Isento)
            </Badge>
          )}
        </div>
        {status === "concluida" && (
          <div className="mt-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-4 text-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              <span>Você concluiu esta formação com sucesso! Todas as aulas e materiais permanecem liberados para consulta.</span>
            </div>
            <Button asChild size="sm" variant="outline" className="border-emerald-600 text-emerald-700 hover:bg-emerald-600 hover:text-white shrink-0">
              <Link to="/aluno/certificados">Ver Certificados</Link>
            </Button>
          </div>
        )}
      </div>

      {/* Barra de Ações Rápidas: Contagem e Expandir/Recolher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2 pb-1 border-b border-border/60">
        <div className="text-sm text-muted-foreground flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-[#ff3403]" />
          <span>
            {modulos.length} {modulos.length === 1 ? "módulo" : "módulos"} •{" "}
            {modulos.reduce((acc, m) => acc + (m.aulas?.length || 0), 0)} aulas no total
          </span>
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleExpandAll}
            className="text-xs h-8 text-muted-foreground hover:text-foreground"
          >
            Expandir Liberados
          </Button>
          <span className="text-muted-foreground/30">•</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleCollapseAll}
            className="text-xs h-8 text-muted-foreground hover:text-foreground"
          >
            Recolher Todos
          </Button>
        </div>
      </div>

      {/* Lista de Módulos (Acordeão: fechados por padrão e com bloqueio sequencial) */}
      <div className="space-y-4">
        {modulos.map((m, i) => {
          const aulas = [...(m.aulas ?? [])].sort((a, b) => a.ordem - b.ordem);
          const avaliacoes = m.avaliacoes ?? [];
          const isModOpen = !!openModules[m.id];
          const completedAulasCount = aulas.filter((a) => !!doneMap.get(a.id)).length;
          const isModDone = isModuleCompleted(m);
          const modUnlocked = isModuleUnlocked(i);

          if (!modUnlocked) {
            return (
              <div
                key={m.id}
                className="rounded-2xl border border-dashed border-border/80 bg-muted/20 opacity-75 transition-all overflow-hidden"
              >
                {/* Header do Módulo Bloqueado */}
                <div
                  onClick={() => handleToggleModulo(m.id, false, i)}
                  className="w-full text-left p-4 sm:p-5 flex items-center justify-between gap-4 cursor-not-allowed select-none hover:bg-muted/30 transition-colors"
                  role="button"
                  tabIndex={0}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0 bg-muted text-muted-foreground">
                      <Lock className="h-4 w-4" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">
                          Módulo {i + 1}
                        </span>
                        <Badge variant="outline" className="text-[10px] py-0 px-2 font-normal border-dashed text-muted-foreground bg-background/60">
                          <Lock className="h-2.5 w-2.5 mr-1" /> Bloqueado
                        </Badge>
                      </div>
                      <h2 className="font-serif text-lg sm:text-xl font-bold text-muted-foreground truncate mt-0.5">
                        {m.titulo}
                      </h2>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-muted-foreground/80 hidden sm:inline italic">
                      Conclua o Módulo {i} para liberar
                    </span>
                    <Badge variant="outline" className="text-xs font-normal border-border/60 text-muted-foreground bg-background/50">
                      {aulas.length} {aulas.length === 1 ? "aula" : "aulas"}
                    </Badge>
                  </div>
                </div>
              </div>
            );
          }

          return (
            <div
              key={m.id}
              className={`rounded-2xl border transition-all duration-200 overflow-hidden bg-card ${
                isModOpen
                  ? "border-[#ff3403]/40 shadow-sm"
                  : "border-border/80 hover:border-border"
              }`}
            >
              {/* Header do Módulo Liberado (Clicável para abrir/fechar) */}
              <button
                type="button"
                onClick={() => handleToggleModulo(m.id, true, i)}
                className="w-full text-left p-4 sm:p-5 flex items-center justify-between gap-4 transition-colors hover:bg-muted/40 cursor-pointer"
                aria-expanded={isModOpen}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 ${
                      isModOpen
                        ? "bg-[#ff3403] text-white rotate-180"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-black uppercase tracking-wider text-[#ff3403]">
                        Módulo {i + 1}
                      </span>
                      {isModDone && (
                        <Badge className="bg-emerald-600/90 text-white text-[10px] py-0 px-2 font-medium">
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Concluído
                        </Badge>
                      )}
                    </div>
                    <h2 className="font-serif text-lg sm:text-xl font-bold text-foreground truncate mt-0.5">
                      {m.titulo}
                    </h2>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="hidden sm:flex flex-col items-end text-xs text-muted-foreground">
                    <span>
                      {completedAulasCount}/{aulas.length} concluídas
                    </span>
                    {avaliacoes.length > 0 && (
                      <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                        {avaliacoes.length} {avaliacoes.length === 1 ? "prova" : "provas"}
                      </span>
                    )}
                  </div>
                  <Badge variant="outline" className="text-xs font-normal border-border bg-background">
                    {aulas.length} {aulas.length === 1 ? "aula" : "aulas"}
                  </Badge>
                </div>
              </button>

              {/* Conteúdo do Módulo (Exibido apenas quando aberto) */}
              {isModOpen && (
                <div className="p-4 sm:p-6 border-t border-border/60 bg-muted/10 space-y-5 animate-in fade-in-50 duration-200">
                  {m.descricao && (
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      {m.descricao}
                    </p>
                  )}

                  {/* Lista de Aulas do Módulo (Com bloqueio sequencial) */}
                  <div className="space-y-2.5">
                    {aulas.map((a, idx) => {
                      const done = !!doneMap.get(a.id);
                      const embed = getEmbedUrl(a.video_url);
                      const isAulaOpen = !!openAulas[a.id];
                      const aulaUnlocked = isAulaUnlocked(i, idx, a, aulas);

                      if (!aulaUnlocked) {
                        return (
                          <Card
                            key={a.id}
                            onClick={() => handleToggleAula(a.id, false)}
                            className="border border-dashed border-border/70 bg-muted/15 opacity-70 cursor-not-allowed select-none transition-all hover:bg-muted/25"
                          >
                            <div className="p-3.5 sm:p-4 flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                <div className="h-7 w-7 rounded-full flex items-center justify-center shrink-0 bg-muted text-muted-foreground">
                                  <Lock className="h-3.5 w-3.5" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-mono text-[11px] font-bold text-muted-foreground">
                                      Aula {a.ordem || idx + 1}
                                    </span>
                                    <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-normal text-muted-foreground border-dashed bg-background/40">
                                      <Lock className="h-2.5 w-2.5 mr-1" /> Bloqueada
                                    </Badge>
                                  </div>
                                  <div className="font-medium text-sm sm:text-base text-muted-foreground truncate mt-0.5">
                                    {a.titulo}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-xs text-muted-foreground hidden sm:inline italic">
                                  Conclua a aula anterior
                                </span>
                              </div>
                            </div>
                          </Card>
                        );
                      }

                      return (
                        <Card
                          key={a.id}
                          className={`border transition-all overflow-hidden bg-card ${
                            isAulaOpen
                              ? "border-[#ff3403]/50 shadow-md ring-1 ring-[#ff3403]/10"
                              : "border-border/70 hover:border-border hover:shadow-xs"
                          }`}
                        >
                          {/* Cabeçalho da Aula Liberada (Clicável para expandir/recolher) */}
                          <div
                            onClick={() => handleToggleAula(a.id, true)}
                            className="p-3.5 sm:p-4 flex items-center justify-between gap-3 cursor-pointer hover:bg-muted/30 transition-colors select-none"
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                handleToggleAula(a.id, true);
                              }
                            }}
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              {/* Botão / Indicador de Conclusão */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  marcarConcluida.mutate({ aulaId: a.id, concluida: !done });
                                }}
                                title={done ? "Marcar como não concluída" : "Marcar como concluída"}
                                className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-95 ${
                                  done
                                    ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40"
                                    : "text-muted-foreground hover:text-foreground bg-muted/60"
                                }`}
                              >
                                {done ? (
                                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                                ) : (
                                  <Circle className="h-5 w-5" />
                                )}
                              </button>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-mono text-[11px] font-bold text-muted-foreground">
                                    Aula {a.ordem || idx + 1}
                                  </span>
                                  {a.video_url && (
                                    <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-normal text-blue-600 border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/30">
                                      <Video className="h-2.5 w-2.5 mr-1" /> Vídeo
                                    </Badge>
                                  )}
                                  {a.material_url && (
                                    <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-normal text-amber-600 border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/30">
                                      <FileText className="h-2.5 w-2.5 mr-1" /> PDF
                                    </Badge>
                                  )}
                                  {a.conteudo && (
                                    <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-normal text-purple-600 border-purple-200 dark:border-purple-900 bg-purple-50/50 dark:bg-purple-950/30">
                                      <BookOpen className="h-2.5 w-2.5 mr-1" /> Texto
                                    </Badge>
                                  )}
                                </div>
                                <div className="font-medium text-sm sm:text-base text-foreground truncate mt-0.5">
                                  {a.titulo}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-xs text-muted-foreground hidden sm:inline">
                                {isAulaOpen ? "Recolher" : "Ver Aula"}
                              </span>
                              <div
                                className={`h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground transition-transform duration-200 ${
                                  isAulaOpen ? "rotate-180 text-foreground bg-muted" : ""
                                }`}
                              >
                                <ChevronDown className="h-4 w-4" />
                              </div>
                            </div>
                          </div>

                          {/* Corpo da Aula (Aberto apenas quando clicado) */}
                          {isAulaOpen && (
                            <CardContent className="p-4 sm:p-6 border-t border-border/60 space-y-5 bg-card animate-in fade-in-50 duration-200">
                              {/* Vídeo */}
                              {embed && (
                                <div className="aspect-video overflow-hidden rounded-xl bg-black border border-border/80 shadow-inner">
                                  <iframe
                                    src={embed}
                                    className="h-full w-full"
                                    allowFullScreen
                                    title={a.titulo}
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                  />
                                </div>
                              )}

                              {/* Imagem Ilustrativa da Aula */}
                              {a.imagem_url && (
                                <div className="overflow-hidden rounded-xl border border-border bg-slate-950/10 p-2">
                                  <img
                                    src={a.imagem_url}
                                    alt={a.titulo}
                                    className="w-full max-h-[460px] object-contain rounded-lg mx-auto"
                                  />
                                </div>
                              )}

                              {/* Conteúdo Didático Completo Formatado em Rich Text */}
                              {a.conteudo && (
                                <div className="pt-3 border-t border-border/40 text-foreground/90">
                                  {/<[a-z][\s\S]*>/i.test(a.conteudo) ? (
                                    <div
                                      className="prose prose-slate dark:prose-invert max-w-none text-sm leading-relaxed
                                        [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:font-serif [&_h1]:mt-6 [&_h1]:mb-3 [&_h1]:text-foreground
                                        [&_h2]:text-xl [&_h2]:font-bold [&_h2]:font-serif [&_h2]:mt-5 [&_h2]:mb-2.5 [&_h2]:text-foreground
                                        [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-2 [&_h3]:text-foreground
                                        [&_p]:mb-3 [&_p]:leading-relaxed
                                        [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-3 [&_ul]:space-y-1
                                        [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-3 [&_ol]:space-y-1
                                        [&_blockquote]:border-l-4 [&_blockquote]:border-[#ff3403] [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground [&_blockquote]:my-3
                                        [&_a]:text-[#ff3403] [&_a]:underline [&_a]:font-medium hover:[&_a]:text-[#d92c02]
                                        [&_img]:max-w-full [&_img]:rounded-xl [&_img]:my-4 [&_img]:border [&_img]:border-border [&_img]:shadow-sm"
                                      dangerouslySetInnerHTML={{ __html: a.conteudo }}
                                    />
                                  ) : (
                                    <p className="whitespace-pre-line text-sm text-muted-foreground leading-relaxed">
                                      {a.conteudo}
                                    </p>
                                  )}
                                </div>
                              )}

                              {/* Material Complementar */}
                              {a.material_url && (
                                <div className="pt-2">
                                  <a
                                    href={a.material_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-2 text-sm font-medium text-[#ff3403] hover:underline bg-[#ff3403]/10 px-3.5 py-2 rounded-lg transition-colors"
                                  >
                                    <FileText className="h-4 w-4" /> Acessar Material de Apoio (PDF / Link)
                                  </a>
                                </div>
                              )}

                              {/* Barra Inferior da Aula: Botão de Conclusão e Fechar */}
                              <div className="pt-4 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-3">
                                <Button
                                  type="button"
                                  variant={done ? "secondary" : "default"}
                                  size="sm"
                                  onClick={() => marcarConcluida.mutate({ aulaId: a.id, concluida: !done })}
                                  className={done ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/30" : "bg-[#ff3403] hover:bg-[#d92c02] text-white"}
                                >
                                  {done ? <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-600" /> : <Circle className="mr-2 h-4 w-4" />}
                                  {done ? "Aula Concluída (Clique para desmarcar)" : "Marcar como Concluída"}
                                </Button>

                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleToggleAula(a.id, true)}
                                  className="text-xs text-muted-foreground hover:text-foreground"
                                >
                                  Recolher esta aula ↑
                                </Button>
                              </div>
                            </CardContent>
                          )}
                        </Card>
                      );
                    })}

                    {aulas.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-4 italic">
                        Nenhuma aula disponível neste módulo no momento.
                      </p>
                    )}
                  </div>

                  {/* Avaliações do Módulo */}
                  {avaliacoes.length > 0 && (
                    <div className="mt-5 pt-4 border-t border-dashed border-border space-y-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <HelpCircle className="h-4 w-4 text-amber-500" /> Avaliações do Módulo
                      </h3>
                      <div className="grid gap-3">
                        {avaliacoes.map((e: any) => {
                          const tentativa = tentativasMap.get(e.id);
                          const aprovado = tentativa?.aprovado;
                          const nota = tentativa?.nota;
                          const evalsUnlocked = areModuleEvaluationsUnlocked(i, aulas);

                          if (!evalsUnlocked) {
                            return (
                              <Card key={e.id} className="border border-dashed border-border/70 bg-muted/20 opacity-70">
                                <CardContent className="p-4 sm:p-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                  <div className="flex items-start gap-3">
                                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0 text-muted-foreground">
                                      <Lock className="h-5 w-5" />
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <h4 className="font-serif text-base sm:text-lg font-bold text-muted-foreground">{e.titulo}</h4>
                                        <Badge variant="outline" className="text-[10px] py-0 border-dashed text-muted-foreground">
                                          <Lock className="h-2.5 w-2.5 mr-1" /> Prova Bloqueada
                                        </Badge>
                                      </div>
                                      <p className="text-xs text-muted-foreground mt-0.5">
                                        Conclua todas as aulas deste módulo para liberar esta avaliação.
                                      </p>
                                    </div>
                                  </div>
                                  <Button
                                    disabled
                                    variant="outline"
                                    size="sm"
                                    className="border-dashed opacity-60 text-xs shrink-0"
                                  >
                                    <Lock className="h-3 w-3 mr-1" /> Bloqueada
                                  </Button>
                                </CardContent>
                              </Card>
                            );
                          }

                          return (
                            <Card key={e.id} className="border-amber-500/30 bg-amber-500/5">
                              <CardContent className="p-4 sm:p-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-start gap-3">
                                  <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
                                    <HelpCircle className="h-5 w-5 text-amber-500" />
                                  </div>
                                  <div>
                                    <h4 className="font-serif text-base sm:text-lg font-bold text-foreground">{e.titulo}</h4>
                                    <p className="text-xs text-muted-foreground mt-0.5">{e.descricao || "Orientação geral da prova."}</p>
                                    <div className="flex gap-2 mt-2">
                                      <Badge variant="outline" className="text-[10px] py-0 border-amber-500/30 text-amber-700 dark:text-amber-400 bg-transparent">
                                        Mínimo: {Number(e.nota_minima).toFixed(1)}
                                      </Badge>
                                      {tentativa && (
                                        <Badge className={aprovado ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] py-0" : "bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-[10px] py-0"}>
                                          {aprovado ? `Aprovado - Nota ${nota}` : `Reprovado - Nota ${nota}`}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <Button
                                  onClick={() => iniciarAvaliacao(e)}
                                  variant={aprovado ? "outline" : "default"}
                                  size="sm"
                                  className={aprovado ? "border-amber-500/40 text-amber-700 dark:text-amber-400 shrink-0" : "bg-[#ff3403] hover:bg-[#d92c02] text-white shrink-0"}
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
              )}
            </div>
          );
        })}
      </div>

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
