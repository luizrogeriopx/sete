import { createFileRoute } from "@tanstack/react-router";
import { EmBreve } from "@/components/panel/em-breve";
export const Route = createFileRoute("/_authenticated/secretaria/alunos")({
  component: () => <EmBreve titulo="Alunos" descricao="Consulte e atualize dados de alunos." />,
});
