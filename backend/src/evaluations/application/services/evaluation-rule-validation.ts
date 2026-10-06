import { InvalidRequestError, UnprocessableEntityError } from '@/shared/errors/application.error';
import {
  InvalidEvaluationItemsError,
  InvalidEvaluationJustificationError,
} from '../../domain/errors/invalid-evaluation.error';

export function validateEvaluationRules<T>(validate: () => T): T {
  try {
    return validate();
  } catch (error) {
    if (error instanceof InvalidEvaluationItemsError) {
      throw new UnprocessableEntityError(error.message);
    }

    if (error instanceof InvalidEvaluationJustificationError) {
      throw new InvalidRequestError(error.message);
    }

    throw error;
  }
}
