import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JWT_SECURITY_SCHEME } from '@/config/swagger.config';
import { ErrorResponseDto } from '@/shared/dtos/error-response.dto';
import { SessionDeletionImpactDto } from '../../application/dtos/session-deletion-impact.dto';
import {
  SessionCreatedResponseDto,
  SessionDetailResponseDto,
  SessionResponseDto,
} from '../../application/dtos/session-response.dto';

const secured = ApiBearerAuth(JWT_SECURITY_SCHEME);
const unauthorized = ApiUnauthorizedResponse({
  description: 'JWT não informado, inválido ou expirado.',
  type: ErrorResponseDto,
});
const forbidden = ApiForbiddenResponse({
  description: 'Acesso negado. O professor não possui permissão nesta sala.',
  type: ErrorResponseDto,
});
const notFound = ApiNotFoundResponse({
  description: 'Problema ou sessão não encontrada.',
  type: ErrorResponseDto,
});

export const CreateSessionSwaggerDocs = applyDecorators(
  secured,
  ApiOperation({ summary: 'Cria uma sessão no problema' }),
  ApiCreatedResponse({
    description: 'Sessão criada com sucesso.',
    type: SessionCreatedResponseDto,
  }),
  ApiBadRequestResponse({ description: 'Dados inválidos.', type: ErrorResponseDto }),
  unauthorized,
  forbidden,
  notFound,
);

export const ListSessionsSwaggerDocs = applyDecorators(
  secured,
  ApiOperation({ summary: 'Lista as sessões do problema por data e ordem' }),
  ApiOkResponse({
    description: 'Sessões listadas com sucesso.',
    type: SessionResponseDto,
    isArray: true,
  }),
  unauthorized,
  forbidden,
  notFound,
);

export const GetSessionSwaggerDocs = applyDecorators(
  secured,
  ApiOperation({ summary: 'Obtém os detalhes de uma sessão' }),
  ApiOkResponse({ description: 'Sessão encontrada.', type: SessionDetailResponseDto }),
  unauthorized,
  forbidden,
  notFound,
);

export const UpdateSessionSwaggerDocs = applyDecorators(
  secured,
  ApiOperation({ summary: 'Atualiza uma sessão' }),
  ApiOkResponse({ description: 'Sessão atualizada.', type: SessionDetailResponseDto }),
  ApiBadRequestResponse({ description: 'Dados inválidos.', type: ErrorResponseDto }),
  unauthorized,
  forbidden,
  notFound,
);

export const GetSessionDeletionImpactSwaggerDocs = applyDecorators(
  secured,
  ApiOperation({ summary: 'Consulta o impacto da exclusão de uma sessão' }),
  ApiOkResponse({ description: 'Impacto consultado.', type: SessionDeletionImpactDto }),
  unauthorized,
  forbidden,
  notFound,
);

export const DeleteSessionSwaggerDocs = applyDecorators(
  secured,
  ApiOperation({ summary: 'Exclui uma sessão sem registros vinculados' }),
  ApiNoContentResponse({ description: 'Sessão excluída.' }),
  ApiConflictResponse({
    description: 'A sessão possui registros vinculados.',
    type: ErrorResponseDto,
  }),
  unauthorized,
  forbidden,
  notFound,
);
