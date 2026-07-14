import { createFileRoute } from "@tanstack/react-router";
import { EmBreve } from "@/components/panel/em-breve";
export const Route = createFileRoute("/_authenticated/aluno/notificacoes")({
  component: () => <EmBreve titulo="Notificações" descricao="Avisos e comunicados do seminário." />,
});
