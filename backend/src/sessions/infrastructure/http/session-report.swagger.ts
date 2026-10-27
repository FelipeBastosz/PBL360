import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiProduces,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JWT_SECURITY_SCHEME } from '@/config/swagger.config';
import { ErrorResponseDto } from '@/shared/dtos/error-response.dto';

export const ExportSessionReportSwaggerDocs = applyDecorators(
  ApiOperation({
    summary: 'Exporta o relatório da sessão em PDF ou Excel',
    description:
      'Gera um arquivo para download nos formatos PDF ou XLSX com os dados registrados na sessão ' +
      'escolhida pelo professor: chamada, papéis, notas adicionais de papel, marcações, notas ' +
      'e feedbacks dos alunos matriculados.',
  }),
  ApiProduces(
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ),
  ApiOkResponse({
    description: 'O arquivo do relatório da sessão no formato escolhido (PDF ou XLSX).',
    schema: { type: 'string', format: 'binary' },
  }),
  ApiBadRequestResponse({
    description: 'O formato informado não é PDF nem XLSX, ou o identificador da sessão é inválido.',
    type: ErrorResponseDto,
  }),
  ApiUnauthorizedResponse({
    description: 'JWT não informado, inválido ou expirado.',
    type: ErrorResponseDto,
  }),
  ApiForbiddenResponse({
    description: 'O professor não tem permissão para acessar esta sala.',
    type: ErrorResponseDto,
  }),
  ApiNotFoundResponse({
    description: 'Sessão não encontrada.',
    type: ErrorResponseDto,
  }),
  ApiInternalServerErrorResponse({
    description: 'Não foi possível gerar o arquivo do relatório.',
    type: ErrorResponseDto,
  }),
  ApiBearerAuth(JWT_SECURITY_SCHEME),
);
