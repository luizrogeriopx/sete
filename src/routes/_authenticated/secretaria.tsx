import { Outlet, createFileRoute } from "@tanstack/react-router";
import { PanelLayout, type NavItem } from "@/components/panel/panel-layout";
import { LayoutDashboard, UserPlus, Wallet, Inbox, Users } from "lucide-react";
const items: NavItem[] = [
  { to: "/secretaria", label: "Dashboard", icon: LayoutDashboard },
  { to: "/secretaria/matriculas", label: "Matrículas", icon: UserPlus },
  { to: "/secretaria/pagamentos-dinheiro", label: "Pagamentos", icon: Wallet },
  { to: "/secretaria/solicitacoes", label: "Solicitações", icon: Inbox },
  { to: "/secretaria/alunos", label: "Alunos", icon: Users },
];
export const Route = createFileRoute("/_authenticated/secretaria")({
  component: () => <PanelLayout title="Secretaria" items={items}><Outlet /></PanelLayout>,
});
