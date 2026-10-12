import { Evaluation, type EvaluationRevision } from './evaluation.entity';
import { EvaluationStatus } from '../enums/evaluation-status.enum';
import {
  InvalidEvaluationStateError,
  InvalidEvaluationJustificationError,
  InvalidEvaluationItemsError,
} from '../errors/invalid-evaluation.error';

const config = {
  tableId: 'table',
  tableName: 'Tabela',
  frozen: true,
  criteria: [{ id: 'a', name: 'Participação', description: null, weight: 1, orderIndex: 1 }],
};
const now = new Date('2026-10-05T12:00:00Z');
const revision = (overrides: Partial<EvaluationRevision> = {}): EvaluationRevision => ({
  items: [{ criterionId: 'a', score: 8 }],
  submit: true,
  authorId: 'tutor',
  bonus: 5,
  now,
  ...overrides,
});
const draft = (): Evaluation =>
  Object.assign(new Evaluation(), {
    id: 'evaluation',
    status: EvaluationStatus.DRAFT,
    items: [],
    submittedAt: null,
    sessionScore: null,
    appliedBonus: null,
    calculationVersion: null,
  });
const submitted = (): Evaluation =>
  Object.assign(draft(), {
    status: EvaluationStatus.SUBMITTED,
    items: [{ id: 'item', criterionId: 'a', score: 8 }],
    submittedAt: now,
    sessionScore: 7.1,
    appliedBonus: 5,
  });

describe('Evaluation', () => {
  it('keeps an empty draft without calculating a grade', () => {
    const evaluation = draft();
    expect(evaluation.revise(revision({ submit: false, items: [] }), config)).toEqual([]);
    expect(evaluation.status).toBe(EvaluationStatus.DRAFT);
    expect(evaluation.sessionScore).toBeNull();
  });
  it('submits a complete draft and freezes the bonus and submission date', () => {
    const evaluation = draft();
    evaluation.revise(revision(), config);
    expect(evaluation).toMatchObject({
      status: EvaluationStatus.SUBMITTED,
      sessionScore: 7.1,
      appliedBonus: 5,
      submittedAt: now,
    });
  });
  it('rejects incomplete submissions', () => {
    expect(() => draft().revise(revision({ items: [] }), config)).toThrow(
      InvalidEvaluationItemsError,
    );
  });
  it('requires justification when a submitted score changes', () => {
    expect(() =>
      submitted().revise(revision({ items: [{ criterionId: 'a', score: 9 }] }), config),
    ).toThrow(InvalidEvaluationJustificationError);
  });
  it('records old and new scores while preserving the original bonus and date', () => {
    const evaluation = submitted();
    const changes = evaluation.revise(
      revision({
        items: [{ criterionId: 'a', score: 9 }],
        justification: 'Revisão da participação',
        authorId: 'other-tutor',
        bonus: 10,
        now: new Date('2026-10-06'),
      }),
      config,
    );
    expect(changes).toEqual([{ itemId: 'item', previousValue: 8, newValue: 9 }]);
    expect(evaluation).toMatchObject({
      sessionScore: 7.8,
      appliedBonus: 5,
      submittedAt: now,
      updatedBy: 'other-tutor',
    });
  });
  it('does not require justification or create adjustments for an unchanged submission', () => {
    const evaluation = submitted();
    expect(evaluation.revise(revision({ bonus: 10 }), config)).toEqual([]);
    expect(evaluation.sessionScore).toBe(7.1);
  });
  it('rejects returning a submitted evaluation to draft', () => {
    expect(() => submitted().revise(revision({ submit: false }), config)).toThrow(
      InvalidEvaluationStateError,
    );
  });
  it('allows zero weights in drafts but blocks sending', () => {
    const zeroConfig = { ...config, criteria: config.criteria.map((c) => ({ ...c, weight: 0 })) };
    expect(() => draft().revise(revision({ submit: false }), zeroConfig)).not.toThrow();
    expect(() => draft().revise(revision(), zeroConfig)).toThrow(InvalidEvaluationItemsError);
  });
});
