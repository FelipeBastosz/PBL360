import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JWT_SECURITY_SCHEME } from '@/config/swagger.config';
import { ReportFileFormat } from '@/report-files/domain/report-document';
import { ExportReportFileSwaggerDocs } from '@/report-files/infrastructure/http/report-file.swagger';
import { ErrorResponseDto } from '@/shared/dtos/error-response.dto';

export const ExportClassFinalReportSwaggerDocs = applyDecorators(
  ApiBearerAuth(JWT_SECURITY_SCHEME),
  ApiOperation({
    summary: 'Exporta o relatório final da turma em PDF ou Excel',
    description:
      'Usa a mesma consolidação de GET /salas/{salaId}/relatorio-final, com notas por problema, ' +
      'média geral e situação completa, parcial ou pendente. Disponível ao responsável e aos ' +
      'co-tutores vinculados à sala. A matrícula é texto e notas ausentes não são convertidas em zero.',
  }),
  ApiParam({ name: 'salaId', format: 'uuid', description: 'Identificador da sala.' }),
  ApiQuery({ name: 'formato', required: true, enum: ReportFileFormat }),
  ExportReportFileSwaggerDocs,
  ApiUnauthorizedResponse({
    description: 'Autenticação ausente ou inválida.',
    type: ErrorResponseDto,
  }),
  ApiForbiddenResponse({
    description: 'Sem permissão para acessar a sala.',
    type: ErrorResponseDto,
  }),
  ApiNotFoundResponse({ description: 'Sala não encontrada.', type: ErrorResponseDto }),
);
