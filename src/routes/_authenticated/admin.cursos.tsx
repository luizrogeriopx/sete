import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Edit3, Trash2, Loader2, Upload, X, BookOpen } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/cursos")({
  component: CursosAdmin,
});

function ImageUpload({
  label,
  value,
  onChange,
  aspectRatio,
  aspectRatioLabel,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  aspectRatio: number;
  aspectRatioLabel: string;
}) {
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione uma imagem válida.");
      return;
    }

    setIsUploading(true);

    try {
      const validateDimensions = (): Promise<{ isValid: boolean; w: number; h: number }> => {
        return new Promise((resolve) => {
          const img = new Image();
          img.src = URL.createObjectURL(file);
          img.onload = () => {
            URL.revokeObjectURL(img.src);
            const ratio = img.width / img.height;
            const diff = Math.abs(ratio - aspectRatio);
            const isValid = diff <= 0.05; // 5% tolerance
            resolve({ isValid, w: img.width, h: img.height });
          };
          img.onerror = () => {
            resolve({ isValid: false, w: 0, h: 0 });
          };
        });
      };

      const { isValid, w, h } = await validateDimensions();

      if (!isValid) {
        toast.error(
          `Proporção incorreta! Encontrado: ${w}x${h}px. A imagem deve estar na proporção ${aspectRatioLabel}.`
        );
        setIsUploading(false);
        return;
      }

      const fileExt = file.name.split(".").pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("cursos")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("cursos").getPublicUrl(filePath);
      if (!data.publicUrl) throw new Error("Não foi possível obter a URL pública.");

      onChange(data.publicUrl);
      toast.success("Imagem carregada com sucesso!");
    } catch (err: any) {
      console.error(err);
      toast.error(`Erro ao carregar imagem: ${err.message || err}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="text-sm font-semibold">{label}</label>
        <span className="text-xs text-muted-foreground">Proporção: {aspectRatioLabel}</span>
      </div>

      {value ? (
        <div className="relative rounded-lg overflow-hidden border border-border bg-slate-950 flex items-center justify-center">
          <img
            src={value}
            alt={label}
            className={`object-cover w-full ${aspectRatio > 1 ? "aspect-[4/1]" : "aspect-[4/5] max-h-[160px] object-contain"}`}
          />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute top-2 right-2 p-1 bg-black/80 hover:bg-black text-white rounded-full transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <label className={`flex flex-col items-center justify-center border border-dashed border-border rounded-lg cursor-pointer hover:border-gold/50 hover:bg-gold/5 transition-all p-4 ${aspectRatio > 1 ? "aspect-[4/1]" : "aspect-[4/5] max-h-[160px]"}`}>
          {isUploading ? (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin text-gold" />
              <span className="text-xs">Enviando...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1 text-muted-foreground text-center">
              <Upload className="h-5 w-5 text-gold mb-1" />
              <span className="text-xs font-semibold">Carregar Imagem</span>
              <span className="text-[10px] text-muted-foreground/80">{aspectRatioLabel}</span>
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
            disabled={isUploading}
          />
        </label>
      )}
    </div>
  );
}

function CursosAdmin() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<"cursos" | "categorias">("cursos");
  const [search, setSearch] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedCurso, setSelectedCurso] = useState<any>(null);

  // Form State Curso
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [preco, setPreco] = useState("0");
  const [modalidadesDisponiveis, setModalidadesDisponiveis] = useState<string[]>(["online"]);
  const [duracao, setDuracao] = useState("6 meses");
  const [ativo, setAtivo] = useState(true);
  const [imagemCard, setImagemCard] = useState("");
  const [imagemCapa, setImagemCapa] = useState("");
  const [categoriaId, setCategoriaId] = useState<string | null>(null);

  // Form State Categoria
  const [isCatOpen, setIsCatOpen] = useState(false);
  const [selectedCategoria, setSelectedCategoria] = useState<any>(null);
  const [catNome, setCatNome] = useState("");
  const [catDescricao, setCatDescricao] = useState("");
  const [catAtiva, setCatAtiva] = useState(true);

  // Query courses
  const { data: cursos, isLoading } = useQuery({
    queryKey: ["admin-cursos-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cursos")
        .select("*, categorias(nome)")
        .order("titulo");

      if (error) throw error;
      return data ?? [];
    },
  });

  // Query categories
  const { data: categorias, isLoading: isCatLoading } = useQuery({
    queryKey: ["admin-categorias-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categorias")
        .select("*")
        .order("nome");
      if (error) throw error;
      return data ?? [];
    },
  });

  const salvarCurso = useMutation({
    mutationFn: async () => {
      if (!titulo) throw new Error("Preencha o título do curso.");
      const slug = titulo
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      const payload = {
        titulo,
        slug,
        descricao,
        preco: parseFloat(preco) || 0,
        modalidade: (modalidadesDisponiveis[0] || "online") as any,
        modalidades_disponiveis: modalidadesDisponiveis,
        duracao: duracao || null,
        ativo,
        imagem_card: imagemCard || null,
        imagem_capa: imagemCapa || null,
        categoria_id: categoriaId || null,
      };

      if (selectedCurso) {
        const { error } = await supabase
          .from("cursos")
          .update(payload)
          .eq("id", selectedCurso.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("cursos")
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-cursos-list"] });
      toast.success(selectedCurso ? "Curso atualizado com sucesso!" : "Curso criado com sucesso!");
      setIsAddOpen(false);
      setSelectedCurso(null);
      resetForm();
    },
    onError: (err: Error) => {
      toast.error(`Erro ao salvar curso: ${err.message}`);
    },
  });

  const salvarCategoria = useMutation({
    mutationFn: async () => {
      if (!catNome.trim()) throw new Error("Preencha o nome da categoria.");
      const catSlug = catNome
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      const payload = {
        nome: catNome,
        slug: catSlug,
        descricao: catDescricao || null,
        ativa: catAtiva,
      };

      if (selectedCategoria) {
        const { error } = await supabase
          .from("categorias")
          .update(payload)
          .eq("id", selectedCategoria.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("categorias")
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-categorias-list"] });
      qc.invalidateQueries({ queryKey: ["admin-cursos-list"] });
      toast.success(selectedCategoria ? "Categoria atualizada!" : "Categoria criada!");
      setIsCatOpen(false);
      setSelectedCategoria(null);
      resetCatForm();
    },
    onError: (err: Error) => {
      toast.error(`Erro ao salvar categoria: ${err.message}`);
    },
  });

  const excluirCurso = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("cursos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-cursos-list"] });
      toast.success("Curso removido!");
    },
    onError: (err: Error) => {
      toast.error(`Erro ao excluir: ${err.message}`);
    },
  });

  const excluirCategoria = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("categorias").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-categorias-list"] });
      qc.invalidateQueries({ queryKey: ["admin-cursos-list"] });
      toast.success("Categoria removida!");
    },
    onError: (err: Error) => {
      toast.error(`Erro ao excluir: ${err.message}`);
    },
  });

  function resetForm() {
    setTitulo("");
    setDescricao("");
    setPreco("0");
    setModalidadesDisponiveis(["online"]);
    setDuracao("6 meses");
    setAtivo(true);
    setImagemCard("");
    setImagemCapa("");
    setCategoriaId(null);
  }

  function resetCatForm() {
    setCatNome("");
    setCatDescricao("");
    setCatAtiva(true);
  }

  function openEdit(c: any) {
    setSelectedCurso(c);
    setTitulo(c.titulo);
    setDescricao(c.descricao || "");
    setPreco(c.preco.toString());
    setModalidadesDisponiveis(c.modalidades_disponiveis || [c.modalidade || "online"]);
    setDuracao(c.duracao || "");
    setAtivo(c.ativo);
    setImagemCard(c.imagem_card || "");
    setImagemCapa(c.imagem_capa || "");
    setCategoriaId(c.categoria_id || null);
    setIsAddOpen(true);
  }

  function openEditCat(cat: any) {
    setSelectedCategoria(cat);
    setCatNome(cat.nome);
    setCatDescricao(cat.descricao || "");
    setCatAtiva(cat.ativa);
    setIsCatOpen(true);
  }

  const filtered = (cursos ?? []).filter((c) =>
    c.titulo.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading || isCatLoading) {
    return <p className="text-muted-foreground p-4">Carregando painel acadêmico…</p>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-4xl">Gerenciar Catálogo</h1>
          <p className="mt-1 text-muted-foreground">Cadastre novos cursos, modifique disciplinas e organize categorias.</p>
        </div>
      </div>

      <div className="flex border-b border-border gap-4">
        <button
          onClick={() => setActiveTab("cursos")}
          className={`pb-2 text-sm font-semibold border-b-2 transition-all ${
            activeTab === "cursos"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Cursos
        </button>
        <button
          onClick={() => setActiveTab("categorias")}
          className={`pb-2 text-sm font-semibold border-b-2 transition-all ${
            activeTab === "categorias"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Categorias
        </button>
      </div>

      {activeTab === "cursos" ? (
        <div className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 max-w-sm w-full">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar curso por título..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            
            <Dialog
              open={isAddOpen}
              onOpenChange={(open) => {
                setIsAddOpen(open);
                if (!open) {
                  setSelectedCurso(null);
                  resetForm();
                }
              }}
            >
              <DialogTrigger asChild>
                <Button className="bg-gold text-gold-foreground hover:bg-gold/90 flex items-center gap-2">
                  <Plus className="h-4 w-4" /> Novo Curso
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md max-h-[90vh] flex flex-col">
                <DialogHeader>
                  <DialogTitle>{selectedCurso ? "Editar Curso" : "Novo Curso"}</DialogTitle>
                  <DialogDescription>Insira as informações gerais para compor a ementa do curso.</DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2 overflow-y-auto flex-1 pr-1">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Título *</label>
                    <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex: Teologia Sistemática" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Descrição</label>
                    <Input value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Apresentação do curso..." />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Categoria</label>
                    <Select value={categoriaId || "sem-categoria"} onValueChange={(val) => setCategoriaId(val === "sem-categoria" ? null : val)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sem-categoria">Sem categoria</SelectItem>
                        {(categorias ?? []).filter(cat => cat.ativa).map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold">Preço (R$)</label>
                      <Input type="number" step="0.01" value={preco} onChange={(e) => setPreco(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold">Duração</label>
                      <Input value={duracao} onChange={(e) => setDuracao(e.target.value)} placeholder="Ex: 6 meses" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold block">Modalidades Disponíveis *</label>
                    <div className="flex flex-wrap gap-4 pt-1">
                      {[
                        { id: "online", label: "Online (AVA)" },
                        { id: "presencial", label: "Presencial" },
                        { id: "hibrido", label: "Semi-presencial" },
                      ].map((opt) => {
                        const checked = modalidadesDisponiveis.includes(opt.id);
                        return (
                          <label key={opt.id} className="flex items-center gap-2 text-sm font-medium cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => {
                                if (checked) {
                                  if (modalidadesDisponiveis.length > 1) {
                                    setModalidadesDisponiveis(modalidadesDisponiveis.filter((m) => m !== opt.id));
                                  } else {
                                    toast.error("O curso deve ter pelo menos uma modalidade selecionada.");
                                  }
                                } else {
                                  setModalidadesDisponiveis([...modalidadesDisponiveis, opt.id]);
                                }
                              }}
                              className="h-4 w-4 rounded border-gray-300 text-gold focus:ring-gold"
                            />
                            <span>{opt.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Uploads de Imagens */}
                  <div className="grid grid-cols-1 gap-4 pt-2 border-t">
                    <ImageUpload
                      label="Imagem do Card (Grade)"
                      value={imagemCard}
                      onChange={setImagemCard}
                      aspectRatio={1080 / 1350}
                      aspectRatioLabel="1080x1350 (4:5)"
                    />
                    
                    <ImageUpload
                      label="Imagem de Capa (Detalhes)"
                      value={imagemCapa}
                      onChange={setImagemCapa}
                      aspectRatio={1584 / 396}
                      aspectRatioLabel="1584x396 (4:1)"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t">
                    <input
                      type="checkbox"
                      id="ativo-chk"
                      checked={ativo}
                      onChange={(e) => setAtivo(e.target.checked)}
                    />
                    <label htmlFor="ativo-chk" className="text-sm font-semibold cursor-pointer select-none">
                      Curso Ativo (Disponível para matrícula)
                    </label>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" className="w-full" onClick={() => setIsAddOpen(false)}>
                    Cancelar
                  </Button>
                  <Button
                    className="w-full bg-gold text-gold-foreground hover:bg-gold/90"
                    onClick={() => salvarCurso.mutate()}
                    disabled={salvarCurso.isPending}
                  >
                    {salvarCurso.isPending ? "Salvando..." : "Confirmar"}
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
                  <TableHead>Categoria</TableHead>
                  <TableHead>Modalidade</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead>Duração</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-semibold">{c.titulo}</TableCell>
                    <TableCell>
                      {c.categorias?.nome ? (
                        <Badge variant="outline">{c.categorias.nome}</Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">Sem categoria</span>
                      )}
                    </TableCell>
                    <TableCell className="capitalize">{c.modalidade === "hibrido" ? "Semi-presencial" : c.modalidade}</TableCell>
                    <TableCell>R$ {Number(c.preco).toFixed(2).replace(".", ",")}</TableCell>
                    <TableCell>{c.duracao || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={c.ativo ? "default" : "outline"}>
                        {c.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap space-x-1">
                      <Button variant="ghost" size="icon" asChild>
                        <Link to="/admin/cursos/$id/conteudo" params={{ id: c.id }}>
                          <BookOpen className="h-4 w-4 text-emerald-500" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(c)}>
                        <Edit3 className="h-4 w-4 text-primary" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => { if(confirm("Deseja mesmo excluir o curso?")) excluirCurso.mutate(c.id); }}>
                        <Trash2 className="h-4 w-4 text-rose-600" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-end">
            <Dialog
              open={isCatOpen}
              onOpenChange={(open) => {
                setIsCatOpen(open);
                if (!open) {
                  setSelectedCategoria(null);
                  resetCatForm();
                }
              }}
            >
              <DialogTrigger asChild>
                <Button className="bg-gold text-gold-foreground hover:bg-gold/90 flex items-center gap-2">
                  <Plus className="h-4 w-4" /> Nova Categoria
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>{selectedCategoria ? "Editar Categoria" : "Nova Categoria"}</DialogTitle>
                  <DialogDescription>Cadastre as categorias para organizar as disciplinas e cursos.</DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Nome *</label>
                    <Input value={catNome} onChange={(e) => setCatNome(e.target.value)} placeholder="Ex: Bacharelado, Extensão..." />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Descrição</label>
                    <Input value={catDescricao} onChange={(e) => setCatDescricao(e.target.value)} placeholder="Breve resumo..." />
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="checkbox"
                      id="cat-ativa-chk"
                      checked={catAtiva}
                      onChange={(e) => setCatAtiva(e.target.checked)}
                    />
                    <label htmlFor="cat-ativa-chk" className="text-sm font-semibold cursor-pointer select-none">
                      Categoria Ativa
                    </label>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button variant="outline" className="w-full" onClick={() => setIsCatOpen(false)}>
                    Cancelar
                  </Button>
                  <Button
                    className="w-full bg-gold text-gold-foreground hover:bg-gold/90"
                    onClick={() => salvarCategoria.mutate()}
                    disabled={salvarCategoria.isPending}
                  >
                    {salvarCategoria.isPending ? "Salvando..." : "Confirmar"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(categorias ?? []).map((cat) => (
                  <TableRow key={cat.id}>
                    <TableCell className="font-semibold">{cat.nome}</TableCell>
                    <TableCell>{cat.descricao || "—"}</TableCell>
                    <TableCell className="font-mono text-xs">{cat.slug}</TableCell>
                    <TableCell>
                      <Badge variant={cat.ativa ? "default" : "outline"}>
                        {cat.ativa ? "Ativa" : "Inativa"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => openEditCat(cat)}>
                        <Edit3 className="h-4 w-4 text-primary" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => { if(confirm("Deseja mesmo excluir esta categoria?")) excluirCategoria.mutate(cat.id); }}>
                        <Trash2 className="h-4 w-4 text-rose-600" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {categorias && categorias.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground p-4">
                      Nenhuma categoria cadastrada.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </div>
      )}
    </div>
  );
}
