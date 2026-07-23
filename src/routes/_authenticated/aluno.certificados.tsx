import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Award, Loader2, Download } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import html2canvas from "html2canvas-pro";
import { jsPDF } from "jspdf";

export const Route = createFileRoute("/_authenticated/aluno/certificados")({
  component: Page,
});

function Page() {
  const { user } = useAuth();
  const [activeCert, setActiveCert] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);

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

  const handleDownloadPDF = async (cert: any) => {
    if (isGenerating) return;
    setIsGenerating(true);
    const toastId = toast.loading("Gerando o arquivo PDF do certificado...");

    try {
      // 1. Set active certificate so off-screen layout renders
      setActiveCert(cert);

      // 2. Wait for state update and rendering
      await new Promise((resolve) => setTimeout(resolve, 800));

      const element = document.getElementById("printable-certificate-area");
      if (!element) {
        throw new Error("Erro ao renderizar o certificado no navegador.");
      }

      // 3. Make sure image is fully loaded if present
      const img = element.querySelector("img");
      if (img && !img.complete) {
        await new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve; // resolve anyway
          setTimeout(resolve, 3000); // safety timeout
        });
      }

      // 4. Capture element to canvas
      const canvas = await html2canvas(element, {
        scale: 2.5, // High resolution for print quality
        useCORS: true,
        allowTaint: false,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.98);
      const isPortrait = cert.layouts_certificado?.orientacao === "retrato";
      const orientation = isPortrait ? "portrait" : "landscape";

      // 5. Create PDF matching aspect ratio (standard A4 sizes at 72dpi: [595, 842])
      const pdf = new jsPDF({
        orientation: orientation,
        unit: "px",
        format: isPortrait ? [595, 842] : [842, 595],
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Certificado - ${cert.cursos?.titulo}.pdf`);

      toast.success("Certificado baixado com sucesso!", { id: toastId });
    } catch (err: any) {
      console.error("PDF generation error:", err);
      toast.error(`Erro ao gerar PDF: ${err.message || "Erro desconhecido."}`, { id: toastId });
    } finally {
      setActiveCert(null);
      setIsGenerating(false);
    }
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
          {data!.map((c: any) => {
            const isThisGenerating = isGenerating && activeCert?.id === c.id;
            return (
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
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <Button
                      size="sm"
                      className="bg-gold text-gold-foreground hover:bg-gold/90 flex items-center gap-1.5"
                      onClick={() => handleDownloadPDF(c)}
                      disabled={isGenerating}
                    >
                      {isThisGenerating ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                      {isThisGenerating ? "Gerando..." : "Baixar PDF"}
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
            );
          })}
        </div>
      )}

      {/* Off-screen Printable Certificate Area */}
      {activeCert && (
        <div className="absolute left-[-9999px] top-[-9999px]">
          <div 
            id="printable-certificate-area" 
            className="relative bg-white"
            style={{ 
              width: activeCert.layouts_certificado?.orientacao === "retrato" ? "794px" : "1123px",
              height: activeCert.layouts_certificado?.orientacao === "retrato" ? "1123px" : "794px",
              aspectRatio: activeCert.layouts_certificado?.orientacao === "retrato" ? "1/1.414" : "1.414/1" 
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
              </div>
            )}

            {/* Overlays positioned relative to typical blanks */}
            <div className="absolute inset-0 flex flex-col justify-center items-center text-center p-8 select-none pointer-events-none">
              {/* Header text at the top */}
              <div className="absolute top-[12%] left-1/2 transform -translate-x-1/2 w-[85%] text-center">
                <h1 className="font-serif text-5xl font-bold text-slate-900 tracking-widest uppercase">
                  SETE
                </h1>
                <p className="font-sans text-xs tracking-widest text-slate-600 uppercase font-bold mt-2">
                  Seminário Teológico Esperança
                </p>
                <div className="h-[2px] w-36 bg-gold/60 mx-auto my-4" />
                <p className="font-serif text-xl tracking-widest text-gold uppercase font-bold mt-2">
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
        </div>
      )}
    </div>
  );
}
