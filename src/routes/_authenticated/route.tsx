import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({ to: "/auth", search: { modo: "login", redirect: location.href } });
    }
    if (
      data.user.user_metadata?.["must_change_password"] === true &&
      location.pathname !== "/trocar-senha"
    ) {
      throw redirect({ to: "/trocar-senha" });
    }
    const { data: rolesData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user.id);
    return {
      user: data.user,
      roles: (rolesData ?? []).map((r) => r.role as string),
    };
  },
  component: () => <Outlet />,
});
