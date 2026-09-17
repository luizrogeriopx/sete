import { Link } from "@tanstack/react-router";
import { useAuth, primaryPanelPath } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { BookOpen, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function SiteHeader() {
  const { user, roles } = useAuth();
  return (
    <header className="sticky top-0 z-40 border-b border-[#e2ddd3] bg-[#f3f0e9]/95 backdrop-blur-md transition-all">
      <div className="mx-auto flex h-18 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#ff3403] text-white shadow-sm group-hover:scale-105 transition-transform">
            <BookOpen className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <div className="font-serif text-xl font-extrabold text-[#1c1917] tracking-tight group-hover:text-[#ff3403] transition-colors">
              SETE
            </div>
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#66594e]">
              Seminário Teológico Esperança
            </div>
          </div>
        </Link>

        <nav className="hidden items-center gap-7 text-sm font-semibold tracking-wide md:flex">
          <Link
            to="/"
            activeOptions={{ exact: true }}
            activeProps={{ className: "text-[#ff3403]" }}
            className="text-[#1c1917]/80 hover:text-[#ff3403] transition-colors uppercase text-xs tracking-wider font-bold"
          >
            Início
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1 text-[#1c1917]/80 hover:text-[#ff3403] focus:outline-none transition-colors uppercase text-xs tracking-wider font-bold cursor-pointer">
              Cursos <ChevronDown className="h-3.5 w-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-60 bg-white border-[#e2ddd3] shadow-lg rounded-xl p-1.5">
              <DropdownMenuItem asChild>
                <Link
                  to="/cursos"
                  activeOptions={{ exact: true }}
                  className="cursor-pointer font-bold uppercase text-[11px] tracking-wider text-[#1c1917] hover:text-[#ff3403] hover:bg-[#f3f0e9] rounded-lg py-2"
                >
                  TODOS OS CURSOS
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  to="/cursos"
                  search={{ categoria: "formacao-teologica" }}
                  className="cursor-pointer font-bold uppercase text-[11px] tracking-wider text-[#1c1917] hover:text-[#ff3403] hover:bg-[#f3f0e9] rounded-lg py-2"
                >
                  FORMAÇÃO TEOLÓGICA
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  to="/cursos"
                  search={{ categoria: "formacao-ministerial" }}
                  className="cursor-pointer font-bold uppercase text-[11px] tracking-wider text-[#1c1917] hover:text-[#ff3403] hover:bg-[#f3f0e9] rounded-lg py-2"
                >
                  FORMAÇÃO MINISTERIAL
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  to="/cursos"
                  search={{ categoria: "cursos-extensao" }}
                  className="cursor-pointer font-bold uppercase text-[11px] tracking-wider text-[#1c1917] hover:text-[#ff3403] hover:bg-[#f3f0e9] rounded-lg py-2"
                >
                  CURSOS DE EXTENSÃO
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Link
            to="/sobre"
            activeProps={{ className: "text-[#ff3403]" }}
            className="text-[#1c1917]/80 hover:text-[#ff3403] transition-colors uppercase text-xs tracking-wider font-bold"
          >
            Sobre
          </Link>
          <Link
            to="/contato"
            activeProps={{ className: "text-[#ff3403]" }}
            className="text-[#1c1917]/80 hover:text-[#ff3403] transition-colors uppercase text-xs tracking-wider font-bold"
          >
            Contato
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <Button asChild size="sm" className="rounded-full bg-[#161922] text-white hover:bg-black font-bold text-xs uppercase tracking-wider px-5">
              <Link to={primaryPanelPath(roles)}>Meu painel</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="rounded-full font-bold text-xs uppercase tracking-wider text-[#1c1917] hover:bg-[#e9e5dc] px-4">
                <Link to="/auth">Entrar</Link>
              </Button>
              <Button asChild size="sm" className="rounded-full bg-[#ff3403] text-white hover:bg-[#e02e00] font-bold text-xs uppercase tracking-wider px-5 shadow-sm hover:shadow transition-all">
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
    <footer className="border-t border-[#232734] bg-[#161922] text-[#f3f0e9]">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-4">
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#ff3403] text-white">
              <BookOpen className="h-5 w-5" />
            </div>
            <div className="font-serif text-2xl font-black text-white tracking-tight">SETE</div>
          </div>
          <p className="text-sm text-[#f3f0e9]/70 max-w-md leading-relaxed font-light">
            Seminário Teológico Esperança — Formação teológica e ministerial de excelência, bíblica e pastoral, preparando vidas para servir o Reino de Deus.
          </p>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#ff3403]/30 bg-[#ff3403]/10 px-3.5 py-1 text-xs font-semibold text-[#ff3403]">
            <span>Educação Teológica & Formação de Líderes</span>
          </div>
        </div>

        <div>
          <h4 className="font-serif text-base font-bold uppercase tracking-wider text-white">Institucional</h4>
          <ul className="mt-4 space-y-2.5 text-sm text-[#f3f0e9]/75">
            <li>
              <Link to="/sobre" className="hover:text-[#ff3403] transition-colors">Sobre o Seminário</Link>
            </li>
            <li>
              <Link to="/cursos" className="hover:text-[#ff3403] transition-colors">Catálogo de Cursos</Link>
            </li>
            <li>
              <Link to="/contato" className="hover:text-[#ff3403] transition-colors">Fale Conosco</Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-serif text-base font-bold uppercase tracking-wider text-white">Área do Aluno</h4>
          <ul className="mt-4 space-y-2.5 text-sm text-[#f3f0e9]/75">
            <li>
              <Link to="/auth" className="hover:text-[#ff3403] transition-colors">Ambiente Virtual / Login</Link>
            </li>
            <li>
              <Link to="/certificado/validar" className="hover:text-[#ff3403] transition-colors">Validar Certificado</Link>
            </li>
            <li>
              <Link to="/auth" search={{ modo: "cadastro" }} className="hover:text-[#ff3403] transition-colors">Inscrições Abertas</Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 py-6 text-center text-xs text-[#f3f0e9]/50">
        © {new Date().getFullYear()} SETE — Seminário Teológico Esperança. Todos os direitos reservados.
      </div>
    </footer>
  );
}
