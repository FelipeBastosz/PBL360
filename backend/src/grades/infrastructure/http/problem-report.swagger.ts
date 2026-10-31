import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiQuery,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JWT_SECURITY_SCHEME } from '@/config/swagger.config';
import { ErrorResponseDto } from '@/shared/dtos/error-response.dto';
import { ExportReportFileSwaggerDocs } from '@/report-files/infrastructure/http/report-file.swagger';
import { ReportFileFormat } from '@/report-files/domain/report-document';

export const ExportProblemReportSwaggerDocs = applyDecorators(
  ApiBearerAuth(JWT_SECURITY_SCHEME),
  ApiOperation({
    summary: 'Exporta o relatório consolidado do problema em PDF ou Excel',
    description:
      'Gera um arquivo PDF legível ou planilha XLSX com as notas dos alunos nas sessões, ' +
      'nota final do problema, pendências e os feedbacks vinculados (geral, sessões e individuais).',
  }),
  ApiQuery({
    name: 'formato',
    enum: ReportFileFormat,
    description: 'Formato do arquivo para exportação.',
    example: ReportFileFormat.PDF,
  }),
  ApiQuery({
    name: 'ocultarNomes',
    required: false,
    type: Boolean,
    description: 'Se verdadeiro, oculta os nomes dos alunos e exibe apenas as matrículas.',
    example: false,
  }),
  ExportReportFileSwaggerDocs,
  ApiUnauthorizedResponse({ description: 'Sem autenticação.', type: ErrorResponseDto }),
  ApiForbiddenResponse({
    description: 'Sem permissão (usuário não é professor responsável ou co-tutor ativo na sala).',
    type: ErrorResponseDto,
  }),
  ApiNotFoundResponse({
    description: 'Problema inexistente na sala informada.',
    type: ErrorResponseDto,
  }),
);
