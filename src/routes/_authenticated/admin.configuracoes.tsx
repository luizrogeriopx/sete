import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Settings, Save, Layout, Eye } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/configuracoes")({
  component: ConfigSite,
});

interface HeroConfig {
  badge: string;
  title: string;
  description: string;
}

function ConfigSite() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const [badge, setBadge] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const { data: heroConfig, isLoading } = useQuery({
    queryKey: ["landing-hero-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_settings")
        .select("valor")
        .eq("chave", "landing_hero")
        .maybeSingle();

      if (error) throw error;
      return (data?.valor as HeroConfig) ?? null;
    },
  });

  useEffect(() => {
    if (heroConfig) {
      setBadge(heroConfig.badge ?? "");
      setTitle(heroConfig.title ?? "");
      setDescription(heroConfig.description ?? "");
    } else {
      // Defalut fallbacks matching user request
      setBadge("SEMINÁRIO TEOLÓGICO ESPERANÇA");
      setTitle("Ensino que transforma\nMinistérios que edificam");
      setDescription("Teologia fundamentada, formação prática e comunidade que apoia seu chamado.");
    }
  }, [heroConfig]);

  const salvarConfiguracoes = useMutation({
    mutationFn: async () => {
      const payload = {
        chave: "landing_hero",
        valor: {
          badge,
          title,
          description,
        },
        updated_by: user!.id,
      };

      const { error } = await supabase
        .from("app_settings")
        .upsert(payload, { onConflict: "chave" });

      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["landing-hero-settings"] });
      toast.success("Configurações salvas com sucesso!");
    },
    onError: (err: Error) => {
      toast.error(`Erro ao salvar configurações: ${err.message}`);
    },
  });

  if (isLoading) {
    return <p className="text-muted-foreground p-4">Carregando configurações…</p>;
  }

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="font-serif text-4xl flex items-center gap-3">
          <Settings className="h-8 w-8 text-gold animate-spin-slow" />
          Configurações do Site
        </h1>
        <p className="mt-1 text-muted-foreground">
          Gerencie os textos principais que são apresentados aos visitantes na página inicial (landing page).
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Form para edição */}
        <Card className="border-border/50 bg-card/65 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="font-serif text-xl flex items-center gap-2">
              <Layout className="h-5 w-5 text-gold" /> Hero Section
            </CardTitle>
            <CardDescription>
              Seção inicial de destaque da landing page do seminário.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-semibold">Tagline / Badge (Destaque superior)</label>
              <Input
                type="text"
                placeholder="Ex: SEMINÁRIO TEOLÓGICO ESPERANÇA"
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
              />
              <p className="text-[10px] text-muted-foreground">
                Exibido em caixa alta dourada antes do título principal.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Título Principal (Headline)</label>
              <Textarea
                placeholder="Ex: Ensino que transforma&#10;Ministérios que edificam"
                value={title}
                rows={3}
                onChange={(e) => setTitle(e.target.value)}
              />
              <p className="text-[10px] text-muted-foreground">
                Título com destaque serifado. Use quebras de linha para dividir o título em mais de uma linha.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Descrição (Subhead)</label>
              <Textarea
                placeholder="Ex: Teologia fundamentada, formação prática e comunidade que apoia seu chamado."
                value={description}
                rows={3}
                onChange={(e) => setDescription(e.target.value)}
              />
              <p className="text-[10px] text-muted-foreground">
                Parágrafo explicativo curto exibido logo abaixo do título principal.
              </p>
            </div>

            <Button
              className="bg-gold text-gold-foreground hover:bg-gold/90 w-full flex items-center justify-center gap-2 h-10 mt-4"
              onClick={() => salvarConfiguracoes.mutate()}
              disabled={salvarConfiguracoes.isPending}
            >
              <Save className="h-4 w-4" />
              {salvarConfiguracoes.isPending ? "Salvando..." : "Salvar Configurações"}
            </Button>
          </CardContent>
        </Card>

        {/* Visualizador em tempo real */}
        <Card className="border-border/50 bg-slate-950 text-white overflow-hidden flex flex-col justify-between">
          <CardHeader className="bg-slate-900 border-b border-border/10">
            <CardTitle className="font-serif text-lg flex items-center gap-2 text-gold">
              <Eye className="h-5 w-5" /> Visualização em Tempo Real
            </CardTitle>
            <CardDescription className="text-slate-400">
              Veja como os textos serão exibidos no topo do site público.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8 flex-1 flex flex-col justify-center relative bg-[radial-gradient(circle_at_1px_1px,#ffffff08_1px,transparent_0)] bg-[size:16px_16px]">
            <div className="space-y-6">
              {badge ? (
                <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-gold">
                  {badge}
                </p>
              ) : (
                <div className="h-4 w-48 bg-slate-800 rounded animate-pulse" />
              )}

              {title ? (
                <h1 className="font-serif text-3xl leading-tight text-slate-100">
                  {title.split("\n").map((line, i) => (
                    <span key={i} className="block">
                      {line}
                    </span>
                  ))}
                </h1>
              ) : (
                <div className="space-y-2">
                  <div className="h-8 w-full bg-slate-800 rounded animate-pulse" />
                  <div className="h-8 w-2/3 bg-slate-800 rounded animate-pulse" />
                </div>
              )}

              {description ? (
                <p className="text-sm text-slate-400 max-w-md leading-relaxed">
                  {description}
                </p>
              ) : (
                <div className="space-y-2">
                  <div className="h-4 w-full bg-slate-800 rounded animate-pulse" />
                  <div className="h-4 w-5/6 bg-slate-800 rounded animate-pulse" />
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <div className="h-9 w-24 bg-gold/90 rounded-md" />
                <div className="h-9 w-28 bg-transparent border border-slate-700 rounded-md" />
              </div>
            </div>
          </CardContent>
          <div className="p-3 bg-slate-900 border-t border-border/10 text-[10px] text-center text-slate-500 font-mono">
            Modo de Demonstração Interativo
          </div>
        </Card>
      </div>
    </div>
  );
}
