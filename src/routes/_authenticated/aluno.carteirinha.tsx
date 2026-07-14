import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Award, IdCard, Calendar, QrCode } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/aluno/carteirinha")({
  component: CarteirinhaEstudantil,
});

function CarteirinhaEstudantil() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["carteirinha", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [profileRes, carteirinhaRes, matriculasRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle(),
        supabase.from("carteirinhas").select("*").eq("aluno_id", user!.id).maybeSingle(),
        supabase.from("matriculas")
          .select("id, status, cursos(titulo)")
          .eq("aluno_id", user!.id)
          .eq("status", "ativa"),
      ]);

      if (profileRes.error) throw profileRes.error;

      return {
        profile: profileRes.data,
        carteirinha: carteirinhaRes.data,
        matriculas: matriculasRes.data ?? [],
      };
    },
  });

  const gerarCarteirinha = useMutation({
    mutationFn: async () => {
      if (!user) return;
      const numRandom = Math.floor(100000 + Math.random() * 900000).toString();
      const validade = new Date();
      validade.setFullYear(validade.getFullYear() + 1); // 1 ano de validade

      const { data, error } = await supabase
        .from("carteirinhas")
        .insert({
          aluno_id: user.id,
          numero: `SETE-${numRandom}`,
          validade: validade.toISOString().split("T")[0],
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["carteirinha", user?.id] });
      toast.success("Carteirinha digital gerada com sucesso!");
    },
    onError: (err: Error) => {
      toast.error(`Erro ao gerar carteirinha: ${err.message}`);
    },
  });

  if (isLoading) {
    return <p className="text-muted-foreground p-4">Carregando carteirinha…</p>;
  }

  const profile = data?.profile;
  const carteirinha = data?.carteirinha;
  const cursoAtivo = data?.matriculas?.[0]?.cursos?.titulo ?? "Aluno Regular";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-4xl">Carteirinha Estudantil</h1>
        <p className="mt-1 text-muted-foreground">Sua identidade digital do Seminário Teológico Esperança.</p>
      </div>

      {!carteirinha ? (
        <Card className="max-w-md">
          <CardContent className="flex flex-col items-center p-8 text-center">
            <IdCard className="h-16 w-16 text-gold animate-pulse" />
            <h3 className="mt-4 font-serif text-xl">Sua carteirinha ainda não foi emitida</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Você pode gerar sua carteirinha digital de estudante agora mesmo para usufruir de descontos e identificação.
            </p>
            <Button
              className="mt-6 bg-gold text-gold-foreground hover:bg-gold/90"
              onClick={() => gerarCarteirinha.mutate()}
              disabled={gerarCarteirinha.isPending}
            >
              Emitir Carteirinha Digital
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Card Visual */}
          <div className="relative mx-auto w-full max-w-sm rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950 p-6 text-white shadow-2xl border border-gold/30">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold text-slate-950 font-bold font-serif">
                  S
                </div>
                <div>
                  <div className="font-serif text-sm font-bold tracking-wide">SETE</div>
                  <div className="text-[8px] uppercase tracking-wider text-gold">Seminário Teológico Esperança</div>
                </div>
              </div>
              <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/30">
                ESTUDANTE ATIVO
              </span>
            </div>

            {/* Content */}
            <div className="mt-6 flex gap-4">
              {/* Photo */}
              <div className="h-24 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-slate-800 border border-white/10 flex items-center justify-center">
                {profile?.foto_url ? (
                  <img src={profile.foto_url} alt={profile.nome_completo} className="h-full w-full object-cover" />
                ) : (
                  <IdCard className="h-10 w-10 text-slate-500" />
                )}
              </div>

              {/* Data */}
              <div className="flex-1 space-y-2 min-w-0">
                <div>
                  <div className="text-[9px] uppercase tracking-wider text-slate-400">Nome do Estudante</div>
                  <div className="truncate font-serif text-base font-semibold text-gold leading-tight">
                    {profile?.nome_completo || "Nome não cadastrado"}
                  </div>
                </div>
                <div>
                  <div className="text-[9px] uppercase tracking-wider text-slate-400">Curso</div>
                  <div className="truncate text-xs font-medium text-white/90">
                    {cursoAtivo}
                  </div>
                </div>
                <div className="flex gap-4">
                  <div>
                    <div className="text-[9px] uppercase tracking-wider text-slate-400">Matrícula</div>
                    <div className="font-mono text-xs font-bold text-white/90">{carteirinha.numero}</div>
                  </div>
                  <div>
                    <div className="text-[9px] uppercase tracking-wider text-slate-400">Validade</div>
                    <div className="font-mono text-xs text-white/90">
                      {new Date(carteirinha.validade).toLocaleDateString("pt-BR")}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer / QR Code */}
            <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4">
              <div>
                <div className="text-[9px] uppercase tracking-wider text-slate-400">CPF</div>
                <div className="font-mono text-xs text-white/80">{profile?.cpf || "Não informado"}</div>
              </div>
              <div className="h-12 w-12 rounded bg-white p-1 flex items-center justify-center">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=SETE-VAL-${carteirinha.numero}`}
                  alt="QR Code de validação"
                  className="h-full w-full"
                />
              </div>
            </div>
          </div>

          {/* Informações detalhadas */}
          <div className="space-y-4">
            <Card>
              <CardContent className="p-6">
                <h3 className="font-serif text-lg font-semibold flex items-center gap-2">
                  <Award className="h-5 w-5 text-gold" />
                  Instruções de Uso
                </h3>
                <ul className="mt-4 space-y-3 text-sm text-muted-foreground list-disc list-inside">
                  <li>Esta carteirinha é digital e de uso exclusivo do aluno titular.</li>
                  <li>O QR Code pode ser lido pela secretaria para validação da sua matrícula ativa.</li>
                  <li>Dá direito a benefícios estudantis aplicáveis de acordo com a legislação.</li>
                  <li>Para atualizar sua foto de perfil, acesse a secretaria e solicite a alteração.</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 flex justify-between items-center">
                <div>
                  <div className="text-xs uppercase tracking-widest text-muted-foreground">Número de Registro</div>
                  <div className="font-mono text-lg font-bold">{carteirinha.numero}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-widest text-muted-foreground text-right">Validade</div>
                  <div className="font-mono text-lg font-bold text-right flex items-center gap-1">
                    <Calendar className="h-4 w-4 text-gold" />
                    {new Date(carteirinha.validade).toLocaleDateString("pt-BR")}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
