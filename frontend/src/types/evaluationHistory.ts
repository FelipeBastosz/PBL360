export type EvaluationAdjustmentSituation = 'SEM_AJUSTE' | 'AJUSTADA';

export type EvaluationHistoryOrigin = 'AUTOAVALIACAO' | 'PARES' | 'PLANNING_POKER';

export type StudentEvaluationHistoryItem = {
  alunoId: string;
  nome: string;
  matricula: string | null;
  notaAluno: number | null;
  notaAlunoOriginal: number | null;
  notaTutor: number | null;
  notaPares: number | null;
  avaliacoesPares: number;
  situacaoAjuste: EvaluationAdjustmentSituation;
  origem?: EvaluationHistoryOrigin | null;
};

export type SessionEvaluationHistoryResponse = {
  alunos: StudentEvaluationHistoryItem[];
};

export type HistoryAdjustment = {
  valorAnterior: number;
  valorNovo: number;
  justificativa: string;
  autor: { id: string; nome: string };
  ajustadoEm: string;
};

export type HistoryPlanningPoker = {
  rodadaId: string;
  numero: number;
  anonimo: boolean;
  media: number | null;
  notaDecidida: number;
  notaVigente: number;
  ajustadaNaMesa: boolean;
  justificativaMesa: string | null;
  decididaEm: string;
  decididaPor: { id: string; nome: string } | null;
  votos: Array<{ avaliadorId: string | null; avaliadorNome: string | null; nota: number }>;
};

export type StudentEvaluationHistoryDetail = {
  aluno: { alunoId: string; nome: string };
  autoavaliacao: {
    status: string;
    enviadaEm: string | null;
    notaConsolidada: number | null;
    itens: Array<{
      criterioId: string;
      nome: string;
      notaAluno: number | null;
      notaTutor: number | null;
    }>;
  };
  pares: Array<{
    avaliadorId: string;
    avaliadorNome: string;
    enviadaEm: string;
    notaConsolidada: number;
  }>;
  planningPoker: HistoryPlanningPoker | null;
  ajustes: HistoryAdjustment[];
};
