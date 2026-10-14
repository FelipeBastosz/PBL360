import type { StudentEvaluationHistoryItem } from '@/types/evaluationHistory';

export function formatScore(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 2 });
}

// The API returns the current (possibly adjusted) score in notaAluno and keeps the
// student's original submission in notaAlunoOriginal only after an adjustment.
export function getStudentScore(item: StudentEvaluationHistoryItem): number | null {
  return item.notaAlunoOriginal ?? item.notaAluno;
}

export function getTutorScore(item: StudentEvaluationHistoryItem): number | null {
  return item.situacaoAjuste === 'AJUSTADA' ? item.notaAluno : null;
}

export function hasSubmitted(item: StudentEvaluationHistoryItem): boolean {
  return item.notaAluno !== null;
}

export function getDisplayName(item: StudentEvaluationHistoryItem, hideNames: boolean): string {
  return hideNames ? item.matricula || 'Sem matrícula' : item.nome;
}

export function getSituationLabel(item: StudentEvaluationHistoryItem): string {
  if (!hasSubmitted(item)) return 'Avaliação pendente';
  return item.situacaoAjuste === 'AJUSTADA' ? 'Ajustada com justificativa' : 'Sem ajuste do tutor';
}
