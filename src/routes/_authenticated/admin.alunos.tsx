import { createFileRoute } from "@tanstack/react-router";
import { EmBreve } from "@/components/panel/em-breve";
export const Route = createFileRoute("/_authenticated/admin/alunos")({
  component: () => <EmBreve titulo="Alunos" descricao="Lista completa de alunos." />,
});
