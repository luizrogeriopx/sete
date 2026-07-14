import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site/site-chrome";
import { Mail, Phone, MapPin } from "lucide-react";

export const Route = createFileRoute("/contato")({
  head: () => ({
    meta: [
      { title: "Contato — SETE" },
      { name: "description", content: "Entre em contato com o Seminário Teológico Esperança." },
      { property: "og:title", content: "Contato — SETE" },
      { property: "og:description", content: "Fale com o SETE — Seminário Teológico Esperança." },
    ],
  }),
  component: ContatoPage,
});

function ContatoPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-16">
        <p className="text-xs font-medium uppercase tracking-[0.25em] text-gold">Fale conosco</p>
        <h1 className="mt-2 font-serif text-5xl">Contato</h1>
        <p className="mt-4 max-w-xl text-muted-foreground">
          Tem dúvidas sobre matrículas, cursos ou o funcionamento do seminário? Fale com a nossa
          secretaria.
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {[
            { icon: Mail, t: "E-mail", d: "contato@sete.edu.br" },
            { icon: Phone, t: "Telefone", d: "(00) 0000-0000" },
            { icon: MapPin, t: "Endereço", d: "Sede do seminário — a definir" },
          ].map((i) => (
            <div key={i.t} className="rounded-xl border border-border bg-card p-6">
              <i.icon className="h-5 w-5 text-gold" />
              <div className="mt-3 font-serif text-lg">{i.t}</div>
              <div className="text-sm text-muted-foreground">{i.d}</div>
            </div>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
