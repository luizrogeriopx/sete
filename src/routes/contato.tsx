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
    return (data?.valor as ContatoConfig) ?? null;
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
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-16">
        <p className="text-xs font-medium uppercase tracking-[0.25em] text-gold">{tagline}</p>
        <h1 className="mt-2 font-serif text-5xl">{title}</h1>
        <p className="mt-4 max-w-xl text-muted-foreground whitespace-pre-line">
          {description}
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {[
            { icon: Mail, t: "E-mail", d: email },
            { icon: Phone, t: "Telefone", d: phone },
            { icon: MapPin, t: "Endereço", d: address },
          ].map((i) => (
            <div key={i.t} className="rounded-xl border border-border bg-card p-6">
              <i.icon className="h-5 w-5 text-gold" />
              <div className="mt-3 font-serif text-lg">{i.t}</div>
              <div className="text-sm text-muted-foreground whitespace-pre-line">{i.d}</div>
            </div>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
