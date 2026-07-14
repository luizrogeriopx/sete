import { createFileRoute } from "@tanstack/react-router";
import { EmBreve } from "@/components/panel/em-breve";
export const Route = createFileRoute("/_authenticated/professor/alunos")({
  component: () => <EmBreve titulo="Alunos" descricao="Alunos matriculados nos seus cursos." />,
});
