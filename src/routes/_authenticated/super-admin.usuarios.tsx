import { createFileRoute } from "@tanstack/react-router";
import { EmBreve } from "@/components/panel/em-breve";
export const Route = createFileRoute("/_authenticated/super-admin/usuarios")({
  component: () => <EmBreve titulo="Usuários" descricao="Gerencie todos os usuários e papéis." />,
});
