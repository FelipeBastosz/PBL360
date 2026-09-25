import type { ArgumentsHost } from '@nestjs/common';
import {
  ConflictError,
  ForbiddenError,
  InvalidRequestError,
  NotFoundError,
  UnauthorizedError,
} from '../errors/application.error';
import { DomainError } from '../errors/domain.error';
import { DomainExceptionFilter } from './domain-exception.filter';

class SampleDomainError extends DomainError {}

const hostWith = (status: jest.Mock): ArgumentsHost =>
  ({
    switchToHttp: () => ({ getResponse: () => ({ status }) }),
  }) as unknown as ArgumentsHost;

describe('DomainExceptionFilter', () => {
  let status: jest.Mock;
  let json: jest.Mock;

  beforeEach(() => {
    json = jest.fn();
    status = jest.fn().mockReturnValue({ json });
  });

  it('answers a domain error with 400 and the message in a list', () => {
    new DomainExceptionFilter().catch(new SampleDomainError('Nome inválido.'), hostWith(status));

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      statusCode: 400,
      message: ['Nome inválido.'],
      error: 'Bad Request',
    });
  });

  it.each([
    [new InvalidRequestError('x'), 400, 'Bad Request'],
    [new UnauthorizedError('x'), 401, 'Unauthorized'],
    [new ForbiddenError('x'), 403, 'Forbidden'],
    [new NotFoundError('x'), 404, 'Not Found'],
    [new ConflictError('x'), 409, 'Conflict'],
  ])('maps %p to %i', (error, statusCode, label) => {
    new DomainExceptionFilter().catch(error, hostWith(status));

    expect(status).toHaveBeenCalledWith(statusCode);
    expect(json).toHaveBeenCalledWith({ statusCode, message: 'x', error: label });
  });
});
