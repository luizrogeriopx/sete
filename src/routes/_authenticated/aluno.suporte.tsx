import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LifeBuoy, Send, MessageSquare, Plus, Clock, ChevronRight } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/aluno/suporte")({
  component: SuporteAluno,
});

const TICKET_CATEGORIAS = [
  "Dúvidas Acadêmicas",
  "Problemas de Acesso / AVA",
  "Problemas no Financeiro",
  "Emissão de Certificados",
  "Outros",
];

function SuporteAluno() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [assunto, setAssunto] = useState("");
  const [categoria, setCategoria] = useState("");
  const [novaMensagem, setNovaMensagem] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Query tickets
  const { data: tickets, isLoading: isTicketsLoading } = useQuery({
    queryKey: ["tickets-aluno", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("suporte_tickets")
        .select("*")
        .eq("usuario_id", user!.id)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      return data ?? [];
    },
  });

  // Query messages for active ticket
  const { data: mensagens, isLoading: isMensagensLoading } = useQuery({
    queryKey: ["ticket-mensagens", activeTicketId],
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

  const criarTicket = useMutation({
    mutationFn: async () => {
      if (!assunto || !categoria) throw new Error("Preencha todos os campos");

      // Insert ticket
      const { data: ticket, error: ticketError } = await supabase
        .from("suporte_tickets")
        .insert({
          usuario_id: user!.id,
          assunto,
          categoria,
          status: "aberto",
        })
        .select()
        .single();

      if (ticketError) throw ticketError;

      // Create initial message
      const { error: msgError } = await supabase
        .from("ticket_mensagens")
        .insert({
          ticket_id: ticket.id,
          autor_id: user!.id,
          mensagem: `Chamado aberto na categoria: ${categoria}. Assunto: ${assunto}`,
        });

      if (msgError) throw msgError;

      return ticket;
    },
    onSuccess: (ticket) => {
      qc.invalidateQueries({ queryKey: ["tickets-aluno", user?.id] });
      toast.success("Ticket de suporte aberto!");
      setAssunto("");
      setCategoria("");
      setIsCreating(false);
      setActiveTicketId(ticket.id);
    },
    onError: (err: Error) => {
      toast.error(`Erro ao criar chamado: ${err.message}`);
    },
  });

  const enviarMensagem = useMutation({
    mutationFn: async () => {
      if (!novaMensagem.trim() || !activeTicketId) return;

      const { data, error } = await supabase
        .from("ticket_mensagens")
        .insert({
          ticket_id: activeTicketId,
          autor_id: user!.id,
          mensagem: novaMensagem,
        });

      if (error) throw error;

      // Update ticket updated_at
      await supabase
        .from("suporte_tickets")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", activeTicketId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ticket-mensagens", activeTicketId] });
      qc.invalidateQueries({ queryKey: ["tickets-aluno", user?.id] });
      setNovaMensagem("");
    },
    onError: (err: Error) => {
      toast.error(`Erro ao enviar mensagem: ${err.message}`);
    },
  });

  const activeTicket = tickets?.find((t) => t.id === activeTicketId);

  if (isTicketsLoading) {
    return <p className="text-muted-foreground p-4">Carregando suporte…</p>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-4xl">Suporte Técnico</h1>
          <p className="mt-1 text-muted-foreground">Tire dúvidas técnicas ou reporte problemas na plataforma.</p>
        </div>
        {!isCreating && (
          <Button
            onClick={() => {
              setIsCreating(true);
              setActiveTicketId(null);
            }}
            className="bg-gold text-gold-foreground hover:bg-gold/90 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" /> Novo Chamado
          </Button>
        )}
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Lado Esquerdo: Lista de Tickets / Formulário de Criação */}
        <div className="lg:col-span-1 space-y-4">
          {isCreating ? (
            <Card>
              <CardHeader>
                <CardTitle className="font-serif text-xl">Novo Chamado</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Categoria</label>
                  <Select value={categoria} onValueChange={setCategoria}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a categoria..." />
                    </SelectTrigger>
                    <SelectContent>
                      {TICKET_CATEGORIAS.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold">Assunto</label>
                  <Input
                    placeholder="Resuma o seu problema ou dúvida..."
                    value={assunto}
                    onChange={(e) => setAssunto(e.target.value)}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setIsCreating(false)}
                  >
                    Voltar
                  </Button>
                  <Button
                    className="w-full bg-gold text-gold-foreground hover:bg-gold/90"
                    onClick={() => criarTicket.mutate()}
                    disabled={criarTicket.isPending}
                  >
                    {criarTicket.isPending ? "Criando..." : "Abrir Chamado"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              <h2 className="font-serif text-xl">Seus Chamados</h2>
              {(!tickets || tickets.length === 0) ? (
                <p className="text-sm text-muted-foreground">Nenhum chamado aberto ainda.</p>
              ) : (
                tickets.map((t) => (
                  <Card
                    key={t.id}
                    className={`cursor-pointer transition hover:shadow-sm border-l-4 ${
                      activeTicketId === t.id ? "border-l-gold bg-slate-50 dark:bg-slate-900" : "border-l-transparent"
                    }`}
                    onClick={() => {
                      setActiveTicketId(t.id);
                      setIsCreating(false);
                    }}
                  >
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="space-y-1 min-w-0">
                        <h4 className="font-semibold text-sm truncate">{t.assunto}</h4>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                          <span>{t.categoria}</span>
                          <span>•</span>
                          <span>{new Date(t.updated_at).toLocaleDateString("pt-BR")}</span>
                        </div>
                      </div>
                      <Badge
                        variant={
                          t.status === "resolvido" || t.status === "fechado"
                            ? "secondary"
                            : t.status === "em_andamento"
                            ? "outline"
                            : "default"
                        }
                        className="text-[10px]"
                      >
                        {t.status === "aberto"
                          ? "Aberto"
                          : t.status === "em_andamento"
                          ? "Em Andamento"
                          : t.status === "resolvido"
                          ? "Resolvido"
                          : "Fechado"}
                      </Badge>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </div>

        {/* Lado Direito: Histórico de Conversa do Chamado Ativo */}
        <div className="lg:col-span-2">
          {activeTicketId && activeTicket ? (
            <Card className="h-[550px] flex flex-col">
              <CardHeader className="border-b border-border py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="font-serif text-lg">{activeTicket.assunto}</CardTitle>
                    <p className="text-xs text-muted-foreground">Categoria: {activeTicket.categoria}</p>
                  </div>
                  <Badge>{activeTicket.status.toUpperCase()}</Badge>
                </div>
              </CardHeader>

              {/* Chat Messages */}
              <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                {isMensagensLoading ? (
                  <p className="text-sm text-muted-foreground text-center">Carregando mensagens...</p>
                ) : (
                  mensagens?.map((msg) => {
                    const isSelf = msg.autor_id === user!.id;
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col max-w-[75%] rounded-lg p-3 ${
                          isSelf
                            ? "bg-primary text-primary-foreground ml-auto"
                            : "bg-slate-100 dark:bg-slate-900 mr-auto border"
                        }`}
                      >
                        <span className="text-[10px] opacity-70 mb-1">
                          {isSelf ? "Você" : "Atendente Técnico"}
                        </span>
                        <p className="text-sm whitespace-pre-wrap">{msg.mensagem}</p>
                        <span className="text-[9px] opacity-60 text-right mt-1">
                          {new Date(msg.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    );
                  })
                )}
              </CardContent>

              {/* Chat Input */}
              {activeTicket.status !== "fechado" ? (
                <div className="border-t border-border p-3 flex gap-2">
                  <Input
                    placeholder="Escreva sua mensagem aqui..."
                    value={novaMensagem}
                    onChange={(e) => setNovaMensagem(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") enviarMensagem.mutate();
                    }}
                  />
                  <Button
                    onClick={() => enviarMensagem.mutate()}
                    disabled={enviarMensagem.isPending || !novaMensagem.trim()}
                    className="bg-gold text-gold-foreground hover:bg-gold/90"
                    size="icon"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="border-t border-border p-3 text-center text-xs text-muted-foreground bg-slate-50 dark:bg-slate-950 rounded-b-lg">
                  Este chamado está fechado e não aceita mais réplicas.
                </div>
              )}
            </Card>
          ) : (
            <Card className="h-full flex items-center justify-center border-dashed p-8 text-center text-muted-foreground">
              <div>
                <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground/30 mb-2" />
                <p>Selecione um chamado da lista ao lado para ver a conversa ou abra um novo chamado.</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
