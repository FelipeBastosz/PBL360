import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { JWT_SECURITY_SCHEME } from '@/config/swagger.config';
import { ErrorResponseDto } from '@/shared/dtos/error-response.dto';
import { EditSessionTableDto } from '../../application/dtos/edit-session-table.dto';
import {
  SessionTableEditPermissionsDto,
  SessionTableEditResponseDto,
} from '../../application/dtos/session-table-edit-response.dto';

const accessErrors = [
  ApiBearerAuth(JWT_SECURITY_SCHEME),
  ApiUnauthorizedResponse({ description: 'Autenticação necessária.', type: ErrorResponseDto }),
  ApiForbiddenResponse({ description: 'Sem acesso às salas afetadas.', type: ErrorResponseDto }),
  ApiNotFoundResponse({ description: 'Sessão ou tabela não encontrada.', type: ErrorResponseDto }),
  ApiBadRequestResponse({
    description: 'Identificador ou corpo inválido.',
    type: ErrorResponseDto,
  }),
];

export const GetSessionTableEditPermissionsSwaggerDocs = applyDecorators(
  ApiOperation({
    summary: 'Consulta as permissões de edição e as sessões que usam a tabela.',
    description:
      'Sessões de hoje ou anteriores, ou com avaliação do tutor enviada, restringem a edição a pesos.',
  }),
  ApiOkResponse({ type: SessionTableEditPermissionsDto }),
  ...accessErrors,
);

export const EditSessionTableSwaggerDocs = applyDecorators(
  ApiOperation({
    summary: 'Edita a tabela em uma sessão ou em todas as sessões vinculadas.',
    description:
      'SESSAO cria uma cópia na turma. TODAS altera a tabela compartilhada, inclusive em outras salas autorizadas. A nota máxima de cada critério é sempre 10 e não pode ser configurada. Notas são recalculadas na leitura; notas por critério e ajustes são preservados.',
  }),
  ApiBody({ type: EditSessionTableDto }),
  ApiOkResponse({ type: SessionTableEditResponseDto }),
  ApiConflictResponse({
    description:
      'Alteração além de pesos em tabela com sessão que já aconteceu, ou vínculo alterado durante a edição.',
    type: ErrorResponseDto,
  }),
  ApiUnprocessableEntityResponse({
    description:
      'Pesos ou critérios inválidos. Cada peso deve estar entre 0 e 10, e a soma dos pesos deve ser igual a 10.',
    type: ErrorResponseDto,
  }),
  ...accessErrors,
);
