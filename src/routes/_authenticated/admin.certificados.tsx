import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileImage, Plus, Trash2, Pencil } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/certificados")({
  component: LayoutsCertificado,
});

type LayoutRow = {
  id: string;
  nome: string;
  imagem_url: string | null;
  curso_id: string | null;
  padrao: boolean;
  orientacao: string;
  cursos?: { titulo: string } | null;
};

const BUCKET = "certificado-layouts";

function LayoutsCertificado() {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<LayoutRow | null>(null);
  const [nome, setNome] = useState("");
  const [cursoId, setCursoId] = useState<string>("__none");
  const [padrao, setPadrao] = useState(false);
  const [orientacao, setOrientacao] = useState<"paisagem" | "retrato">("paisagem");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const { data: layouts, isLoading } = useQuery({
    queryKey: ["admin-cert-layouts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("layouts_certificado")
        .select("id, nome, imagem_url, curso_id, padrao, orientacao, cursos(titulo)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as LayoutRow[];
    },
  });

  const { data: cursos } = useQuery({
    queryKey: ["admin-cursos-select-layouts"],
    queryFn: async () => {
      const { data } = await supabase.from("cursos").select("id, titulo").order("titulo");
      return data ?? [];
    },
  });

  // Signed URLs for private bucket previews
  const { data: signedMap } = useQuery({
    queryKey: ["admin-cert-layouts-signed", layouts?.map((l) => l.imagem_url).join("|")],
    enabled: !!layouts?.length,
    queryFn: async () => {
      const map: Record<string, string> = {};
      const paths = (layouts ?? []).map((l) => l.imagem_url).filter(Boolean) as string[];
      if (paths.length === 0) return map;
      const { data } = await supabase.storage.from(BUCKET).createSignedUrls(paths, 3600);
      (data ?? []).forEach((s) => {
        if (s.path && s.signedUrl) map[s.path] = s.signedUrl;
      });
      return map;
    },
  });

  function resetForm() {
    setEditing(null);
    setNome("");
    setCursoId("__none");
    setPadrao(false);
    setOrientacao("paisagem");
    setFile(null);
    setPreviewUrl(null);
  }

  function openCreate() {
    resetForm();
    setDialogOpen(true);
  }

  function openEdit(row: LayoutRow) {
    setEditing(row);
    setNome(row.nome);
    setCursoId(row.curso_id ?? "__none");
    setPadrao(row.padrao);
    setOrientacao((row.orientacao as "paisagem" | "retrato") ?? "paisagem");
    setFile(null);
    setPreviewUrl(row.imagem_url ? signedMap?.[row.imagem_url] ?? null : null);
    setDialogOpen(true);
  }

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const save = useMutation({
    mutationFn: async () => {
      if (!nome.trim()) throw new Error("Informe o nome do layout.");
      if (!editing && !file) throw new Error("Envie a imagem do layout.");

      let imagemPath = editing?.imagem_url ?? null;
      if (file) {
        const ext = file.name.split(".").pop() ?? "png";
        const path = `${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from(BUCKET)
          .upload(path, file, { contentType: file.type, upsert: false });
        if (upErr) throw upErr;
        // Remove old file when replacing
        if (editing?.imagem_url) {
          await supabase.storage.from(BUCKET).remove([editing.imagem_url]);
        }
        imagemPath = path;
      }

      const payload = {
        nome: nome.trim(),
        curso_id: cursoId === "__none" ? null : cursoId,
        padrao,
        orientacao,
        imagem_url: imagemPath,
      };

      if (editing) {
        const { error } = await supabase.from("layouts_certificado").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("layouts_certificado").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-cert-layouts"] });
      toast.success(editing ? "Layout atualizado." : "Layout cadastrado.");
      setDialogOpen(false);
      resetForm();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (row: LayoutRow) => {
      if (row.imagem_url) {
        await supabase.storage.from(BUCKET).remove([row.imagem_url]);
      }
      const { error } = await supabase.from("layouts_certificado").delete().eq("id", row.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-cert-layouts"] });
      toast.success("Layout removido.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-4xl">Layouts de Certificado</h1>
          <p className="mt-1 text-muted-foreground">
            Cadastre os modelos visuais utilizados para gerar automaticamente os certificados dos alunos ao concluírem
            um curso. Vincule um layout a um curso específico ou marque como padrão para todos.
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button onClick={openCreate} className="bg-gold text-gold-foreground hover:bg-gold/90 gap-2">
              <Plus className="h-4 w-4" /> Novo Layout
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editing ? "Editar layout" : "Novo layout de certificado"}</DialogTitle>
              <DialogDescription>
                Envie a arte do certificado (imagem PNG/JPG). Os dados do aluno serão sobrepostos automaticamente.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Nome do layout</Label>
                <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Padrão Teologia" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Curso vinculado</Label>
                  <Select value={cursoId} onValueChange={setCursoId}>
                    <SelectTrigger><SelectValue placeholder="Nenhum (genérico)" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none">Nenhum (genérico)</SelectItem>
                      {cursos?.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.titulo}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Orientação</Label>
                  <Select value={orientacao} onValueChange={(v) => setOrientacao(v as "paisagem" | "retrato")}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="paisagem">Paisagem</SelectItem>
                      <SelectItem value="retrato">Retrato</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-md border border-border p-3">
                <div>
                  <Label className="text-sm">Layout padrão</Label>
                  <p className="text-xs text-muted-foreground">Usado quando o curso não tem layout específico.</p>
                </div>
                <Switch checked={padrao} onCheckedChange={setPadrao} />
              </div>

              <div className="space-y-2">
                <Label>Arquivo de imagem</Label>
                <Input
                  type="file"
                  accept="image/png,image/jpeg"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
                {previewUrl && (
                  <div className="mt-2 overflow-hidden rounded-md border border-border">
                    <img src={previewUrl} alt="Prévia" className="max-h-48 w-full object-contain bg-muted" />
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button
                onClick={() => save.mutate()}
                disabled={save.isPending}
                className="bg-gold text-gold-foreground hover:bg-gold/90"
              >
                {save.isPending ? "Salvando…" : "Salvar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Carregando layouts…</p>
      ) : !layouts || layouts.length === 0 ? (
        <Card className="border-dashed p-10 text-center text-muted-foreground">
          <FileImage className="mx-auto h-12 w-12 text-muted-foreground/40" />
          <p className="mt-4">Nenhum layout cadastrado. Envie o primeiro modelo para começar.</p>
        </Card>
      ) : (
        <Card className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Prévia</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Curso</TableHead>
                <TableHead>Orientação</TableHead>
                <TableHead>Padrão</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {layouts.map((l) => (
                <TableRow key={l.id}>
                  <TableCell>
                    {l.imagem_url && signedMap?.[l.imagem_url] ? (
                      <img
                        src={signedMap[l.imagem_url]}
                        alt={l.nome}
                        className="h-14 w-24 rounded border border-border object-cover"
                      />
                    ) : (
                      <div className="flex h-14 w-24 items-center justify-center rounded border border-dashed border-border text-muted-foreground">
                        <FileImage className="h-5 w-5" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-semibold">{l.nome}</TableCell>
                  <TableCell>{l.cursos?.titulo ?? <span className="text-muted-foreground">— Genérico —</span>}</TableCell>
                  <TableCell className="capitalize">{l.orientacao}</TableCell>
                  <TableCell>{l.padrao ? <Badge>Padrão</Badge> : <span className="text-muted-foreground">—</span>}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEdit(l)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (confirm(`Remover o layout "${l.nome}"?`)) remove.mutate(l);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
