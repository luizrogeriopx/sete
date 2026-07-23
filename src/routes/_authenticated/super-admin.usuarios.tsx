import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, Key, Search, GraduationCap } from "lucide-react";
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
  const [selectedUserMatriculas, setSelectedUserMatriculas] = useState<any>(null);
  const [cursoIdParaMatricular, setCursoIdParaMatricular] = useState("");

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

  // Fetch enrollments for the selected student
  const { data: userMatriculas, isLoading: isMatriculasLoading } = useQuery({
    queryKey: ["super-admin-user-matriculas", selectedUserMatriculas?.id],
    queryFn: async () => {
      if (!selectedUserMatriculas?.id) return [];
      const { data, error } = await supabase
        .from("matriculas")
        .select("*, cursos(titulo)")
        .eq("aluno_id", selectedUserMatriculas.id);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!selectedUserMatriculas?.id,
  });

  // Fetch all active courses for manual enrollment dropdown
  const { data: allCourses } = useQuery({
    queryKey: ["super-admin-all-courses-select"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cursos")
        .select("id, titulo")
        .eq("ativo", true)
        .order("titulo");
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!selectedUserMatriculas?.id,
  });

  // Mutation to update enrollment status
  const updateMatriculaStatus = useMutation({
    mutationFn: async ({
      matriculaId,
      status,
      progresso,
      concluir,
      alunoId,
      cursoId,
    }: {
      matriculaId: string;
      status: any;
      progresso?: number;
      concluir?: boolean;
      alunoId: string;
      cursoId: string;
    }) => {
      const updates: any = { status };
      if (concluir) {
        updates.progresso = 100;
        updates.data_conclusao = new Date().toISOString();
      } else if (progresso !== undefined) {
        updates.progresso = progresso;
      }
      
      const { error } = await supabase
        .from("matriculas")
        .update(updates)
        .eq("id", matriculaId);
      
      if (error) throw error;

      if (status === "concluida") {
        // Find layout for this course
        const { data: layout } = await supabase
          .from("layouts_certificado")
          .select("id")
          .eq("curso_id", cursoId)
          .maybeSingle();

        let layoutId = layout?.id;
        if (!layoutId) {
          const { data: defaultLayout } = await supabase
            .from("layouts_certificado")
            .select("id")
            .eq("padrao", true)
            .maybeSingle();
          layoutId = defaultLayout?.id;
        }

        const { error: certError } = await supabase
          .from("certificados")
          .insert({
            aluno_id: alunoId,
            curso_id: cursoId,
            layout_id: layoutId || null,
          });

        if (certError && !certError.message.includes("duplicate key")) {
          throw certError;
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["super-admin-user-matriculas", selectedUserMatriculas?.id] });
      toast.success("Matrícula atualizada com sucesso!");
    },
    onError: (err: Error) => {
      toast.error(`Erro ao atualizar matrícula: ${err.message}`);
    }
  });

  // Mutation to enroll student in a course
  const matricularAlunoSuper = useMutation({
    mutationFn: async () => {
      if (!selectedUserMatriculas?.id || !cursoIdParaMatricular) {
        throw new Error("Selecione um curso para matricular.");
      }

      // Check if already enrolled
      const { data: existing } = await supabase
        .from("matriculas")
        .select("id")
        .eq("aluno_id", selectedUserMatriculas.id)
        .eq("curso_id", cursoIdParaMatricular)
        .maybeSingle();

      if (existing) {
        throw new Error("Este usuário já está matriculado neste curso.");
      }

      const { error } = await supabase
        .from("matriculas")
        .insert({
          aluno_id: selectedUserMatriculas.id,
          curso_id: cursoIdParaMatricular,
          status: "ativa", // enroll directly as active
          progresso: 0,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["super-admin-user-matriculas", selectedUserMatriculas?.id] });
      toast.success("Aluno matriculado com sucesso!");
      setCursoIdParaMatricular("");
    },
    onError: (err: Error) => {
      toast.error(`Erro ao matricular: ${err.message}`);
    }
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
        <Input placeholder="Buscar usuário por nome..." value={search} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)} />
      </div>

      <Card className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome Completo</TableHead>
              <TableHead>Nível de Acesso (Cargo)</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead className="text-right">Ações</TableHead>
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
                <TableCell className="text-right space-x-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Gerenciar Matrículas"
                    onClick={() => setSelectedUserMatriculas(u)}
                  >
                    <GraduationCap className="h-4 w-4 text-emerald-600" />
                  </Button>
                  <Dialog open={selectedUser?.id === u.id} onOpenChange={(open) => !open && setSelectedUser(null)}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="icon" title="Alterar Cargo" onClick={() => openEdit(u)}>
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

      {/* Dialog for Managing Student Enrollments */}
      <Dialog open={!!selectedUserMatriculas} onOpenChange={(open) => !open && setSelectedUserMatriculas(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl flex items-center gap-2">
              <GraduationCap className="h-6 w-6 text-gold" /> Matrículas de {selectedUserMatriculas?.nome_completo}
            </DialogTitle>
            <DialogDescription>
              Gerencie as matrículas e o progresso do aluno. Você pode aprovar/ativar matrículas pendentes ou registrar a conclusão.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-6">
            {/* List of Enrollments */}
            <div className="space-y-2">
              <h3 className="font-serif text-lg">Cursos Matriculados</h3>
              {isMatriculasLoading ? (
                <p className="text-muted-foreground text-center py-4">Carregando matrículas...</p>
              ) : !userMatriculas || userMatriculas.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground border border-dashed rounded-lg text-sm">
                  Este usuário não está matriculado em nenhum curso.
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden bg-card">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Curso</TableHead>
                        <TableHead>Progresso</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {userMatriculas.map((m: any) => (
                        <TableRow key={m.id}>
                          <TableCell className="font-semibold text-sm">{m.cursos?.titulo}</TableCell>
                          <TableCell className="font-mono text-xs">{m.progresso}%</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                m.status === "ativa"
                                  ? "default"
                                  : m.status === "concluida"
                                  ? "secondary"
                                  : "outline"
                              }
                              className={m.status === "ativa" ? "bg-emerald-600 hover:bg-emerald-600 text-white" : ""}
                            >
                              {m.status.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                            {m.status === "pendente" && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 border-emerald-200"
                                onClick={() => updateMatriculaStatus.mutate({ matriculaId: m.id, status: "ativa", alunoId: m.aluno_id, cursoId: m.curso_id })}
                                disabled={updateMatriculaStatus.isPending}
                              >
                                Aprovar/Ativar
                              </Button>
                            )}
                            {m.status === "ativa" && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="bg-amber-50 text-amber-700 hover:bg-amber-100 hover:text-amber-800 border-amber-200"
                                onClick={() => updateMatriculaStatus.mutate({ matriculaId: m.id, status: "concluida", concluir: true, alunoId: m.aluno_id, cursoId: m.curso_id })}
                                disabled={updateMatriculaStatus.isPending}
                              >
                                Aprovar Conclusão
                              </Button>
                            )}
                            
                            <Select
                              value={m.status}
                              onValueChange={(val) => updateMatriculaStatus.mutate({ matriculaId: m.id, status: val, alunoId: m.aluno_id, cursoId: m.curso_id })}
                              disabled={updateMatriculaStatus.isPending}
                            >
                              <SelectTrigger className="inline-flex w-[120px] h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pendente">Pendente</SelectItem>
                                <SelectItem value="ativa">Ativa</SelectItem>
                                <SelectItem value="concluida">Concluída</SelectItem>
                                <SelectItem value="cancelada">Cancelada</SelectItem>
                                <SelectItem value="trancada">Trancada</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

            {/* Quick Enrollment Section */}
            <div className="border-t pt-4 space-y-3">
              <h3 className="font-serif text-lg">Matricular em Novo Curso</h3>
              <div className="flex gap-2 items-end">
                <div className="flex-1 space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Selecionar Curso</label>
                  <Select value={cursoIdParaMatricular} onValueChange={setCursoIdParaMatricular}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um curso ativo..." />
                    </SelectTrigger>
                    <SelectContent>
                      {allCourses?.map((c: any) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.titulo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  className="bg-gold text-gold-foreground hover:bg-gold/90"
                  onClick={() => matricularAlunoSuper.mutate()}
                  disabled={matricularAlunoSuper.isPending || !cursoIdParaMatricular}
                >
                  {matricularAlunoSuper.isPending ? "Matriculando..." : "Matricular Aluno"}
                </Button>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setSelectedUserMatriculas(null)}>
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
