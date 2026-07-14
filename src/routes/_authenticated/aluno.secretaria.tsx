import { createFileRoute } from "@tanstack/react-router";
import { EmBreve } from "@/components/panel/em-breve";
export const Route = createFileRoute("/_authenticated/aluno/secretaria")({
  component: () => <EmBreve titulo="Secretaria" descricao="Abra solicitações (declarações, 2ª via, etc.)." />,
});
