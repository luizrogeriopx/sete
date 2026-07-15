import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/aluno/meus-dados")({
  component: MeusDadosPage,
});

function MeusDadosPage() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const [nome, setNome] = useState("");
  const [dataNasc, setDataNasc] = useState("");
  const [cpf, setCpf] = useState("");
  const [telefone, setTelefone] = useState("");
  const [fotoUrl, setFotoUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const { data: perfil, isLoading } = useQuery({
    queryKey: ["perfil", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (perfil) {
      setNome(perfil.nome_completo || "");
      setDataNasc(perfil.data_nascimento || "");
      setCpf(perfil.cpf || "");
      setTelefone(perfil.telefone || "");
      setFotoUrl(perfil.foto_url || "");
    }
  }, [perfil]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user!.id}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("perfis")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("perfis").getPublicUrl(filePath);
      if (!data.publicUrl) throw new Error("Não foi possível obter a URL pública.");

      setFotoUrl(data.publicUrl);
      toast.success("Foto de perfil carregada com sucesso!");
    } catch (err: any) {
      console.error(err);
      toast.error(`Erro ao carregar foto: ${err.message || err}`);
    } finally {
      setIsUploading(false);
    }
  };

  const salvarDados = useMutation({
    mutationFn: async () => {
      if (!nome.trim()) throw new Error("O nome completo é obrigatório.");
      const { error } = await supabase
        .from("profiles")
        .update({
          nome_completo: nome,
          data_nascimento: dataNasc || null,
          cpf: cpf || null,
          telefone: telefone || null,
          foto_url: fotoUrl || null,
        })
        .eq("id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["perfil", user?.id] });
      toast.success("Dados atualizados com sucesso!");
    },
    onError: (err: any) => {
      toast.error(`Erro ao salvar dados: ${err.message || err}`);
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="font-serif text-4xl">Meus Dados</h1>
        <p className="mt-1 text-muted-foreground">Mantenha suas informações cadastrais atualizadas.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-serif">Informações Pessoais</CardTitle>
          <CardDescription>
            Esses dados são importantes para a emissão de seus certificados e identificação no portal.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              salvarDados.mutate();
            }}
            className="space-y-6"
          >
            {/* Foto de Perfil */}
            <div className="flex flex-col items-center gap-3 pb-6 border-b border-border">
              <Label className="text-sm font-semibold">Foto de Perfil</Label>
              <div className="relative h-28 w-28 rounded-full overflow-hidden border-2 border-gold/40 bg-slate-900 group">
                {fotoUrl ? (
                  <img src={fotoUrl} alt="Foto de perfil" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-slate-500 font-serif text-3xl font-bold bg-slate-900">
                    {nome ? nome.charAt(0).toUpperCase() : "?"}
                  </div>
                )}
                {isUploading && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-gold" />
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById("avatar-upload")?.click()}
                  disabled={isUploading}
                >
                  Alterar Foto
                </Button>
                {fotoUrl && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => setFotoUrl("")}
                    disabled={isUploading}
                  >
                    Remover
                  </Button>
                )}
              </div>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
                disabled={isUploading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail (Login)</Label>
              <Input id="email" type="email" value={user?.email || ""} disabled className="bg-slate-900/50 text-muted-foreground" />
              <p className="text-[10px] text-muted-foreground">O e-mail de login não pode ser alterado diretamente.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nome">Nome Completo *</Label>
              <Input id="nome" required value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Seu nome completo" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dataNasc">Data de Nascimento</Label>
                <Input id="dataNasc" type="date" value={dataNasc} onChange={(e) => setDataNasc(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cpf">CPF</Label>
                <Input id="cpf" value={cpf} onChange={(e) => setCpf(e.target.value)} placeholder="000.000.000-00" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone / WhatsApp</Label>
              <Input id="telefone" value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="(00) 00000-0000" />
            </div>

            <div className="pt-2">
              <Button type="submit" className="bg-gold text-gold-foreground hover:bg-gold/90 flex items-center gap-2" disabled={salvarDados.isPending}>
                {salvarDados.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Salvar Alterações"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
