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

async function assertSuper(context: any) {
  const { data: isSuper, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "super_admin",
  });
  if (error) throw new Error(error.message);
  if (!isSuper) throw new Error("Acesso restrito ao Super Administrador.");
}

export const listarEmails = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertSuper(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const map: Record<string, string> = {};
    for (let page = 1; page < 50; page++) {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 });
      if (error) throw new Error(error.message);
      data.users.forEach((u) => (map[u.id] = u.email ?? ""));
      if (data.users.length < 1000) break;
    }
    return map;
  });

export const editarUsuario = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        nome_completo: z.string().trim().min(3).max(150),
        email: z.string().trim().email().max(255),
        telefone: z.string().trim().max(30).optional().default(""),
        cpf: z.string().trim().max(20).optional().default(""),
        nova_senha: z.string().max(72).optional().default(""),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertSuper(context);
    if (data.nova_senha && data.nova_senha.length < 6) throw new Error("A senha deve ter ao menos 6 caracteres.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const attrs: any = { email: data.email, email_confirm: true };
    if (data.nova_senha) {
      attrs.password = data.nova_senha;
      const { data: u } = await supabaseAdmin.auth.admin.getUserById(data.id);
      attrs.user_metadata = { ...(u.user?.user_metadata ?? {}), must_change_password: true };
    }
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.id, attrs);
    if (error) throw new Error(error.message);
    const { error: pErr } = await supabaseAdmin
      .from("profiles")
      .update({ nome_completo: data.nome_completo, telefone: data.telefone || null, cpf: data.cpf || null })
      .eq("id", data.id);
    if (pErr) throw new Error(pErr.message);
    return { ok: true };
  });
