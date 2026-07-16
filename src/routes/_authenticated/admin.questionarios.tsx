import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit3, Trash2, ArrowLeft, Loader2, HelpCircle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/questionarios")({
  component: QuestionariosAdmin,
});

function QuestionariosAdmin() {
  const qc = useQueryClient();
  const [activeQuiz, setActiveQuiz] = useState<any | null>(null);

  // Modals
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [isQuestionOpen, setIsQuestionOpen] = useState(false);

  // Form State Questionnaire
  const [selectedQuiz, setSelectedQuiz] = useState<any>(null);
  const [quizTitulo, setQuizTitulo] = useState("");
  const [quizDescricao, setQuizDescricao] = useState("");

  // Form State Question
  const [selectedQuestion, setSelectedQuestion] = useState<any>(null);
  const [qEnunciado, setQEnunciado] = useState("");
  const [qAltA, setQAltA] = useState("");
  const [qAltB, setQAltB] = useState("");
  const [qAltC, setQAltC] = useState("");
  const [qAltD, setQAltD] = useState("");
  const [qCorreta, setQCorreta] = useState("A"); // "A", "B", "C", "D"
  const [qPeso, setQPeso] = useState("1.0");

  // Query Questionnaires
  const { data: questionarios, isLoading: isLoadingQuizzes } = useQuery({
    queryKey: ["admin-questionarios"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("questionarios")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  // Query Questions for active Quiz
  const { data: questoes, isLoading: isLoadingQuestions } = useQuery({
    queryKey: ["admin-questoes", activeQuiz?.id],
    enabled: !!activeQuiz,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("questoes_questionario")
        .select("*")
        .eq("questionario_id", activeQuiz.id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  // Mutations Questionnaire
  const salvarQuiz = useMutation({
    mutationFn: async () => {
      if (!quizTitulo.trim()) throw new Error("O título é obrigatório.");
      const payload = {
        titulo: quizTitulo,
        descricao: quizDescricao || null,
      };

      if (selectedQuiz) {
        const { error } = await supabase
          .from("questionarios")
          .update(payload)
          .eq("id", selectedQuiz.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("questionarios")
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-questionarios"] });
      toast.success(selectedQuiz ? "Questionário atualizado!" : "Questionário criado!");
      setIsQuizOpen(false);
      setSelectedQuiz(null);
      setQuizTitulo("");
      setQuizDescricao("");
    },
    onError: (err: any) => {
      toast.error(`Erro ao salvar questionário: ${err.message || err}`);
    },
  });

  const excluirQuiz = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("questionarios").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-questionarios"] });
      toast.success("Questionário removido!");
      if (activeQuiz && activeQuiz.id === selectedQuiz?.id) {
        setActiveQuiz(null);
      }
    },
    onError: (err: any) => {
      toast.error(`Erro ao excluir: ${err.message || err}`);
    },
  });

  // Mutations Questions
  const salvarQuestion = useMutation({
    mutationFn: async () => {
      if (!qEnunciado.trim()) throw new Error("O enunciado é obrigatório.");
      if (!qAltA.trim() || !qAltB.trim() || !qAltC.trim() || !qAltD.trim()) {
        throw new Error("Preencha todas as 4 alternativas.");
      }

      const alternativas = [qAltA.trim(), qAltB.trim(), qAltC.trim(), qAltD.trim()];
      const indexCorreta = qCorreta === "A" ? 0 : qCorreta === "B" ? 1 : qCorreta === "C" ? 2 : 3;

      const payload = {
        questionario_id: activeQuiz.id,
        enunciado: qEnunciado,
        alternativas: alternativas,
        resposta_correta: alternativas[indexCorreta], // we save the exact text
        peso: parseFloat(qPeso) || 1.0,
      };

      if (selectedQuestion) {
        const { error } = await supabase
          .from("questoes_questionario")
          .update(payload)
          .eq("id", selectedQuestion.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("questoes_questionario")
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-questoes", activeQuiz?.id] });
      toast.success(selectedQuestion ? "Questão atualizada!" : "Questão adicionada!");
      setIsQuestionOpen(false);
      setSelectedQuestion(null);
      resetQuestionForm();
    },
    onError: (err: any) => {
      toast.error(`Erro ao salvar questão: ${err.message || err}`);
    },
  });

  const excluirQuestion = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("questoes_questionario").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-questoes", activeQuiz?.id] });
      toast.success("Questão removida!");
    },
    onError: (err: any) => {
      toast.error(`Erro ao excluir questão: ${err.message || err}`);
    },
  });

  function resetQuestionForm() {
    setQEnunciado("");
    setQAltA("");
    setQAltB("");
    setQAltC("");
    setQAltD("");
    setQCorreta("A");
    setQPeso("1.0");
  }

  function openEditQuiz(q: any) {
    setSelectedQuiz(q);
    setQuizTitulo(q.titulo);
    setQuizDescricao(q.descricao || "");
    setIsQuizOpen(true);
  }

  function openEditQuestion(quest: any) {
    setSelectedQuestion(quest);
    setQEnunciado(quest.enunciado);
    
    const alts = Array.isArray(quest.alternativas) ? quest.alternativas : [];
    setQAltA(alts[0] || "");
    setQAltB(alts[1] || "");
    setQAltC(alts[2] || "");
    setQAltD(alts[3] || "");

    const corretaIndex = alts.indexOf(quest.resposta_correta);
    setQCorreta(corretaIndex === 1 ? "B" : corretaIndex === 2 ? "C" : corretaIndex === 3 ? "D" : "A");
    setQPeso((quest.peso || 1.0).toString());
    
    setIsQuestionOpen(true);
  }

  if (isLoadingQuizzes) {
    return <p className="text-muted-foreground p-4">Carregando questionários…</p>;
  }

  return (
    <div className="space-y-8">
      {/* 1. VIEW QUESTIONNAIRES LIST */}
      {!activeQuiz ? (
        <div className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="font-serif text-4xl">Banco de Questionários</h1>
              <p className="mt-1 text-muted-foreground">Crie e edite questionários de provas reutilizáveis.</p>
            </div>
            
            <Dialog
              open={isQuizOpen}
              onOpenChange={(open) => {
                setIsQuizOpen(open);
                if (!open) {
                  setSelectedQuiz(null);
                  setQuizTitulo("");
                  setQuizDescricao("");
                }
              }}
            >
              <DialogTrigger asChild>
                <Button className="bg-gold text-gold-foreground hover:bg-gold/90 flex items-center gap-2">
                  <Plus className="h-4 w-4" /> Novo Questionário
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>{selectedQuiz ? "Editar Questionário" : "Novo Questionário"}</DialogTitle>
                  <DialogDescription>Dê um nome para identificar este questionário nas avaliações dos módulos.</DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label htmlFor="quiz-title">Título *</Label>
                    <Input id="quiz-title" value={quizTitulo} onChange={(e) => setQuizTitulo(e.target.value)} placeholder="Ex: Prova de Teologia do Novo Testamento" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quiz-desc">Descrição</Label>
                    <Input id="quiz-desc" value={quizDescricao} onChange={(e) => setQuizDescricao(e.target.value)} placeholder="Breve orientação ou resumo..." />
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button variant="outline" className="w-full" onClick={() => setIsQuizOpen(false)}>
                    Cancelar
                  </Button>
                  <Button
                    className="w-full bg-gold text-gold-foreground hover:bg-gold/90"
                    onClick={() => salvarQuiz.mutate()}
                    disabled={salvarQuiz.isPending}
                  >
                    {salvarQuiz.isPending ? "Salvando..." : "Confirmar"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Data de Criação</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(questionarios ?? []).map((q) => (
                  <TableRow key={q.id}>
                    <TableCell className="font-semibold">{q.titulo}</TableCell>
                    <TableCell>{q.descricao || "—"}</TableCell>
                    <TableCell>{new Date(q.created_at).toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell className="text-right whitespace-nowrap space-x-1">
                      <Button variant="outline" size="sm" onClick={() => setActiveQuiz(q)} className="gap-1">
                        <HelpCircle className="h-4 w-4" /> Questões
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openEditQuiz(q)}>
                        <Edit3 className="h-4 w-4 text-primary" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => { if (confirm("Excluir este questionário apagará todas as questões dele. Continuar?")) excluirQuiz.mutate(q.id); }}>
                        <Trash2 className="h-4 w-4 text-rose-600" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {questionarios && questionarios.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground p-8">
                      Nenhum questionário cadastrado. Clique em "Novo Questionário" para começar.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </div>
      ) : (
        /* 2. VIEW QUESTIONS LIST FOR SPECIFIC QUESTIONNAIRE */
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setActiveQuiz(null)} className="gap-1">
              <ArrowLeft className="h-4 w-4" /> Voltar
            </Button>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-serif text-3xl font-bold">{activeQuiz.titulo}</h1>
                <Badge variant="secondary">Banco de Questões</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">{activeQuiz.descricao || "Sem descrição informada."}</p>
            </div>

            <Dialog
              open={isQuestionOpen}
              onOpenChange={(open) => {
                setIsQuestionOpen(open);
                if (!open) {
                  setSelectedQuestion(null);
                  resetQuestionForm();
                }
              }}
            >
              <DialogTrigger asChild>
                <Button className="bg-gold text-gold-foreground hover:bg-gold/90 flex items-center gap-2">
                  <Plus className="h-4 w-4" /> Adicionar Questão
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{selectedQuestion ? "Editar Questão" : "Nova Questão"}</DialogTitle>
                  <DialogDescription>Insira o enunciado e as quatro alternativas de múltipla escolha.</DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label htmlFor="q-enunciado">Enunciado / Pergunta *</Label>
                    <Input id="q-enunciado" value={qEnunciado} onChange={(e) => setQEnunciado(e.target.value)} placeholder="Ex: Quem escreveu a Epístola aos Romanos?" />
                  </div>

                  <div className="space-y-2 pt-2 border-t">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">Alternativas</Label>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-muted-foreground w-4">A)</span>
                        <Input value={qAltA} onChange={(e) => setQAltA(e.target.value)} placeholder="Primeira alternativa" />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-muted-foreground w-4">B)</span>
                        <Input value={qAltB} onChange={(e) => setQAltB(e.target.value)} placeholder="Segunda alternativa" />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-muted-foreground w-4">C)</span>
                        <Input value={qAltC} onChange={(e) => setQAltC(e.target.value)} placeholder="Terceira alternativa" />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-muted-foreground w-4">D)</span>
                        <Input value={qAltD} onChange={(e) => setQAltD(e.target.value)} placeholder="Quarta alternativa" />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                    <div className="space-y-2">
                      <Label htmlFor="q-correta">Resposta Correta</Label>
                      <select
                        id="q-correta"
                        value={qCorreta}
                        onChange={(e) => setQCorreta(e.target.value)}
                        className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                      >
                        <option value="A">Alternativa A</option>
                        <option value="B">Alternativa B</option>
                        <option value="C">Alternativa C</option>
                        <option value="D">Alternativa D</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="q-peso">Peso (Pontuação)</Label>
                      <Input id="q-peso" type="number" step="0.5" value={qPeso} onChange={(e) => setQPeso(e.target.value)} />
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button variant="outline" className="w-full" onClick={() => setIsQuestionOpen(false)}>
                    Cancelar
                  </Button>
                  <Button
                    className="w-full bg-gold text-gold-foreground hover:bg-gold/90"
                    onClick={() => salvarQuestion.mutate()}
                    disabled={salvarQuestion.isPending}
                  >
                    {salvarQuestion.isPending ? "Salvando..." : "Confirmar"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {isLoadingQuestions ? (
            <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-gold" /></div>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Questão</TableHead>
                    <TableHead>Alternativas</TableHead>
                    <TableHead>Correta</TableHead>
                    <TableHead>Peso</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(questoes ?? []).map((quest, idx) => {
                    const alts = Array.isArray(quest.alternativas) ? quest.alternativas : [];
                    return (
                      <TableRow key={quest.id}>
                        <TableCell className="max-w-md">
                          <div className="font-bold text-xs text-muted-foreground mb-1">Questão {idx + 1}</div>
                          <div className="font-semibold text-slate-100">{quest.enunciado}</div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          <ul className="space-y-1">
                            <li><span className="font-bold text-white/75">A:</span> {alts[0] || "—"}</li>
                            <li><span className="font-bold text-white/75">B:</span> {alts[1] || "—"}</li>
                            <li><span className="font-bold text-white/75">C:</span> {alts[2] || "—"}</li>
                            <li><span className="font-bold text-white/75">D:</span> {alts[3] || "—"}</li>
                          </ul>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-emerald-400 border-emerald-500/30 bg-emerald-500/5 max-w-[200px] truncate block text-center">
                            {quest.resposta_correta}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono">{quest.peso}</TableCell>
                        <TableCell className="text-right whitespace-nowrap space-x-1">
                          <Button variant="ghost" size="icon" onClick={() => openEditQuestion(quest)}>
                            <Edit3 className="h-4 w-4 text-primary" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => { if (confirm("Deseja mesmo excluir esta questão?")) excluirQuestion.mutate(quest.id); }}>
                            <Trash2 className="h-4 w-4 text-rose-600" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {questoes && questoes.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground p-8">
                        Nenhuma questão cadastrada neste questionário. Clique em "Adicionar Questão".
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
