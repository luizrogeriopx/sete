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
import { KeyRound, Lock, Mail, ArrowLeft, CheckCircle2 } from "lucide-react";

const searchSchema = z.object({
  modo: z.enum(["login", "cadastro", "recuperar", "redefinir"]).optional(),
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
  const [modo, setModo] = useState<"login" | "cadastro" | "recuperar" | "redefinir">(search.modo ?? "login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [nome, setNome] = useState("");
  const [dataNasc, setDataNasc] = useState("");
  const [cpf, setCpf] = useState("");
  const [telefone, setTelefone] = useState("");
  const [loading, setLoading] = useState(false);
  const [recoverySent, setRecoverySent] = useState(false);
  const navigate = useNavigate();
  const { user, roles, loading: authLoading } = useAuth();

  // Detect recovery or invite tokens in URL hash or search params
  useEffect(() => {
    if (typeof window === "undefined") return;

    const hash = window.location.hash || "";
    const isRecoveryHash = hash.includes("type=recovery") || hash.includes("type=invite");
    
    if (isRecoveryHash || search.modo === "redefinir") {
      setModo("redefinir");
    } else if (search.modo) {
      setModo(search.modo);
    }
  }, [search.modo]);

  // Handle automatic redirection only when NOT in password reset mode
  useEffect(() => {
    if (typeof window === "undefined") return;

    const hash = window.location.hash || "";
    const isRecovery = hash.includes("type=recovery") || hash.includes("type=invite") || modo === "redefinir";

    if (isRecovery) {
      return;
    }

    if (!authLoading && user) {
      const dest = search.redirect ?? primaryPanelPath(roles);
      navigate({ to: dest, replace: true });
    }
  }, [user, authLoading, roles, navigate, search.redirect, modo]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (modo === "cadastro") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth`,
            data: { 
              nome_completo: nome,
              data_nascimento: dataNasc || null,
              cpf: cpf || null,
              telefone: telefone || null,
            },
          },
        });
        if (error) throw error;
        toast.success("Cadastro realizado! Você já pode entrar.");
        setModo("login");
      } else if (modo === "recuperar") {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/auth?modo=redefinir`,
        });
        if (error) throw error;
        setRecoverySent(true);
        toast.success("E-mail de recuperação enviado com sucesso!");
      } else if (modo === "redefinir") {
        if (password.length < 6) {
          throw new Error("A nova senha deve ter no mínimo 6 caracteres.");
        }
        if (password !== confirmPassword) {
          throw new Error("As senhas informadas não coincidem.");
        }

        const { error } = await supabase.auth.updateUser({
          password: password,
        });
        if (error) throw error;

        toast.success("Nova senha cadastrada com sucesso!");
        setPassword("");
        setConfirmPassword("");

        // Clean up hash from URL
        if (window.history.replaceState) {
          window.history.replaceState(null, "", window.location.pathname);
        }

        // Navigate to the user's primary panel
        const dest = search.redirect ?? primaryPanelPath(roles);
        navigate({ to: dest, replace: true });
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
        
        // Check for forced password change right after login
        if (data.user?.user_metadata?.["must_change_password"] === true) {
          toast.info("Por favor, defina uma nova senha.");
          navigate({ to: "/trocar-senha", replace: true });
          return;
        }

        toast.success("Bem-vindo(a)!");

      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao processar solicitação";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-4 py-12">
        <Card className="w-full shadow-lg border-border/70">
          <CardContent className="p-8">
            <p className="text-xs font-medium uppercase tracking-[0.25em] text-gold">Portal SETE</p>
            
            <h1 className="mt-2 font-serif text-3xl text-foreground">
              {modo === "login" && "Entrar"}
              {modo === "cadastro" && "Criar conta"}
              {modo === "recuperar" && "Recuperar Senha"}
              {modo === "redefinir" && "Definir Nova Senha"}
            </h1>
            
            <p className="mt-2 text-sm text-muted-foreground">
              {modo === "login" && "Acesse o portal do aluno ou administrativo."}
              {modo === "cadastro" && "Cadastre-se para se matricular em cursos."}
              {modo === "recuperar" && "Informe seu e-mail para receber as instruções de recuperação."}
              {modo === "redefinir" && "Digite e confirme a sua nova senha de acesso."}
            </p>

            {modo === "recuperar" && recoverySent ? (
              <div className="mt-6 space-y-4 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-serif text-lg font-semibold">Link de acesso enviado!</h3>
                  <p className="text-sm text-muted-foreground">
                    Enviamos um e-mail para <strong>{email}</strong> com o link seguro para você definir sua nova senha.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full mt-4 flex items-center justify-center gap-2"
                  onClick={() => {
                    setRecoverySent(false);
                    setModo("login");
                  }}
                >
                  <ArrowLeft className="h-4 w-4" /> Voltar ao Login
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                {modo === "cadastro" && (
                  <>
                    <div>
                      <Label htmlFor="nome">Nome completo *</Label>
                      <Input id="nome" required value={nome} onChange={(e) => setNome(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor="dataNasc">Data de Nascimento</Label>
                        <Input id="dataNasc" type="date" value={dataNasc} onChange={(e) => setDataNasc(e.target.value)} className="w-full text-slate-300" />
                      </div>
                      <div>
                        <Label htmlFor="cpf">CPF</Label>
                        <Input id="cpf" value={cpf} onChange={(e) => setCpf(e.target.value)} placeholder="000.000.000-00" />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="telefone">Telefone / WhatsApp</Label>
                      <Input id="telefone" value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="(00) 00000-0000" />
                    </div>
                  </>
                )}

                {modo !== "redefinir" && (
                  <div>
                    <Label htmlFor="email">E-mail</Label>
                    <div className="relative mt-1">
                      <Input
                        id="email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="seu.email@exemplo.com"
                        className="pl-9"
                      />
                      <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>
                )}

                {modo === "login" && (
                  <div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Senha</Label>
                      <button
                        type="button"
                        onClick={() => setModo("recuperar")}
                        className="text-xs text-gold hover:underline"
                      >
                        Esqueceu a senha?
                      </button>
                    </div>
                    <div className="relative mt-1">
                      <Input
                        id="password"
                        type="password"
                        required
                        minLength={6}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-9"
                      />
                      <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>
                )}

                {modo === "cadastro" && (
                  <div>
                    <Label htmlFor="password">Senha</Label>
                    <div className="relative mt-1">
                      <Input
                        id="password"
                        type="password"
                        required
                        minLength={6}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-9"
                      />
                      <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>
                )}

                {modo === "redefinir" && (
                  <>
                    <div>
                      <Label htmlFor="new-password">Nova Senha *</Label>
                      <div className="relative mt-1">
                        <Input
                          id="new-password"
                          type="password"
                          required
                          minLength={6}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Mínimo 6 caracteres"
                          className="pl-9"
                        />
                        <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="confirm-password">Confirmar Nova Senha *</Label>
                      <div className="relative mt-1">
                        <Input
                          id="confirm-password"
                          type="password"
                          required
                          minLength={6}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Repita a nova senha"
                          className="pl-9"
                        />
                        <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                      </div>
                    </div>
                  </>
                )}

                <Button type="submit" className="w-full bg-gold text-gold-foreground hover:bg-gold/90" disabled={loading}>
                  {loading ? (
                    "Aguarde..."
                  ) : modo === "login" ? (
                    "Entrar"
                  ) : modo === "cadastro" ? (
                    "Cadastrar"
                  ) : modo === "recuperar" ? (
                    "Enviar Link de Recuperação"
                  ) : (
                    "Salvar Nova Senha"
                  )}
                </Button>
              </form>
            )}

            {/* Alternância de Modos */}
            <div className="mt-6 text-center text-sm text-muted-foreground space-y-2">
              {modo === "login" && (
                <div>
                  Ainda não tem conta?{" "}
                  <button className="text-primary underline font-medium" onClick={() => setModo("cadastro")}>
                    Cadastre-se
                  </button>
                </div>
              )}

              {modo === "cadastro" && (
                <div>
                  Já tem conta?{" "}
                  <button className="text-primary underline font-medium" onClick={() => setModo("login")}>
                    Entrar
                  </button>
                </div>
              )}

              {modo === "recuperar" && !recoverySent && (
                <div>
                  Lembrou sua senha?{" "}
                  <button className="text-primary underline font-medium" onClick={() => setModo("login")}>
                    Voltar ao Login
                  </button>
                </div>
              )}

              {modo === "redefinir" && (
                <div>
                  Deseja entrar com outra conta?{" "}
                  <button className="text-primary underline font-medium" onClick={() => setModo("login")}>
                    Ir para o Login
                  </button>
                </div>
              )}
            </div>

            <div className="mt-4 text-center">
              <Link to="/" className="text-xs text-muted-foreground underline hover:text-foreground">
                Voltar ao início
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
      <SiteFooter />
    </div>
  );
}

