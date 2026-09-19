import { ArgumentsHost, Catch, HttpStatus, type ExceptionFilter } from '@nestjs/common';
import type { Response } from 'express';
import { DomainError } from '../errors/domain.error';

@Catch(DomainError)
export class DomainExceptionFilter implements ExceptionFilter<DomainError> {
  catch(exception: DomainError, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();

    response.status(HttpStatus.BAD_REQUEST).json({
      statusCode: HttpStatus.BAD_REQUEST,
      message: [exception.message],
      error: 'Bad Request',
    });
  }
}
