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
import { EvaluationReleasesResponseDto } from '../../application/dtos/evaluation-releases-response.dto';

const commonErrors = [
  ApiUnauthorizedResponse({
    description: 'JWT não informado, inválido ou expirado.',
    type: ErrorResponseDto,
  }),
  ApiForbiddenResponse({
    description: 'O professor não participa da sala da sessão.',
    type: ErrorResponseDto,
  }),
  ApiNotFoundResponse({ description: 'Sessão não encontrada.', type: ErrorResponseDto }),
];

export const GetEvaluationReleasesSwaggerDocs = applyDecorators(
  ApiBearerAuth(JWT_SECURITY_SCHEME),
  ApiOperation({
    summary: 'Consulta as liberações de autoavaliação e de pares da sessão',
    description:
      'Devolve o estado das duas liberações e a adesão dos alunos presentes ou atrasados na chamada.',
  }),
  ApiOkResponse({ description: 'Liberações retornadas.', type: EvaluationReleasesResponseDto }),
  ...commonErrors,
);

export const UpdateEvaluationReleasesSwaggerDocs = applyDecorators(
  ApiBearerAuth(JWT_SECURITY_SCHEME),
  ApiOperation({
    summary: 'Liga, desliga ou altera o prazo das avaliações da sessão',
    description:
      'Autoavaliação e pares são mutuamente exclusivas: só uma pode estar liberada por vez. ' +
      'Desligar bloqueia novos envios e edições, mas preserva o que já foi enviado. ' +
      'Depois do prazo o envio fica fechado; para reabrir, informe um prazo novo.',
  }),
  ApiOkResponse({ description: 'Liberações atualizadas.', type: EvaluationReleasesResponseDto }),
  ApiBadRequestResponse({
    description: 'Prazo no passado, corpo sem autoavaliação nem pares, ou dados inválidos.',
    type: ErrorResponseDto,
  }),
  ApiConflictResponse({
    description:
      'A chamada da sessão ainda não foi salva, a sessão já possui avaliações do tutor submetidas, ou o pedido deixaria autoavaliação e pares liberadas ao mesmo tempo.',
    type: ErrorResponseDto,
  }),
  ...commonErrors,
);
