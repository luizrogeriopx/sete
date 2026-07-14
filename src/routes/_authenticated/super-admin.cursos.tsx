import { createFileRoute } from "@tanstack/react-router";
import { EmBreve } from "@/components/panel/em-breve";
export const Route = createFileRoute("/_authenticated/super-admin/cursos")({
  component: () => <EmBreve titulo="Cursos" descricao="Edite qualquer curso do sistema." />,
});
