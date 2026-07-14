import { createFileRoute } from "@tanstack/react-router";
import { EmBreve } from "@/components/panel/em-breve";
export const Route = createFileRoute("/_authenticated/secretaria/matriculas")({
  component: () => <EmBreve titulo="Matrículas" descricao="Cadastre matrículas presencialmente." />,
});
