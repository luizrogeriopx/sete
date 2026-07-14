import { createFileRoute } from "@tanstack/react-router";
import { EmBreve } from "@/components/panel/em-breve";
export const Route = createFileRoute("/_authenticated/super-admin/configuracoes")({
  component: () => <EmBreve titulo="Configurações" descricao="Credenciais do Mercado Pago e ajustes gerais do sistema." />,
});
