import { describe, expect, it } from 'vitest';
import type { StudentEvaluationHistoryItem } from '@/types/evaluationHistory';
import {
  applyAdjustment,
  formatScore,
  getDisplayName,
  getScoreLabel,
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

const notSubmittedItem: StudentEvaluationHistoryItem = {
  ...baseItem,
  notaAluno: null,
  notaPares: null,
};

const peerOnlyItem: StudentEvaluationHistoryItem = {
  ...baseItem,
  notaAluno: null,
  notaPares: 8,
};

describe('formatScore', () => {
  it('formats with comma and a single decimal place', () => {
    expect(formatScore(9)).toBe('9,0');
    expect(formatScore(8.25)).toBe('8,3');
  });

  it('returns a dash when there is no score', () => {
    expect(formatScore(null)).toBe('—');
  });
});

describe('student and tutor scores', () => {
  it('shows the tutor evaluation score when there is no adjustment', () => {
    expect(getStudentScore(baseItem)).toBe(9);
    expect(getTutorScore(baseItem)).toBe(7.5);
    expect(getTutorScore({ ...baseItem, notaTutor: null })).toBeNull();
  });

  it('shows the original score as the student score and the current one as the tutor score', () => {
    expect(getStudentScore(adjustedItem)).toBe(9.5);
    expect(getTutorScore(adjustedItem)).toBe(8.5);
  });

  it('shows the peer score when self-assessment was not submitted', () => {
    expect(getStudentScore(peerOnlyItem)).toBe(8);
    expect(hasSubmitted(peerOnlyItem)).toBe(true);
    expect(getSituationLabel(peerOnlyItem)).toBe('Sem ajuste do tutor');
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

describe('planning poker', () => {
  const pokerItem: StudentEvaluationHistoryItem = {
    ...baseItem,
    notaAluno: null,
    notaTutor: null,
    notaPares: 8,
    origem: 'PLANNING_POKER',
  };
  const pokerAdjustedAtTable: StudentEvaluationHistoryItem = {
    ...pokerItem,
    notaAlunoOriginal: 6.5,
    situacaoAjuste: 'AJUSTADA',
  };
  const response = {
    alunoId: 'aluno-1',
    notaOriginal: 8,
    notaVigente: 9,
    ajuste: {
      valorAnterior: 8,
      valorNovo: 9,
      justificativa: 'Revisada pelo tutor.',
      autor: { id: 'tutor-1', nome: 'Tutor' },
      ajustadoEm: '2026-10-15T12:00:00Z',
    },
  };

  it('labels the score column by the origin of the grade', () => {
    expect(getScoreLabel(baseItem)).toBe('Aluno');
    expect(getScoreLabel(peerOnlyItem)).toBe('Pares');
    expect(getScoreLabel(pokerItem)).toBe('Poker');
  });

  it('treats a decided poker grade as submitted', () => {
    expect(hasSubmitted(pokerItem)).toBe(true);
    expect(getSituationLabel(pokerItem)).toBe('Sem ajuste do tutor');
    expect(getStudentScore(pokerItem)).toBe(8);
  });

  it('keeps the vote average as reference after a new adjustment', () => {
    const [updated] = applyAdjustment([pokerAdjustedAtTable], response);

    expect(updated).toMatchObject({ notaAlunoOriginal: 6.5, notaPares: 9 });
    expect(getTutorScore(updated!)).toBe(9);
  });

  it('uses the decided grade as reference on the first adjustment', () => {
    const [updated] = applyAdjustment([pokerItem], response);

    expect(updated).toMatchObject({ notaAlunoOriginal: 8, notaPares: 9 });
    expect(getSituationLabel(updated!)).toBe('Ajustada com justificativa');
  });

  it('describes a grade given only by the tutor as evaluated', () => {
    const tutorOnly: StudentEvaluationHistoryItem = {
      ...notSubmittedItem,
      notaTutor: 9,
      origem: 'TUTOR',
    };

    expect(getSituationLabel(tutorOnly)).toBe('Avaliada pelo tutor');
    expect(hasSubmitted(tutorOnly)).toBe(false);
    expect(getTutorScore(tutorOnly)).toBe(9);
  });
});
