import { Outlet } from "@tanstack/react-router";
import { createFileRoute } from "@tanstack/react-router";
import { PanelLayout, type NavItem } from "@/components/panel/panel-layout";
import {
  LayoutDashboard, BookOpen, Award, IdCard, Wallet, Bell, LifeBuoy, Building2, PlusCircle,
} from "lucide-react";

const items: NavItem[] = [
  { to: "/aluno", label: "Dashboard", icon: LayoutDashboard },
  { to: "/aluno/meus-cursos", label: "Meus cursos", icon: BookOpen },
  { to: "/aluno/cursos-disponiveis", label: "Cursos disponíveis", icon: PlusCircle },
  { to: "/aluno/certificados", label: "Certificados", icon: Award },
  { to: "/aluno/carteirinha", label: "Carteirinha", icon: IdCard },
  { to: "/aluno/financeiro", label: "Financeiro", icon: Wallet },
  { to: "/aluno/notificacoes", label: "Notificações", icon: Bell },
  { to: "/aluno/secretaria", label: "Secretaria", icon: Building2 },
  { to: "/aluno/suporte", label: "Suporte", icon: LifeBuoy },
];

export const Route = createFileRoute("/_authenticated/aluno")({
  component: () => (
    <PanelLayout title="Portal do Aluno" items={items}>
      <Outlet />
    </PanelLayout>
  ),
});
