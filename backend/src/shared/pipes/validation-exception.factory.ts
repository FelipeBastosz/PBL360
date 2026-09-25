import { BadRequestException } from '@nestjs/common';
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

export const validationExceptionFactory = (errors: ValidationError[]): BadRequestException =>
  new BadRequestException(errors.flatMap((error) => messagesOf(error)));
