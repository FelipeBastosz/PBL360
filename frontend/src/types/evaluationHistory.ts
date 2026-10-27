export type EvaluationAdjustmentSituation = 'SEM_AJUSTE' | 'AJUSTADA';

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
};

export type SessionEvaluationHistoryResponse = {
  alunos: StudentEvaluationHistoryItem[];
};
