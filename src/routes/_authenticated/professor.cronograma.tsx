import { createFileRoute } from "@tanstack/react-router";
import { EmBreve } from "@/components/panel/em-breve";
export const Route = createFileRoute("/_authenticated/professor/cronograma")({
  component: () => <EmBreve titulo="Cronograma" descricao="Datas de aula e conteúdo programado." />,
});
