import { CreateRoomDto } from '@/rooms/application/dtos/create-room.dto';
import { UpdateRoomResponseDto } from '@/rooms/application/dtos/update-room-response.dto';
import { JWT_SECURITY_SCHEME } from '@/config/swagger.config';
import { ErrorResponseDto } from '@/shared/dtos/error-response.dto';
import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

const authError = ApiUnauthorizedResponse({
  description: 'JWT não informado, inválido ou expirado.',
  type: ErrorResponseDto,
});

const tutorError = ApiForbiddenResponse({
  description: 'Acesso permitido apenas a professores autorizados.',
  type: ErrorResponseDto,
});

export const CreateRoomSwaggerDocs = applyDecorators(
  ApiBearerAuth(JWT_SECURITY_SCHEME),
  ApiOperation({ summary: 'Cria uma nova sala' }),
  ApiBody({ type: CreateRoomDto }),
  ApiCreatedResponse({
    description: 'Sala criada com sucesso.',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        tutorId: { type: 'string', format: 'uuid' },
        name: { type: 'string', example: 'Engenharia de Software' },
        courseCode: { type: 'string', example: 'EXA123' },
        roomCode: { type: 'string', example: 'aB7kP2x9' },
        semester: { type: 'string', example: '2026.2' },
        active: { type: 'boolean', example: true },
        createdAt: { type: 'string', format: 'date-time' },
      },
    },
  }),
  ApiBadRequestResponse({ type: ErrorResponseDto }),
  authError,
  tutorError,
);

export const ListRoomsSwaggerDocs = applyDecorators(
  ApiBearerAuth(JWT_SECURITY_SCHEME),
  ApiOperation({
    summary: 'Lista as salas vinculadas ao professor autenticado',
    description: 'Retorna salas não excluídas, ordenadas por criação.',
  }),
  ApiOkResponse({
    description: 'Lista de salas ou array vazio.',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string', example: 'Engenharia de Software' },
          courseCode: { type: 'string', example: 'EXA123' },
          semester: { type: 'string', example: '2026.2' },
          active: { type: 'boolean', example: true },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  }),
  authError,
  tutorError,
);

export const GetRoomDetailSwaggerDocs = applyDecorators(
  ApiBearerAuth(JWT_SECURITY_SCHEME),
  ApiOperation({
    summary: 'Consulta os dados de uma sala',
    description: 'Disponível para professores vinculados à sala.',
  }),
  ApiOkResponse({
    description: 'Dados completos da sala.',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        tutorId: { type: 'string', format: 'uuid' },
        name: { type: 'string', example: 'Engenharia de Software' },
        courseCode: { type: 'string', example: 'EXA123' },
        roomCode: { type: 'string', example: 'aB7kP2x9' },
        semester: { type: 'string', example: '2026.2' },
        active: { type: 'boolean', example: true },
        createdAt: { type: 'string', format: 'date-time' },
      },
    },
  }),
  ApiBadRequestResponse({ description: 'ID inválido.', type: ErrorResponseDto }),
  ApiNotFoundResponse({ description: 'Sala inexistente ou excluída.', type: ErrorResponseDto }),
  authError,
  tutorError,
);

export const EditRoomSwaggerDocs = applyDecorators(
  ApiBearerAuth(JWT_SECURITY_SCHEME),
  ApiOperation({ summary: 'Atualiza os dados de uma sala' }),
  ApiOkResponse({ description: 'Sala atualizada.', type: UpdateRoomResponseDto }),
  ApiBadRequestResponse({ type: ErrorResponseDto }),
  ApiNotFoundResponse({ description: 'Sala não encontrada.', type: ErrorResponseDto }),
  authError,
  tutorError,
);

export const DeleteRoomSwaggerDocs = applyDecorators(
  ApiBearerAuth(JWT_SECURITY_SCHEME),
  ApiOperation({ summary: 'Exclui logicamente uma sala' }),
  ApiNoContentResponse({ description: 'Sala excluída com sucesso.' }),
  ApiBadRequestResponse({ type: ErrorResponseDto }),
  ApiNotFoundResponse({
    description: 'Sala não encontrada ou já excluída.',
    type: ErrorResponseDto,
  }),
  authError,
  tutorError,
);
