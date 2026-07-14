import { createFileRoute } from "@tanstack/react-router";
import { EmBreve } from "@/components/panel/em-breve";
export const Route = createFileRoute("/_authenticated/aluno/suporte")({
  component: () => <EmBreve titulo="Suporte" descricao="Tire dúvidas com nossa equipe." />,
});
