import { createFileRoute } from "@tanstack/react-router";
import { EmBreve } from "@/components/panel/em-breve";
export const Route = createFileRoute("/_authenticated/professor/cursos")({
  component: () => <EmBreve titulo="Meus cursos" descricao="Cursos que você ministra." />,
});
