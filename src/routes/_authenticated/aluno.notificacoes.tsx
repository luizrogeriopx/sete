import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, BellOff, Check, CheckCheck } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/aluno/notificacoes")({
  component: NotificacoesAluno,
});

function NotificacoesAluno() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: notificacoes, isLoading } = useQuery({
    queryKey: ["notificacoes-aluno", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notificacoes")
        .select("*")
        .or(`destinatario_id.eq.${user!.id},destinatario_role.eq.aluno`)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data ?? [];
    },
  });

  const marcarLida = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("notificacoes")
        .update({ lida: true })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notificacoes-aluno", user?.id] });
      qc.invalidateQueries({ queryKey: ["aluno-home", user?.id] });
      toast.success("Notificação marcada como lida");
    },
    onError: (err: Error) => {
      toast.error(`Erro: ${err.message}`);
    },
  });

  const marcarTodasLidas = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("notificacoes")
        .update({ lida: true })
        .or(`destinatario_id.eq.${user!.id},destinatario_role.eq.aluno`)
        .eq("lida", false);

      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notificacoes-aluno", user?.id] });
      qc.invalidateQueries({ queryKey: ["aluno-home", user?.id] });
      toast.success("Todas as notificações foram marcadas como lidas");
    },
    onError: (err: Error) => {
      toast.error(`Erro: ${err.message}`);
    },
  });

  if (isLoading) {
    return <p className="text-muted-foreground p-4">Carregando avisos…</p>;
  }

  const naoLidasCount = notificacoes?.filter((n) => !n.lida).length ?? 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-4xl">Notificações</h1>
          <p className="mt-1 text-muted-foreground">Fique por dentro das novidades e prazos do SETE.</p>
        </div>
        {naoLidasCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => marcarTodasLidas.mutate()}
            disabled={marcarTodasLidas.isPending}
            className="flex items-center gap-2"
          >
            <CheckCheck className="h-4 w-4" />
            Marcar todas como lidas
          </Button>
        )}
      </div>

      {(!notificacoes || notificacoes.length === 0) ? (
        <Card className="border-dashed p-8 text-center">
          <BellOff className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 font-serif text-lg">Caixa de entrada vazia</h3>
          <p className="mt-1 text-sm text-muted-foreground">Você não possui avisos ou notificações no momento.</p>
        </Card>
      ) : (
        <div className="space-y-4 max-w-3xl">
          {notificacoes.map((n) => (
            <Card
              key={n.id}
              className={`transition hover:shadow-sm border-l-4 ${
                n.lida ? "border-l-muted bg-card/60" : "border-l-gold bg-card"
              }`}
            >
              <CardContent className="p-5 flex items-start gap-4 justify-between">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className={`font-serif text-lg leading-tight ${n.lida ? "text-muted-foreground" : "text-primary"}`}>
                      {n.titulo}
                    </h3>
                    {!n.lida && <Badge className="bg-gold text-gold-foreground text-[10px]">Novo</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{n.mensagem}</p>
                  <div className="text-[10px] text-muted-foreground">
                    {new Date(n.created_at).toLocaleString("pt-BR")}
                  </div>
                </div>
                {!n.lida && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => marcarLida.mutate(n.id)}
                    disabled={marcarLida.isPending}
                    title="Marcar como lida"
                    className="hover:text-gold"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
