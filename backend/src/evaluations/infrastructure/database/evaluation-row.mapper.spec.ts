import { Evaluation } from '../../domain/entities/evaluation.entity';
import { EvaluationStatus } from '../../domain/enums/evaluation-status.enum';
import { toEvaluation, type EvaluationRow } from './evaluation-row.mapper';

describe('toEvaluation', () => {
  const row: EvaluationRow = {
    id: 'e1',
    status: EvaluationStatus.DRAFT,
    submittedAt: null,
    sessionScore: null,
    appliedBonus: '2.5',
    calculationVersion: null,
    createdBy: 'u1',
    createdAt: new Date('2025-01-01T00:00:00Z'),
    updatedBy: null,
    updatedAt: new Date('2025-01-02T00:00:00Z'),
  };

  it('maps nullable and numeric scores and items into an entity', () => {
    const evaluation = toEvaluation({ ...row, sessionScore: '8.75' }, [
      { id: 'i1', evaluationId: 'e1', criterionId: 'c1', score: '4.25' } as never,
    ]);
    expect(evaluation).toBeInstanceOf(Evaluation);
    expect(evaluation).toMatchObject({
      sessionScore: 8.75,
      appliedBonus: 2.5,
      items: [{ score: 4.25 }],
    });
  });

  it('preserves null scores', () => {
    expect(toEvaluation(row, [])).toMatchObject({
      sessionScore: null,
      appliedBonus: 2.5,
      items: [],
    });
  });

  it('preserves a null applied bonus', () => {
    expect(toEvaluation({ ...row, appliedBonus: null }, [])).toMatchObject({ appliedBonus: null });
  });
});
