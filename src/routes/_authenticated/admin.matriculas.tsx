import { createFileRoute } from "@tanstack/react-router";
import { EmBreve } from "@/components/panel/em-breve";
export const Route = createFileRoute("/_authenticated/admin/matriculas")({
  component: () => <EmBreve titulo="Relatório de matrículas" descricao="Análise de matrículas por curso e período." />,
});
