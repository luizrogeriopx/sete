import { Construction } from "lucide-react";

export function EmBreve({ titulo, descricao }: { titulo: string; descricao?: string }) {
  return (
    <div>
      <h1 className="font-serif text-4xl">{titulo}</h1>
      {descricao && <p className="mt-1 text-muted-foreground">{descricao}</p>}
      <div className="mt-8 rounded-xl border border-dashed border-border p-10 text-center">
        <Construction className="mx-auto h-10 w-10 text-gold" />
        <p className="mt-3 font-serif text-lg">Este módulo será liberado em breve</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Estamos preparando esta seção. Enquanto isso, navegue pelas demais áreas do painel.
        </p>
      </div>
    </div>
  );
}
