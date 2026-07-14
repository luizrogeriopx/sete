import { createFileRoute, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader, SiteFooter } from "@/components/site/site-chrome";
import { CheckCircle2, XCircle } from "lucide-react";

export const Route = createFileRoute("/certificado/validar/$codigo")({
  head: () => ({
    meta: [
      { title: "Validar certificado — SETE" },
      { name: "description", content: "Valide a autenticidade de um certificado do SETE." },
    ],
  }),
  component: ValidarPage,
});

function ValidarPage() {
  const { codigo } = useParams({ from: "/certificado/validar/$codigo" });
  const [state, setState] = useState<"loading" | "ok" | "invalido">("loading");
  const [info, setInfo] = useState<{ curso: string; aluno: string; emitido_em: string } | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("certificados")
        .select("emitido_em, aluno_id, curso_id, cursos(titulo)")
        .eq("codigo_validacao", codigo)
        .maybeSingle();
      if (!data) { setState("invalido"); return; }
      const { data: p } = await supabase.from("profiles").select("nome_completo").eq("id", data.aluno_id).maybeSingle();
      setInfo({
        curso: data.cursos?.titulo ?? "",
        aluno: p?.nome_completo ?? "",
        emitido_em: new Date(data.emitido_em).toLocaleDateString("pt-BR"),
      });
      setState("ok");
    })();
  }, [codigo]);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center px-4 py-16 text-center">
        {state === "loading" && <p className="text-muted-foreground">Validando…</p>}
        {state === "invalido" && (
          <>
            <XCircle className="h-16 w-16 text-destructive" />
            <h1 className="mt-4 font-serif text-3xl">Certificado não encontrado</h1>
            <p className="mt-2 text-muted-foreground">Código inválido: <code>{codigo}</code></p>
          </>
        )}
        {state === "ok" && info && (
          <>
            <CheckCircle2 className="h-16 w-16 text-gold" />
            <h1 className="mt-4 font-serif text-3xl">Certificado autêntico</h1>
            <div className="mt-8 w-full rounded-2xl border border-border bg-card p-8 text-left">
              <div className="text-xs uppercase tracking-widest text-muted-foreground">Aluno</div>
              <div className="font-serif text-2xl">{info.aluno}</div>
              <div className="mt-4 text-xs uppercase tracking-widest text-muted-foreground">Curso</div>
              <div className="font-serif text-xl">{info.curso}</div>
              <div className="mt-4 text-xs uppercase tracking-widest text-muted-foreground">Emitido em</div>
              <div>{info.emitido_em}</div>
              <div className="mt-4 text-xs uppercase tracking-widest text-muted-foreground">Código</div>
              <code className="text-sm">{codigo}</code>
            </div>
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
