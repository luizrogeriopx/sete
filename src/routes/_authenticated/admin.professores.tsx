import { createFileRoute } from "@tanstack/react-router";
import { EmBreve } from "@/components/panel/em-breve";
export const Route = createFileRoute("/_authenticated/admin/professores")({
  component: () => <EmBreve titulo="Professores" descricao="Cadastre e vincule ministrantes." />,
});
