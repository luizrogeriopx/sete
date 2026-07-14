import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Settings, Save, Key, ShieldCheck } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/super-admin/configuracoes")({
  component: ConfiguracoesSuperAdmin,
});

function ConfiguracoesSuperAdmin() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [mpPublicKey, setMpPublicKey] = useState("");
  const [mpAccessToken, setMpAccessToken] = useState("");

  const { data: settings, isLoading } = useQuery({
    queryKey: ["super-admin-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("app_settings").select("*");
      if (error) throw error;
      return data ?? [];
    },
  });

  useEffect(() => {
    if (settings) {
      const pubKey = settings.find((s) => s.chave === "mp_public_key")?.valor as string ?? "";
      const accToken = settings.find((s) => s.chave === "mp_access_token")?.valor as string ?? "";
      setMpPublicKey(pubKey);
      setMpAccessToken(accToken);
    }
  }, [settings]);

  const salvarConfiguracoes = useMutation({
    mutationFn: async () => {
      // Upsert key values
      const payloads = [
        { chave: "mp_public_key", valor: mpPublicKey, updated_by: user!.id },
        { chave: "mp_access_token", valor: mpAccessToken, updated_by: user!.id },
      ];

      for (const payload of payloads) {
        const { error } = await supabase
          .from("app_settings")
          .upsert(payload, { onConflict: "chave" });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["super-admin-settings"] });
      toast.success("Configurações do Mercado Pago salvas com sucesso!");
    },
    onError: (err: Error) => {
      toast.error(`Erro ao salvar: ${err.message}`);
    },
  });

  if (isLoading) {
    return <p className="text-muted-foreground p-4">Carregando configurações…</p>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-4xl">Configurações do Sistema</h1>
        <p className="mt-1 text-muted-foreground">Credenciais da API de pagamentos, chaves e preferências gerais.</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Formulário de Credenciais */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-serif text-xl flex items-center gap-2">
              <Key className="h-5 w-5 text-gold" /> Integração Mercado Pago
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold">Mercado Pago Public Key</label>
              <Input
                type="text"
                placeholder="APP_USR-..."
                value={mpPublicKey}
                onChange={(e) => setMpPublicKey(e.target.value)}
              />
              <p className="text-[10px] text-muted-foreground">Disponível no painel do desenvolvedor do Mercado Pago.</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Mercado Pago Access Token</label>
              <Input
                type="password"
                placeholder="MLA-..."
                value={mpAccessToken}
                onChange={(e) => setMpAccessToken(e.target.value)}
              />
              <p className="text-[10px] text-muted-foreground">Token privado para autenticação das requisições de pagamento.</p>
            </div>

            <Button
              className="bg-gold text-gold-foreground hover:bg-gold/90 flex items-center gap-2"
              onClick={() => salvarConfiguracoes.mutate()}
              disabled={salvarConfiguracoes.isPending}
            >
              <Save className="h-4 w-4" />
              {salvarConfiguracoes.isPending ? "Salvando..." : "Salvar Credenciais"}
            </Button>
          </CardContent>
        </Card>

        {/* Informações de Segurança */}
        <Card className="lg:col-span-1 h-fit">
          <CardHeader>
            <CardTitle className="font-serif text-lg flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-gold" /> Segurança
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground space-y-3 leading-relaxed">
            <p>
              As credenciais salvas aqui são criptografadas e utilizadas pelo backend nas comunicações seguras para a geração de faturas.
            </p>
            <p>
              Nunca compartilhe esses tokens publicamente ou em repositórios abertos de código.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
