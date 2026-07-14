import { createFileRoute } from "@tanstack/react-router";
import { EmBreve } from "@/components/panel/em-breve";
export const Route = createFileRoute("/_authenticated/professor/chamada")({
  component: () => <EmBreve titulo="Chamada" descricao="Registre presenças, faltas e justificativas." />,
});
