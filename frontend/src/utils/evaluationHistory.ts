import type { SelfAssessmentAdjustmentResponse } from '@/types/evaluation';
import type { StudentEvaluationHistoryItem } from '@/types/evaluationHistory';
import { formatGrade } from './formatGrade';

export const formatScore = formatGrade;

// The API returns the current (possibly adjusted) score in notaAluno and keeps the
// student's original submission in notaAlunoOriginal only after an adjustment.
// When self-assessment is not submitted, falls back to the peer evaluation grade.
export function getStudentScore(item: StudentEvaluationHistoryItem): number | null {
  return item.notaAlunoOriginal ?? item.notaAluno ?? item.notaPares;
}

// The tutor column shows the adjusted self/peer assessment when there is one, otherwise the
// grade from the tutor's own evaluation of the student.
export function getTutorScore(item: StudentEvaluationHistoryItem): number | null {
  if (item.situacaoAjuste === 'AJUSTADA') {
    return item.notaAluno ?? item.notaPares;
  }
  return item.notaTutor;
}

export function hasSubmitted(item: StudentEvaluationHistoryItem): boolean {
  return item.notaAluno !== null || item.notaPares !== null;
}

export function getDisplayName(item: StudentEvaluationHistoryItem, hideNames: boolean): string {
  return hideNames ? item.matricula || 'Sem matrícula' : item.nome;
}

export function getSituationLabel(item: StudentEvaluationHistoryItem): string {
  if (!hasSubmitted(item)) return 'Avaliação pendente';
  return item.situacaoAjuste === 'AJUSTADA' ? 'Ajustada com justificativa' : 'Sem ajuste do tutor';
}

export function applyAdjustment(
  items: StudentEvaluationHistoryItem[],
  response: SelfAssessmentAdjustmentResponse,
): StudentEvaluationHistoryItem[] {
  return items.map((item) =>
    item.alunoId === response.alunoId
      ? {
          ...item,
          notaAluno: item.notaAluno !== null ? response.notaVigente : null,
          notaPares: item.notaAluno === null ? response.notaVigente : item.notaPares,
          notaAlunoOriginal: response.notaOriginal,
          situacaoAjuste: 'AJUSTADA',
        }
      : item,
  );
}
