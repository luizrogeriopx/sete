import { Link } from "@tanstack/react-router";
import { useAuth, primaryPanelPath } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";

export function SiteHeader() {
  const { user, roles } = useAuth();
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <BookOpen className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <div className="font-serif text-lg font-semibold text-foreground">SETE</div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Seminário Teológico Esperança
            </div>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
          <Link to="/" activeOptions={{ exact: true }} activeProps={{ className: "text-primary" }} className="text-muted-foreground hover:text-foreground">
            Início
          </Link>
          <Link to="/cursos" activeProps={{ className: "text-primary" }} className="text-muted-foreground hover:text-foreground">
            Cursos
          </Link>
          <Link to="/sobre" activeProps={{ className: "text-primary" }} className="text-muted-foreground hover:text-foreground">
            Sobre
          </Link>
          <Link to="/contato" activeProps={{ className: "text-primary" }} className="text-muted-foreground hover:text-foreground">
            Contato
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <Button asChild size="sm">
              <Link to={primaryPanelPath(roles)}>Meu painel</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/auth">Entrar</Link>
              </Button>
              <Button asChild size="sm" className="bg-gold text-gold-foreground hover:bg-gold/90">
                <Link to="/auth" search={{ modo: "cadastro" }}>
                  Matricule-se
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-primary text-primary-foreground">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-3">
        <div>
          <div className="font-serif text-2xl font-semibold">SETE</div>
          <p className="mt-2 text-sm text-primary-foreground/70">
            Seminário Teológico Esperança — formação sólida, coração pastoral.
          </p>
        </div>
        <div>
          <h4 className="font-serif text-lg">Institucional</h4>
          <ul className="mt-3 space-y-1 text-sm text-primary-foreground/70">
            <li><Link to="/sobre">Sobre o seminário</Link></li>
            <li><Link to="/cursos">Cursos</Link></li>
            <li><Link to="/contato">Contato</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-serif text-lg">Aluno</h4>
          <ul className="mt-3 space-y-1 text-sm text-primary-foreground/70">
            <li><Link to="/auth">Portal do aluno</Link></li>
            <li><Link to="/certificado/validar">Validar certificado</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-primary-foreground/10 py-4 text-center text-xs text-primary-foreground/60">
        © {new Date().getFullYear()} SETE — Seminário Teológico Esperança.
      </div>
    </footer>
  );
}
