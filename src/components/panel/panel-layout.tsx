import { type ReactNode } from "react";
import { Link, useRouter } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { BookOpen, LogOut, Menu } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";

export interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export function PanelLayout({
  title,
  items,
  children,
}: {
  title: string;
  items: NavItem[];
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();

  async function handleSignOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    router.navigate({ to: "/", replace: true });
  }

  return (
    <div className="flex min-h-screen bg-background">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-transform md:static md:flex md:translate-x-0",
          open ? "flex translate-x-0" : "hidden -translate-x-full md:flex",
        )}
      >
        <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-gold text-gold-foreground">
            <BookOpen className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <div className="font-serif text-lg">SETE</div>
            <div className="text-[10px] uppercase tracking-widest text-sidebar-foreground/60">
              {title}
            </div>
          </div>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {items.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              activeProps={{ className: "bg-sidebar-accent text-sidebar-accent-foreground" }}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="border-t border-sidebar-border p-3">
          <div className="mb-2 truncate text-xs text-sidebar-foreground/60">{user?.email}</div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <LogOut className="mr-2 h-4 w-4" /> Sair
          </Button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col md:pl-0">
        <header className="flex h-16 items-center gap-3 border-b border-border bg-card px-4 md:hidden">
          <button
            onClick={() => setOpen((v) => !v)}
            className="rounded-md border border-border p-2"
            aria-label="Abrir menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="font-serif text-lg">SETE · {title}</div>
        </header>
        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
