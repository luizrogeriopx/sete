import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site/site-chrome";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/certificado/validar/")({
  head: () => ({
    meta: [
      { title: "Validar certificado — SETE" },
      { name: "description", content: "Informe o código para validar um certificado." },
    ],
  }),
  component: BuscarPage,
});

function BuscarPage() {
  const [codigo, setCodigo] = useState("");
  const navigate = useNavigate();
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-4 py-16">
        <p className="text-xs font-medium uppercase tracking-[0.25em] text-gold">Validação pública</p>
        <h1 className="mt-2 font-serif text-3xl">Validar certificado</h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Informe o código impresso no certificado para verificar sua autenticidade.
        </p>
        <form
          className="mt-6 flex w-full gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (codigo.trim()) navigate({ to: "/certificado/validar/$codigo", params: { codigo: codigo.trim() } });
          }}
        >
          <Input placeholder="Código de validação" value={codigo} onChange={(e) => setCodigo(e.target.value)} />
          <Button type="submit">Validar</Button>
        </form>
        <Link to="/" className="mt-6 text-xs text-muted-foreground underline">Voltar ao início</Link>
      </main>
      <SiteFooter />
    </div>
  );
}
