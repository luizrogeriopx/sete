import { createFileRoute } from "@tanstack/react-router";
import { EmBreve } from "@/components/panel/em-breve";
export const Route = createFileRoute("/_authenticated/admin/")({
  component: () => <EmBreve titulo="Administração" descricao="Indicadores gerais do seminário." />,
});
