import { createFileRoute } from "@tanstack/react-router";
import { EmBreve } from "@/components/panel/em-breve";
export const Route = createFileRoute("/_authenticated/secretaria/pagamentos-dinheiro")({
  component: () => <EmBreve titulo="Pagamentos em dinheiro" descricao="Registre quitações presenciais." />,
});
