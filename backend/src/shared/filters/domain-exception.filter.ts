import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ConflictException,
  ForbiddenException,
  HttpStatus,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
  UnprocessableEntityException,
  HttpException,
  type ExceptionFilter,
} from '@nestjs/common';
import type { Response } from 'express';
import { ReportGenerationError } from '@/report-files/application/errors/report-generation.error';
import {
  ApplicationError,
  ConflictError,
  ForbiddenError,
  InvalidRequestError,
  LockedError,
  NotFoundError,
  UnauthorizedError,
  UnprocessableEntityError,
} from '../errors/application.error';
import { DomainError } from '../errors/domain.error';

type HttpExceptionClass = new (message: string) => HttpException;
type HandledError = DomainError | ApplicationError | ReportGenerationError;

class LockedHttpException extends HttpException {
  constructor(message: string) {
    super(HttpException.createBody(message, 'Locked', HttpStatus.LOCKED), HttpStatus.LOCKED);
  }
}

const HTTP_EXCEPTIONS: [abstract new (message: string) => Error, HttpExceptionClass][] = [
  [InvalidRequestError, BadRequestException],
  [UnauthorizedError, UnauthorizedException],
  [ForbiddenError, ForbiddenException],
  [NotFoundError, NotFoundException],
  [ConflictError, ConflictException],
  [UnprocessableEntityError, UnprocessableEntityException],
  [LockedError, LockedHttpException],
  [ReportGenerationError, InternalServerErrorException],
];

export const toHttpException = (error: HandledError): HttpException => {
  if (error instanceof DomainError) {
    return new BadRequestException([error.message]);
  }

  const match = HTTP_EXCEPTIONS.find(([errorClass]) => error instanceof errorClass);
  const HttpExceptionClass = match?.[1] ?? BadRequestException;

  const exception = new HttpExceptionClass(error.message);
  if (error instanceof ConflictError && error.details) {
    const response = exception.getResponse();
    if (typeof response === 'object' && response !== null) {
      Object.assign(response, error.details);
    }
  }
  return exception;
};

@Catch(DomainError, ApplicationError, ReportGenerationError)
export class DomainExceptionFilter implements ExceptionFilter<HandledError> {
  catch(error: HandledError, host: ArgumentsHost): void {
    const exception = toHttpException(error);

    host
      .switchToHttp()
      .getResponse<Response>()
      .status(exception.getStatus())
      .json(exception.getResponse());
  }
}
