import { InvalidRequestError, UnprocessableEntityError } from '@/shared/errors/application.error';
import {
  InvalidEvaluationItemsError,
  InvalidEvaluationJustificationError,
} from '../../domain/errors/invalid-evaluation.error';
import { validateEvaluationRules } from './evaluation-rule-validation';

describe('validateEvaluationRules', () => {
  it('executes a successful validation once', () => {
    const validate = jest.fn<void, []>();

    expect(() => validateEvaluationRules(validate)).not.toThrow();
    expect(validate).toHaveBeenCalledTimes(1);
  });

  it('returns a validated result', () => {
    expect(validateEvaluationRules(() => [1, 2])).toEqual([1, 2]);
  });

  it('translates an item error while preserving its message', () => {
    const message = 'A nota do critério deve estar entre 0 e 10.';

    expect(() =>
      validateEvaluationRules(() => {
        throw new InvalidEvaluationItemsError(message);
      }),
    ).toThrow(new UnprocessableEntityError(message));
    expect(() =>
      validateEvaluationRules(() => {
        throw new InvalidEvaluationItemsError(message);
      }),
    ).toThrow(UnprocessableEntityError);
  });

  it('translates a justification error while preserving its message', () => {
    const message = 'Informe uma justificativa válida.';

    expect(() =>
      validateEvaluationRules(() => {
        throw new InvalidEvaluationJustificationError(message);
      }),
    ).toThrow(new InvalidRequestError(message));
    expect(() =>
      validateEvaluationRules(() => {
        throw new InvalidEvaluationJustificationError(message);
      }),
    ).toThrow(InvalidRequestError);
  });

  it('propagates unexpected errors unchanged', () => {
    const failure = new Error('Unexpected failure');
    let caught: unknown;

    try {
      validateEvaluationRules(() => {
        throw failure;
      });
    } catch (error) {
      caught = error;
    }

    expect(caught).toBe(failure);
  });
});
