import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Edit, Search, UserPlus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/secretaria/alunos")({
  component: AlunosSecretaria,
});

function AlunosSecretaria() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const [editNome, setEditNome] = useState("");
  const [editCpf, setEditCpf] = useState("");
  const [editTelefone, setEditTelefone] = useState("");
  const [editAtivo, setEditAtivo] = useState(true);

  // Fetch all profiles belonging to user role 'aluno'
  const { data: profiles, isLoading } = useQuery({
    queryKey: ["secretaria-alunos-list"],
    queryFn: async () => {
      // Get user ids with aluno role
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "aluno");

      const uids = (roleData ?? []).map((r) => r.user_id);
      if (uids.length === 0) return [];

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .in("id", uids)
        .order("nome_completo", { ascending: true });

      if (error) throw error;
      return data ?? [];
    },
  });

  const atualizarPerfil = useMutation({
    mutationFn: async () => {
      if (!selectedProfile) return;
      const { error } = await supabase
        .from("profiles")
        .update({
          nome_completo: editNome,
          cpf: editCpf || null,
          telefone: editTelefone || null,
          ativo: editAtivo,
        })
        .eq("id", selectedProfile.id);

      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["secretaria-alunos-list"] });
      toast.success("Perfil do aluno atualizado com sucesso!");
      setSelectedProfile(null);
    },
    onError: (err: Error) => {
      toast.error(`Erro ao atualizar perfil: ${err.message}`);
    },
  });

  function openEdit(profile: any) {
    setSelectedProfile(profile);
    setEditNome(profile.nome_completo || "");
    setEditCpf(profile.cpf || "");
    setEditTelefone(profile.telefone || "");
    setEditAtivo(profile.ativo ?? true);
  }

  const filtered = (profiles ?? []).filter((p) => {
    const q = search.toLowerCase();
    return (
      (p.nome_completo ?? "").toLowerCase().includes(q) ||
      (p.cpf ?? "").toLowerCase().includes(q)
    );
  });

  if (isLoading) {
    return <p className="text-muted-foreground p-4">Carregando alunos…</p>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-4xl">Alunos</h1>
          <p className="mt-1 text-muted-foreground">Consulte e atualize os perfis cadastrados no seminário.</p>
        </div>
      </div>

      <div className="flex items-center gap-2 max-w-sm">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar aluno por nome ou CPF..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Card className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome Completo</TableHead>
              <TableHead>CPF</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.nome_completo}</TableCell>
                <TableCell>{p.cpf || "—"}</TableCell>
                <TableCell>{p.telefone || "—"}</TableCell>
                <TableCell>
                  <Badge variant={p.ativo ? "default" : "secondary"}>
                    {p.ativo ? "Ativo" : "Inativo"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Dialog open={selectedProfile?.id === p.id} onOpenChange={(open) => !open && setSelectedProfile(null)}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                        <Edit className="h-4 w-4 text-primary" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Editar Cadastro do Aluno</DialogTitle>
                        <DialogDescription>Atualize os dados cadastrais deste estudante.</DialogDescription>
                      </DialogHeader>

                      <div className="space-y-4 py-2">
                        <div className="space-y-2">
                          <label className="text-sm font-semibold">Nome Completo</label>
                          <Input value={editNome} onChange={(e) => setEditNome(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-semibold">CPF</label>
                          <Input value={editCpf} onChange={(e) => setEditCpf(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-semibold">Telefone</label>
                          <Input value={editTelefone} onChange={(e) => setEditTelefone(e.target.value)} />
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="ativo-chk"
                            checked={editAtivo}
                            onChange={(e) => setEditAtivo(e.target.checked)}
                            className="rounded border-border"
                          />
                          <label htmlFor="ativo-chk" className="text-sm font-semibold select-none cursor-pointer">
                            Aluno Ativo no Sistema
                          </label>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button variant="outline" className="w-full" onClick={() => setSelectedProfile(null)}>
                          Cancelar
                        </Button>
                        <Button
                          className="w-full bg-gold text-gold-foreground hover:bg-gold/90"
                          onClick={() => atualizarPerfil.mutate()}
                          disabled={atualizarPerfil.isPending}
                        >
                          {atualizarPerfil.isPending ? "Salvando..." : "Salvar Alterações"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                  Nenhum aluno encontrado correspondente à pesquisa.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
