import { createFileRoute } from "@tanstack/react-router";
import { EmBreve } from "@/components/panel/em-breve";
export const Route = createFileRoute("/_authenticated/secretaria/")({
  component: () => <EmBreve titulo="Secretaria" descricao="Central de matrículas, pagamentos e atendimento." />,
});
