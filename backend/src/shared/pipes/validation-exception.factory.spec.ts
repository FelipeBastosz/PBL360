import type { ValidationError } from 'class-validator';
import { validationExceptionFactory } from './validation-exception.factory';

const errorFor = (
  property: string,
  constraints: Record<string, string>,
  children: ValidationError[] = [],
): ValidationError => ({ property, constraints, children });

describe('validationExceptionFactory', () => {
  it('keeps the messages declared on the DTO', () => {
    const exception = validationExceptionFactory([
      errorFor('nome', { isNotEmpty: 'O nome é obrigatório.' }),
    ]);

    expect(exception.getResponse()).toMatchObject({ message: ['O nome é obrigatório.'] });
  });

  it('translates fields that are not allowed', () => {
    const exception = validationExceptionFactory([
      errorFor('extra', { whitelistValidation: 'property extra should not exist' }),
    ]);

    expect(exception.getResponse()).toMatchObject({
      message: ['O campo "extra" não é permitido.'],
    });
  });

  it('names nested fields by their full path', () => {
    const exception = validationExceptionFactory([
      errorFor('endereco', {}, [errorFor('rua', { whitelistValidation: 'x' })]),
    ]);

    expect(exception.getResponse()).toMatchObject({
      message: ['O campo "endereco.rua" não é permitido.'],
    });
  });
});
