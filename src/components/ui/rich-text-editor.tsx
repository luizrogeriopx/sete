import React, { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  Unlink,
  Image as ImageIcon,
  Upload,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Minus,
  RemoveFormatting,
  Code,
  Eye,
  Edit3,
  Loader2,
  ExternalLink,
} from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Digite o conteúdo da aula aqui...",
  className = "",
  minHeight = "480px",
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<"visual" | "html" | "preview">("visual");
  const [savedRange, setSavedRange] = useState<Range | null>(null);

  // Link Dialog State
  const [isLinkOpen, setIsLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");

  // Image Dialog State
  const [isImageOpen, setIsImageOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [imageAlt, setImageAlt] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  // Synchronize initial value into editor
  useEffect(() => {
    if (editorRef.current) {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value || "";
      }
    }
  }, [value]);

  const saveCurrentSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      setSavedRange(sel.getRangeAt(0));
    }
  };

  const restoreCurrentSelection = () => {
    if (!savedRange) return;
    const sel = window.getSelection();
    if (sel) {
      sel.removeAllRanges();
      sel.addRange(savedRange);
    }
  };

  const executeCommand = (command: string, val: string | undefined = undefined) => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
    document.execCommand(command, false, val);
    handleContentChange();
  };

  const handleContentChange = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      onChange(html);
    }
  };

  // Open Link Modal
  const handleOpenLinkModal = () => {
    saveCurrentSelection();
    const sel = window.getSelection();
    const selected = sel ? sel.toString() : "";
    setLinkText(selected);
    setLinkUrl("");
    setIsLinkOpen(true);
  };

  // Apply Link
  const handleApplyLink = () => {
    if (!linkUrl.trim()) {
      toast.error("Insira a URL do link.");
      return;
    }

    let finalUrl = linkUrl.trim();
    if (!finalUrl.startsWith("http://") && !finalUrl.startsWith("https://") && !finalUrl.startsWith("mailto:")) {
      finalUrl = "https://" + finalUrl;
    }

    restoreCurrentSelection();

    if (linkText.trim()) {
      const linkHtml = `<a href="${finalUrl}" target="_blank" rel="noopener noreferrer" class="text-[#ff3403] underline font-medium hover:text-[#d92c02]">${linkText.trim()}</a>`;
      document.execCommand("insertHTML", false, linkHtml);
    } else {
      executeCommand("createLink", finalUrl);
    }

    handleContentChange();
    setIsLinkOpen(false);
    setLinkUrl("");
    setLinkText("");
    toast.success("Link inserido com sucesso!");
  };

  const handleRemoveLink = () => {
    executeCommand("unlink");
    toast.info("Link removido da seleção.");
  };

  // Open Image Modal
  const handleOpenImageModal = () => {
    saveCurrentSelection();
    setImageUrl("");
    setImageAlt("");
    setIsImageOpen(true);
  };

  // Upload image to Supabase Storage
  const handleUploadImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Selecione um arquivo de imagem válido.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 10MB.");
      return;
    }

    try {
      setIsUploading(true);
      const ext = file.name.split(".").pop() || "jpg";
      const fileName = `aulas/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("cursos")
        .upload(fileName, file, { cacheControl: "3600", upsert: false });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("cursos").getPublicUrl(fileName);
      if (!data.publicUrl) throw new Error("Erro ao obter link público da imagem.");

      setImageUrl(data.publicUrl);
      toast.success("Upload concluído! Clique em Inserir.");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Erro no upload da imagem.");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  // Insert Image into text
  const handleApplyImage = () => {
    if (!imageUrl.trim()) {
      toast.error("Por favor, selecione uma imagem ou informe a URL.");
      return;
    }

    restoreCurrentSelection();

    const imgHtml = `<div class="my-5 text-center"><img src="${imageUrl.trim()}" alt="${imageAlt.trim() || "Imagem da aula"}" class="rounded-2xl max-w-full mx-auto shadow-md border border-[#e2ddd3] object-contain max-h-[500px]" />${imageAlt ? `<p class="text-xs text-muted-foreground mt-2 italic">${imageAlt}</p>` : ""}<p><br></p></div>`;

    if (editorRef.current) {
      editorRef.current.focus();
    }

    document.execCommand("insertHTML", false, imgHtml);
    handleContentChange();
    setIsImageOpen(false);
    setImageUrl("");
    setImageAlt("");
    toast.success("Imagem inserida no texto!");
  };

  return (
    <div className={`flex flex-col rounded-2xl border border-[#e2ddd3] bg-white shadow-xs overflow-hidden ${className}`}>
      {/* Top Toolbar Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e2ddd3] bg-[#f8f6f0] p-2.5">
        {/* Formatting Group */}
        <div className="flex flex-wrap items-center gap-1">
          {/* Headings */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => executeCommand("formatBlock", "<h1>")}
            title="Título Principal (H1)"
            className="h-8 px-2 text-xs font-serif font-bold text-[#1c1917] hover:bg-[#eae5d9]"
          >
            H1
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => executeCommand("formatBlock", "<h2>")}
            title="Subtítulo (H2)"
            className="h-8 px-2 text-xs font-serif font-bold text-[#1c1917] hover:bg-[#eae5d9]"
          >
            H2
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => executeCommand("formatBlock", "<h3>")}
            title="Seção (H3)"
            className="h-8 px-2 text-xs font-serif font-bold text-[#1c1917] hover:bg-[#eae5d9]"
          >
            H3
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => executeCommand("formatBlock", "<p>")}
            title="Parágrafo Normal"
            className="h-8 px-2 text-xs text-[#66594e] hover:bg-[#eae5d9]"
          >
            Texto
          </Button>

          <div className="h-4 w-[1px] bg-[#e2ddd3] mx-1" />

          {/* Text Styles */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => executeCommand("bold")}
            title="Negrito (Ctrl+B)"
            className="h-8 w-8 text-[#1c1917] hover:bg-[#eae5d9]"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => executeCommand("italic")}
            title="Itálico (Ctrl+I)"
            className="h-8 w-8 text-[#1c1917] hover:bg-[#eae5d9]"
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => executeCommand("underline")}
            title="Sublinhado (Ctrl+U)"
            className="h-8 w-8 text-[#1c1917] hover:bg-[#eae5d9]"
          >
            <Underline className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => executeCommand("strikeThrough")}
            title="Tachado"
            className="h-8 w-8 text-[#1c1917] hover:bg-[#eae5d9]"
          >
            <Strikethrough className="h-4 w-4" />
          </Button>

          <div className="h-4 w-[1px] bg-[#e2ddd3] mx-1" />

          {/* Lists & Quote */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => executeCommand("insertUnorderedList")}
            title="Lista com Marcadores"
            className="h-8 w-8 text-[#1c1917] hover:bg-[#eae5d9]"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => executeCommand("insertOrderedList")}
            title="Lista Numerada"
            className="h-8 w-8 text-[#1c1917] hover:bg-[#eae5d9]"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => executeCommand("formatBlock", "<blockquote>")}
            title="Citação em Bloco"
            className="h-8 w-8 text-[#1c1917] hover:bg-[#eae5d9]"
          >
            <Quote className="h-4 w-4" />
          </Button>

          <div className="h-4 w-[1px] bg-[#e2ddd3] mx-1" />

          {/* Alignment */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => executeCommand("justifyLeft")}
            title="Alinhar à Esquerda"
            className="h-8 w-8 text-[#1c1917] hover:bg-[#eae5d9]"
          >
            <AlignLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => executeCommand("justifyCenter")}
            title="Centralizar"
            className="h-8 w-8 text-[#1c1917] hover:bg-[#eae5d9]"
          >
            <AlignCenter className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => executeCommand("justifyRight")}
            title="Alinhar à Direita"
            className="h-8 w-8 text-[#1c1917] hover:bg-[#eae5d9]"
          >
            <AlignRight className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => executeCommand("justifyFull")}
            title="Justificar"
            className="h-8 w-8 text-[#1c1917] hover:bg-[#eae5d9]"
          >
            <AlignJustify className="h-4 w-4" />
          </Button>

          <div className="h-4 w-[1px] bg-[#e2ddd3] mx-1" />

          {/* Insert Link & Image */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleOpenLinkModal}
            title="Inserir Link em Palavra Selecionada"
            className="h-8 px-2.5 text-xs font-medium border-[#ff3403]/30 text-[#ff3403] bg-white hover:bg-[#ff3403]/10"
          >
            <LinkIcon className="h-3.5 w-3.5 mr-1" /> Link
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleRemoveLink}
            title="Remover Link da Seleção"
            className="h-8 w-8 text-muted-foreground hover:bg-[#eae5d9]"
          >
            <Unlink className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleOpenImageModal}
            title="Inserir Imagem Entre o Texto"
            className="h-8 px-2.5 text-xs font-medium border-emerald-600/30 text-emerald-700 bg-white hover:bg-emerald-50"
          >
            <ImageIcon className="h-3.5 w-3.5 mr-1" /> Inserir Imagem
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => executeCommand("insertHorizontalRule")}
            title="Linha Divisória"
            className="h-8 w-8 text-[#1c1917] hover:bg-[#eae5d9]"
          >
            <Minus className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => executeCommand("removeFormat")}
            title="Limpar Formatação"
            className="h-8 w-8 text-[#66594e] hover:bg-[#eae5d9]"
          >
            <RemoveFormatting className="h-4 w-4" />
          </Button>
        </div>

        {/* View Mode Tabs */}
        <div className="flex items-center gap-1 bg-[#eae5d9] p-1 rounded-xl">
          <Button
            type="button"
            variant={activeTab === "visual" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("visual")}
            className={`h-7 px-2.5 text-xs font-medium rounded-lg ${activeTab === "visual" ? "bg-white shadow-xs text-[#1c1917]" : "text-[#66594e]"}`}
          >
            <Edit3 className="h-3 w-3 mr-1" /> Editor
          </Button>
          <Button
            type="button"
            variant={activeTab === "preview" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("preview")}
            className={`h-7 px-2.5 text-xs font-medium rounded-lg ${activeTab === "preview" ? "bg-white shadow-xs text-[#1c1917]" : "text-[#66594e]"}`}
          >
            <Eye className="h-3 w-3 mr-1" /> Prévia
          </Button>
          <Button
            type="button"
            variant={activeTab === "html" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("html")}
            className={`h-7 px-2.5 text-xs font-medium rounded-lg ${activeTab === "html" ? "bg-white shadow-xs text-[#1c1917]" : "text-[#66594e]"}`}
          >
            <Code className="h-3 w-3 mr-1" /> HTML
          </Button>
        </div>
      </div>

      {/* Editor Content Area */}
      {activeTab === "visual" && (
        <div
          ref={editorRef}
          contentEditable
          onInput={handleContentChange}
          onBlur={handleContentChange}
          style={{ minHeight }}
          data-placeholder={placeholder}
          className="p-6 focus:outline-hidden text-[#1c1917] text-base leading-relaxed overflow-y-auto max-h-[75vh] [&_h1]:text-3xl [&_h1]:font-serif [&_h1]:font-black [&_h1]:mt-6 [&_h1]:mb-3 [&_h1]:text-[#161922] [&_h2]:text-2xl [&_h2]:font-serif [&_h2]:font-bold [&_h2]:mt-5 [&_h2]:mb-2 [&_h2]:text-[#161922] [&_h3]:text-xl [&_h3]:font-serif [&_h3]:font-bold [&_h3]:mt-4 [&_h3]:mb-2 [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-3 [&_blockquote]:border-l-4 [&_blockquote]:border-[#ff3403] [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:my-4 [&_blockquote]:text-[#66594e] [&_a]:text-[#ff3403] [&_a]:underline [&_a]:font-medium [&_img]:rounded-2xl [&_img]:my-4 [&_img]:max-w-full [&_img]:shadow-sm [&_img]:border [&_img]:border-[#e2ddd3] empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground empty:before:pointer-events-none"
        />
      )}

      {activeTab === "preview" && (
        <div style={{ minHeight }} className="p-6 bg-[#f8f6f0]/40 overflow-y-auto max-h-[75vh]">
          <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl border border-[#e2ddd3] shadow-xs">
            <div className="text-[10px] font-black uppercase tracking-wider text-[#ff3403] mb-4">
              Prévia Visual do Aluno
            </div>
            {value ? (
              <div
                className="text-[#1c1917] text-base leading-relaxed [&_h1]:text-3xl [&_h1]:font-serif [&_h1]:font-black [&_h1]:mt-6 [&_h1]:mb-3 [&_h1]:text-[#161922] [&_h2]:text-2xl [&_h2]:font-serif [&_h2]:font-bold [&_h2]:mt-5 [&_h2]:mb-2 [&_h2]:text-[#161922] [&_h3]:text-xl [&_h3]:font-serif [&_h3]:font-bold [&_h3]:mt-4 [&_h3]:mb-2 [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-3 [&_blockquote]:border-l-4 [&_blockquote]:border-[#ff3403] [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:my-4 [&_blockquote]:text-[#66594e] [&_a]:text-[#ff3403] [&_a]:underline [&_a]:font-medium [&_img]:rounded-2xl [&_img]:my-4 [&_img]:max-w-full [&_img]:shadow-sm [&_img]:border [&_img]:border-[#e2ddd3]"
                dangerouslySetInnerHTML={{ __html: value }}
              />
            ) : (
              <p className="text-muted-foreground italic text-sm">Nenhum conteúdo inserido ainda.</p>
            )}
          </div>
        </div>
      )}

      {activeTab === "html" && (
        <div style={{ minHeight }} className="p-4 bg-slate-950 font-mono text-xs text-slate-200">
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full h-full min-h-[480px] bg-transparent resize-none focus:outline-hidden text-emerald-400 font-mono text-sm leading-relaxed"
            placeholder="<div>...</div>"
          />
        </div>
      )}

      {/* Dialog Link */}
      <Dialog open={isLinkOpen} onOpenChange={setIsLinkOpen}>
        <DialogContent className="max-w-md bg-white rounded-3xl border-[#e2ddd3]">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl font-black">Inserir Link no Texto</DialogTitle>
            <DialogDescription>
              Insira o link na palavra selecionada para que os alunos possam clicar e abrir a página.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="link-text-input">Texto / Palavra Selecionada</Label>
              <Input
                id="link-text-input"
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
                placeholder="Ex: Apostila de Hermenêutica"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="link-url-input">URL de Destino (Link) *</Label>
              <Input
                id="link-url-input"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://exemplo.com/artigo"
                autoFocus
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsLinkOpen(false)}>
              Cancelar
            </Button>
            <Button className="bg-[#ff3403] hover:bg-[#d92c02] text-white" onClick={handleApplyLink}>
              Inserir Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Imagem */}
      <Dialog open={isImageOpen} onOpenChange={setIsImageOpen}>
        <DialogContent className="max-w-md bg-white rounded-3xl border-[#e2ddd3]">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl font-black">Inserir Imagem Entre o Texto</DialogTitle>
            <DialogDescription>
              Faça upload de uma imagem do seu computador ou cole o link de uma imagem da web.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Opção 1: Upload */}
            <div className="space-y-2">
              <Label>Fazer Upload do Computador</Label>
              <label
                className={`flex flex-col items-center justify-center border-2 border-dashed border-[#e2ddd3] hover:border-[#ff3403] rounded-2xl p-5 cursor-pointer transition-colors bg-[#f8f6f0]/50 ${
                  isUploading ? "opacity-60 pointer-events-none" : ""
                }`}
              >
                {isUploading ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-6 w-6 animate-spin text-[#ff3403]" />
                    <span className="text-xs text-muted-foreground">Enviando imagem...</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1.5 text-center">
                    <div className="p-2.5 rounded-full bg-[#ff3403]/10 text-[#ff3403]">
                      <Upload className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-bold text-[#1c1917]">Clique para escolher a imagem</span>
                    <span className="text-[11px] text-[#66594e]">PNG, JPG, WebP ou GIF (máx. 10MB)</span>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleUploadImageFile}
                  disabled={isUploading}
                />
              </label>
            </div>

            <div className="flex items-center gap-2 my-1">
              <div className="h-[1px] bg-[#e2ddd3] flex-1" />
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">ou link direto</span>
              <div className="h-[1px] bg-[#e2ddd3] flex-1" />
            </div>

            {/* Opção 2: URL */}
            <div className="space-y-2">
              <Label htmlFor="image-url-input">URL da Imagem</Label>
              <Input
                id="image-url-input"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://.../grafico.png"
              />
            </div>

            {imageUrl && (
              <div className="rounded-xl border border-[#e2ddd3] p-2 bg-[#f8f6f0] text-center">
                <p className="text-[11px] text-muted-foreground mb-1">Prévia da imagem:</p>
                <img src={imageUrl} alt="Prévia" className="max-h-36 rounded-lg mx-auto object-contain" />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="image-alt-input">Legenda / Texto Alternativo (Opcional)</Label>
              <Input
                id="image-alt-input"
                value={imageAlt}
                onChange={(e) => setImageAlt(e.target.value)}
                placeholder="Ex: Mapa do Antigo Oriente Médio"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsImageOpen(false)}>
              Cancelar
            </Button>
            <Button
              className="bg-[#ff3403] hover:bg-[#d92c02] text-white"
              onClick={handleApplyImage}
              disabled={!imageUrl.trim() || isUploading}
            >
              Inserir no Texto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
