import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { JWT_SECURITY_SCHEME } from '@/config/swagger.config';
import { ErrorResponseDto } from '@/shared/dtos/error-response.dto';

export const CreateProblemSwaggerDocs = applyDecorators(
  ApiBearerAuth(JWT_SECURITY_SCHEME),
  ApiOperation({
    summary: 'Cadastra um novo problema na sala',
    description:
      'Permite que um professor vinculado à sala cadastre um novo problema. ' +
      'A ordem do problema na sala é definida automaticamente de forma sequencial.',
  }),
  ApiCreatedResponse({
    description: 'Problema cadastrado com sucesso.',
  }),
  ApiBadRequestResponse({
    description: 'Dados inválidos ou erro de validação.',
    type: ErrorResponseDto,
  }),
  ApiUnauthorizedResponse({
    description: 'JWT não informado, inválido ou expirado.',
    type: ErrorResponseDto,
  }),
  ApiForbiddenResponse({
    description: 'Acesso negado. O professor não possui permissão nesta sala.',
    type: ErrorResponseDto,
  }),
  ApiNotFoundResponse({
    description: 'Sala não encontrada.',
    type: ErrorResponseDto,
  }),
);
