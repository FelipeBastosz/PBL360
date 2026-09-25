import { JWT_SECURITY_SCHEME } from '@/config/swagger.config';
import { CreateRoomDto } from '@/rooms/application/dtos/create-room.dto';
import { UpdateRoomResponseDto } from '@/rooms/application/dtos/update-room-response.dto';
import { ErrorResponseDto } from '@/shared/dtos/error-response.dto';
import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiNoContentResponse,
  ApiBody,
  ApiCreatedResponse,
} from '@nestjs/swagger';

export const EditRoomSwaggerDocs = applyDecorators(
  ApiBearerAuth(),
  ApiOperation({
    summary: 'Atualiza os dados de uma sala',
    description:
      'Valida as informações enviadas, atualiza a sala correspondente ao ID informado e devolve os dados atualizados.',
  }),
  ApiOkResponse({ description: 'Sala atualizada com sucesso.', type: UpdateRoomResponseDto }),
  ApiBadRequestResponse({
    description: 'Dados inválidos fornecidos para a atualização.',
    type: ErrorResponseDto,
  }),
  ApiUnauthorizedResponse({
    description: 'Não autorizado. JWT não informado, inválido ou expirado.',
    type: ErrorResponseDto,
  }),
  ApiForbiddenResponse({
    description: 'Acesso negado. Apenas usuários com perfil TUTOR podem realizar esta ação.',
    type: ErrorResponseDto,
  }),
  ApiNotFoundResponse({
    description: 'Sala não encontrada pelo ID fornecido.',
    type: ErrorResponseDto,
  }),
);

export const DeleteRoomSwaggerDocs = applyDecorators(
  ApiBearerAuth(),
  ApiOperation({
    summary: 'Exclui uma sala',
    description:
      'Realiza a exclusão lógica da sala correspondente ao ID informado. Valida se o usuário requerente é o professor responsável pela sala.',
  }),
  ApiNoContentResponse({
    description: 'Sala excluída com sucesso (exclusão lógica). Não retorna conteúdo.',
  }),
  ApiBadRequestResponse({
    description: 'Dados inválidos fornecidos para a exclusão (ex: UUID inválido).',
    type: ErrorResponseDto,
  }),
  ApiUnauthorizedResponse({
    description: 'Não autorizado. Token de acesso não informado, inválido ou expirado.',
    type: ErrorResponseDto,
  }),
  ApiForbiddenResponse({
    description: 'Acesso negado. Apenas o professor responsável pode excluir esta sala.',
    type: ErrorResponseDto,
  }),
  ApiNotFoundResponse({
    description: 'Sala não encontrada pelo ID fornecido ou já excluída.',
    type: ErrorResponseDto,
  }),
);

export const ListRoomSwaggerDocs = applyDecorators(
  ApiBearerAuth(JWT_SECURITY_SCHEME),
  ApiOperation({
    summary: 'Lista as salas vinculadas ao professor autenticado',
    description: 'Retorna as salas não excluídas vinculadas ao professor, ordenadas por criação.',
  }),
  ApiOkResponse({
    description: 'Lista de salas do professor. Retorna um array vazio quando não houver salas.',
  }),
  ApiUnauthorizedResponse({
    description: 'JWT não informado, inválido ou expirado.',
    type: ErrorResponseDto,
  }),
  ApiForbiddenResponse({
    description: 'Apenas professores podem consultar suas salas.',
    type: ErrorResponseDto,
  }),
);

export const CreateRoomSwaggerDocs = applyDecorators(
  ApiBearerAuth(JWT_SECURITY_SCHEME),
  ApiOperation({
    summary: 'Cria uma nova sala',
    description:
      'Permite que um professor autenticado crie uma sala. ' +
      'O professor informa o nome, o código da disciplina e o semestre. ',
  }),
  ApiBody({
    description:
      'Dados necessários para criar uma sala. ' +
      'O código da sala é gerado automaticamente pelo sistema.',
    type: CreateRoomDto,
  }),
  ApiCreatedResponse({
    description: 'Sala criada com sucesso.',
    schema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          format: 'uuid',
          description: 'Identificador único da sala.',
          example: '550e8400-e29b-41d4-a716-446655440000',
        },
        tutorId: {
          type: 'string',
          format: 'uuid',
          description: 'Identificador do professor responsável.',
          example: '123e4567-e89b-42d3-a456-426614174000',
        },
        name: {
          type: 'string',
          description: 'Nome da sala.',
          example: 'Engenharia de Software',
        },
        courseCode: {
          type: 'string',
          description: 'Código da disciplina informado pelo professor.',
          example: 'EXA123',
        },
        roomCode: {
          type: 'string',
          description: 'Código de 8 caracteres gerado automaticamente para ingresso na sala.',
          example: 'aB7kP2x9',
        },
        semester: {
          type: 'string',
          description: 'Semestre acadêmico da turma.',
          example: '2026.2',
        },
        active: {
          type: 'boolean',
          description: 'Indica se a sala está ativa.',
          example: true,
        },
        createdAt: {
          type: 'string',
          format: 'date-time',
          description: 'Data e hora de criação da sala.',
        },
      },
    },
  }),
  ApiBadRequestResponse({
    description: 'Dados inválidos fornecidos para a criação.',
    type: ErrorResponseDto,
  }),
  ApiUnauthorizedResponse({
    description: 'JWT não informado, inválido ou expirado.',
    type: ErrorResponseDto,
  }),
  ApiForbiddenResponse({
    description:
      'Acesso negado. Apenas professores podem criar salas. ' +
      'Não é permitido criar uma sala em nome de outro professor.',
    type: ErrorResponseDto,
  }),
);
