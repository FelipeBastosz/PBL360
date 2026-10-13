import { InvalidAdjustmentError } from '../errors/invalid-evaluation.error';
import type { EvaluationAdjustment } from '../entities/grade-adjustment.entity';
import { SelfAssessmentAdjustmentRules } from './self-assessment-adjustment-rules';

const adjustment = (newValue: number): EvaluationAdjustment => ({
  previousValue: 5,
  newValue,
  justification: 'Revisão após conversa com o aluno.',
  authorId: 'tutor',
  authorName: 'Tutor',
  createdAt: new Date('2026-10-12T12:00:00.000Z'),
});

describe('SelfAssessmentAdjustmentRules', () => {
  it('uses the original score while there is no adjustment', () => {
    expect(SelfAssessmentAdjustmentRules.currentScore(7.5, [])).toBe(7.5);
  });

  it('uses the most recent adjustment as the current score', () => {
    expect(SelfAssessmentAdjustmentRules.currentScore(7.5, [adjustment(9), adjustment(6)])).toBe(9);
  });

  it('rejects a new score equal to the current one', () => {
    expect(() => SelfAssessmentAdjustmentRules.assertNewScore(8.25, 8.25)).toThrow(
      InvalidAdjustmentError,
    );
    expect(() => SelfAssessmentAdjustmentRules.assertNewScore(8.25, 8.26)).not.toThrow();
  });

  it.each(['a'.repeat(9), 'a'.repeat(501), '   curta   ', ''])(
    'rejects a justification out of bounds: "%s"',
    (justification) => {
      expect(() => SelfAssessmentAdjustmentRules.assertJustification(justification)).toThrow(
        InvalidAdjustmentError,
      );
    },
  );

  it.each([10, 500])('accepts a justification with %s characters', (length) => {
    expect(() =>
      SelfAssessmentAdjustmentRules.assertJustification(` ${'a'.repeat(length)} `),
    ).not.toThrow();
  });
});
