import type { ArgumentsHost } from '@nestjs/common';
import type { Response } from 'express';
import { ReportGenerationError } from '../../application/errors/report-generation.error';
import { ReportGenerationFilter } from './report-generation.filter';

describe('ReportGenerationFilter', () => {
  let filter: ReportGenerationFilter;
  let response: { status: jest.Mock; json: jest.Mock };
  let host: ArgumentsHost;

  beforeEach(() => {
    filter = new ReportGenerationFilter();
    response = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    host = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: jest.fn().mockReturnValue(response),
      }),
    } as unknown as ArgumentsHost;
  });

  it('maps ReportGenerationError to 500 response', () => {
    const error = new ReportGenerationError();
    filter.catch(error, host);

    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 500,
        message: 'Não foi possível gerar o arquivo do relatório.',
      }),
    );
  });
});
