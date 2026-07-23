import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Award, Printer, Eye } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/aluno/certificados")({
  component: Page,
});

function Page() {
  const { user } = useAuth();
  const [activeCert, setActiveCert] = useState<any>(null);

  // Fetch certificates with layouts
  const { data } = useQuery({
    queryKey: ["certificados-aluno", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("certificados")
        .select("id, codigo_validacao, emitido_em, layout_id, cursos(titulo), layouts_certificado(imagem_url, orientacao)")
        .eq("aluno_id", user!.id);
      return data ?? [];
    },
  });

  // Fetch student profile name
  const { data: profile } = useQuery({
    queryKey: ["aluno-profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("nome_completo")
        .eq("id", user!.id)
        .maybeSingle();
      return data;
    },
  });

  // Pre-generate signed URLs for private certificate layout images
  const { data: signedMap } = useQuery({
    queryKey: ["certificados-signed-urls", data?.map((c: any) => c.layouts_certificado?.imagem_url).join("|")],
    enabled: !!data?.length,
    queryFn: async () => {
      const map: Record<string, string> = {};
      const paths = (data ?? [])
        .map((c: any) => c.layouts_certificado?.imagem_url)
        .filter(Boolean) as string[];
      if (paths.length === 0) return map;

      const { data: signedData } = await supabase.storage
        .from("certificado-layouts")
        .createSignedUrls(paths, 3600);

      (signedData ?? []).forEach((s) => {
        if (s.path && s.signedUrl) map[s.path] = s.signedUrl;
      });
      return map;
    },
  });

  const handlePrint = () => {
    window.print();
  };

  const getImageUrl = (c: any) => {
    const path = c.layouts_certificado?.imagem_url;
    return path ? signedMap?.[path] ?? "" : "";
  };

  const formatDocDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("pt-BR", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  };

  return (
    <div>
      <h1 className="font-serif text-4xl">Meus certificados</h1>
      <p className="mt-1 text-muted-foreground">Cursos concluídos com aprovação.</p>

      {(data ?? []).length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          Você ainda não concluiu cursos.
        </div>
      ) : (
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {data!.map((c: any) => (
            <Card key={c.id}>
              <CardContent className="p-6">
                <Award className="h-6 w-6 text-gold" />
                <div className="mt-2 font-serif text-lg">{c.cursos?.titulo}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Emitido em {new Date(c.emitido_em).toLocaleDateString("pt-BR")}
                </div>
                <div className="mt-3 text-xs">
                  Código: <code>{c.codigo_validacao}</code>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-gold/30 text-gold hover:bg-gold/10 flex items-center gap-1.5"
                    onClick={() => setActiveCert(c)}
                  >
                    <Eye className="h-4 w-4" /> Visualizar e Imprimir
                  </Button>
                  <Link
                    to="/certificado/validar/$codigo"
                    params={{ codigo: c.codigo_validacao }}
                    className="text-primary underline text-sm flex items-center text-slate-400 hover:text-slate-100 transition-colors"
                  >
                    Página pública de validação
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dynamic Print Styles for orientation */}
      {activeCert && (
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            body * {
              visibility: hidden !important;
            }
            #printable-certificate-area, #printable-certificate-area * {
              visibility: visible !important;
            }
            #printable-certificate-area {
              position: fixed !important;
              left: 0 !important;
              top: 0 !important;
              width: 100vw !important;
              height: 100vh !important;
              margin: 0 !important;
              padding: 0 !important;
              box-shadow: none !important;
              border: none !important;
              background-color: white !important;
            }
            @page {
              size: ${activeCert.layouts_certificado?.orientacao === 'retrato' ? 'portrait' : 'landscape'};
              margin: 0;
            }
          }
        `}} />
      )}

      {/* View & Print Certificate Dialog */}
      <Dialog open={!!activeCert} onOpenChange={(open) => !open && setActiveCert(null)}>
        <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
          <DialogHeader className="print:hidden">
            <DialogTitle className="font-serif text-xl flex items-center gap-2">
              <Award className="h-5 w-5 text-gold" /> Certificado Acadêmico
            </DialogTitle>
            <DialogDescription>
              Visualize o seu certificado. Clique em "Imprimir" para salvar como PDF ou imprimir.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 flex flex-col items-center">
            {activeCert && (
              <div 
                id="printable-certificate-area" 
                className="relative border shadow-lg w-full max-w-3xl overflow-hidden bg-white print:shadow-none print:border-none"
                style={{ 
                  aspectRatio: activeCert.layouts_certificado?.orientacao === 'retrato' ? '1/1.414' : '1.414/1' 
                }}
              >
                {getImageUrl(activeCert) ? (
                  <img 
                    src={getImageUrl(activeCert)} 
                    alt="Layout de Certificado" 
                    className="w-full h-full object-cover select-none" 
                  />
                ) : (
                  <div className="w-full h-full bg-slate-50 border border-dashed flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                    <Award className="h-16 w-16 opacity-30 mb-2" />
                    <span>Arte do certificado não cadastrada.</span>
                    <span className="text-xs">O texto será impresso sobre fundo branco.</span>
                  </div>
                )}

                {/* Overlays positioned relative to typical blanks */}
                <div className="absolute inset-0 flex flex-col justify-center items-center text-center p-8 select-none pointer-events-none">
                  {/* Header text at the top */}
                  <div className="absolute top-[12%] left-1/2 transform -translate-x-1/2 w-[85%] text-center">
                    <h1 className="font-serif text-2xl font-bold text-slate-900 tracking-widest sm:text-3xl md:text-4xl uppercase">
                      SETE
                    </h1>
                    <p className="font-sans text-[10px] tracking-wider text-slate-600 uppercase font-semibold sm:text-xs md:text-sm mt-0.5">
                      Seminário Teológico Esperança
                    </p>
                    <div className="h-[1.5px] w-24 bg-gold/50 mx-auto my-3" />
                    <p className="font-serif text-sm tracking-widest text-gold uppercase font-bold sm:text-base md:text-lg mt-1">
                      Certificado de Conclusão
                    </p>
                  </div>

                  {/* Student Name */}
                  <div className="absolute top-[48%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[85%] text-center">
                    <h2 className="font-serif text-xl font-semibold text-slate-800 tracking-wide sm:text-2xl md:text-3xl">
                      {profile?.nome_completo || user?.user_metadata?.nome_completo || "Nome do Aluno"}
                    </h2>
                  </div>

                  {/* Course Title */}
                  <div className="absolute top-[62%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[85%] text-center">
                    <h3 className="font-serif text-lg font-medium text-slate-700 sm:text-xl md:text-2xl tracking-widest uppercase">
                      {activeCert.cursos?.titulo}
                    </h3>
                  </div>

                  {/* Issue Date */}
                  <div className="absolute top-[75%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[85%] text-center">
                    <p className="text-sm text-slate-600 sm:text-base md:text-lg">
                      Emitido em {formatDocDate(activeCert.emitido_em)}
                    </p>
                  </div>

                  {/* Validation Code */}
                  <div className="absolute bottom-[6%] left-[6%] text-left text-[10px] text-slate-500 font-mono">
                    Código de validação: {activeCert.codigo_validacao}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 print:hidden">
            <Button variant="outline" onClick={() => setActiveCert(null)}>
              Fechar
            </Button>
            <Button 
              className="bg-gold text-gold-foreground hover:bg-gold/90 flex items-center gap-1.5"
              onClick={handlePrint}
            >
              <Printer className="h-4 w-4" /> Imprimir / Salvar PDF
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
