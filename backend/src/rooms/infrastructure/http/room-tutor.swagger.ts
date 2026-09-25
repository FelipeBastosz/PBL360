import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { JWT_SECURITY_SCHEME } from '@/config/swagger.config';
import { ErrorResponseDto } from '@/shared/dtos/error-response.dto';

export const AddTutorToRoomSwaggerDocs = applyDecorators(
  ApiBearerAuth(JWT_SECURITY_SCHEME),
  ApiOperation({
    summary: 'Adiciona um professor à sala',
    description:
      'Permite que o professor responsável associe outro professor ' +
      'cadastrado à sala. O professor responsável é identificado pelo JWT.',
  }),
  ApiOkResponse({
    description: 'Professor associado à sala com sucesso.',
  }),
  ApiBadRequestResponse({
    description: 'Identificador inválido.',
    type: ErrorResponseDto,
  }),
  ApiUnauthorizedResponse({
    description: 'JWT não informado, inválido ou expirado.',
    type: ErrorResponseDto,
  }),
  ApiForbiddenResponse({
    description: 'Acesso negado. Apenas o professor responsável pode adicionar professores.',
    type: ErrorResponseDto,
  }),
  ApiNotFoundResponse({
    description: 'Sala ou professor não encontrado.',
    type: ErrorResponseDto,
  }),
  ApiConflictResponse({
    description: 'O professor já está associado à sala.',
    type: ErrorResponseDto,
  }),
);

export const RemoveTutorFromRoomSwaggerDocs = applyDecorators(
  ApiBearerAuth(JWT_SECURITY_SCHEME),
  ApiOperation({
    summary: 'Remove um professor da sala',
    description:
      'Permite que o professor responsável remova outro professor ' +
      'associado à sala. O professor responsável não pode ser removido.',
  }),
  ApiOkResponse({
    description: 'Professor removido da sala com sucesso.',
  }),
  ApiBadRequestResponse({
    description: 'Identificador inválido.',
    type: ErrorResponseDto,
  }),
  ApiUnauthorizedResponse({
    description: 'JWT não informado, inválido ou expirado.',
    type: ErrorResponseDto,
  }),
  ApiForbiddenResponse({
    description:
      'Acesso negado. Apenas o professor responsável pode remover professores. ' +
      'O professor responsável não pode ser removido.',
    type: ErrorResponseDto,
  }),
  ApiNotFoundResponse({
    description: 'Sala ou associação não encontrada.',
    type: ErrorResponseDto,
  }),
);
