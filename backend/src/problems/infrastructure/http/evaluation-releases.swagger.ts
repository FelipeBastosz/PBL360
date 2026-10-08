import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { JWT_SECURITY_SCHEME } from '@/config/swagger.config';
import { ErrorResponseDto } from '@/shared/dtos/error-response.dto';
import { EvaluationReleasesResponseDto } from '../../application/dtos/evaluation-releases-response.dto';

const commonErrors = [
  ApiUnauthorizedResponse({
    description: 'JWT não informado, inválido ou expirado.',
    type: ErrorResponseDto,
  }),
  ApiForbiddenResponse({
    description: 'O professor não participa desta sala.',
    type: ErrorResponseDto,
  }),
  ApiNotFoundResponse({ description: 'Sala ou problema não encontrado.', type: ErrorResponseDto }),
];

export const GetEvaluationReleasesSwaggerDocs = applyDecorators(
  ApiBearerAuth(JWT_SECURITY_SCHEME),
  ApiOperation({
    summary: 'Consulta as liberações de autoavaliação e de pares',
    description: 'Devolve o estado das duas liberações do problema e a adesão dos alunos.',
  }),
  ApiOkResponse({ description: 'Liberações retornadas.', type: EvaluationReleasesResponseDto }),
  ...commonErrors,
);

export const UpdateEvaluationReleasesSwaggerDocs = applyDecorators(
  ApiBearerAuth(JWT_SECURITY_SCHEME),
  ApiOperation({
    summary: 'Liga, desliga ou altera o prazo das avaliações',
    description:
      'Desligar bloqueia novos envios e edições, mas preserva o que já foi enviado. ' +
      'Depois do prazo o envio fica fechado; para reabrir, informe um prazo novo.',
  }),
  ApiOkResponse({ description: 'Liberações atualizadas.', type: EvaluationReleasesResponseDto }),
  ApiBadRequestResponse({
    description: 'Prazo no passado, corpo sem autoavaliação nem pares, ou dados inválidos.',
    type: ErrorResponseDto,
  }),
  ...commonErrors,
);
