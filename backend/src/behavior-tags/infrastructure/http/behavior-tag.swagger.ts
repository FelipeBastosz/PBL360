import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
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

import { BehaviorTagNameDto } from '../../application/dtos/behavior-tag-name.dto';
import { BehaviorTagResponseDto } from '../../application/dtos/behavior-tag-response.dto';

const UNAUTHORIZED = ApiUnauthorizedResponse({
  description: 'JWT não informado, inválido ou expirado.',
  type: ErrorResponseDto,
});

const ONLY_TUTORS = ApiForbiddenResponse({
  description: 'Apenas professores podem gerenciar marcações.',
  type: ErrorResponseDto,
});

const NOT_OWNER = ApiForbiddenResponse({
  description: 'A marcação é predefinida, é de outro professor ou o usuário não é professor.',
  type: ErrorResponseDto,
});

const INVALID_NAME = ApiBadRequestResponse({
  description: 'Nome vazio, maior que 80 caracteres ou id inválido.',
  type: ErrorResponseDto,
});

const NAME_TAKEN = ApiConflictResponse({
  description: 'O professor já tem uma marcação com esse nome.',
  type: ErrorResponseDto,
});

const NOT_FOUND = ApiNotFoundResponse({
  description: 'Marcação não encontrada ou já excluída.',
  type: ErrorResponseDto,
});

export const ListBehaviorTagsSwaggerDocs = applyDecorators(
  ApiBearerAuth(JWT_SECURITY_SCHEME),
  ApiOperation({
    summary: 'Lista as marcações disponíveis para o professor',
    description:
      'Retorna as marcações predefinidas e as marcações personalizadas ativas do professor.',
  }),
  ApiOkResponse({ type: BehaviorTagResponseDto, isArray: true }),
  UNAUTHORIZED,
  ONLY_TUTORS,
);

export const CreateBehaviorTagSwaggerDocs = applyDecorators(
  ApiBearerAuth(JWT_SECURITY_SCHEME),
  ApiOperation({ summary: 'Cria uma marcação personalizada' }),
  ApiBody({ type: BehaviorTagNameDto }),
  ApiCreatedResponse({ type: BehaviorTagResponseDto }),
  INVALID_NAME,
  UNAUTHORIZED,
  ONLY_TUTORS,
  NAME_TAKEN,
);

export const RenameBehaviorTagSwaggerDocs = applyDecorators(
  ApiBearerAuth(JWT_SECURITY_SCHEME),
  ApiOperation({ summary: 'Renomeia uma marcação personalizada' }),
  ApiBody({ type: BehaviorTagNameDto }),
  ApiOkResponse({ type: BehaviorTagResponseDto }),
  INVALID_NAME,
  UNAUTHORIZED,
  NOT_OWNER,
  NOT_FOUND,
  NAME_TAKEN,
);

export const DeactivateBehaviorTagSwaggerDocs = applyDecorators(
  ApiBearerAuth(JWT_SECURITY_SCHEME),
  ApiOperation({
    summary: 'Exclui uma marcação personalizada',
    description:
      'A marcação é desativada, não apagada: as observações já registradas com ela continuam no histórico.',
  }),
  ApiNoContentResponse({ description: 'Marcação excluída.' }),
  UNAUTHORIZED,
  NOT_OWNER,
  NOT_FOUND,
);
