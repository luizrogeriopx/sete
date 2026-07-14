import { createFileRoute } from "@tanstack/react-router";
import { EmBreve } from "@/components/panel/em-breve";
export const Route = createFileRoute("/_authenticated/professor/")({
  component: () => <EmBreve titulo="Professor" descricao="Visão geral das suas turmas." />,
});
