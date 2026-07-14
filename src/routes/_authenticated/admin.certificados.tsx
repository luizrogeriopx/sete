import { createFileRoute } from "@tanstack/react-router";
import { EmBreve } from "@/components/panel/em-breve";
export const Route = createFileRoute("/_authenticated/admin/certificados")({
  component: () => <EmBreve titulo="Certificados" descricao="Layouts e emissões." />,
});
