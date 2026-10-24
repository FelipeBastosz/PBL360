import {
  ArgumentsHost,
  Catch,
  InternalServerErrorException,
  type ExceptionFilter,
} from '@nestjs/common';
import type { Response } from 'express';
import { ReportGenerationError } from '../../application/errors/report-generation.error';

@Catch(ReportGenerationError)
export class ReportGenerationFilter implements ExceptionFilter<ReportGenerationError> {
  catch(error: ReportGenerationError, host: ArgumentsHost): void {
    const exception = new InternalServerErrorException(error.message);
    host.switchToHttp().getResponse<Response>().status(500).json(exception.getResponse());
  }
}
