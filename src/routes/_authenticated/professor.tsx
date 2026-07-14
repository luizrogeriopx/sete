import { Outlet, createFileRoute } from "@tanstack/react-router";
import { PanelLayout, type NavItem } from "@/components/panel/panel-layout";
import { LayoutDashboard, BookOpen, Users, Calendar, ClipboardCheck } from "lucide-react";
const items: NavItem[] = [
  { to: "/professor", label: "Dashboard", icon: LayoutDashboard },
  { to: "/professor/cursos", label: "Meus cursos", icon: BookOpen },
  { to: "/professor/alunos", label: "Alunos", icon: Users },
  { to: "/professor/chamada", label: "Chamada", icon: ClipboardCheck },
  { to: "/professor/cronograma", label: "Cronograma", icon: Calendar },
];
export const Route = createFileRoute("/_authenticated/professor")({
  component: () => <PanelLayout title="Portal do Professor" items={items}><Outlet /></PanelLayout>,
});
