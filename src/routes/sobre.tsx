import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site/site-chrome";
import { useQuery, queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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

const sobreSettingsQO = queryOptions({
  queryKey: ["site-sobre-settings"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("app_settings")
      .select("valor")
      .eq("chave", "site_sobre")
      .maybeSingle();

    if (error) {
      console.warn("Falling back to default about settings:", error);
      return null;
    }
    return (data?.valor as SobreConfig) ?? null;
  },
});

export const Route = createFileRoute("/sobre")({
  head: () => ({
    meta: [
      { title: "Sobre — SETE" },
      {
        name: "description",
        content:
          "Conheça o Seminário Teológico Esperança (SETE): missão, visão, valores e corpo docente.",
      },
      { property: "og:title", content: "Sobre o SETE — Seminário Teológico Esperança" },
      {
        property: "og:description",
        content: "Missão, visão e valores do Seminário Teológico Esperança.",
      },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(sobreSettingsQO),
  component: SobrePage,
});

function SobrePage() {
  const { data: sobreConfig } = useQuery(sobreSettingsQO);

  const tagline = sobreConfig?.tagline ?? "Institucional";
  const title = sobreConfig?.title ?? "Sobre o SETE";
  const intro = sobreConfig?.intro ?? "O Seminário Teológico Esperança (SETE) é uma instituição comprometida com a formação bíblica, teológica e ministerial de servos e servas do Senhor. Nosso propósito é preparar líderes que amem a Palavra, sirvam à Igreja e alcancem o mundo com o Evangelho.";
  const missionTitle = sobreConfig?.mission_title ?? "Missão";
  const missionText = sobreConfig?.mission_text ?? "Formar cristãos com base bíblica sólida, discernimento teológico e coração pastoral, capacitando-os para o serviço à Igreja e à sociedade.";
  const visionTitle = sobreConfig?.vision_title ?? "Visão";
  const visionText = sobreConfig?.vision_text ?? "Ser referência em educação teológica acessível, unindo excelência acadêmica, fidelidade doutrinária e paixão missionária.";
  const valuesTitle = sobreConfig?.values_title ?? "Valores";
  const values = sobreConfig?.values ?? [
    "Fidelidade às Escrituras",
    "Amor à Igreja",
    "Excelência acadêmica",
    "Formação integral",
    "Serviço com humildade"
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-16">
        <p className="text-xs font-medium uppercase tracking-[0.25em] text-gold">{tagline}</p>
        <h1 className="mt-2 font-serif text-5xl">{title}</h1>
        <div className="prose prose-neutral mt-8 max-w-none text-foreground">
          <p className="text-lg leading-relaxed text-muted-foreground whitespace-pre-line">
            {intro}
          </p>

          <h2 className="mt-10 font-serif text-3xl">{missionTitle}</h2>
          <p className="whitespace-pre-line">
            {missionText}
          </p>

          <h2 className="mt-8 font-serif text-3xl">{visionTitle}</h2>
          <p className="whitespace-pre-line">
            {visionText}
          </p>

          <h2 className="mt-8 font-serif text-3xl">{valuesTitle}</h2>
          <ul>
            {values.map((v, i) => (
              <li key={i}>{v}</li>
            ))}
          </ul>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
