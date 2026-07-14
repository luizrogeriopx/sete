import { createFileRoute } from "@tanstack/react-router";
import { EmBreve } from "@/components/panel/em-breve";
export const Route = createFileRoute("/_authenticated/super-admin/suporte")({
  component: () => <EmBreve titulo="Suporte global" descricao="Atenda tickets de todos os usuários." />,
});
