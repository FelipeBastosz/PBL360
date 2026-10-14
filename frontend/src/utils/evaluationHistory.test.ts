import { describe, expect, it } from 'vitest';
import type { StudentEvaluationHistoryItem } from '@/types/evaluationHistory';
import {
  formatScore,
  getDisplayName,
  getSituationLabel,
  getStudentScore,
  getTutorScore,
  hasSubmitted,
} from './evaluationHistory';

const baseItem: StudentEvaluationHistoryItem = {
  alunoId: 'aluno-1',
  nome: 'Ana Luiza Silva',
  matricula: '26121190',
  notaAluno: 9,
  notaAlunoOriginal: null,
  notaTutor: 7.5,
  notaPares: 8,
  avaliacoesPares: 3,
  situacaoAjuste: 'SEM_AJUSTE',
};

const adjustedItem: StudentEvaluationHistoryItem = {
  ...baseItem,
  notaAluno: 8.5,
  notaAlunoOriginal: 9.5,
  situacaoAjuste: 'AJUSTADA',
};

const notSubmittedItem: StudentEvaluationHistoryItem = { ...baseItem, notaAluno: null };

describe('formatScore', () => {
  it('formats with comma and up to two decimals', () => {
    expect(formatScore(9)).toBe('9,0');
    expect(formatScore(8.25)).toBe('8,25');
  });

  it('returns a dash when there is no score', () => {
    expect(formatScore(null)).toBe('—');
  });
});

describe('student and tutor scores', () => {
  it('shows the submitted score and no tutor score when not adjusted', () => {
    expect(getStudentScore(baseItem)).toBe(9);
    expect(getTutorScore(baseItem)).toBeNull();
  });

  it('shows the original score as the student score and the current one as the tutor score', () => {
    expect(getStudentScore(adjustedItem)).toBe(9.5);
    expect(getTutorScore(adjustedItem)).toBe(8.5);
  });
});

describe('getDisplayName', () => {
  it('shows the name or the registration number', () => {
    expect(getDisplayName(baseItem, false)).toBe('Ana Luiza Silva');
    expect(getDisplayName(baseItem, true)).toBe('26121190');
    expect(getDisplayName({ ...baseItem, matricula: null }, true)).toBe('Sem matrícula');
  });
});

describe('getSituationLabel / hasSubmitted', () => {
  it('describes each situation', () => {
    expect(getSituationLabel(baseItem)).toBe('Sem ajuste do tutor');
    expect(getSituationLabel(adjustedItem)).toBe('Ajustada com justificativa');
    expect(getSituationLabel(notSubmittedItem)).toBe('Avaliação pendente');
  });

  it('tells whether the evaluation was submitted', () => {
    expect(hasSubmitted(baseItem)).toBe(true);
    expect(hasSubmitted(notSubmittedItem)).toBe(false);
  });
});
