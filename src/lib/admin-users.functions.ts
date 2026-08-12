import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const criarAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        email: z.string().email(),
        nome_completo: z.string().min(3),
        role: z.enum(["admin", "secretaria", "professor", "super_admin"]).default("admin"),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: isSuper, error: roleError } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "super_admin",
    });
    if (roleError) throw new Error(roleError.message);
    if (!isSuper) throw new Error("Acesso restrito ao Super Administrador.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: "123456",
      email_confirm: true,
      user_metadata: {
        nome_completo: data.nome_completo,
        role: data.role,
        must_change_password: true,
      },
    });
    if (error) throw new Error(error.message);

    const userId = created.user?.id;
    if (userId) {
      // garante o cargo mesmo se o trigger não tiver aplicado
      await supabaseAdmin.from("user_roles").delete().eq("user_id", userId);
      await supabaseAdmin.from("user_roles").insert({ user_id: userId, role: data.role });
    }

    return { id: userId, email: data.email };
  });
