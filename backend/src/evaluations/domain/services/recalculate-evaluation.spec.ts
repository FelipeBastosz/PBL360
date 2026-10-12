import { Evaluation } from '../entities/evaluation.entity';
import { EvaluationStatus } from '../enums/evaluation-status.enum';
import type { SessionEvaluationConfig } from '../entities/session-evaluation-config.entity';
import { recalculateEvaluation } from './recalculate-evaluation';

describe('recalculateEvaluation', () => {
  const config: SessionEvaluationConfig = {
    tableId: 'table',
    tableName: 'Barema',
    frozen: true,
    criteria: [
      { id: 'a', name: 'A', description: null, orderIndex: 1, weight: 8, maxScore: 10 },
      { id: 'b', name: 'B', description: null, orderIndex: 2, weight: 2, maxScore: 10 },
    ],
  };

  function evaluation(): Evaluation {
    return Object.assign(new Evaluation(), {
      status: EvaluationStatus.SUBMITTED,
      appliedBonus: null,
      sessionScore: 7,
      submittedAt: new Date('2026-10-01T12:00:00Z'),
      updatedBy: 'original-author',
      items: [
        { id: 'item-a', criterionId: 'a', score: 8 },
        { id: 'item-b', criterionId: 'b', score: 6 },
      ],
    });
  }

  it('recalculates with current weights without changing scores, submission time or author', () => {
    const current = evaluation();
    const previousItems = structuredClone(current.items);
    expect(recalculateEvaluation(current, config)?.sessionScore).toBe(7.6);
    expect(current.items).toEqual(previousItems);
    expect(current.submittedAt).toEqual(new Date('2026-10-01T12:00:00Z'));
    expect(current.updatedBy).toBe('original-author');
  });

  it('preserves the role bonus applied at submission', () => {
    const current = evaluation();
    current.appliedBonus = 0.8;
    expect(recalculateEvaluation(current, config)?.sessionScore).toBe(7.72);
  });

  it('does not calculate drafts or missing evaluations', () => {
    const draft = evaluation();
    draft.status = EvaluationStatus.DRAFT;
    draft.sessionScore = null;
    expect(recalculateEvaluation(draft, config)?.sessionScore).toBeNull();
    expect(recalculateEvaluation(null, config)).toBeNull();
  });

  it('keeps the recorded student result when new criteria receive all the weight', () => {
    const current = evaluation();
    const historical = {
      ...config,
      criteria: config.criteria.map((criterion) => ({ ...criterion, weight: 0 })),
    };
    expect(recalculateEvaluation(current, historical, false)?.sessionScore).toBe(7);
  });
});
