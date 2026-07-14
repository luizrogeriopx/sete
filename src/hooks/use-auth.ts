import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export type AppRole = Database["public"]["Enums"]["app_role"];

export interface AuthState {
  user: User | null;
  roles: AppRole[];
  loading: boolean;
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadRoles(uid: string) {
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", uid);
      if (!mounted) return;
      setRoles((data ?? []).map((r) => r.role as AppRole));
    }

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      const u = data.session?.user ?? null;
      setUser(u);
      if (u) loadRoles(u.id).finally(() => mounted && setLoading(false));
      else setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) loadRoles(u.id);
      else setRoles([]);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { user, roles, loading };
}

export function hasAnyRole(roles: AppRole[], ...check: AppRole[]) {
  return roles.some((r) => check.includes(r));
}

export function primaryPanelPath(roles: AppRole[]): string {
  if (roles.includes("super_admin")) return "/super-admin";
  if (roles.includes("admin")) return "/admin";
  if (roles.includes("secretaria")) return "/secretaria";
  if (roles.includes("professor")) return "/professor";
  return "/aluno";
}
