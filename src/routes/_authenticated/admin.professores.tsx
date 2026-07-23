import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Link2, Award, User, HelpCircle, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@supabase/supabase-js";

export const Route = createFileRoute("/_authenticated/admin/professores")({
  component: ProfessoresAdmin,
});

function ProfessoresAdmin() {
  const qc = useQueryClient();
  const [isLinkOpen, setIsLinkOpen] = useState(false);
  const [cursoId, setCursoId] = useState("");
  const [professorId, setProfessorId] = useState("");

  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [regNome, setRegNome] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("123456");
  const [regTelefone, setRegTelefone] = useState("");
  const [regCpf, setRegCpf] = useState("");
  const [regDataNasc, setRegDataNasc] = useState("");

  // Get profiles with role = 'professor'
  const { data: professores, isLoading: isProfsLoading } = useQuery({
    queryKey: ["admin-professores-list"],
    queryFn: async () => {
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "professor");

      const uids = (roleData ?? []).map((r) => r.user_id);
      if (uids.length === 0) return [];

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .in("id", uids)
        .order("nome_completo");

      if (error) throw error;
      return data ?? [];
    },
  });

  // Get courses and their linked teachers
  const { data: cursos, isLoading: isCursosLoading } = useQuery({
    queryKey: ["admin-cursos-professores"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cursos")
        .select("id, titulo, ministrante_id, profiles:ministrante_id(nome_completo)")
        .order("titulo");

      if (error) throw error;
      return data ?? [];
    },
  });

  const vincularProfessor = useMutation({
    mutationFn: async () => {
      if (!cursoId || !professorId) throw new Error("Selecione o curso e o professor.");

      const { error } = await supabase
        .from("cursos")
        .update({ ministrante_id: professorId === "none" ? null : professorId })
        .eq("id", cursoId);

      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-cursos-professores"] });
      toast.success("Vínculo do professor atualizado com sucesso!");
      setIsLinkOpen(false);
      setCursoId("");
      setProfessorId("");
    },
    onError: (err: Error) => {
      toast.error(`Erro ao vincular: ${err.message}`);
    },
  });

  const cadastrarProfessor = useMutation({
    mutationFn: async () => {
      if (!regNome || !regEmail || !regPassword) {
        throw new Error("Nome, E-mail e Senha são obrigatórios.");
      }

      // 1. Create client without persisting session
      const tempClient = createClient(
        import.meta.env.VITE_SUPABASE_URL || "",
        import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "",
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false,
          },
        }
      );

      // 2. SignUp the user in auth
      const { data: signUpData, error: signUpError } = await tempClient.auth.signUp({
        email: regEmail,
        password: regPassword,
        options: {
          data: {
            nome_completo: regNome,
            telefone: regTelefone || null,
            cpf: regCpf || null,
            data_nascimento: regDataNasc || null,
          },
        },
      });

      if (signUpError) throw signUpError;
      if (!signUpData.user?.id) throw new Error("Erro ao criar usuário.");

      const newUserId = signUpData.user.id;

      // 3. Delete automatic 'aluno' role created by trigger
      await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", newUserId);

      // 4. Assign role 'professor'
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({
          user_id: newUserId,
          role: "professor",
        });

      if (roleError) throw roleError;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-professores-list"] });
      toast.success("Professor cadastrado com sucesso!");
      setIsRegisterOpen(false);
      // Reset form
      setRegNome("");
      setRegEmail("");
      setRegPassword("123456");
      setRegTelefone("");
      setRegCpf("");
      setRegDataNasc("");
    },
    onError: (err: Error) => {
      toast.error(`Erro ao cadastrar: ${err.message}`);
    },
  });

  if (isProfsLoading || isCursosLoading) {
    return <p className="text-muted-foreground p-4">Carregando docentes…</p>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-4xl">Professores</h1>
          <p className="mt-1 text-muted-foreground">Vincule ministrantes às disciplinas e acompanhe o corpo docente.</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Dialog to Register Teacher */}
          <Dialog open={isRegisterOpen} onOpenChange={setIsRegisterOpen}>
            <DialogTrigger asChild>
              <Button className="bg-slate-900 text-gold hover:bg-slate-800 border border-gold/30 flex items-center gap-2">
                <Plus className="h-4 w-4" /> Cadastrar Professor
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Cadastrar Novo Professor</DialogTitle>
                <DialogDescription>
                  Crie uma nova conta de acesso para um professor. O professor receberá o papel de acesso correspondente.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                <div className="space-y-1">
                  <Label htmlFor="reg-nome">Nome Completo *</Label>
                  <Input
                    id="reg-nome"
                    required
                    value={regNome}
                    onChange={(e) => setRegNome(e.target.value)}
                    placeholder="Ex: Prof. Dr. João Silva"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="reg-email">E-mail *</Label>
                  <Input
                    id="reg-email"
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="joao.silva@exemplo.com"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="reg-password">Senha Provisória *</Label>
                  <Input
                    id="reg-password"
                    type="password"
                    required
                    minLength={6}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="reg-telefone">Telefone / WhatsApp</Label>
                  <Input
                    id="reg-telefone"
                    value={regTelefone}
                    onChange={(e) => setRegTelefone(e.target.value)}
                    placeholder="Ex: (11) 99999-9999"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="reg-cpf">CPF</Label>
                    <Input
                      id="reg-cpf"
                      value={regCpf}
                      onChange={(e) => setRegCpf(e.target.value)}
                      placeholder="000.000.000-00"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="reg-data-nasc">Data de Nascimento</Label>
                    <Input
                      id="reg-data-nasc"
                      type="date"
                      value={regDataNasc}
                      onChange={(e) => setRegDataNasc(e.target.value)}
                      className="text-slate-300"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="w-full" onClick={() => setIsRegisterOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  className="w-full bg-gold text-gold-foreground hover:bg-gold/90"
                  onClick={() => cadastrarProfessor.mutate()}
                  disabled={cadastrarProfessor.isPending}
                >
                  {cadastrarProfessor.isPending ? "Cadastrando..." : "Cadastrar"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Dialog to Link Teacher */}
          <Dialog open={isLinkOpen} onOpenChange={setIsLinkOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gold text-gold-foreground hover:bg-gold/90 flex items-center gap-2">
                <Link2 className="h-4 w-4" /> Vincular Professor
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Vincular Professor ao Curso</DialogTitle>
              <DialogDescription>Associe um professor cadastrado à ministração de um curso.</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <label className="text-sm font-semibold">Curso</label>
                <Select value={cursoId} onValueChange={setCursoId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o curso..." />
                  </SelectTrigger>
                  <SelectContent>
                    {cursos?.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.titulo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold">Professor Ministrante</label>
                <Select value={professorId} onValueChange={setProfessorId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o professor..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Remover Ministrante (Sem Professor)</SelectItem>
                    {professores?.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nome_completo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="w-full" onClick={() => setIsLinkOpen(false)}>
                Cancelar
              </Button>
              <Button
                className="w-full bg-gold text-gold-foreground hover:bg-gold/90"
                onClick={() => vincularProfessor.mutate()}
                disabled={vincularProfessor.isPending}
              >
                {vincularProfessor.isPending ? "Vinculando..." : "Salvar Vínculo"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Lista de Professores Ativos */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="font-serif text-2xl">Docentes Cadastrados</h2>
          {professores?.length === 0 ? (
            <Card className="p-6 text-center text-muted-foreground border-dashed">
              <User className="mx-auto h-8 w-8 opacity-50 mb-2" />
              Nenhum professor cadastrado no sistema. Atribua o cargo 'professor' em Usuários.
            </Card>
          ) : (
            <div className="space-y-2">
              {professores?.map((p) => (
                <Card key={p.id}>
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-gold/10 text-gold flex items-center justify-center font-bold">
                      {p.nome_completo[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-sm leading-tight">{p.nome_completo}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">{p.telefone || "Sem telefone"}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Grade de Cursos e Professores Vinculados */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="font-serif text-2xl">Distribuição de Matérias</h2>
          <Card className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Curso</TableHead>
                  <TableHead>Professor Responsável</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cursos?.map((c: any) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-semibold">{c.titulo}</TableCell>
                    <TableCell>
                      {c.profiles?.nome_completo ? (
                        <Badge className="bg-slate-900 text-gold hover:bg-slate-900 border border-gold/30">
                          🎓 {c.profiles.nome_completo}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs italic">Sem professor associado</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>
      </div>
    </div>
  );
}
