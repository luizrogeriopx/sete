import { createFileRoute } from "@tanstack/react-router";
import { EmBreve } from "@/components/panel/em-breve";
export const Route = createFileRoute("/_authenticated/admin/financeiro")({
  component: () => <EmBreve titulo="Relatório financeiro" descricao="Receitas, inadimplência e exportação em PDF." />,
});
