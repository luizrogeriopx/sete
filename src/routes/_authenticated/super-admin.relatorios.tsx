import { createFileRoute } from "@tanstack/react-router";
import { EmBreve } from "@/components/panel/em-breve";
export const Route = createFileRoute("/_authenticated/super-admin/relatorios")({
  component: () => <EmBreve titulo="Relatórios avançados" descricao="Análises globais e exportações." />,
});
