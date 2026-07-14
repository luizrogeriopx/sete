import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Bell, Send, Users, ShieldAlert } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/admin/notificacoes")({
  component: NotificacoesAdmin,
});

function NotificacoesAdmin() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [destinatarioTipo, setDestinatarioTipo] = useState<"global" | "role" | "usuario">("global");
  const [targetRole, setTargetRole] = useState<any>("aluno");
  const [targetUserId, setTargetUserId] = useState("");
  const [titulo, setTitulo] = useState("");
  const [mensagem, setMensagem] = useState("");

  // Get active profiles list for targeted select
  const { data: profiles } = useQuery({
    queryKey: ["admin-profiles-select-notificacoes"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, nome_completo")
        .order("nome_completo");
      return data ?? [];
    },
  });

  // Get recent notification history
  const { data: historico, isLoading } = useQuery({
    queryKey: ["admin-notificacoes-history"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notificacoes")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(15);

      if (error) throw error;
      return data ?? [];
    },
  });

  const enviarAviso = useMutation({
    mutationFn: async () => {
      if (!titulo || !mensagem) throw new Error("Preencha o título e a mensagem.");

      const payload: any = {
        titulo,
        mensagem,
        enviada_por: user!.id,
        lida: false,
      };

      if (destinatarioTipo === "role") {
        payload.destinatario_role = targetRole;
      } else if (destinatarioTipo === "usuario") {
        if (!targetUserId) throw new Error("Selecione um usuário de destino.");
        payload.destinatario_id = targetUserId;
      } else {
        // Global: we can represent it as role = 'aluno' (or leave both null for general system messages). Let's put role = null and id = null
        payload.destinatario_role = null;
        payload.destinatario_id = null;
      }

      const { data, error } = await supabase
        .from("notificacoes")
        .insert(payload);

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-notificacoes-history"] });
      toast.success("Aviso enviado com sucesso!");
      setTitulo("");
      setMensagem("");
      setTargetUserId("");
    },
    onError: (err: Error) => {
      toast.error(`Erro ao disparar: ${err.message}`);
    },
  });

  if (isLoading) {
    return <p className="text-muted-foreground p-4">Carregando avisos…</p>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-4xl">Notificações</h1>
        <p className="mt-1 text-muted-foreground">Dispare comunicados acadêmicos ou avisos direcionados.</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Formulário de Disparo */}
        <Card className="lg:col-span-1 h-fit">
          <CardHeader>
            <CardTitle className="font-serif text-xl flex items-center gap-2">
              <Send className="h-5 w-5 text-gold" /> Disparar Comunicado
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold">Tipo de Destino</label>
              <Select value={destinatarioTipo} onValueChange={(val: any) => setDestinatarioTipo(val)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="global">Global (Todos os Usuários)</SelectItem>
                  <SelectItem value="role">Por Nível de Acesso (Papel)</SelectItem>
                  <SelectItem value="usuario">Indivíduo Específico</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {destinatarioTipo === "role" && (
              <div className="space-y-2 animate-fadeIn">
                <label className="text-sm font-semibold">Nível de Acesso (Papel)</label>
                <Select value={targetRole} onValueChange={setTargetRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aluno">Alunos</SelectItem>
                    <SelectItem value="professor">Professores</SelectItem>
                    <SelectItem value="secretaria">Secretaria</SelectItem>
                    <SelectItem value="admin">Administradores</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {destinatarioTipo === "usuario" && (
              <div className="space-y-2 animate-fadeIn">
                <label className="text-sm font-semibold">Selecionar Usuário</label>
                <Select value={targetUserId} onValueChange={setTargetUserId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {profiles?.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nome_completo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-semibold">Título do Aviso *</label>
              <Input
                placeholder="Ex: Prazo final de inscrições"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Mensagem *</label>
              <Textarea
                placeholder="Escreva a mensagem ou comunicado completo..."
                rows={4}
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
              />
            </div>

            <Button
              className="w-full bg-gold text-gold-foreground hover:bg-gold/90"
              onClick={() => enviarAviso.mutate()}
              disabled={enviarAviso.isPending}
            >
              {enviarAviso.isPending ? "Disparando..." : "Disparar Comunicado"}
            </Button>
          </CardContent>
        </Card>

        {/* Histórico Recente de Notificações */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="font-serif text-2xl flex items-center gap-2">
            <Bell className="h-5 w-5 text-gold" /> Comunicados Enviados
          </h2>
          <Card className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Mensagem</TableHead>
                  <TableHead>Destinatário</TableHead>
                  <TableHead>Enviado Em</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historico?.map((h) => {
                  let destText = "Global";
                  if (h.destinatario_role) {
                    destText = `Nível: ${h.destinatario_role}`;
                  } else if (h.destinatario_id) {
                    destText = `Individual (UID)`;
                  }

                  return (
                    <TableRow key={h.id}>
                      <TableCell className="font-semibold text-xs whitespace-nowrap">{h.titulo}</TableCell>
                      <TableCell className="max-w-xs text-xs truncate" title={h.mensagem}>
                        {h.mensagem}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs uppercase">
                          {destText}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs">
                        {new Date(h.created_at).toLocaleString("pt-BR")}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {historico?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-6">
                      Nenhum comunicado disparado até o momento.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </div>
      </div>
    </div>
  );
}
