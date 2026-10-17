import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiProduces,
} from '@nestjs/swagger';
import { ErrorResponseDto } from '@/shared/dtos/error-response.dto';

export const ExportReportFileSwaggerDocs = applyDecorators(
  ApiProduces(
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ),
  ApiOkResponse({
    description: 'O arquivo do relatório em PDF ou XLSX, conforme o formato pedido.',
    schema: { type: 'string', format: 'binary' },
  }),
  ApiBadRequestResponse({
    description: 'O formato informado não é PDF nem XLSX.',
    type: ErrorResponseDto,
  }),
  ApiInternalServerErrorResponse({ description: 'O arquivo do relatório não pôde ser gerado.' }),
);
