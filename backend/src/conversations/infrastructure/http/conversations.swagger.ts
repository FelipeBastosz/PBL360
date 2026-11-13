import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JWT_SECURITY_SCHEME } from '@/config/swagger.config';
import { ErrorResponseDto } from '@/shared/dtos/error-response.dto';
import { ConversationResponseDto } from '../../application/dtos/conversation-response.dto';
import {
  MessageResponseDto,
  MessagesListResponseDto,
} from '../../application/dtos/message-response.dto';

export const ListRoomConversationsSwaggerDocs = applyDecorators(
  ApiBearerAuth(JWT_SECURITY_SCHEME),
  ApiOperation({
    summary: 'Lista as conversas do usuário na sala',
    description:
      'Retorna todas as conversas em que o usuário autenticado participa na sala informada, ordenadas pela mensagem mais recente.',
  }),
  ApiOkResponse({ type: ConversationResponseDto, isArray: true }),
  ApiBadRequestResponse({ description: 'Identificador inválido.', type: ErrorResponseDto }),
  ApiUnauthorizedResponse({
    description: 'JWT não informado ou inválido.',
    type: ErrorResponseDto,
  }),
  ApiForbiddenResponse({
    description: 'Usuário não possui vínculo com a sala.',
    type: ErrorResponseDto,
  }),
  ApiNotFoundResponse({ description: 'Sala não encontrada.', type: ErrorResponseDto }),
);

export const CreateConversationSwaggerDocs = applyDecorators(
  ApiBearerAuth(JWT_SECURITY_SCHEME),
  ApiOperation({
    summary: 'Inicia ou recupera uma conversa entre professor e aluno',
    description:
      'Cria uma nova conversa (201) ou retorna a conversa existente (200) entre o professor e o aluno na mesma sala.',
  }),
  ApiCreatedResponse({
    description: 'Conversa criada com sucesso.',
    type: ConversationResponseDto,
  }),
  ApiOkResponse({
    description: 'Conversa existente recuperada com sucesso.',
    type: ConversationResponseDto,
  }),
  ApiBadRequestResponse({
    description: 'Dados inválidos, tentativa de conversar consigo mesmo ou par não permitido.',
    type: ErrorResponseDto,
  }),
  ApiUnauthorizedResponse({
    description: 'JWT não informado ou inválido.',
    type: ErrorResponseDto,
  }),
  ApiForbiddenResponse({
    description: 'Usuário ou destinatário sem vínculo com a sala.',
    type: ErrorResponseDto,
  }),
  ApiNotFoundResponse({
    description: 'Sala ou destinatário não encontrado.',
    type: ErrorResponseDto,
  }),
);

export const ListConversationMessagesSwaggerDocs = applyDecorators(
  ApiBearerAuth(JWT_SECURITY_SCHEME),
  ApiOperation({
    summary: 'Lista as mensagens de uma conversa',
    description:
      'Retorna mensagens ordenadas cronologicamente (antigas para recentes). Permite paginação para o passado via cursor e polling via parâmetro apos.',
  }),
  ApiOkResponse({ type: MessagesListResponseDto }),
  ApiBadRequestResponse({
    description: 'Parâmetros de consulta inválidos.',
    type: ErrorResponseDto,
  }),
  ApiUnauthorizedResponse({
    description: 'JWT não informado ou inválido.',
    type: ErrorResponseDto,
  }),
  ApiForbiddenResponse({
    description: 'Usuário não é participante da conversa ou perdeu o vínculo com a sala.',
    type: ErrorResponseDto,
  }),
  ApiNotFoundResponse({ description: 'Conversa não encontrada.', type: ErrorResponseDto }),
);

export const SendMessageSwaggerDocs = applyDecorators(
  ApiBearerAuth(JWT_SECURITY_SCHEME),
  ApiOperation({
    summary: 'Envia uma mensagem na conversa',
    description:
      'Grava uma nova mensagem textual (1 a 2000 caracteres) enviada pelo usuário autenticado.',
  }),
  ApiCreatedResponse({
    description: 'Mensagem enviada com sucesso.',
    type: MessageResponseDto,
  }),
  ApiBadRequestResponse({
    description: 'Mensagem vazia ou que exceda 2000 caracteres.',
    type: ErrorResponseDto,
  }),
  ApiUnauthorizedResponse({
    description: 'JWT não informado ou inválido.',
    type: ErrorResponseDto,
  }),
  ApiForbiddenResponse({
    description: 'Usuário não participante, sem vínculo ou sala desativada.',
    type: ErrorResponseDto,
  }),
  ApiNotFoundResponse({ description: 'Conversa não encontrada.', type: ErrorResponseDto }),
);
