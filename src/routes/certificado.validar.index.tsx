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
    <div className="flex min-h-screen flex-col bg-[#f3f0e9] text-[#1c1917]">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-4 py-20">
        <div className="w-full bg-white rounded-3xl border border-[#e2ddd3] p-8 sm:p-10 shadow-xl text-center">
          <span className="inline-block text-xs font-black uppercase tracking-[0.25em] text-[#ff3403] bg-[#ff3403]/10 border border-[#ff3403]/20 px-3.5 py-1 rounded-full mb-3">
            Validação pública
          </span>
          <h1 className="font-serif text-3xl font-black text-[#1c1917]">Validar certificado</h1>
          <p className="mt-2 text-sm text-[#66594e]">
            Informe o código impresso no certificado para verificar sua autenticidade institucional.
          </p>
          <form
            className="mt-6 flex flex-col sm:flex-row w-full gap-2.5"
            onSubmit={(e) => {
              e.preventDefault();
              if (codigo.trim()) navigate({ to: "/certificado/validar/$codigo", params: { codigo: codigo.trim() } });
            }}
          >
            <Input
              placeholder="Código de validação"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              className="rounded-full border-[#e2ddd3] bg-white px-4 text-center sm:text-left focus:border-[#ff3403]"
            />
            <Button type="submit" className="rounded-full bg-[#ff3403] text-white hover:bg-[#e02e00] font-bold text-xs uppercase tracking-wider px-6 py-2.5 shadow-sm">
              Validar
            </Button>
          </form>
          <Link to="/" className="mt-6 inline-block text-xs text-[#66594e] underline hover:text-[#1c1917]">
            Voltar ao início
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
