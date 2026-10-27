import {
  InvalidEvaluationItemsError,
  InvalidEvaluationJustificationError,
} from '../errors/invalid-evaluation.error';
import { EvaluationRules } from './evaluation-rules';

const criterionIds = ['criterion-1', 'criterion-2'];

describe('EvaluationRules', () => {
  describe('assertValidItems', () => {
    it.each([0, 8.01, 10])(
      'accepts score %s in drafts and submissions with criterion objects',
      (score) => {
        const criteria = [{ id: 'criterion-1' }];
        for (const complete of [false, true]) {
          expect(() =>
            EvaluationRules.assertValidItems(
              [{ criterionId: 'criterion-1', score }],
              criteria,
              complete,
            ),
          ).not.toThrow();
          expect(() =>
            EvaluationRules.assertValidItems(
              [{ criterionId: 'criterion-1', score: 10.01 }],
              criteria,
              complete,
            ),
          ).toThrow('A nota do critério deve estar entre 0 e 10.');
        }
      },
    );

    it.each([0, 8.5, 10])('accepts a score of %s', (score) => {
      expect(() =>
        EvaluationRules.assertValidItems(
          [{ criterionId: 'criterion-1', score }],
          ['criterion-1'],
          true,
        ),
      ).not.toThrow();
    });

    it.each([-0.01, 10.01, NaN, Infinity, -Infinity])('rejects an invalid score of %s', (score) => {
      expect(() =>
        EvaluationRules.assertValidItems(
          [{ criterionId: 'criterion-1', score }],
          criterionIds,
          false,
        ),
      ).toThrow(new InvalidEvaluationItemsError('A nota do critério deve estar entre 0 e 10.'));
    });

    it.each([false, true])(
      'rejects criteria outside the configuration (complete: %s)',
      (requireComplete) => {
        expect(() =>
          EvaluationRules.assertValidItems(
            [{ criterionId: 'foreign-criterion', score: 8 }],
            criterionIds,
            requireComplete,
          ),
        ).toThrow('Um dos critérios não pertence à configuração desta avaliação.');
      },
    );

    it.each([false, true])('rejects repeated criteria (complete: %s)', (requireComplete) => {
      expect(() =>
        EvaluationRules.assertValidItems(
          [
            { criterionId: 'criterion-1', score: 8 },
            { criterionId: 'criterion-1', score: 9 },
          ],
          criterionIds,
          requireComplete,
        ),
      ).toThrow('A avaliação não pode repetir um critério.');
    });

    it('accepts an incomplete draft', () => {
      expect(() =>
        EvaluationRules.assertValidItems(
          [{ criterionId: 'criterion-1', score: 8 }],
          criterionIds,
          false,
        ),
      ).not.toThrow();
    });

    it('accepts an empty draft', () => {
      expect(() => EvaluationRules.assertValidItems([], criterionIds, false)).not.toThrow();
    });

    it('rejects submission when a criterion is missing', () => {
      expect(() =>
        EvaluationRules.assertValidItems(
          [{ criterionId: 'criterion-1', score: 8 }],
          criterionIds,
          true,
        ),
      ).toThrow('Preencha todos os critérios antes de enviar a avaliação.');
    });

    it('rejects submission when no scores were provided', () => {
      expect(() => EvaluationRules.assertValidItems([], criterionIds, true)).toThrow(
        'Preencha todos os critérios antes de enviar a avaliação.',
      );
    });

    it('rejects submission when there are no available criteria', () => {
      expect(() => EvaluationRules.assertValidItems([], [], true)).toThrow(
        'Não é possível enviar uma avaliação sem critérios.',
      );
    });

    it('accepts a complete evaluation regardless of item order and preserves the input', () => {
      const items = Object.freeze([
        Object.freeze({ criterionId: 'criterion-2', score: 7 }),
        Object.freeze({ criterionId: 'criterion-1', score: 0 }),
      ]);
      const allowed = Object.freeze([...criterionIds]);

      expect(() => EvaluationRules.assertValidItems(items, allowed, true)).not.toThrow();
      expect(items).toEqual([
        { criterionId: 'criterion-2', score: 7 },
        { criterionId: 'criterion-1', score: 0 },
      ]);
      expect(allowed).toEqual(criterionIds);
    });
  });

  describe('assertAdjustmentJustification', () => {
    it.each([
      { label: 'missing', value: undefined },
      { label: 'empty', value: '' },
      { label: 'only spaces', value: '          ' },
      { label: 'too short', value: 'a'.repeat(9) },
      { label: 'too long', value: 'a'.repeat(501) },
      { label: 'padded short text', value: '     curta     ' },
    ])('rejects a $label justification', ({ value }) => {
      expect(() => EvaluationRules.assertAdjustmentJustification(value)).toThrow(
        InvalidEvaluationJustificationError,
      );
    });

    it.each([10, 500])('accepts a justification with %s characters', (length) => {
      expect(() => EvaluationRules.assertAdjustmentJustification('a'.repeat(length))).not.toThrow();
    });

    it('accepts a valid justification surrounded by spaces', () => {
      expect(() =>
        EvaluationRules.assertAdjustmentJustification('  Correção após revisão.  '),
      ).not.toThrow();
    });
  });
});
