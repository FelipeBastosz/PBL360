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

import { JWT_SECURITY_SCHEME } from '@/config/swagger.config';
import { ErrorResponseDto } from '@/shared/dtos/error-response.dto';

import { CreateRoomDto } from '../../application/dtos/create-room.dto';
import { RoomResponseDto } from '../../application/dtos/room-response.dto';
import { UpdateRoomDto } from '../../application/dtos/update-room.dto';

const UNAUTHORIZED = ApiUnauthorizedResponse({
  description: 'JWT não informado, inválido ou expirado.',
  type: ErrorResponseDto,
});

const INVALID_ID = ApiBadRequestResponse({
  description: 'Dados inválidos ou identificador que não é um UUID.',
  type: ErrorResponseDto,
});

const ROOM_NOT_FOUND = ApiNotFoundResponse({
  description: 'Sala não encontrada ou já excluída.',
  type: ErrorResponseDto,
});

export const ListRoomsSwaggerDocs = applyDecorators(
  ApiBearerAuth(JWT_SECURITY_SCHEME),
  ApiOperation({
    summary: 'Lista as salas vinculadas ao professor autenticado',
    description: 'Retorna as salas não excluídas vinculadas ao professor, ordenadas por criação.',
  }),
  ApiOkResponse({
    description: 'Salas do professor. Retorna uma lista vazia quando não houver salas.',
    type: RoomResponseDto,
    isArray: true,
  }),
  UNAUTHORIZED,
  ApiForbiddenResponse({
    description: 'Apenas professores podem consultar suas salas.',
    type: ErrorResponseDto,
  }),
);

export const GetRoomDetailSwaggerDocs = applyDecorators(
  ApiBearerAuth(JWT_SECURITY_SCHEME),
  ApiOperation({
    summary: 'Consulta os dados de uma sala',
    description: 'Disponível para qualquer professor vinculado à sala.',
  }),
  ApiOkResponse({ description: 'Dados completos da sala.', type: RoomResponseDto }),
  INVALID_ID,
  UNAUTHORIZED,
  ApiForbiddenResponse({
    description: 'O professor não está vinculado à sala.',
    type: ErrorResponseDto,
  }),
  ROOM_NOT_FOUND,
);

export const CreateRoomSwaggerDocs = applyDecorators(
  ApiBearerAuth(JWT_SECURITY_SCHEME),
  ApiOperation({
    summary: 'Cria uma nova sala',
    description:
      'Cria uma sala tendo o professor autenticado como responsável. ' +
      'O código de ingresso da sala é gerado automaticamente.',
  }),
  ApiBody({ type: CreateRoomDto }),
  ApiCreatedResponse({ description: 'Sala criada com sucesso.', type: RoomResponseDto }),
  ApiBadRequestResponse({
    description: 'Dados inválidos fornecidos para a criação.',
    type: ErrorResponseDto,
  }),
  UNAUTHORIZED,
  ApiForbiddenResponse({
    description: 'Apenas professores podem criar salas.',
    type: ErrorResponseDto,
  }),
);

export const EditRoomSwaggerDocs = applyDecorators(
  ApiBearerAuth(JWT_SECURITY_SCHEME),
  ApiOperation({
    summary: 'Atualiza os dados de uma sala',
    description:
      'Atualiza nome, semestre ou situação da sala. Qualquer professor vinculado à sala pode editar.',
  }),
  ApiBody({ type: UpdateRoomDto }),
  ApiOkResponse({ description: 'Sala atualizada com sucesso.', type: RoomResponseDto }),
  INVALID_ID,
  UNAUTHORIZED,
  ApiForbiddenResponse({
    description: 'O professor não está vinculado à sala.',
    type: ErrorResponseDto,
  }),
  ROOM_NOT_FOUND,
);

export const DeleteRoomSwaggerDocs = applyDecorators(
  ApiBearerAuth(JWT_SECURITY_SCHEME),
  ApiOperation({
    summary: 'Exclui uma sala',
    description:
      'Realiza a exclusão lógica da sala. Apenas o professor responsável pode excluí-la.',
  }),
  ApiNoContentResponse({ description: 'Sala excluída com sucesso. Não retorna conteúdo.' }),
  INVALID_ID,
  UNAUTHORIZED,
  ApiForbiddenResponse({
    description: 'Apenas o professor responsável pode excluir esta sala.',
    type: ErrorResponseDto,
  }),
  ROOM_NOT_FOUND,
);
