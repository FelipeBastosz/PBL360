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
  ApiForbiddenResponse({
    description:
      'Sem acesso às salas afetadas ou tentativa de alterar um padrão do sistema com TODAS.',
    type: ErrorResponseDto,
  }),
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
      'Sessões de hoje ou anteriores, ou com avaliação do tutor enviada, restringem a edição a pesos. Padrões do sistema são somente leitura; nesse caso, a consulta informa apenas a sessão atual e orienta a criar uma cópia.',
  }),
  ApiOkResponse({ type: SessionTableEditPermissionsDto }),
  ...accessErrors,
);

export const EditSessionTableSwaggerDocs = applyDecorators(
  ApiOperation({
    summary: 'Edita a tabela em uma sessão ou em todas as sessões vinculadas.',
    description:
      'SESSAO cria uma cópia na turma. Para um padrão do sistema, somente SESSAO é permitido, respeitando o histórico da sessão atual. TODAS altera tabelas comuns, inclusive em outras salas autorizadas. Notas são recalculadas na leitura; notas por critério e ajustes são preservados.',
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
      'Pesos, notas máximas ou critérios inválidos. Soma dos pesos igual a 10 e máxima maior que zero e até 10.',
    type: ErrorResponseDto,
  }),
  ...accessErrors,
);
