import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Save, Layout, Eye, Info, Phone, Mail, MapPin } from "lucide-react";
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

interface SobreConfig {
  tagline: string;
  title: string;
  intro: string;
  mission_title: string;
  mission_text: string;
  vision_title: string;
  vision_text: string;
  values_title: string;
  values: string[];
}

interface ContatoConfig {
  tagline: string;
  title: string;
  description: string;
  email: string;
  phone: string;
  address: string;
}

function ConfigSite() {
  const { user } = useAuth();
  const qc = useQueryClient();

  // Tab: Hero
  const [heroBadge, setHeroBadge] = useState("");
  const [heroTitle, setHeroTitle] = useState("");
  const [heroDescription, setHeroDescription] = useState("");

  // Tab: Sobre
  const [sobreTagline, setSobreTagline] = useState("");
  const [sobreTitle, setSobreTitle] = useState("");
  const [sobreIntro, setSobreIntro] = useState("");
  const [sobreMissionTitle, setSobreMissionTitle] = useState("");
  const [sobreMissionText, setSobreMissionText] = useState("");
  const [sobreVisionTitle, setSobreVisionTitle] = useState("");
  const [sobreVisionText, setSobreVisionText] = useState("");
  const [sobreValuesTitle, setSobreValuesTitle] = useState("");
  const [sobreValuesText, setSobreValuesText] = useState(""); // Represented as line-separated list

  // Tab: Contato
  const [contatoTagline, setContatoTagline] = useState("");
  const [contatoTitle, setContatoTitle] = useState("");
  const [contatoDescription, setContatoDescription] = useState("");
  const [contatoEmail, setContatoEmail] = useState("");
  const [contatoPhone, setContatoPhone] = useState("");
  const [contatoAddress, setContatoAddress] = useState("");

  // Queries
  const { data: allSettings, isLoading } = useQuery({
    queryKey: ["site-settings-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_settings")
        .select("chave, valor")
        .in("chave", ["landing_hero", "site_sobre", "site_contato"]);

      if (error) throw error;
      return data ?? [];
    },
  });

  useEffect(() => {
    if (allSettings) {
      // Hero
      const hero = allSettings.find((s) => s.chave === "landing_hero")?.valor as HeroConfig | undefined;
      setHeroBadge(hero?.badge ?? "SEMINÁRIO TEOLÓGICO ESPERANÇA");
      setHeroTitle(hero?.title ?? "Ensino que transforma\nMinistérios que edificam");
      setHeroDescription(hero?.description ?? "Teologia fundamentada, formação prática e comunidade que apoia seu chamado.");

      // Sobre
      const sobre = allSettings.find((s) => s.chave === "site_sobre")?.valor as SobreConfig | undefined;
      setSobreTagline(sobre?.tagline ?? "Institucional");
      setSobreTitle(sobre?.title ?? "Sobre o SETE");
      setSobreIntro(sobre?.intro ?? "O Seminário Teológico Esperança (SETE) é uma instituição comprometida com a formação bíblica, teológica e ministerial de servos e servas do Senhor. Nosso propósito é preparar líderes que amem a Palavra, sirvam à Igreja e alcancem o mundo com o Evangelho.");
      setSobreMissionTitle(sobre?.mission_title ?? "Missão");
      setSobreMissionText(sobre?.mission_text ?? "Formar cristãos com base bíblica sólida, discernimento teológico e coração pastoral, capacitando-os para o serviço à Igreja e à sociedade.");
      setSobreVisionTitle(sobre?.vision_title ?? "Visão");
      setSobreVisionText(sobre?.vision_text ?? "Ser referência em educação teológica acessível, unindo excelência acadêmica, fidelidade doutrinária e paixão missionária.");
      setSobreValuesTitle(sobre?.values_title ?? "Valores");
      setSobreValuesText(
        sobre?.values?.join("\n") ?? 
        ["Fidelidade às Escrituras", "Amor à Igreja", "Excelência acadêmica", "Formação integral", "Serviço com humildade"].join("\n")
      );

      // Contato
      const contato = allSettings.find((s) => s.chave === "site_contato")?.valor as ContatoConfig | undefined;
      setContatoTagline(contato?.tagline ?? "Fale conosco");
      setContatoTitle(contato?.title ?? "Contato");
      setContatoDescription(contato?.description ?? "Tem dúvidas sobre matrículas, cursos ou o funcionamento do seminário? Fale com a nossa secretaria.");
      setContatoEmail(contato?.email ?? "contato@sete.edu.br");
      setContatoPhone(contato?.phone ?? "(00) 0000-0000");
      setContatoAddress(contato?.address ?? "Sede do seminário — a definir");
    }
  }, [allSettings]);

  // Mutations
  const salvarHero = useMutation({
    mutationFn: async () => {
      const payload = {
        chave: "landing_hero",
        valor: { badge: heroBadge, title: heroTitle, description: heroDescription },
        updated_by: user!.id,
      };
      const { error } = await supabase.from("app_settings").upsert(payload, { onConflict: "chave" });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["site-settings-all"] });
      qc.invalidateQueries({ queryKey: ["landing-hero-settings"] });
      toast.success("Configurações do Hero salvas com sucesso!");
    },
    onError: (err: Error) => {
      toast.error(`Erro ao salvar Hero: ${err.message}`);
    },
  });

  const salvarSobre = useMutation({
    mutationFn: async () => {
      const parsedValues = sobreValuesText
        .split("\n")
        .map((v) => v.trim())
        .filter((v) => v.length > 0);

      const payload = {
        chave: "site_sobre",
        valor: {
          tagline: sobreTagline,
          title: sobreTitle,
          intro: sobreIntro,
          mission_title: sobreMissionTitle,
          mission_text: sobreMissionText,
          vision_title: sobreVisionTitle,
          vision_text: sobreVisionText,
          values_title: sobreValuesTitle,
          values: parsedValues,
        },
        updated_by: user!.id,
      };
      const { error } = await supabase.from("app_settings").upsert(payload, { onConflict: "chave" });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["site-settings-all"] });
      qc.invalidateQueries({ queryKey: ["site-sobre-settings"] });
      toast.success("Configurações da página 'Sobre' salvas com sucesso!");
    },
    onError: (err: Error) => {
      toast.error(`Erro ao salvar Página Sobre: ${err.message}`);
    },
  });

  const salvarContato = useMutation({
    mutationFn: async () => {
      const payload = {
        chave: "site_contato",
        valor: {
          tagline: contatoTagline,
          title: contatoTitle,
          description: contatoDescription,
          email: contatoEmail,
          phone: contatoPhone,
          address: contatoAddress,
        },
        updated_by: user!.id,
      };
      const { error } = await supabase.from("app_settings").upsert(payload, { onConflict: "chave" });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["site-settings-all"] });
      qc.invalidateQueries({ queryKey: ["site-contato-settings"] });
      toast.success("Configurações da página 'Contato' salvas com sucesso!");
    },
    onError: (err: Error) => {
      toast.error(`Erro ao salvar Página Contato: ${err.message}`);
    },
  });

  if (isLoading) {
    return <p className="text-muted-foreground p-4">Carregando configurações…</p>;
  }

  return (
    <div className="space-y-8 max-w-6xl">
      <div>
        <h1 className="font-serif text-4xl flex items-center gap-3">
          <Settings className="h-8 w-8 text-gold animate-spin-slow" />
          Configurações do Site
        </h1>
        <p className="mt-1 text-muted-foreground">
          Gerencie o conteúdo dinâmico exibido nas páginas públicas: Início, Sobre e Contato.
        </p>
      </div>

      <Tabs defaultValue="hero" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-3 bg-muted/50 border">
          <TabsTrigger value="hero">Hero (Início)</TabsTrigger>
          <TabsTrigger value="sobre">Página Sobre</TabsTrigger>
          <TabsTrigger value="contato">Página Contato</TabsTrigger>
        </TabsList>

        {/* TAB HERO */}
        <TabsContent value="hero" className="grid gap-8 md:grid-cols-2">
          <Card className="border-border/50 bg-card/65 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="font-serif text-xl flex items-center gap-2">
                <Layout className="h-5 w-5 text-gold" /> Hero Section (Página Inicial)
              </CardTitle>
              <CardDescription>Edite a seção de entrada do site.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-semibold">Tagline / Badge (Destaque superior)</label>
                <Input
                  type="text"
                  value={heroBadge}
                  onChange={(e) => setHeroBadge(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold">Título Principal (Headline)</label>
                <Textarea
                  value={heroTitle}
                  rows={3}
                  onChange={(e) => setHeroTitle(e.target.value)}
                />
                <p className="text-[10px] text-muted-foreground">Use quebras de linha para dividir o título.</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold">Descrição (Subhead)</label>
                <Textarea
                  value={heroDescription}
                  rows={3}
                  onChange={(e) => setHeroDescription(e.target.value)}
                />
              </div>

              <Button
                className="bg-gold text-gold-foreground hover:bg-gold/90 w-full flex items-center justify-center gap-2 h-10 mt-4"
                onClick={() => salvarHero.mutate()}
                disabled={salvarHero.isPending}
              >
                <Save className="h-4 w-4" />
                {salvarHero.isPending ? "Salvando..." : "Salvar Configurações do Hero"}
              </Button>
            </CardContent>
          </Card>

          {/* Preview Hero */}
          <Card className="border-border/50 bg-slate-950 text-white overflow-hidden flex flex-col justify-between">
            <CardHeader className="bg-slate-900 border-b border-border/10">
              <CardTitle className="font-serif text-lg flex items-center gap-2 text-gold">
                <Eye className="h-5 w-5" /> Visualização (Landing Hero)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 flex-1 flex flex-col justify-center bg-[radial-gradient(circle_at_1px_1px,#ffffff08_1px,transparent_0)] bg-[size:16px_16px]">
              <div className="space-y-6">
                <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-gold">{heroBadge}</p>
                <h1 className="font-serif text-3xl leading-tight text-slate-100">
                  {heroTitle.split("\n").map((line, i) => (
                    <span key={i} className="block">{line}</span>
                  ))}
                </h1>
                <p className="text-sm text-slate-400 max-w-md leading-relaxed">{heroDescription}</p>
                <div className="flex gap-2 pt-2">
                  <div className="h-9 w-24 bg-gold/90 rounded-md" />
                  <div className="h-9 w-28 bg-transparent border border-slate-700 rounded-md" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB SOBRE */}
        <TabsContent value="sobre" className="grid gap-8 md:grid-cols-2">
          <Card className="border-border/50 bg-card/65 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="font-serif text-xl flex items-center gap-2">
                <Info className="h-5 w-5 text-gold" /> Página Sobre o SETE
              </CardTitle>
              <CardDescription>Ajuste os textos institucionais e valores.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Tagline Superior</label>
                  <Input value={sobreTagline} onChange={(e) => setSobreTagline(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Título da Página</label>
                  <Input value={sobreTitle} onChange={(e) => setSobreTitle(e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold">Texto de Introdução (Destaque)</label>
                <Textarea value={sobreIntro} rows={3} onChange={(e) => setSobreIntro(e.target.value)} />
              </div>

              <div className="border-t pt-4 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Título - Missão</label>
                    <Input value={sobreMissionTitle} onChange={(e) => setSobreMissionTitle(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Título - Visão</label>
                    <Input value={sobreVisionTitle} onChange={(e) => setSobreVisionTitle(e.target.value)} />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold">Texto - Missão</label>
                  <Textarea value={sobreMissionText} rows={2} onChange={(e) => setSobreMissionText(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold">Texto - Visão</label>
                  <Textarea value={sobreVisionText} rows={2} onChange={(e) => setSobreVisionText(e.target.value)} />
                </div>
              </div>

              <div className="border-t pt-4 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Título - Valores</label>
                  <Input value={sobreValuesTitle} onChange={(e) => setSobreValuesTitle(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Valores (Um por linha)</label>
                  <Textarea value={sobreValuesText} rows={4} onChange={(e) => setSobreValuesText(e.target.value)} />
                  <p className="text-[10px] text-muted-foreground">Escreva cada valor em uma nova linha.</p>
                </div>
              </div>

              <Button
                className="bg-gold text-gold-foreground hover:bg-gold/90 w-full flex items-center justify-center gap-2 h-10 mt-4"
                onClick={() => salvarSobre.mutate()}
                disabled={salvarSobre.isPending}
              >
                <Save className="h-4 w-4" />
                {salvarSobre.isPending ? "Salvando..." : "Salvar Configurações 'Sobre'"}
              </Button>
            </CardContent>
          </Card>

          {/* Preview Sobre */}
          <Card className="border-border/50 bg-background overflow-hidden flex flex-col justify-between">
            <CardHeader className="bg-muted/40 border-b border-border/10">
              <CardTitle className="font-serif text-lg flex items-center gap-2 text-primary">
                <Eye className="h-5 w-5 text-gold" /> Visualização (Página Sobre)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 flex-1 flex flex-col justify-start bg-card overflow-y-auto max-h-[600px] text-foreground">
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-widest text-gold">{sobreTagline}</p>
                  <h1 className="font-serif text-2xl mt-1 text-primary">{sobreTitle}</h1>
                </div>
                <p className="text-xs font-medium leading-relaxed border-l-2 border-gold/40 pl-3 italic text-muted-foreground">{sobreIntro}</p>

                <div className="space-y-3 pt-2">
                  <div>
                    <h3 className="font-serif text-sm font-bold text-primary">{sobreMissionTitle}</h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-snug">{sobreMissionText}</p>
                  </div>
                  <div>
                    <h3 className="font-serif text-sm font-bold text-primary">{sobreVisionTitle}</h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-snug">{sobreVisionText}</p>
                  </div>
                  <div>
                    <h3 className="font-serif text-sm font-bold text-primary">{sobreValuesTitle}</h3>
                    <ul className="list-disc pl-4 text-xs text-muted-foreground mt-1 space-y-1">
                      {sobreValuesText.split("\n").filter(v => v.trim().length > 0).map((val, idx) => (
                        <li key={idx}>{val}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB CONTATO */}
        <TabsContent value="contato" className="grid gap-8 md:grid-cols-2">
          <Card className="border-border/50 bg-card/65 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="font-serif text-xl flex items-center gap-2">
                <Phone className="h-5 w-5 text-gold" /> Página Contato
              </CardTitle>
              <CardDescription>Gerencie as informações de atendimento.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Tagline Superior</label>
                  <Input value={contatoTagline} onChange={(e) => setContatoTagline(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Título Principal</label>
                  <Input value={contatoTitle} onChange={(e) => setContatoTitle(e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold">Descrição / Texto Auxiliar</label>
                <Textarea value={contatoDescription} rows={2} onChange={(e) => setContatoDescription(e.target.value)} />
              </div>

              <div className="border-t pt-4 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gold" /> E-mail de Contato
                  </label>
                  <Input type="email" value={contatoEmail} onChange={(e) => setContatoEmail(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gold" /> Telefone comercial
                  </label>
                  <Input value={contatoPhone} onChange={(e) => setContatoPhone(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gold" /> Endereço físico
                  </label>
                  <Input value={contatoAddress} onChange={(e) => setContatoAddress(e.target.value)} />
                </div>
              </div>

              <Button
                className="bg-gold text-gold-foreground hover:bg-gold/90 w-full flex items-center justify-center gap-2 h-10 mt-4"
                onClick={() => salvarContato.mutate()}
                disabled={salvarContato.isPending}
              >
                <Save className="h-4 w-4" />
                {salvarContato.isPending ? "Salvando..." : "Salvar Configurações 'Contato'"}
              </Button>
            </CardContent>
          </Card>

          {/* Preview Contato */}
          <Card className="border-border/50 bg-background overflow-hidden flex flex-col justify-between">
            <CardHeader className="bg-muted/40 border-b border-border/10">
              <CardTitle className="font-serif text-lg flex items-center gap-2 text-primary">
                <Eye className="h-5 w-5 text-gold" /> Visualização (Página Contato)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 flex-1 flex flex-col justify-center bg-card text-foreground">
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-widest text-gold">{contatoTagline}</p>
                  <h1 className="font-serif text-2xl mt-1 text-primary">{contatoTitle}</h1>
                </div>
                <p className="text-xs text-muted-foreground">{contatoDescription}</p>

                <div className="grid gap-3 pt-2">
                  <div className="border rounded-lg p-3 bg-muted/20 flex items-start gap-2.5">
                    <Mail className="h-4 w-4 text-gold mt-0.5" />
                    <div>
                      <div className="font-serif text-xs font-bold text-primary">E-mail</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">{contatoEmail}</div>
                    </div>
                  </div>

                  <div className="border rounded-lg p-3 bg-muted/20 flex items-start gap-2.5">
                    <Phone className="h-4 w-4 text-gold mt-0.5" />
                    <div>
                      <div className="font-serif text-xs font-bold text-primary">Telefone</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">{contatoPhone}</div>
                    </div>
                  </div>

                  <div className="border rounded-lg p-3 bg-muted/20 flex items-start gap-2.5">
                    <MapPin className="h-4 w-4 text-gold mt-0.5" />
                    <div>
                      <div className="font-serif text-xs font-bold text-primary">Endereço</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">{contatoAddress}</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
