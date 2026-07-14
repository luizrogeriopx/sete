import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LifeBuoy, Send, MessageSquare } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/super-admin/suporte")({
  component: SuporteGlobalSuperAdmin,
});

function SuporteGlobalSuperAdmin() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [novaMensagem, setNovaMensagem] = useState("");
  const [statusFiltro, setStatusFiltro] = useState<string>("all");

  // Fetch all support tickets and resolve profiles manually in memory to prevent relationship errors
  const { data, isLoading: isTicketsLoading } = useQuery({
    queryKey: ["super-admin-tickets-list"],
    queryFn: async () => {
      const { data: tickets, error: tError } = await supabase
        .from("suporte_tickets")
        .select("*")
        .order("updated_at", { ascending: false });

      if (tError) throw tError;

      const userIds = Array.from(new Set((tickets ?? []).map((t) => t.usuario_id).filter(Boolean)));

      const profilesMap: Record<string, string> = {};
      if (userIds.length > 0) {
        const { data: profiles, error: prError } = await supabase
          .from("profiles")
          .select("id, nome_completo")
          .in("id", userIds);

        if (prError) throw prError;

        profiles?.forEach((p) => {
          profilesMap[p.id] = p.nome_completo;
        });
      }

      return {
        tickets: tickets ?? [],
        profilesMap,
      };
    },
  });

  const tickets = data?.tickets ?? [];
  const profilesMap = data?.profilesMap ?? {};

  // Fetch messages for active ticket
  const { data: mensagens, isLoading: isMensagensLoading } = useQuery({
    queryKey: ["super-admin-ticket-messages", activeTicketId],
    enabled: !!activeTicketId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ticket_mensagens")
        .select("*")
        .eq("ticket_id", activeTicketId!)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data ?? [];
    },
  });

  const enviarResposta = useMutation({
    mutationFn: async () => {
      if (!novaMensagem.trim() || !activeTicketId) return;

      const { error } = await supabase
        .from("ticket_mensagens")
        .insert({
          ticket_id: activeTicketId,
          autor_id: user!.id,
          mensagem: novaMensagem,
        });

      if (error) throw error;

      // Update ticket updated_at and set status to em_andamento if it was open
      const ticket = tickets.find((t) => t.id === activeTicketId);
      const nextStatus = ticket?.status === "aberto" ? "em_andamento" : ticket?.status;

      await supabase
        .from("suporte_tickets")
        .update({
          updated_at: new Date().toISOString(),
          status: nextStatus,
        })
        .eq("id", activeTicketId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["super-admin-ticket-messages", activeTicketId] });
      qc.invalidateQueries({ queryKey: ["super-admin-tickets-list"] });
      setNovaMensagem("");
    },
    onError: (err: Error) => {
      toast.error(`Erro ao responder chamado: ${err.message}`);
    },
  });

  const alterarStatusTicket = useMutation({
    mutationFn: async (novoStatus: any) => {
      if (!activeTicketId) return;
      const { error } = await supabase
        .from("suporte_tickets")
        .update({
          status: novoStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", activeTicketId);

      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["super-admin-tickets-list"] });
      toast.success("Status do chamado atualizado!");
    },
    onError: (err: Error) => {
      toast.error(`Erro: ${err.message}`);
    },
  });

  const activeTicket = tickets.find((t) => t.id === activeTicketId);
  const activeTicketUser = activeTicket ? (profilesMap[activeTicket.usuario_id] ?? "Desconhecido") : "";

  const filteredTickets = tickets.filter((t) =>
    statusFiltro === "all" ? true : t.status === statusFiltro
  );

  if (isTicketsLoading) {
    return <p className="text-muted-foreground p-4">Carregando helpdesk…</p>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-4xl">Suporte Técnico Global</h1>
        <p className="mt-1 text-muted-foreground">Central de atendimento aos chamados de suporte abertos no sistema.</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Lado Esquerdo: Lista de Tickets com Filtro */}
        <div className="lg:col-span-1 space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Filtrar por Status
            </label>
            <Select value={statusFiltro} onValueChange={setStatusFiltro}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Chamados</SelectItem>
                <SelectItem value="aberto">Abertos</SelectItem>
                <SelectItem value="em_andamento">Em Andamento</SelectItem>
                <SelectItem value="resolvido">Resolvidos</SelectItem>
                <SelectItem value="fechado">Fechados</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            {filteredTickets.length === 0 ? (
              <p className="text-xs text-muted-foreground">Nenhum chamado correspondente.</p>
            ) : (
              filteredTickets.map((t) => {
                const ownerName = profilesMap[t.usuario_id] ?? "Desconhecido";
                return (
                  <Card
                    key={t.id}
                    className={`cursor-pointer transition hover:shadow-sm border-l-4 ${
                      activeTicketId === t.id ? "border-l-gold bg-slate-50 dark:bg-slate-900" : "border-l-transparent"
                    }`}
                    onClick={() => setActiveTicketId(t.id)}
                  >
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="space-y-1 min-w-0">
                        <h4 className="font-semibold text-sm truncate">{t.assunto}</h4>
                        <p className="text-[10px] text-muted-foreground">
                          Por: {ownerName}
                        </p>
                        <div className="text-[9px] text-muted-foreground">
                          {t.categoria} • {new Date(t.updated_at).toLocaleDateString("pt-BR")}
                        </div>
                      </div>
                      <Badge variant={t.status === "aberto" ? "default" : "outline"} className="text-[9px]">
                        {t.status}
                      </Badge>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </div>

        {/* Lado Direito: Histórico de Conversa e Ações */}
        <div className="lg:col-span-2">
          {activeTicketId && activeTicket ? (
            <Card className="h-[550px] flex flex-col">
              <CardHeader className="border-b border-border py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="font-serif text-lg">{activeTicket.assunto}</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      Por: {activeTicketUser} ({activeTicket.categoria})
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select
                      value={activeTicket.status}
                      onValueChange={(val: any) => alterarStatusTicket.mutate(val)}
                    >
                      <SelectTrigger className="w-[140px] h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="aberto">Aberto</SelectItem>
                        <SelectItem value="em_andamento">Em Andamento</SelectItem>
                        <SelectItem value="resolvido">Resolvido</SelectItem>
                        <SelectItem value="fechado">Fechado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>

              {/* Mensagens */}
              <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                {isMensagensLoading ? (
                  <p className="text-xs text-muted-foreground text-center">Buscando conversa...</p>
                ) : (
                  mensagens?.map((msg) => {
                    const isSelf = msg.autor_id === user!.id;
                    const autorLabel = isSelf ? "Você (Técnico)" : activeTicketUser;

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col max-w-[75%] rounded-lg p-3 ${
                          isSelf
                            ? "bg-slate-900 text-gold ml-auto border border-gold/20"
                            : "bg-slate-100 dark:bg-slate-900 mr-auto border"
                        }`}
                      >
                        <span className="text-[10px] opacity-70 mb-1">{autorLabel}</span>
                        <p className="text-sm whitespace-pre-wrap">{msg.mensagem}</p>
                        <span className="text-[9px] opacity-60 text-right mt-1">
                          {new Date(msg.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    );
                  })
                )}
              </CardContent>

              {/* Entrada */}
              <div className="border-t border-border p-3 flex gap-2">
                <Input
                  placeholder="Escreva a resposta para o usuário..."
                  value={novaMensagem}
                  onChange={(e) => setNovaMensagem(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") enviarResposta.mutate();
                  }}
                />
                <Button
                  onClick={() => enviarResposta.mutate()}
                  disabled={enviarResposta.isPending || !novaMensagem.trim()}
                  className="bg-gold text-gold-foreground hover:bg-gold/90"
                  size="icon"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ) : (
            <Card className="h-full flex items-center justify-center border-dashed p-8 text-center text-muted-foreground">
              <div>
                <LifeBuoy className="mx-auto h-12 w-12 text-muted-foreground/30 mb-2" />
                <p>Selecione um chamado na barra lateral para começar a atender.</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
