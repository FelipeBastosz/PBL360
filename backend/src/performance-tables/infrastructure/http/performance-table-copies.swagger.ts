import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { JWT_SECURITY_SCHEME } from '@/config/swagger.config';
import { ErrorResponseDto } from '@/shared/dtos/error-response.dto';
import { CopyPerformanceTableDto } from '../../application/dtos/copy-performance-table.dto';
import { PerformanceTableResponseDto } from '../../application/dtos/performance-table-response.dto';

export const CopyPerformanceTableSwaggerDocs = applyDecorators(
  ApiBearerAuth(JWT_SECURITY_SCHEME),
  ApiOperation({
    summary: 'Cria uma cópia editável de uma tabela padrão do sistema.',
    description:
      'A cópia recebe novos identificadores e pertence ao professor ou à turma informada. O padrão original permanece inalterado.',
  }),
  ApiBody({ type: CopyPerformanceTableDto }),
  ApiCreatedResponse({ type: PerformanceTableResponseDto }),
  ApiBadRequestResponse({
    description: 'Nome ou identificadores inválidos.',
    type: ErrorResponseDto,
  }),
  ApiUnauthorizedResponse({ type: ErrorResponseDto }),
  ApiForbiddenResponse({
    description: 'Somente professores com acesso à turma podem copiar.',
    type: ErrorResponseDto,
  }),
  ApiNotFoundResponse({ description: 'Tabela não encontrada.', type: ErrorResponseDto }),
  ApiUnprocessableEntityResponse({
    description: 'A tabela de origem não é um padrão do sistema.',
    type: ErrorResponseDto,
  }),
);
