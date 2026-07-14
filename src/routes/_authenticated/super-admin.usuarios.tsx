import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, Key, Search } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/super-admin/usuarios")({
  component: UsuariosSuperAdmin,
});

function UsuariosSuperAdmin() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [novaRole, setNovaRole] = useState<any>("aluno");

  // Fetch all profiles and their roles
  const { data: users, isLoading } = useQuery({
    queryKey: ["super-admin-users-list"],
    queryFn: async () => {
      // 1. Fetch profiles
      const { data: profiles, error: pError } = await supabase
        .from("profiles")
        .select("*")
        .order("nome_completo");

      if (pError) throw pError;

      // 2. Fetch roles
      const { data: roles, error: rError } = await supabase
        .from("user_roles")
        .select("*");

      if (rError) throw rError;

      // Map roles to profiles
      const mapped = (profiles ?? []).map((p) => {
        const userRoles = roles?.filter((r) => r.user_id === p.id).map((r) => r.role) ?? [];
        return {
          ...p,
          roles: userRoles,
        };
      });

      return mapped;
    },
  });

  const salvarPermissao = useMutation({
    mutationFn: async () => {
      if (!selectedUser) return;

      // For safety, delete previous roles for this user and add the new chosen role.
      // SETE has single primary role structure, but user_roles table allows multiple rows. We overwrite for convenience.
      const { error: deleteError } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", selectedUser.id);

      if (deleteError) throw deleteError;

      const { error: insertError } = await supabase
        .from("user_roles")
        .insert({
          user_id: selectedUser.id,
          role: novaRole,
        });

      if (insertError) throw insertError;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["super-admin-users-list"] });
      toast.success("Nível de acesso atualizado com sucesso!");
      setSelectedUser(null);
    },
    onError: (err: Error) => {
      toast.error(`Erro ao atualizar papel: ${err.message}`);
    },
  });

  function openEdit(u: any) {
    setSelectedUser(u);
    setNovaRole(u.roles?.[0] || "aluno");
  }

  const filtered = (users ?? []).filter((u) =>
    (u.nome_completo ?? "").toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return <p className="text-muted-foreground p-4">Carregando usuários…</p>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-4xl">Controle de Usuários</h1>
        <p className="mt-1 text-muted-foreground">Gerencie o nível de acesso e permissões das contas registradas.</p>
      </div>

      <div className="flex items-center gap-2 max-w-sm">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar usuário por nome..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Card className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome Completo</TableHead>
              <TableHead>Nível de Acesso (Cargo)</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead className="text-right">Ação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-semibold">{u.nome_completo}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {u.roles.length === 0 ? (
                      <Badge variant="outline">Sem Cargo</Badge>
                    ) : (
                      u.roles.map((r: string) => (
                        <Badge
                          key={r}
                          className={
                            r === "super_admin"
                              ? "bg-purple-600 text-white"
                              : r === "admin"
                              ? "bg-red-600 text-white"
                              : r === "secretaria"
                              ? "bg-blue-600 text-white"
                              : r === "professor"
                              ? "bg-amber-600 text-white"
                              : "bg-slate-500 text-white"
                          }
                        >
                          {r.toUpperCase()}
                        </Badge>
                      ))
                    )}
                  </div>
                </TableCell>
                <TableCell>{u.telefone || "—"}</TableCell>
                <TableCell className="text-right">
                  <Dialog open={selectedUser?.id === u.id} onOpenChange={(open) => !open && setSelectedUser(null)}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(u)}>
                        <Key className="h-4 w-4 text-primary" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Alterar Nível de Acesso</DialogTitle>
                        <DialogDescription>
                          Ajuste as permissões de acesso do usuário. Atenção ao conceder privilégios administrativos.
                        </DialogDescription>
                      </DialogHeader>

                      <div className="space-y-4 py-2">
                        <div className="rounded-lg bg-slate-50 dark:bg-slate-900 border p-4 text-xs space-y-1">
                          <div><strong>Nome:</strong> {u.nome_completo}</div>
                          <div><strong>ID:</strong> {u.id}</div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-semibold">Nível de Acesso (Cargo)</label>
                          <Select value={novaRole} onValueChange={(val: any) => setNovaRole(val)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="aluno">Aluno (Portal do Aluno)</SelectItem>
                              <SelectItem value="professor">Professor (Lançar Chamadas/Notas)</SelectItem>
                              <SelectItem value="secretaria">Secretaria (Efetuar Matrículas/Atendimento)</SelectItem>
                              <SelectItem value="admin">Administrador (Total sobre cursos/financeiro)</SelectItem>
                              <SelectItem value="super_admin">Super Administrador (Acesso ao console completo)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button variant="outline" className="w-full" onClick={() => setSelectedUser(null)}>
                          Cancelar
                        </Button>
                        <Button
                          className="w-full bg-gold text-gold-foreground hover:bg-gold/90"
                          onClick={() => salvarPermissao.mutate()}
                          disabled={salvarPermissao.isPending}
                        >
                          {salvarPermissao.isPending ? "Salvando..." : "Atualizar Permissão"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
