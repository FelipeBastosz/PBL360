import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { JWT_SECURITY_SCHEME } from '@/config/swagger.config';
import { ErrorResponseDto } from '@/shared/dtos/error-response.dto';

import { DisciplineResponseDto } from '../../application/dtos/discipline-response.dto';

export const ListDisciplinesSwaggerDocs = applyDecorators(
  ApiBearerAuth(JWT_SECURITY_SCHEME),
  ApiOperation({
    summary: 'Lista as disciplinas cadastradas',
    description:
      'Retorna os módulos integradores do curso de Engenharia de Computação, ordenados pelo código.',
  }),
  ApiOkResponse({ type: DisciplineResponseDto, isArray: true }),
  ApiUnauthorizedResponse({
    description: 'JWT não informado, inválido ou expirado.',
    type: ErrorResponseDto,
  }),
  ApiForbiddenResponse({
    description: 'Apenas professores podem listar as disciplinas.',
    type: ErrorResponseDto,
  }),
);
