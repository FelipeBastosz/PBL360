import type { ArgumentsHost } from '@nestjs/common';
import { ReportGenerationError } from '@/report-files/application/errors/report-generation.error';
import {
  ConflictError,
  ForbiddenError,
  InvalidRequestError,
  NotFoundError,
  UnauthorizedError,
  UnprocessableEntityError,
  LockedError,
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
    [new UnprocessableEntityError('x'), 422, 'Unprocessable Entity'],
    [new LockedError('x'), 423, 'Locked'],
  ])('maps %p to %i', (error, statusCode, label) => {
    new DomainExceptionFilter().catch(error, hostWith(status));

    expect(status).toHaveBeenCalledWith(statusCode);
    expect(json).toHaveBeenCalledWith({ statusCode, message: 'x', error: label });
  });

  it('answers report generation failures with 500 without exposing the cause', () => {
    const error = new ReportGenerationError(new Error('Internal renderer details'));

    new DomainExceptionFilter().catch(error, hostWith(status));

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      statusCode: 500,
      message: 'Não foi possível gerar o arquivo do relatório.',
      error: 'Internal Server Error',
    });
  });

  it('includes structured deletion details in the 409 response', () => {
    const details = { feedbacks: 3, avaliacoes: 5, chamada: 12, observacoes: 1 };
    const message = 'A sessão não pode ser excluída pois possui registros vinculados.';
    new DomainExceptionFilter().catch(
      new ConflictError(message, { detalhes: details }),
      hostWith(status),
    );

    expect(status).toHaveBeenCalledWith(409);
    expect(json).toHaveBeenCalledWith({
      statusCode: 409,
      message,
      error: 'Conflict',
      detalhes: details,
    });
  });
});
