import { createFileRoute } from "@tanstack/react-router";
import { EmBreve } from "@/components/panel/em-breve";
export const Route = createFileRoute("/_authenticated/admin/notificacoes")({
  component: () => <EmBreve titulo="Notificações" descricao="Envie avisos a alunos, professores e turmas." />,
});
