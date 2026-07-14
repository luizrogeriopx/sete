import { createFileRoute } from "@tanstack/react-router";
import { EmBreve } from "@/components/panel/em-breve";
export const Route = createFileRoute("/_authenticated/secretaria/solicitacoes")({
  component: () => <EmBreve titulo="Solicitações" descricao="Atenda pedidos dos alunos." />,
});
