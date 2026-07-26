export type Situacao = "usuario" | "aluno" | "formado";

export interface MatriculaLike {
  status?: string | null;
}

/**
 * Terminologia oficial do SETE:
 * - Usuário: conta cadastrada, sem nenhuma matrícula
 * - Aluno: possui ao menos uma matrícula ainda não concluída
 * - Formado: concluiu todos os cursos em que se matriculou
 */
export function classificarSituacao(matriculas: MatriculaLike[] | undefined | null): Situacao {
  const list = matriculas ?? [];
  if (list.length === 0) return "usuario";
  const todasConcluidas = list.every((m) => m.status === "concluida");
  return todasConcluidas ? "formado" : "aluno";
}

export const SITUACAO_LABEL: Record<Situacao, string> = {
  usuario: "Usuário",
  aluno: "Aluno",
  formado: "Formado",
};

export const SITUACAO_CLASS: Record<Situacao, string> = {
  usuario: "bg-slate-500 text-white hover:bg-slate-500",
  aluno: "bg-emerald-600 text-white hover:bg-emerald-600",
  formado: "bg-indigo-600 text-white hover:bg-indigo-600",
};
