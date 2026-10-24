import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { JWT_SECURITY_SCHEME } from '@/config/swagger.config';
import { ErrorResponseDto } from '@/shared/dtos/error-response.dto';

import { CreateDisciplineDto } from '../../application/dtos/create-discipline.dto';
import { DisciplineResponseDto } from '../../application/dtos/discipline-response.dto';

const UNAUTHORIZED = ApiUnauthorizedResponse({
  description: 'JWT não informado, inválido ou expirado.',
  type: ErrorResponseDto,
});

const ONLY_TUTORS = ApiForbiddenResponse({
  description: 'Apenas professores podem gerenciar as disciplinas.',
  type: ErrorResponseDto,
});

export const ListDisciplinesSwaggerDocs = applyDecorators(
  ApiBearerAuth(JWT_SECURITY_SCHEME),
  ApiOperation({
    summary: 'Lista as disciplinas cadastradas',
    description:
      'Retorna os módulos integradores do curso de Engenharia de Computação, ordenados pelo código.',
  }),
  ApiOkResponse({ type: DisciplineResponseDto, isArray: true }),
  UNAUTHORIZED,
  ONLY_TUTORS,
);

export const CreateDisciplineSwaggerDocs = applyDecorators(
  ApiBearerAuth(JWT_SECURITY_SCHEME),
  ApiOperation({
    summary: 'Cadastra uma disciplina',
    description:
      'Cadastra uma disciplina que ainda não está na lista. Ela passa a aparecer para todos os professores ao criar uma turma.',
  }),
  ApiBody({ type: CreateDisciplineDto }),
  ApiCreatedResponse({ type: DisciplineResponseDto }),
  ApiBadRequestResponse({
    description: 'Código fora do formato ABC123 ou nome vazio ou maior que 120 caracteres.',
    type: ErrorResponseDto,
  }),
  UNAUTHORIZED,
  ONLY_TUTORS,
  ApiConflictResponse({
    description: 'Já existe uma disciplina com esse código.',
    type: ErrorResponseDto,
  }),
);
