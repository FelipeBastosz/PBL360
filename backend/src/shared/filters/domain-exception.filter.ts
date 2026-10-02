import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
  UnprocessableEntityException,
  type ExceptionFilter,
  type HttpException,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  ApplicationError,
  ConflictError,
  ForbiddenError,
  InvalidRequestError,
  NotFoundError,
  UnauthorizedError,
  UnprocessableEntityError,
} from '../errors/application.error';
import { DomainError } from '../errors/domain.error';

type HttpExceptionClass = new (message: string) => HttpException;

const HTTP_EXCEPTIONS: [abstract new (message: string) => Error, HttpExceptionClass][] = [
  [InvalidRequestError, BadRequestException],
  [UnauthorizedError, UnauthorizedException],
  [ForbiddenError, ForbiddenException],
  [NotFoundError, NotFoundException],
  [ConflictError, ConflictException],
  [UnprocessableEntityError, UnprocessableEntityException],
];

export const toHttpException = (error: DomainError | ApplicationError): HttpException => {
  if (error instanceof DomainError) {
    return new BadRequestException([error.message]);
  }

  const match = HTTP_EXCEPTIONS.find(([errorClass]) => error instanceof errorClass);
  const HttpExceptionClass = match?.[1] ?? BadRequestException;

  return new HttpExceptionClass(error.message);
};

@Catch(DomainError, ApplicationError)
export class DomainExceptionFilter implements ExceptionFilter<DomainError | ApplicationError> {
  catch(error: DomainError | ApplicationError, host: ArgumentsHost): void {
    const exception = toHttpException(error);

    host
      .switchToHttp()
      .getResponse<Response>()
      .status(exception.getStatus())
      .json(exception.getResponse());
  }
}
