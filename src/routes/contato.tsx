import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site/site-chrome";
import { Mail, Phone, MapPin } from "lucide-react";
import { useQuery, queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ContatoConfig {
  tagline: string;
  title: string;
  description: string;
  email: string;
  phone: string;
  address: string;
}

const contatoSettingsQO = queryOptions({
  queryKey: ["site-contato-settings"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("app_settings")
      .select("valor")
      .eq("chave", "site_contato")
      .maybeSingle();

    if (error) {
      console.warn("Falling back to default contact settings:", error);
      return null;
    }
    return (data?.valor as unknown as ContatoConfig) ?? null;
  },
});

export const Route = createFileRoute("/contato")({
  head: () => ({
    meta: [
      { title: "Contato — SETE" },
      { name: "description", content: "Entre em contato com o Seminário Teológico Esperança." },
      { property: "og:title", content: "Contato — SETE" },
      { property: "og:description", content: "Fale com o SETE — Seminário Teológico Esperança." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(contatoSettingsQO),
  component: ContatoPage,
});

function ContatoPage() {
  const { data: contatoConfig } = useQuery(contatoSettingsQO);

  const tagline = contatoConfig?.tagline ?? "Fale conosco";
  const title = contatoConfig?.title ?? "Contato";
  const description = contatoConfig?.description ?? "Tem dúvidas sobre matrículas, cursos ou o funcionamento do seminário? Fale com a nossa secretaria.";
  const email = contatoConfig?.email ?? "contato@sete.edu.br";
  const phone = contatoConfig?.phone ?? "(00) 0000-0000";
  const address = contatoConfig?.address ?? "Sede do seminário — a definir";

  return (
    <div className="flex min-h-screen flex-col bg-[#f3f0e9] text-[#1c1917]">
      <SiteHeader />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-16 sm:py-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="inline-block text-xs font-black uppercase tracking-[0.25em] text-[#ff3403] bg-[#ff3403]/10 border border-[#ff3403]/20 px-4 py-1.5 rounded-full mb-3">
            {tagline}
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl font-black text-[#1c1917] tracking-tight">{title}</h1>
          <p className="mt-4 text-base text-[#66594e] font-normal leading-relaxed whitespace-pre-line">
            {description}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {[
            { icon: Mail, t: "E-mail", d: email },
            { icon: Phone, t: "Telefone", d: phone },
            { icon: MapPin, t: "Endereço", d: address },
          ].map((i) => (
            <div key={i.t} className="rounded-3xl border border-[#e2ddd3] bg-white p-7 shadow-xs hover:border-[#ff3403] hover:shadow-md transition-all">
              <div className="h-12 w-12 rounded-2xl bg-[#ff3403]/10 text-[#ff3403] flex items-center justify-center mb-4">
                <i.icon className="h-6 w-6" />
              </div>
              <div className="font-serif text-xl font-black text-[#1c1917]">{i.t}</div>
              <div className="mt-2 text-sm text-[#66594e] font-medium whitespace-pre-line leading-relaxed">{i.d}</div>
            </div>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
