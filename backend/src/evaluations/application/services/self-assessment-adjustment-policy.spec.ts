import {
  ConflictError,
  NotFoundError,
  UnprocessableEntityError,
} from '@/shared/errors/application.error';
import type { EvaluationAdjustment } from '../../domain/entities/grade-adjustment.entity';
import { EvaluationStatus } from '../../domain/enums/evaluation-status.enum';
import type { SelfAssessmentAdjustmentHistory } from '../../domain/repositories/self-assessment-adjustment.repository';
import {
  planSelfAssessmentAdjustment,
  summarizeSelfAssessmentAdjustments,
} from './self-assessment-adjustment-policy';

const justification = 'Revisão após conversa com o aluno.';
const adjustment = (previousValue: number, newValue: number): EvaluationAdjustment => ({
  previousValue,
  newValue,
  justification,
  authorId: 'tutor',
  authorName: 'Tutor',
  createdAt: new Date('2026-10-12T12:00:00.000Z'),
});
const history = (
  overrides: Partial<SelfAssessmentAdjustmentHistory> = {},
): SelfAssessmentAdjustmentHistory => ({
  evaluationId: 'evaluation',
  status: EvaluationStatus.SUBMITTED,
  originalScore: 7,
  adjustments: [],
  ...overrides,
});

describe('planSelfAssessmentAdjustment', () => {
  it('rejects a missing self-assessment', () => {
    expect(() => planSelfAssessmentAdjustment(null, 8, justification)).toThrow(NotFoundError);
  });

  it('rejects a self-assessment that was not submitted', () => {
    const draft = history({ status: EvaluationStatus.DRAFT, originalScore: null });
    expect(() => planSelfAssessmentAdjustment(draft, 8, justification)).toThrow(ConflictError);
  });

  it('records the original score as the previous value of the first adjustment', () => {
    expect(planSelfAssessmentAdjustment(history(), 8.5, `  ${justification}  `)).toEqual({
      evaluationId: 'evaluation',
      originalScore: 7,
      previousValue: 7,
      newValue: 8.5,
      justification,
    });
  });

  it('records the current score as the previous value of later adjustments', () => {
    const adjusted = history({ adjustments: [adjustment(8, 9), adjustment(7, 8)] });
    expect(planSelfAssessmentAdjustment(adjusted, 6, justification)).toMatchObject({
      previousValue: 9,
      newValue: 6,
    });
  });

  it('rejects a new score equal to the current one, even after adjustments', () => {
    expect(() => planSelfAssessmentAdjustment(history(), 7, justification)).toThrow(
      UnprocessableEntityError,
    );
    const adjusted = history({ adjustments: [adjustment(7, 9)] });
    expect(() => planSelfAssessmentAdjustment(adjusted, 9, justification)).toThrow(
      UnprocessableEntityError,
    );
    expect(() => planSelfAssessmentAdjustment(adjusted, 7, justification)).not.toThrow();
  });

  it.each(['Curta', 'a'.repeat(501)])('rejects an out-of-bounds justification', (text) => {
    expect(() => planSelfAssessmentAdjustment(history(), 8, text)).toThrow(
      UnprocessableEntityError,
    );
  });
});

describe('summarizeSelfAssessmentAdjustments', () => {
  it('rejects a missing self-assessment', () => {
    expect(() => summarizeSelfAssessmentAdjustments(null)).toThrow(NotFoundError);
  });

  it('rejects a missing peer assessment with peer error message', () => {
    expect(() => summarizeSelfAssessmentAdjustments(null, 'PARES')).toThrow(
      'Avaliação entre pares não encontrada.',
    );
  });

  it('keeps the original score and exposes the latest adjustment as current', () => {
    const adjustments = [adjustment(8, 9), adjustment(7, 8)];
    expect(summarizeSelfAssessmentAdjustments(history({ adjustments }))).toEqual({
      originalScore: 7,
      currentScore: 9,
      adjustments,
    });
  });

  it('reports no scores for a draft', () => {
    const draft = history({ status: EvaluationStatus.DRAFT, originalScore: null });
    expect(summarizeSelfAssessmentAdjustments(draft)).toEqual({
      originalScore: null,
      currentScore: null,
      adjustments: [],
    });
  });
});

describe('peer adjustments planning', () => {
  it('rejects missing and unsubmitted peer evaluations with appropriate messages', () => {
    expect(() => planSelfAssessmentAdjustment(null, 8, justification, 'PARES')).toThrow(
      'Avaliação entre pares não encontrada.',
    );
    const draft = history({ status: EvaluationStatus.DRAFT, originalScore: null, tipo: 'PARES' });
    expect(() => planSelfAssessmentAdjustment(draft, 8, justification)).toThrow(
      'A avaliação entre pares ainda não foi finalizada.',
    );
  });

  it('plans adjustment for poker round', () => {
    const pokerHistory: SelfAssessmentAdjustmentHistory = {
      pokerRoundId: 'poker-round-1',
      status: EvaluationStatus.SUBMITTED,
      originalScore: 8,
      adjustments: [],
      tipo: 'PARES',
    };
    expect(planSelfAssessmentAdjustment(pokerHistory, 9, justification)).toEqual({
      evaluationId: undefined,
      pokerRoundId: 'poker-round-1',
      sessionId: undefined,
      studentId: undefined,
      originalScore: 8,
      previousValue: 8,
      newValue: 9,
      justification,
      tipo: 'PARES',
    });
  });

  it('plans adjustment for peer form', () => {
    const peerHistory: SelfAssessmentAdjustmentHistory = {
      sessionId: 'sess-1',
      studentId: 'stud-1',
      status: EvaluationStatus.SUBMITTED,
      originalScore: 7.5,
      adjustments: [],
      tipo: 'PARES',
    };
    expect(planSelfAssessmentAdjustment(peerHistory, 8.5, justification)).toEqual({
      evaluationId: undefined,
      pokerRoundId: undefined,
      sessionId: 'sess-1',
      studentId: 'stud-1',
      originalScore: 7.5,
      previousValue: 7.5,
      newValue: 8.5,
      justification,
      tipo: 'PARES',
    });
  });
});
