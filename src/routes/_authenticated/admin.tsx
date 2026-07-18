import { Outlet, createFileRoute } from "@tanstack/react-router";
import { PanelLayout, type NavItem } from "@/components/panel/panel-layout";
import { LayoutDashboard, BookOpen, Users, Wallet, FileBarChart, Bell, Award, GraduationCap, HelpCircle, Settings } from "lucide-react";
const items: NavItem[] = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/cursos", label: "Cursos", icon: BookOpen },
  { to: "/admin/questionarios", label: "Questionários", icon: HelpCircle },
  { to: "/admin/professores", label: "Professores", icon: GraduationCap },
  { to: "/admin/alunos", label: "Alunos", icon: Users },
  { to: "/admin/financeiro", label: "Rel. financeiro", icon: Wallet },
  { to: "/admin/matriculas", label: "Rel. matrículas", icon: FileBarChart },
  { to: "/admin/certificados", label: "Layouts de certificado", icon: Award },
  { to: "/admin/notificacoes", label: "Notificações", icon: Bell },
  { to: "/admin/configuracoes", label: "Configurações do Site", icon: Settings },
];
export const Route = createFileRoute("/_authenticated/admin")({
  component: () => <PanelLayout title="Administração" items={items}><Outlet /></PanelLayout>,
});
