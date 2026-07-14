import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site/site-chrome";

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
  component: SobrePage,
});

function SobrePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-16">
        <p className="text-xs font-medium uppercase tracking-[0.25em] text-gold">Institucional</p>
        <h1 className="mt-2 font-serif text-5xl">Sobre o SETE</h1>
        <div className="prose prose-neutral mt-8 max-w-none text-foreground">
          <p className="text-lg leading-relaxed text-muted-foreground">
            O <strong>Seminário Teológico Esperança (SETE)</strong> é uma instituição
            comprometida com a formação bíblica, teológica e ministerial de servos e servas
            do Senhor. Nosso propósito é preparar líderes que amem a Palavra, sirvam à Igreja
            e alcancem o mundo com o Evangelho.
          </p>

          <h2 className="mt-10 font-serif text-3xl">Missão</h2>
          <p>
            Formar cristãos com base bíblica sólida, discernimento teológico e coração pastoral,
            capacitando-os para o serviço à Igreja e à sociedade.
          </p>

          <h2 className="mt-8 font-serif text-3xl">Visão</h2>
          <p>
            Ser referência em educação teológica acessível, unindo excelência acadêmica,
            fidelidade doutrinária e paixão missionária.
          </p>

          <h2 className="mt-8 font-serif text-3xl">Valores</h2>
          <ul>
            <li>Fidelidade às Escrituras</li>
            <li>Amor à Igreja</li>
            <li>Excelência acadêmica</li>
            <li>Formação integral</li>
            <li>Serviço com humildade</li>
          </ul>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
