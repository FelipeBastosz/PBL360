export interface SessionColumn {
  id: string;
  rotulo?: string;
  nome?: string;
  name?: string;
  titulo?: string;
  title?: string;
  descricao?: string;
  data?: string;
}

export interface StudentSessionGrade {
  sessaoId: string;
  nota: number | null;
  situacao: 'AVALIADA' | 'PENDENTE' | 'JUSTIFICADA' | 'AUSENTE' | string;
  feedback?: string | null;
  updatedAt?: string | null;
}

export interface StudentGradeRow {
  alunoId: string;
  nome: string;
  matricula: string | null;
  sessoes: StudentSessionGrade[];
  notaFinal: number | null;
}

export interface ProblemGradesResponse {
  sessoes: SessionColumn[];
  alunos: StudentGradeRow[];
  mediaTurma: number | null;
  versoesFormula: { sessao: number | null; problema: number | null };
}
