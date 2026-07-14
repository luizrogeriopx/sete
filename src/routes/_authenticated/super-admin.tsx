import { Outlet, createFileRoute } from "@tanstack/react-router";
import { PanelLayout, type NavItem } from "@/components/panel/panel-layout";
import { LayoutDashboard, Users, Settings, LifeBuoy, BookOpen, FileBarChart } from "lucide-react";
const items: NavItem[] = [
  { to: "/super-admin", label: "Dashboard", icon: LayoutDashboard },
  { to: "/super-admin/usuarios", label: "Usuários", icon: Users },
  { to: "/super-admin/cursos", label: "Cursos", icon: BookOpen },
  { to: "/super-admin/relatorios", label: "Relatórios", icon: FileBarChart },
  { to: "/super-admin/suporte", label: "Suporte global", icon: LifeBuoy },
  { to: "/super-admin/configuracoes", label: "Configurações", icon: Settings },
];
export const Route = createFileRoute("/_authenticated/super-admin")({
  component: () => <PanelLayout title="Super Admin" items={items}><Outlet /></PanelLayout>,
});
