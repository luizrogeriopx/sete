import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { useAuth, primaryPanelPath } from "@/hooks/use-auth";
import { KeyRound } from "lucide-react";

export const Route = createFileRoute("/_authenticated/trocar-senha")({
  head: () => ({
    meta: [
      { title: "Definir nova senha — SETE" },
      { name: "description", content: "Defina sua senha definitiva de acesso ao portal SETE." },
    ],
  }),
  component: TrocarSenha,
});

function TrocarSenha() {
  const [senha, setSenha] = useState("");
  const [confirma, setConfirma] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { roles, loading: authLoading, user } = useAuth();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (senha.length < 6) return toast.error("A senha deve ter ao menos 6 caracteres.");
    if (senha === "123456") return toast.error("Escolha uma senha diferente da provisória.");
    if (senha !== confirma) return toast.error("As senhas não coincidem.");
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: senha,
        data: { must_change_password: false },
      });
      if (error) throw error;
      
      // Invalidate session to ensure metadata is updated everywhere
      await supabase.auth.refreshSession();
      
      toast.success("Senha atualizada com sucesso!");
      navigate({ to: primaryPanelPath(roles), replace: true });
    } catch (err) {
      toast.error(`Erro ao atualizar senha: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  }

  if (authLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gold border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <Card>
        <CardContent className="space-y-6 p-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-gold">
              <KeyRound className="h-5 w-5" />
              <span className="text-xs font-medium uppercase tracking-[0.2em]">Primeiro acesso</span>
            </div>
            <h1 className="font-serif text-3xl">Defina sua nova senha</h1>
            <p className="text-sm text-muted-foreground">
              Por segurança, é necessário substituir a senha provisória antes de usar o sistema.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="senha">Nova senha</Label>
              <Input id="senha" type="password" value={senha} onChange={(e) => setSenha(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirma">Confirmar nova senha</Label>
              <Input id="confirma" type="password" value={confirma} onChange={(e) => setConfirma(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full bg-gold text-gold-foreground hover:bg-gold/90" disabled={loading}>
              {loading ? "Salvando..." : "Salvar nova senha"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

