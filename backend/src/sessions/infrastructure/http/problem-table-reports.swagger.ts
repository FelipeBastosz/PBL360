import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JWT_SECURITY_SCHEME } from '@/config/swagger.config';
import { ErrorResponseDto } from '@/shared/dtos/error-response.dto';
import { ProblemTableReportResponseDto } from '../../application/dtos/problem-table-report.dto';

export const ListProblemTableReportsSwaggerDocs = applyDecorators(
  ApiBearerAuth(JWT_SECURITY_SCHEME),
  ApiParam({ name: 'salaId', description: 'Identificador UUID da sala', format: 'uuid' }),
  ApiParam({ name: 'problemaId', description: 'Identificador UUID do problema', format: 'uuid' }),
  ApiOperation({
    summary: 'Lista os relatórios de mesa consolidados de um problema',
    description:
      'Retorna exclusivamente os anexos da categoria `RELATORIO_MESA` vinculados às sessões do ' +
      'problema na sala informada, ordenados cronologicamente pela data e ordem da sessão ' +
      '(crescente) e, dentro da mesma sessão, pela data de envio (mais recente primeiro) com ' +
      'desempate determinístico pelo identificador do anexo.',
  }),
  ApiOkResponse({
    description: 'Lista consolidada de relatórios de mesa do problema.',
    type: ProblemTableReportResponseDto,
    isArray: true,
  }),
  ApiBadRequestResponse({
    description: 'Identificador de sala ou problema inválido.',
    type: ErrorResponseDto,
  }),
  ApiUnauthorizedResponse({ description: 'JWT ausente ou inválido.', type: ErrorResponseDto }),
  ApiForbiddenResponse({
    description: 'O usuário não é professor vinculado nem aluno matriculado na sala.',
    type: ErrorResponseDto,
  }),
  ApiNotFoundResponse({
    description: 'Sala ou problema não encontrado.',
    type: ErrorResponseDto,
  }),
);
