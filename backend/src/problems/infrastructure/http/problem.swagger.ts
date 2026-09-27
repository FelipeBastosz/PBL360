import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
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

import { ProblemDeletionImpactDto } from '../../application/dtos/problem-deletion-impact.dto';
import { ProblemResponseDto } from '../../application/dtos/problem-response.dto';

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
    type: ProblemResponseDto,
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

export const ListProblemsSwaggerDocs = applyDecorators(
  ApiBearerAuth(JWT_SECURITY_SCHEME),
  ApiOperation({
    summary: 'Lista os problemas de uma sala',
    description:
      'Retorna os problemas da sala informada, na ordem sequencial definida para a sala. ' +
      'Caso a sala não possua problemas cadastrados, devolve uma lista vazia.',
  }),
  ApiOkResponse({
    description: 'Lista de problemas da sala retornada com sucesso.',
    type: ProblemResponseDto,
    isArray: true,
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

export const GetProblemSwaggerDocs = applyDecorators(
  ApiBearerAuth(JWT_SECURITY_SCHEME),
  ApiOperation({
    summary: 'Obtém as informações de um problema da sala',
    description:
      'Retorna os dados detalhados de um problema específico. ' +
      'Caso o problema não exista ou não pertença à sala informada, o sistema responde que ele não existe.',
  }),
  ApiOkResponse({
    description: 'Problema encontrado com sucesso.',
    type: ProblemResponseDto,
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
    description: 'Problema ou sala não encontrada.',
    type: ErrorResponseDto,
  }),
);
export const UpdateProblemSwaggerDocs = applyDecorators(
  ApiBearerAuth(JWT_SECURITY_SCHEME),
  ApiOperation({
    summary: 'Atualiza título de um problema',
    description:
      'Permite que o professor atualize o título de um problema existente na sala. Apenas o campo "title" é editável.',
  }),
  ApiOkResponse({ description: 'Problema atualizado com sucesso.' }),
  ApiBadRequestResponse({
    description: 'Dados inválidos ou erro de validação.',
    type: ErrorResponseDto,
  }),
  ApiUnauthorizedResponse({
    description: 'JWT não informado, inválido ou expirado.',
    type: ErrorResponseDto,
  }),
  ApiForbiddenResponse({ description: 'Acesso negado.', type: ErrorResponseDto }),
  ApiNotFoundResponse({ description: 'Problema não encontrado.', type: ErrorResponseDto }),
);

export const GetProblemDeletionImpactSwaggerDocs = applyDecorators(
  ApiBearerAuth(JWT_SECURITY_SCHEME),
  ApiOperation({
    summary: 'Consulta o impacto da exclusão de um problema',
    description:
      'Retorna a contagem de registros que dependem do problema (sessões, notas, feedbacks e avaliações) ' +
      'para confirmação prévia da exclusão.',
  }),
  ApiOkResponse({
    description: 'Impacto da exclusão consultado com sucesso.',
    type: ProblemDeletionImpactDto,
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
    description: 'Problema ou sala não encontrada.',
    type: ErrorResponseDto,
  }),
);

export const DeleteProblemSwaggerDocs = applyDecorators(
  ApiBearerAuth(JWT_SECURITY_SCHEME),
  ApiOperation({
    summary: 'Exclui um problema da sala',
    description:
      'Remove permanentemente o problema da sala mantendo a ordem sequencial dos problemas restantes. ' +
      'Apenas o professor responsável pela sala possui permissão para excluir problemas.',
  }),
  ApiNoContentResponse({ description: 'Problema excluído com sucesso.' }),
  ApiUnauthorizedResponse({
    description: 'JWT não informado, inválido ou expirado.',
    type: ErrorResponseDto,
  }),
  ApiForbiddenResponse({
    description: 'Acesso negado. Apenas o professor responsável pode excluir problemas da sala.',
    type: ErrorResponseDto,
  }),
  ApiNotFoundResponse({
    description: 'Problema ou sala não encontrada.',
    type: ErrorResponseDto,
  }),
);
