import { createFileRoute } from "@tanstack/react-router";
import { EmBreve } from "@/components/panel/em-breve";
import { SiteHeader, SiteFooter } from "@/components/site/site-chrome";

export const Route = createFileRoute("/checkout/$slug")({
  component: () => (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-16">
        <EmBreve
          titulo="Checkout Mercado Pago"
          descricao="A integração de pagamento será ativada assim que as credenciais forem cadastradas no painel Super Admin → Configurações."
        />
      </main>
      <SiteFooter />
    </div>
  ),
});
