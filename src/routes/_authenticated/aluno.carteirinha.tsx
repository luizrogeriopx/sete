import { createFileRoute } from "@tanstack/react-router";
import { EmBreve } from "@/components/panel/em-breve";
export const Route = createFileRoute("/_authenticated/aluno/carteirinha")({
  component: () => <EmBreve titulo="Carteirinha estudantil" descricao="Sua carteirinha digital com QR code." />,
});
