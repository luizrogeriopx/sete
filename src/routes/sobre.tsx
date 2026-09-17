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
    return (data?.valor as unknown as SobreConfig) ?? null;
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
    <div className="flex min-h-screen flex-col bg-[#f3f0e9] text-[#1c1917]">
      <SiteHeader />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-16 sm:py-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="inline-block text-xs font-black uppercase tracking-[0.25em] text-[#ff3403] bg-[#ff3403]/10 border border-[#ff3403]/20 px-4 py-1.5 rounded-full mb-3">
            {tagline}
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl font-black text-[#1c1917] tracking-tight">{title}</h1>
        </div>

        <div className="space-y-8">
          <div className="rounded-3xl bg-white p-8 sm:p-10 border border-[#e2ddd3] shadow-xs">
            <p className="text-base sm:text-lg leading-relaxed text-[#66594e] font-normal whitespace-pre-line">
              {intro}
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="rounded-3xl bg-white p-8 border border-[#e2ddd3] shadow-xs">
              <span className="text-xs font-black uppercase tracking-widest text-[#ff3403] block mb-2">
                Nosso Propósito
              </span>
              <h2 className="font-serif text-2xl font-black text-[#1c1917]">{missionTitle}</h2>
              <p className="mt-3 text-sm text-[#66594e] leading-relaxed whitespace-pre-line font-normal">
                {missionText}
              </p>
            </div>

            <div className="rounded-3xl bg-white p-8 border border-[#e2ddd3] shadow-xs">
              <span className="text-xs font-black uppercase tracking-widest text-[#ff3403] block mb-2">
                Onde Queremos Chegar
              </span>
              <h2 className="font-serif text-2xl font-black text-[#1c1917]">{visionTitle}</h2>
              <p className="mt-3 text-sm text-[#66594e] leading-relaxed whitespace-pre-line font-normal">
                {visionText}
              </p>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-8 sm:p-10 border border-[#e2ddd3] shadow-xs">
            <span className="text-xs font-black uppercase tracking-widest text-[#ff3403] block mb-2">
              Princípios Inegociáveis
            </span>
            <h2 className="font-serif text-2xl font-black text-[#1c1917] mb-6">{valuesTitle}</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {values.map((v, i) => (
                <div key={i} className="flex items-center gap-3 rounded-2xl bg-[#f3f0e9]/50 border border-[#e2ddd3] p-4 text-sm font-semibold text-[#1c1917]">
                  <div className="h-2 w-2 rounded-full bg-[#ff3403]" />
                  <span>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
