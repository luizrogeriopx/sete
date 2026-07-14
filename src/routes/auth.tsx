import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader, SiteFooter } from "@/components/site/site-chrome";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { useAuth, primaryPanelPath } from "@/hooks/use-auth";

const searchSchema = z.object({
  modo: z.enum(["login", "cadastro"]).optional().default("login").catch("login"),
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Entrar — SETE" },
      { name: "description", content: "Acesse o portal do SETE." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const search = Route.useSearch();
  const [modo, setModo] = useState<"login" | "cadastro">(search.modo);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nome, setNome] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, roles, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && user) {
      const dest = search.redirect ?? primaryPanelPath(roles);
      navigate({ to: dest, replace: true });
    }
  }, [user, authLoading, roles, navigate, search.redirect]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (modo === "cadastro") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { nome_completo: nome },
          },
        });
        if (error) throw error;
        toast.success("Cadastro realizado! Você já pode entrar.");
        setModo("login");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Bem-vindo(a)!");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-4 py-12">
        <Card className="w-full">
          <CardContent className="p-8">
            <p className="text-xs font-medium uppercase tracking-[0.25em] text-gold">Portal SETE</p>
            <h1 className="mt-2 font-serif text-3xl">
              {modo === "login" ? "Entrar" : "Criar conta"}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {modo === "login"
                ? "Acesse o portal do aluno ou administrativo."
                : "Cadastre-se para se matricular em cursos."}
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {modo === "cadastro" && (
                <div>
                  <Label htmlFor="nome">Nome completo</Label>
                  <Input id="nome" required value={nome} onChange={(e) => setNome(e.target.value)} />
                </div>
              )}
              <div>
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="password">Senha</Label>
                <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Aguarde..." : modo === "login" ? "Entrar" : "Cadastrar"}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              {modo === "login" ? (
                <>Ainda não tem conta?{" "}
                  <button className="text-primary underline" onClick={() => setModo("cadastro")}>
                    Cadastre-se
                  </button>
                </>
              ) : (
                <>Já tem conta?{" "}
                  <button className="text-primary underline" onClick={() => setModo("login")}>
                    Entrar
                  </button>
                </>
              )}
            </div>
            <div className="mt-4 text-center">
              <Link to="/" className="text-xs text-muted-foreground underline">Voltar ao início</Link>
            </div>
          </CardContent>
        </Card>
      </main>
      <SiteFooter />
    </div>
  );
}
