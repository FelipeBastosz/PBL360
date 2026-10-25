import { BadRequestException, UnprocessableEntityException } from '@nestjs/common';
import type { ValidationError } from 'class-validator';

const WHITELIST_CONSTRAINT = 'whitelistValidation';

const fieldPath = (parent: string, property: string): string =>
  parent ? `${parent}.${property}` : property;

const messagesOf = (error: ValidationError, parent = ''): string[] => {
  const path = fieldPath(parent, error.property);
  const own = Object.entries(error.constraints ?? {}).map(([constraint, message]) =>
    constraint === WHITELIST_CONSTRAINT ? `O campo "${path}" não é permitido.` : message,
  );
  const nested = (error.children ?? []).flatMap((child) => messagesOf(child, path));

  return [...own, ...nested];
};

function hasFinalFormulaWeightError(
  errors: ValidationError[],
  insideSessionWeights = false,
): boolean {
  return errors.some((error) => {
    const isNumericWeightRangeError =
      insideSessionWeights &&
      error.property === 'peso' &&
      !error.constraints?.isNumber &&
      Boolean(error.constraints?.min || error.constraints?.max);
    return (
      isNumericWeightRangeError ||
      hasFinalFormulaWeightError(
        error.children ?? [],
        insideSessionWeights || error.property === 'sessoes',
      )
    );
  });
}

export const validationExceptionFactory = (errors: ValidationError[]) => {
  const messages = errors.flatMap((error) => messagesOf(error));
  return hasFinalFormulaWeightError(errors)
    ? new UnprocessableEntityException(messages)
    : new BadRequestException(messages);
};
