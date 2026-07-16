import { createFileRoute, useParams, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Edit3, Trash2, ArrowLeft, Loader2, Video, FileText, HelpCircle, Layers, FileQuestion } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/cursos_/$id/conteudo")({
  component: CursoConteudoAdmin,
});

function CursoConteudoAdmin() {
  const { id: cursoId } = useParams({ from: "/_authenticated/admin/cursos_/$id/conteudo" });
  const qc = useQueryClient();

  // Modals Open State
  const [isModOpen, setIsModOpen] = useState(false);
  const [isClassOpen, setIsClassOpen] = useState(false);
  const [isEvalOpen, setIsEvalOpen] = useState(false);

  // Form State Modulo
  const [selectedModulo, setSelectedModulo] = useState<any>(null);
  const [modTitulo, setModTitulo] = useState("");
  const [modDescricao, setModDescricao] = useState("");
  const [modOrdem, setModOrdem] = useState("0");

  // Form State Aula
  const [activeModuloId, setActiveModuloId] = useState<string | null>(null);
  const [selectedAula, setSelectedAula] = useState<any>(null);
  const [classTitulo, setClassTitulo] = useState("");
  const [classDescricao, setClassDescricao] = useState("");
  const [classVideoUrl, setClassVideoUrl] = useState("");
  const [classMaterialUrl, setClassMaterialUrl] = useState("");
  const [classConteudo, setClassConteudo] = useState("");
  const [classOrdem, setClassOrdem] = useState("0");

  // Form State Avaliacao
  const [selectedEval, setSelectedEval] = useState<any>(null);
  const [evalTitulo, setEvalTitulo] = useState("");
  const [evalDescricao, setEvalDescricao] = useState("");
  const [evalNotaMinima, setEvalNotaMinima] = useState("6.0");
  const [evalQuestionarioId, setEvalQuestionarioId] = useState<string | null>(null);
  const [evalQtdQuestoes, setEvalQtdQuestoes] = useState("10");

  // Query Course Info
  const { data: curso, isLoading: isLoadingCurso } = useQuery({
    queryKey: ["admin-curso-detalhes", cursoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cursos")
        .select("id, titulo")
        .eq("id", cursoId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  // Query Modules, Lessons, and Assessments in a single tree
  const { data: modulos, isLoading: isLoadingModulos } = useQuery({
    queryKey: ["admin-curso-modulos", cursoId],
    queryFn: async () => {
      const [{ data: mods }, { data: evals }] = await Promise.all([
        supabase
          .from("modulos")
          .select("*, aulas(*)")
          .eq("curso_id", cursoId)
          .order("ordem", { ascending: true }),
        supabase
          .from("avaliacoes")
          .select("*, questionarios(titulo)")
          .eq("curso_id", cursoId)
          .order("created_at", { ascending: true }),
      ]);

      const evaluations = evals ?? [];
      return (mods ?? []).map((m) => ({
        ...m,
        aulas: (m.aulas ?? []).sort((a: any, b: any) => a.ordem - b.ordem),
        avaliacoes: evaluations.filter((e: any) => e.modulo_id === m.id),
      }));
    },
  });

  // Query Questionnaires for dropdown
  const { data: questionarios } = useQuery({
    queryKey: ["admin-questionarios-dropdown"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("questionarios")
        .select("id, titulo")
        .order("titulo");
      if (error) throw error;
      return data ?? [];
    },
  });

  // Mutations Modulo
  const salvarModulo = useMutation({
    mutationFn: async () => {
      if (!modTitulo.trim()) throw new Error("Título é obrigatório.");
      const payload = {
        curso_id: cursoId,
        titulo: modTitulo,
        descricao: modDescricao || null,
        ordem: parseInt(modOrdem) || 0,
      };

      if (selectedModulo) {
        const { error } = await supabase
          .from("modulos")
          .update(payload)
          .eq("id", selectedModulo.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("modulos")
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-curso-modulos", cursoId] });
      toast.success(selectedModulo ? "Módulo atualizado!" : "Módulo criado!");
      setIsModOpen(false);
      setSelectedModulo(null);
      setModTitulo("");
      setModDescricao("");
      setModOrdem("0");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const excluirModulo = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("modulos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-curso-modulos", cursoId] });
      toast.success("Módulo removido!");
    },
    onError: (err: any) => toast.error(err.message),
  });

  // Mutations Aula
  const salvarAula = useMutation({
    mutationFn: async () => {
      if (!classTitulo.trim()) throw new Error("Título da aula é obrigatório.");
      const payload = {
        modulo_id: activeModuloId!,
        titulo: classTitulo,
        descricao: classDescricao || null,
        video_url: classVideoUrl || null,
        material_url: classMaterialUrl || null,
        conteudo: classConteudo || null,
        ordem: parseInt(classOrdem) || 0,
      };

      if (selectedAula) {
        const { error } = await supabase
          .from("aulas")
          .update(payload)
          .eq("id", selectedAula.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("aulas")
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-curso-modulos", cursoId] });
      toast.success(selectedAula ? "Aula atualizada!" : "Aula criada!");
      setIsClassOpen(false);
      setSelectedAula(null);
      resetAulaForm();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const excluirAula = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("aulas").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-curso-modulos", cursoId] });
      toast.success("Aula removida!");
    },
    onError: (err: any) => toast.error(err.message),
  });

  // Mutations Avaliacao
  const salvarAvaliacao = useMutation({
    mutationFn: async () => {
      if (!evalTitulo.trim()) throw new Error("Título da avaliação é obrigatório.");
      const payload = {
        curso_id: cursoId,
        modulo_id: activeModuloId!,
        titulo: evalTitulo,
        descricao: evalDescricao || null,
        nota_minima: parseFloat(evalNotaMinima) || 6.0,
        questionario_id: evalQuestionarioId || null,
        quantidade_questoes: parseInt(evalQtdQuestoes) || 10,
      };

      if (selectedEval) {
        const { error } = await supabase
          .from("avaliacoes")
          .update(payload)
          .eq("id", selectedEval.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("avaliacoes")
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-curso-modulos", cursoId] });
      toast.success(selectedEval ? "Avaliação atualizada!" : "Avaliação criada!");
      setIsEvalOpen(false);
      setSelectedEval(null);
      resetEvalForm();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const excluirAvaliacao = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("avaliacoes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-curso-modulos", cursoId] });
      toast.success("Avaliação removida!");
    },
    onError: (err: any) => toast.error(err.message),
  });

  function resetAulaForm() {
    setClassTitulo("");
    setClassDescricao("");
    setClassVideoUrl("");
    setClassMaterialUrl("");
    setClassConteudo("");
    setClassOrdem("0");
  }

  function resetEvalForm() {
    setEvalTitulo("");
    setEvalDescricao("");
    setEvalNotaMinima("6.0");
    setEvalQuestionarioId(null);
    setEvalQtdQuestoes("10");
  }

  function openEditMod(m: any) {
    setSelectedModulo(m);
    setModTitulo(m.titulo);
    setModDescricao(m.descricao || "");
    setModOrdem(m.ordem.toString());
    setIsModOpen(true);
  }

  function openNewClass(modId: string) {
    setActiveModuloId(modId);
    setSelectedAula(null);
    resetAulaForm();
    setIsClassOpen(true);
  }

  function openEditClass(aula: any, modId: string) {
    setActiveModuloId(modId);
    setSelectedAula(aula);
    setClassTitulo(aula.titulo);
    setClassDescricao(aula.descricao || "");
    setClassVideoUrl(aula.video_url || "");
    setClassMaterialUrl(aula.material_url || "");
    setClassConteudo(aula.conteudo || "");
    setClassOrdem((aula.ordem || 0).toString());
    setIsClassOpen(true);
  }

  function openNewEval(modId: string) {
    setActiveModuloId(modId);
    setSelectedEval(null);
    resetEvalForm();
    if (questionarios && questionarios.length > 0) {
      setEvalQuestionarioId(questionarios[0].id);
    }
    setIsEvalOpen(true);
  }

  function openEditEval(e: any, modId: string) {
    setActiveModuloId(modId);
    setSelectedEval(e);
    setEvalTitulo(e.titulo);
    setEvalDescricao(e.descricao || "");
    setEvalNotaMinima((e.nota_minima || 6.0).toString());
    setEvalQuestionarioId(e.questionario_id || null);
    setEvalQtdQuestoes((e.quantidade_questoes || 10).toString());
    setIsEvalOpen(true);
  }

  if (isLoadingCurso || isLoadingModulos) {
    return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-gold" /></div>;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link to="/admin/cursos" className="text-xs text-muted-foreground hover:underline flex items-center gap-1">
          <ArrowLeft className="h-3 w-3" /> Voltar para Cursos
        </Link>
        <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-serif text-3xl font-bold">Conteúdo: {curso?.titulo}</h1>
            <p className="text-sm text-muted-foreground">Cadastre módulos, videoaulas e provas com sorteio de questões.</p>
          </div>

          <Button onClick={() => setIsModOpen(true)} className="bg-gold text-gold-foreground hover:bg-gold/90 flex items-center gap-2">
            <Plus className="h-4 w-4" /> Novo Módulo
          </Button>
        </div>
      </div>

      {/* Accordion List of Modules */}
      <div className="space-y-6">
        {(modulos ?? []).map((m, i) => (
          <Card key={m.id} className="border-l-4 border-l-gold">
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-3 bg-slate-900/10">
              <div>
                <CardTitle className="font-serif text-xl flex items-center gap-2">
                  <Layers className="h-5 w-5 text-gold" /> Módulo {i + 1}: {m.titulo}
                </CardTitle>
                {m.descricao && <CardDescription className="mt-1">{m.descricao}</CardDescription>}
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => openEditMod(m)}>
                  Editar Módulo
                </Button>
                <Button variant="ghost" size="icon" onClick={() => { if (confirm("Deseja mesmo excluir o módulo e todo o seu conteúdo?")) excluirModulo.mutate(m.id); }}>
                  <Trash2 className="h-4 w-4 text-rose-600" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="pt-6 space-y-6">
              {/* SECTION 1: CLASSES / VIDEO AULAS */}
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-2 border-b">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Video className="h-4 w-4 text-gold" /> Aulas ({m.aulas.length})
                  </h3>
                  <Button variant="outline" size="xs" onClick={() => openNewClass(m.id)} className="text-xs h-7 px-2">
                    <Plus className="h-3 w-3 mr-1" /> Adicionar Aula
                  </Button>
                </div>

                <div className="space-y-2">
                  {m.aulas.map((aula: any) => (
                    <div key={aula.id} className="flex justify-between items-center p-3 rounded-lg border bg-slate-950/20 hover:bg-slate-950/40 transition">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-slate-900 flex items-center justify-center font-mono text-xs font-bold text-slate-400">
                          {aula.ordem}
                        </div>
                        <div>
                          <div className="font-medium text-sm text-slate-100">{aula.titulo}</div>
                          <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                            {aula.video_url && <span className="flex items-center gap-1"><Video className="h-3 w-3" /> Possui Vídeo</span>}
                            {aula.material_url && <span className="flex items-center gap-1"><FileText className="h-3 w-3" /> Possui Material</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEditClass(aula, m.id)}>
                          <Edit3 className="h-3.5 w-3.5 text-primary" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => { if (confirm("Deseja mesmo excluir esta aula?")) excluirAula.mutate(aula.id); }}>
                          <Trash2 className="h-3.5 w-3.5 text-rose-600" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {m.aulas.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-4">Nenhuma aula cadastrada neste módulo.</p>
                  )}
                </div>
              </div>

              {/* SECTION 2: EVALUATIONS / EXAMS */}
              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center pb-2 border-b">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <FileQuestion className="h-4 w-4 text-gold" /> Provas e Avaliações ({m.avaliacoes.length})
                  </h3>
                  <Button variant="outline" size="xs" onClick={() => openNewEval(m.id)} className="text-xs h-7 px-2 border-dashed">
                    <Plus className="h-3 w-3 mr-1" /> Adicionar Avaliação
                  </Button>
                </div>

                <div className="space-y-2">
                  {m.avaliacoes.map((e: any) => (
                    <div key={e.id} className="flex justify-between items-center p-3 rounded-lg border border-dashed border-gold/30 bg-gold/5 hover:bg-gold/10 transition">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-gold/10 flex items-center justify-center">
                          <HelpCircle className="h-4 w-4 text-gold" />
                        </div>
                        <div>
                          <div className="font-semibold text-sm text-gold">{e.titulo}</div>
                          <div className="flex flex-wrap gap-2 mt-1.5">
                            <Badge variant="outline" className="text-[10px] py-0 border-gold/20 text-gold-foreground">
                              Mínimo: {Number(e.nota_minima).toFixed(1)}
                            </Badge>
                            {e.questionarios && (
                              <Badge className="text-[10px] py-0 bg-slate-900 border border-gold/20 text-slate-100 font-mono">
                                Banco: {e.questionarios.titulo} ({e.quantidade_questoes} questões)
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEditEval(e, m.id)}>
                          <Edit3 className="h-3.5 w-3.5 text-gold" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => { if (confirm("Deseja mesmo excluir esta avaliação?")) excluirAvaliacao.mutate(e.id); }}>
                          <Trash2 className="h-3.5 w-3.5 text-rose-600" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {m.avaliacoes.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-4">Nenhuma avaliação cadastrada para este módulo.</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {modulos && modulos.length === 0 && (
          <div className="rounded-lg border border-dashed p-12 text-center">
            <Layers className="mx-auto h-12 w-12 text-muted-foreground animate-pulse" />
            <h3 className="mt-4 font-serif text-lg font-bold">O curso não possui conteúdo</h3>
            <p className="mt-2 text-sm text-muted-foreground">Cadastre o primeiro módulo para liberar as videoaulas.</p>
            <Button onClick={() => setIsModOpen(true)} className="mt-6 bg-gold text-gold-foreground hover:bg-gold/90">
              Criar Primeiro Módulo
            </Button>
          </div>
        )}
      </div>

      {/* ========== DIALOGS ========== */}

      {/* 1. Modulo Dialog */}
      <Dialog
        open={isModOpen}
        onOpenChange={(open) => {
          setIsModOpen(open);
          if (!open) {
            setSelectedModulo(null);
            setModTitulo("");
            setModDescricao("");
            setModOrdem("0");
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedModulo ? "Editar Módulo" : "Novo Módulo"}</DialogTitle>
            <DialogDescription>Crie divisões conceituais para guiar as matérias do aluno.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="mod-titulo">Título *</Label>
              <Input id="mod-titulo" required value={modTitulo} onChange={(e) => setModTitulo(e.target.value)} placeholder="Ex: Módulo 1: Teologia Sistemática I" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mod-desc">Descrição</Label>
              <Input id="mod-desc" value={modDescricao} onChange={(e) => setModDescricao(e.target.value)} placeholder="O que o aluno aprenderá..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mod-ordem">Ordem de Exibição</Label>
              <Input id="mod-ordem" type="number" value={modOrdem} onChange={(e) => setModOrdem(e.target.value)} />
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button variant="outline" className="w-full" onClick={() => setIsModOpen(false)}>
              Cancelar
            </Button>
            <Button
              className="w-full bg-gold text-gold-foreground hover:bg-gold/90"
              onClick={() => salvarModulo.mutate()}
              disabled={salvarModulo.isPending}
            >
              {salvarModulo.isPending ? "Salvando..." : "Confirmar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 2. Aula / Class Dialog */}
      <Dialog
        open={isClassOpen}
        onOpenChange={(open) => {
          setIsClassOpen(open);
          if (!open) {
            setSelectedAula(null);
            resetAulaForm();
          }
        }}
      >
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedAula ? "Editar Aula" : "Nova Aula"}</DialogTitle>
            <DialogDescription>Adicione as videoaulas do YouTube ou Vimeo e materiais didáticos de apoio.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="class-titulo">Título da Aula *</Label>
              <Input id="class-titulo" required value={classTitulo} onChange={(e) => setClassTitulo(e.target.value)} placeholder="Ex: Introdução à Hermenêutica" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="class-desc">Resumo / Descrição Rápida</Label>
              <Input id="class-desc" value={classDescricao} onChange={(e) => setClassDescricao(e.target.value)} placeholder="Resumo simples..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="class-ordem">Ordem / Sequência</Label>
                <Input id="class-ordem" type="number" value={classOrdem} onChange={(e) => setClassOrdem(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="class-video">Vídeo URL (YouTube/Vimeo)</Label>
                <Input id="class-video" value={classVideoUrl} onChange={(e) => setClassVideoUrl(e.target.value)} placeholder="https://..." />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="class-material">Material PDF URL (Google Drive/Dropbox)</Label>
              <Input id="class-material" value={classMaterialUrl} onChange={(e) => setClassMaterialUrl(e.target.value)} placeholder="https://..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="class-content">Conteúdo Completo (Texto de Estudo)</Label>
              <textarea
                id="class-content"
                value={classConteudo}
                onChange={(e) => setClassConteudo(e.target.value)}
                className="w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                placeholder="Insira notas de estudo, artigos ou textos completos da aula..."
              />
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button variant="outline" className="w-full" onClick={() => setIsClassOpen(false)}>
              Cancelar
            </Button>
            <Button
              className="w-full bg-gold text-gold-foreground hover:bg-gold/90"
              onClick={() => salvarAula.mutate()}
              disabled={salvarAula.isPending}
            >
              {salvarAula.isPending ? "Salvando..." : "Confirmar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 3. Avaliacao / Exam Dialog */}
      <Dialog
        open={isEvalOpen}
        onOpenChange={(open) => {
          setIsEvalOpen(open);
          if (!open) {
            setSelectedEval(null);
            resetEvalForm();
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedEval ? "Editar Avaliação" : "Nova Avaliação"}</DialogTitle>
            <DialogDescription>Defina a nota de corte e o questionário que será sorteado para o aluno.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="eval-titulo">Título da Prova *</Label>
              <Input id="eval-titulo" required value={evalTitulo} onChange={(e) => setEvalTitulo(e.target.value)} placeholder="Ex: Avaliação Geral de Novo Testamento" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="eval-desc">Instruções</Label>
              <Input id="eval-desc" value={evalDescricao} onChange={(e) => setEvalDescricao(e.target.value)} placeholder="Instruções para o aluno ao iniciar..." />
            </div>

            <div className="space-y-2">
              <Label htmlFor="eval-quest">Questionário (Banco de Questões) *</Label>
              <select
                id="eval-quest"
                required
                value={evalQuestionarioId || ""}
                onChange={(e) => setEvalQuestionarioId(e.target.value || null)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
              >
                <option value="">Selecione um questionário...</option>
                {(questionarios ?? []).map((q) => (
                  <option key={q.id} value={q.id}>{q.titulo}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="eval-min">Nota Mínima (Corte)</Label>
                <Input id="eval-min" type="number" step="0.5" min="0" max="10" value={evalNotaMinima} onChange={(e) => setEvalNotaMinima(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="eval-qtd">Quant. de Questões a Sortear</Label>
                <Input id="eval-qtd" type="number" min="1" value={evalQtdQuestoes} onChange={(e) => setEvalQtdQuestoes(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button variant="outline" className="w-full" onClick={() => setIsEvalOpen(false)}>
              Cancelar
            </Button>
            <Button
              className="w-full bg-gold text-gold-foreground hover:bg-gold/90"
              onClick={() => salvarAvaliacao.mutate()}
              disabled={salvarAvaliacao.isPending}
            >
              {salvarAvaliacao.isPending ? "Salvando..." : "Confirmar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
