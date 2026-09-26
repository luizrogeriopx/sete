import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Settings,
  Save,
  Layout,
  Eye,
  Info,
  Phone,
  Mail,
  MapPin,
  Upload,
  Image as ImageIcon,
  Video,
  Award,
  GraduationCap,
  BookOpen,
  Globe,
  Play,
  Loader2,
} from "lucide-react";
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

interface InstitucionalConfig {
  imagem_url: string;
  titulo: string;
  botao_texto: string;
  video_url: string;
  card1_titulo: string;
  card1_descricao: string;
  card2_titulo: string;
  card2_descricao: string;
  card3_titulo: string;
  card3_descricao: string;
  card4_titulo: string;
  card4_descricao: string;
}

interface SomosSeteConfig {
  titulo: string;
  subtitulo: string;
  texto: string;
  video_url: string;
}

function getVideoEmbedUrl(url: string) {
  if (!url) return "";
  try {
    if (url.includes("youtube.com/watch")) {
      const v = new URL(url).searchParams.get("v");
      if (v) return `https://www.youtube.com/embed/${v}`;
    }
    if (url.includes("youtu.be/")) {
      const id = url.split("youtu.be/")[1]?.split("?")[0];
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
    if (url.includes("youtube.com/embed/")) {
      return url;
    }
    if (url.includes("vimeo.com/")) {
      const id = url.split("vimeo.com/")[1]?.split("?")[0];
      if (id) return `https://player.vimeo.com/video/${id}`;
    }
  } catch {
    return url;
  }
  return url;
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

  // Tab: Institucional (Banner com Imagem & 4 Pilares)
  const [instImagemUrl, setInstImagemUrl] = useState("");
  const [instTitulo, setInstTitulo] = useState("");
  const [instBotaoTexto, setInstBotaoTexto] = useState("");
  const [instVideoUrl, setInstVideoUrl] = useState("");
  const [instCard1Titulo, setInstCard1Titulo] = useState("");
  const [instCard1Descricao, setInstCard1Descricao] = useState("");
  const [instCard2Titulo, setInstCard2Titulo] = useState("");
  const [instCard2Descricao, setInstCard2Descricao] = useState("");
  const [instCard3Titulo, setInstCard3Titulo] = useState("");
  const [instCard3Descricao, setInstCard3Descricao] = useState("");
  const [instCard4Titulo, setInstCard4Titulo] = useState("");
  const [instCard4Descricao, setInstCard4Descricao] = useState("");
  const [isUploadingInstImage, setIsUploadingInstImage] = useState(false);

  // Tab: Somos o SETE (Seção Institucional Texto + Vídeo)
  const [somosTitulo, setSomosTitulo] = useState("");
  const [somosSubtitulo, setSomosSubtitulo] = useState("");
  const [somosTexto, setSomosTexto] = useState("");
  const [somosVideoUrl, setSomosVideoUrl] = useState("");

  // Queries
  const { data: allSettings, isLoading } = useQuery({
    queryKey: ["site-settings-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_settings")
        .select("chave, valor")
        .in("chave", ["landing_hero", "site_sobre", "site_contato", "landing_institucional", "landing_somos_sete"]);

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

      // Institucional
      const inst = allSettings.find((s) => s.chave === "landing_institucional")?.valor as InstitucionalConfig | undefined;
      setInstImagemUrl(inst?.imagem_url ?? "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1920&q=80");
      setInstTitulo(inst?.titulo ?? "Preparando vidas para servir o Reino de Deus");
      setInstBotaoTexto(inst?.botao_texto ?? "ASSISTA NOSSO VÍDEO INSTITUCIONAL");
      setInstVideoUrl(inst?.video_url ?? "");
      setInstCard1Titulo(inst?.card1_titulo ?? "Certificação");
      setInstCard1Descricao(inst?.card1_descricao ?? "Diploma e certificado reconhecidos pelo SETE, com formação bíblica sólida para capacitar obreiros e líderes no Brasil e no exterior.");
      setInstCard2Titulo(inst?.card2_titulo ?? "Docentes");
      setInstCard2Descricao(inst?.card2_descricao ?? "Nosso corpo docente é altamente qualificado, composto por pastores, mestres e líderes com vasta experiência ministerial e teológica.");
      setInstCard3Titulo(inst?.card3_titulo ?? "Biblioteca");
      setInstCard3Descricao(inst?.card3_descricao ?? "Conteúdo didático completo, apostilas exclusivas em PDF e acervo digital para enriquecer o estudo de cada disciplina.");
      setInstCard4Titulo(inst?.card4_titulo ?? "Comunidade");
      setInstCard4Descricao(inst?.card4_descricao ?? "O SETE é reconhecido pela comunhão e acolhimento, promovendo intercâmbio e edificação entre estudantes, igrejas e ministérios.");

      // Somos o SETE (Seção Institucional com Vídeo do YouTube)
      const somos = allSettings.find((s) => s.chave === "landing_somos_sete")?.valor as SomosSeteConfig | undefined;
      setSomosTitulo(somos?.titulo ?? "Somos o SETE");
      setSomosSubtitulo(somos?.subtitulo ?? "e celebramos sua presença conosco nesta jornada de fé e conhecimento");
      setSomosTexto(
        somos?.texto ??
          "O Seminário Teológico Esperança (SETE) é uma comunidade acadêmica e de fé comprometida com a formação bíblica sólida, a excelência teológica e a preparação prática de homens e mulheres chamados para o ministério cristão.\n\nAcreditamos no ensino que transforma a mente, edifica o coração e capacita o obreiro para cumprir com excelência o propósito de Deus na igreja local, nos campos missionários e na sociedade contemporânea."
      );
      setSomosVideoUrl(somos?.video_url ?? "https://www.youtube.com/watch?v=dQw4w9WgXcQ");
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

  const salvarInstitucional = useMutation({
    mutationFn: async () => {
      const payload = {
        chave: "landing_institucional",
        valor: {
          imagem_url: instImagemUrl,
          titulo: instTitulo,
          botao_texto: instBotaoTexto,
          video_url: instVideoUrl,
          card1_titulo: instCard1Titulo,
          card1_descricao: instCard1Descricao,
          card2_titulo: instCard2Titulo,
          card2_descricao: instCard2Descricao,
          card3_titulo: instCard3Titulo,
          card3_descricao: instCard3Descricao,
          card4_titulo: instCard4Titulo,
          card4_descricao: instCard4Descricao,
        },
        updated_by: user!.id,
      };
      const { error } = await supabase.from("app_settings").upsert(payload, { onConflict: "chave" });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["site-settings-all"] });
      qc.invalidateQueries({ queryKey: ["landing-institucional-settings"] });
      toast.success("Banner Institucional salvo com sucesso!");
    },
    onError: (err: Error) => {
      toast.error(`Erro ao salvar Banner Institucional: ${err.message}`);
    },
  });

  const salvarSomosSete = useMutation({
    mutationFn: async () => {
      const payload = {
        chave: "landing_somos_sete",
        valor: {
          titulo: somosTitulo,
          subtitulo: somosSubtitulo,
          texto: somosTexto,
          video_url: somosVideoUrl,
        },
        updated_by: user!.id,
      };
      const { error } = await supabase.from("app_settings").upsert(payload, { onConflict: "chave" });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["site-settings-all"] });
      qc.invalidateQueries({ queryKey: ["landing-somos-sete-home"] });
      toast.success("Seção 'Somos o SETE' salva com sucesso!");
    },
    onError: (err: Error) => {
      toast.error(`Erro ao salvar seção Somos o SETE: ${err.message}`);
    },
  });

  async function handleUploadImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingInstImage(true);
      const fileExt = file.name.split(".").pop() || "jpg";
      const fileName = `institucional/${Date.now()}-${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("cursos")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("cursos").getPublicUrl(fileName);
      if (!data.publicUrl) throw new Error("Não foi possível gerar a URL pública da imagem.");

      setInstImagemUrl(data.publicUrl);
      toast.success("Imagem enviada com sucesso! Lembre-se de clicar em Salvar.");
    } catch (err: any) {
      console.error("Erro no upload da imagem:", err);
      toast.error(err.message || "Erro ao fazer upload da imagem.");
    } finally {
      setIsUploadingInstImage(false);
      e.target.value = "";
    }
  }

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
        <TabsList className="grid w-full max-w-3xl grid-cols-2 sm:grid-cols-5 bg-muted/50 border h-auto p-1.5 gap-1">
          <TabsTrigger value="hero">Hero (Início)</TabsTrigger>
          <TabsTrigger value="somos">Somos o SETE</TabsTrigger>
          <TabsTrigger value="institucional">Banner Campus</TabsTrigger>
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

        {/* TAB SOMOS O SETE (SEÇÃO INSTITUCIONAL TEXTO + VÍDEO YOUTUBE) */}
        <TabsContent value="somos" className="grid gap-8 lg:grid-cols-2">
          <Card className="border-border/50 bg-card/65 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="font-serif text-xl flex items-center gap-2">
                <Video className="h-5 w-5 text-gold" /> Seção Somos o SETE (Texto + Vídeo)
              </CardTitle>
              <CardDescription>
                Configure o título, subtítulo, texto institucional e o link do vídeo do YouTube da seção &quot;Vida e Ministério no SETE&quot;.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-semibold">Título Principal</label>
                <Input
                  type="text"
                  placeholder="Ex: Somos o SETE"
                  value={somosTitulo}
                  onChange={(e) => setSomosTitulo(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold">Subtítulo / Chamada</label>
                <Input
                  type="text"
                  placeholder="Ex: e celebramos sua presença conosco nesta jornada..."
                  value={somosSubtitulo}
                  onChange={(e) => setSomosSubtitulo(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold">Texto Institucional</label>
                <Textarea
                  rows={6}
                  placeholder="Digite os parágrafos de apresentação. Separe os parágrafos com uma linha em branco."
                  value={somosTexto}
                  onChange={(e) => setSomosTexto(e.target.value)}
                />
                <p className="text-[11px] text-muted-foreground">
                  Separe parágrafos com duas quebras de linha para formatar os blocos de texto no site.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold flex items-center gap-2">
                  <Video className="h-4 w-4 text-gold" /> URL do Vídeo (YouTube)
                </label>
                <Input
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={somosVideoUrl}
                  onChange={(e) => setSomosVideoUrl(e.target.value)}
                />
                <p className="text-[11px] text-muted-foreground">
                  Cole o link regular do YouTube (ex: https://www.youtube.com/watch?v=... ou https://youtu.be/...).
                </p>
              </div>

              <Button
                className="bg-gold text-gold-foreground hover:bg-gold/90 w-full flex items-center justify-center gap-2 h-10 mt-4"
                onClick={() => salvarSomosSete.mutate()}
                disabled={salvarSomosSete.isPending}
              >
                <Save className="h-4 w-4" />
                {salvarSomosSete.isPending ? "Salvando..." : "Salvar Seção Somos o SETE"}
              </Button>
            </CardContent>
          </Card>

          {/* Preview Somos o SETE */}
          <Card className="border-border/50 bg-[#fbf9f4] text-[#1c1917] overflow-hidden flex flex-col justify-between shadow-md">
            <CardHeader className="bg-[#f0ebe1] border-b border-[#e2ddd3]">
              <CardTitle className="font-serif text-lg flex items-center gap-2 text-[#ea4310]">
                <Eye className="h-5 w-5" /> Pré-visualização da Seção
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 flex-1 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="text-center">
                  <span className="inline-block text-[10px] font-black uppercase tracking-[0.2em] text-[#ea4310] bg-[#ea4310]/10 border border-[#ea4310]/20 px-3 py-1 rounded-full mb-2">
                    VIDA E MINISTÉRIO NO SETE
                  </span>
                  <h3 className="font-serif text-2xl font-black text-[#ea4310] tracking-tight">
                    {somosTitulo || "Somos o SETE"}
                  </h3>
                  {somosSubtitulo && (
                    <p className="font-serif text-sm font-bold text-[#ea4310]/90 mt-1">
                      {somosSubtitulo}
                    </p>
                  )}
                </div>

                <div className="space-y-2 text-center text-xs text-[#66594e] leading-relaxed">
                  {(somosTexto || "O Seminário Teológico Esperança é comprometido com o Reino...")
                    .split("\n\n")
                    .map((p, i) => (
                      <p key={i}>{p}</p>
                    ))}
                </div>

                {somosVideoUrl ? (
                  <div className="relative aspect-video w-full rounded-2xl overflow-hidden shadow-lg border border-black/10 bg-black mt-4">
                    <iframe
                      src={getVideoEmbedUrl(somosVideoUrl)}
                      title="Preview do Vídeo"
                      className="absolute inset-0 w-full h-full border-0"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <div className="aspect-video w-full rounded-2xl border-2 border-dashed border-[#e2ddd3] flex flex-col items-center justify-center text-[#66594e] text-xs gap-2">
                    <Video className="h-8 w-8 text-[#ea4310]/40" />
                    <span>Nenhum vídeo configurado</span>
                  </div>
                )}
              </div>

              <div className="text-center text-[10px] text-muted-foreground pt-4 border-t border-[#e2ddd3]">
                Esta seção é renderizada com fundo claro (#fbf9f4) e títulos em laranja (#ea4310).
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB BANNER INSTITUCIONAL COM UPLOAD DE IMAGEM */}
        <TabsContent value="institucional" className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-6">
            {/* Card de Imagem e Vídeo */}
            <Card className="border-border/50 bg-card/65 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="font-serif text-xl flex items-center gap-2">
                  <ImageIcon className="h-5 w-5 text-gold" /> Imagem de Fundo & Vídeo
                </CardTitle>
                <CardDescription>
                  Faça o upload da foto da instituição/campus para o fundo do banner.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Upload de Imagem */}
                <div className="space-y-3">
                  <label className="text-sm font-semibold flex items-center justify-between">
                    <span>Upload da Imagem do Banner</span>
                    {isUploadingInstImage && (
                      <span className="flex items-center gap-1.5 text-xs text-gold">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Enviando arquivo...
                      </span>
                    )}
                  </label>

                  {/* Preview da imagem atual */}
                  <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-border bg-muted/30">
                    {instImagemUrl ? (
                      <img
                        src={instImagemUrl}
                        alt="Pré-visualização do Banner Institucional"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-muted-foreground text-xs">
                        Nenhuma imagem selecionada
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <label className="relative flex-1">
                      <Button
                        type="button"
                        variant="outline"
                        disabled={isUploadingInstImage}
                        className="w-full cursor-pointer flex items-center justify-center gap-2 border-dashed border-2"
                        asChild
                      >
                        <span>
                          <Upload className="h-4 w-4" />
                          {isUploadingInstImage ? "Enviando arquivo..." : "Escolher Imagem do Computador"}
                        </span>
                      </Button>
                      <input
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        disabled={isUploadingInstImage}
                        onChange={handleUploadImage}
                      />
                    </label>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Ou informe diretamente a URL da imagem:</label>
                    <Input
                      type="url"
                      placeholder="https://exemplo.com/foto-campus.jpg"
                      value={instImagemUrl}
                      onChange={(e) => setInstImagemUrl(e.target.value)}
                    />
                  </div>
                </div>

                {/* Título do Banner */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Título Principal do Banner</label>
                  <Input
                    type="text"
                    value={instTitulo}
                    onChange={(e) => setInstTitulo(e.target.value)}
                    placeholder="Preparando vidas para servir o Reino de Deus"
                  />
                </div>

                {/* Botão e Vídeo */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Texto do Botão</label>
                    <Input
                      type="text"
                      value={instBotaoTexto}
                      onChange={(e) => setInstBotaoTexto(e.target.value)}
                      placeholder="ASSISTA NOSSO VÍDEO INSTITUCIONAL"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Link do Vídeo (YouTube / Vimeo)</label>
                    <Input
                      type="url"
                      value={instVideoUrl}
                      onChange={(e) => setInstVideoUrl(e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=..."
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card dos 4 Pilares da Faixa Laranja */}
            <Card className="border-border/50 bg-card/65 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="font-serif text-xl flex items-center gap-2">
                  <Layout className="h-5 w-5 text-gold" /> Os 4 Pilares da Faixa Laranja
                </CardTitle>
                <CardDescription>
                  Personalize os títulos e descrições dos 4 itens exibidos na faixa inferior.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Pilar 1: Certificação */}
                <div className="p-3.5 rounded-xl border border-border/60 bg-muted/20 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-gold uppercase tracking-wider">
                    <Award className="h-4 w-4" /> Pilar 1: Certificação
                  </div>
                  <Input
                    value={instCard1Titulo}
                    onChange={(e) => setInstCard1Titulo(e.target.value)}
                    placeholder="Título do Pilar 1"
                  />
                  <Textarea
                    rows={2}
                    value={instCard1Descricao}
                    onChange={(e) => setInstCard1Descricao(e.target.value)}
                    placeholder="Descrição do Pilar 1"
                  />
                </div>

                {/* Pilar 2: Docentes */}
                <div className="p-3.5 rounded-xl border border-border/60 bg-muted/20 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-gold uppercase tracking-wider">
                    <GraduationCap className="h-4 w-4" /> Pilar 2: Docentes
                  </div>
                  <Input
                    value={instCard2Titulo}
                    onChange={(e) => setInstCard2Titulo(e.target.value)}
                    placeholder="Título do Pilar 2"
                  />
                  <Textarea
                    rows={2}
                    value={instCard2Descricao}
                    onChange={(e) => setInstCard2Descricao(e.target.value)}
                    placeholder="Descrição do Pilar 2"
                  />
                </div>

                {/* Pilar 3: Biblioteca */}
                <div className="p-3.5 rounded-xl border border-border/60 bg-muted/20 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-gold uppercase tracking-wider">
                    <BookOpen className="h-4 w-4" /> Pilar 3: Biblioteca
                  </div>
                  <Input
                    value={instCard3Titulo}
                    onChange={(e) => setInstCard3Titulo(e.target.value)}
                    placeholder="Título do Pilar 3"
                  />
                  <Textarea
                    rows={2}
                    value={instCard3Descricao}
                    onChange={(e) => setInstCard3Descricao(e.target.value)}
                    placeholder="Descrição do Pilar 3"
                  />
                </div>

                {/* Pilar 4: Comunidade */}
                <div className="p-3.5 rounded-xl border border-border/60 bg-muted/20 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-gold uppercase tracking-wider">
                    <Globe className="h-4 w-4" /> Pilar 4: Comunidade
                  </div>
                  <Input
                    value={instCard4Titulo}
                    onChange={(e) => setInstCard4Titulo(e.target.value)}
                    placeholder="Título do Pilar 4"
                  />
                  <Textarea
                    rows={2}
                    value={instCard4Descricao}
                    onChange={(e) => setInstCard4Descricao(e.target.value)}
                    placeholder="Descrição do Pilar 4"
                  />
                </div>

                <Button
                  className="bg-gold text-gold-foreground hover:bg-gold/90 w-full flex items-center justify-center gap-2 h-11 mt-4 shadow-md font-bold"
                  onClick={() => salvarInstitucional.mutate()}
                  disabled={salvarInstitucional.isPending || isUploadingInstImage}
                >
                  <Save className="h-4 w-4" />
                  {salvarInstitucional.isPending ? "Salvando alterações..." : "Salvar Banner Institucional"}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Preview da Seção Completa */}
          <div className="space-y-6">
            <Card className="border-border/50 bg-slate-950 text-white overflow-hidden sticky top-6 shadow-2xl">
              <CardHeader className="bg-slate-900 border-b border-border/10 py-3">
                <CardTitle className="font-serif text-sm flex items-center gap-2 text-gold">
                  <Eye className="h-4 w-4" /> Pré-visualização em Tempo Real (Padrão FTSA)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 overflow-hidden">
                {/* Parte superior simulada */}
                <div
                  className="relative h-64 flex items-center bg-cover bg-center p-6 text-white"
                  style={{
                    backgroundImage: `url(${instImagemUrl || "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1920&q=80"})`,
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/30" />
                  <div className="relative space-y-4 max-w-sm">
                    <h2 className="font-serif text-xl sm:text-2xl font-black leading-tight text-white drop-shadow">
                      {instTitulo || "Preparando vidas para servir o Reino de Deus"}
                    </h2>
                    <div>
                      <span className="inline-flex items-center gap-2 rounded-full bg-white text-[#ea4310] text-[10px] font-black uppercase tracking-wider px-3.5 py-1.5 shadow-md">
                        <span>{instBotaoTexto || "ASSISTA NOSSO VÍDEO INSTITUCIONAL"}</span>
                        <Play className="h-2.5 w-2.5 fill-current" />
                      </span>
                    </div>
                  </div>
                </div>

                {/* Parte inferior simulada (faixa laranja) */}
                <div className="bg-[#ea4310] text-white p-5">
                  <div className="grid grid-cols-2 gap-4 text-[11px]">
                    <div className="space-y-1">
                      <div className="font-serif font-bold text-white flex items-center gap-1.5 text-xs">
                        <Award className="h-3.5 w-3.5" /> {instCard1Titulo || "Certificação"}
                      </div>
                      <p className="text-[10px] text-white/90 line-clamp-2 leading-relaxed">
                        {instCard1Descricao}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <div className="font-serif font-bold text-white flex items-center gap-1.5 text-xs">
                        <GraduationCap className="h-3.5 w-3.5" /> {instCard2Titulo || "Docentes"}
                      </div>
                      <p className="text-[10px] text-white/90 line-clamp-2 leading-relaxed">
                        {instCard2Descricao}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <div className="font-serif font-bold text-white flex items-center gap-1.5 text-xs">
                        <BookOpen className="h-3.5 w-3.5" /> {instCard3Titulo || "Biblioteca"}
                      </div>
                      <p className="text-[10px] text-white/90 line-clamp-2 leading-relaxed">
                        {instCard3Descricao}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <div className="font-serif font-bold text-white flex items-center gap-1.5 text-xs">
                        <Globe className="h-3.5 w-3.5" /> {instCard4Titulo || "Comunidade"}
                      </div>
                      <p className="text-[10px] text-white/90 line-clamp-2 leading-relaxed">
                        {instCard4Descricao}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
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
