import { createFileRoute } from "@tanstack/react-router";
import { EmBreve } from "@/components/panel/em-breve";
export const Route = createFileRoute("/_authenticated/aluno/financeiro")({
  component: () => <EmBreve titulo="Financeiro" descricao="Suas cobranças, comprovantes e histórico de pagamentos." />,
});
