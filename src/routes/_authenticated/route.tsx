import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    // Only fetch user, avoid complex logic in beforeLoad if it causes issues with redirects
    const { data, error } = await supabase.auth.getUser();
    
    if (error || !data.user) {
      throw redirect({ 
        to: "/auth", 
        search: { modo: "login", redirect: location.href } 
      });
    }

    // Move role fetching to a separate check if needed, but for now keep it simple
    const { data: rolesData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user.id);
      
    const roles = (rolesData ?? []).map((r) => r.role as string);

    // Forced password change redirect
    if (
      data.user.user_metadata?.["must_change_password"] === true &&
      location.pathname !== "/trocar-senha"
    ) {
      throw redirect({ to: "/trocar-senha" });
    }

    return {
      user: data.user,
      roles,
    };
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { user } = Route.useRouteContext();
  const location = Route.useLocation();
  
  // Safety check in component level too for client-side transitions
  if (user?.user_metadata?.["must_change_password"] === true && location.pathname !== "/trocar-senha") {
    return <redirect to="/trocar-senha" />;
  }

  return <Outlet />;
}

