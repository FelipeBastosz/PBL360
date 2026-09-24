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
