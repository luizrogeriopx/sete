import { createFileRoute } from "@tanstack/react-router";
import { EmBreve } from "@/components/panel/em-breve";
export const Route = createFileRoute("/_authenticated/admin/cursos")({
  component: () => <EmBreve titulo="Cursos" descricao="Cadastre e edite cursos, módulos, aulas e avaliações." />,
});
