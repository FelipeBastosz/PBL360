import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse, ApiBearerAuth, ApiCreatedResponse,
  ApiConflictResponse, ApiForbiddenResponse, ApiNoContentResponse,
  ApiNotFoundResponse, ApiOkResponse, ApiOperation,
  ApiUnauthorizedResponse, ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';

import { JWT_SECURITY_SCHEME } from '@/config/swagger.config';
import { ErrorResponseDto } from '@/shared/dtos/error-response.dto';
import { ProblemDeletionImpactDto } from '../../application/dtos/problem-deletion-impact.dto';
import { ProblemResponseDto } from '../../application/dtos/problem-response.dto';
import { ProblemPerformanceTableResponseDto } from '../../application/dtos/problem-performance-table-response.dto';

export const CreateProblemSwaggerDocs = applyDecorators(
  ApiBearerAuth(JWT_SECURITY_SCHEME),
  ApiOperation({ summary: 'Cadastra um novo problema na sala' }),
  ApiCreatedResponse({ description: 'Problema cadastrado com sucesso.', type: ProblemResponseDto }),
  ApiBadRequestResponse({ description: 'Dados inválidos.', type: ErrorResponseDto }),
  ApiUnauthorizedResponse({ description: 'JWT não informado.', type: ErrorResponseDto }),
  ApiForbiddenResponse({ description: 'Acesso negado.', type: ErrorResponseDto }),
  ApiNotFoundResponse({ description: 'Sala não encontrada.', type: ErrorResponseDto }),
);

export const ListProblemsSwaggerDocs = applyDecorators(
  ApiBearerAuth(JWT_SECURITY_SCHEME),
  ApiOperation({ summary: 'Lista os problemas de uma sala' }),
  ApiOkResponse({ description: 'Lista retornada.', type: ProblemResponseDto, isArray: true }),
  ApiUnauthorizedResponse({ description: 'JWT não informado.', type: ErrorResponseDto }),
  ApiForbiddenResponse({ description: 'Acesso negado.', type: ErrorResponseDto }),
  ApiNotFoundResponse({ description: 'Sala não encontrada.', type: ErrorResponseDto }),
);

export const GetProblemSwaggerDocs = applyDecorators(
  ApiBearerAuth(JWT_SECURITY_SCHEME),
  ApiOperation({ summary: 'Obtém as informações de um problema da sala' }),
  ApiOkResponse({ description: 'Problema encontrado.', type: ProblemResponseDto }),
  ApiUnauthorizedResponse({ description: 'JWT não informado.', type: ErrorResponseDto }),
  ApiForbiddenResponse({ description: 'Acesso negado.', type: ErrorResponseDto }),
  ApiNotFoundResponse({ description: 'Problema ou sala não encontrada.', type: ErrorResponseDto }),
);

export const UpdateProblemSwaggerDocs = applyDecorators(
  ApiBearerAuth(JWT_SECURITY_SCHEME),
  ApiOperation({ summary: 'Atualiza título de um problema' }),
  ApiOkResponse({ description: 'Problema atualizado com sucesso.' }),
  ApiBadRequestResponse({ description: 'Dados inválidos.', type: ErrorResponseDto }),
  ApiUnauthorizedResponse({ description: 'JWT não informado.', type: ErrorResponseDto }),
  ApiForbiddenResponse({ description: 'Acesso negado.', type: ErrorResponseDto }),
  ApiNotFoundResponse({ description: 'Problema não encontrado.', type: ErrorResponseDto }),
);

export const GetProblemDeletionImpactSwaggerDocs = applyDecorators(
  ApiBearerAuth(JWT_SECURITY_SCHEME),
  ApiOperation({ summary: 'Consulta o impacto da exclusão de um problema' }),
  ApiOkResponse({ description: 'Impacto consultado.', type: ProblemDeletionImpactDto }),
  ApiUnauthorizedResponse({ description: 'JWT não informado.', type: ErrorResponseDto }),
  ApiForbiddenResponse({ description: 'Acesso negado.', type: ErrorResponseDto }),
  ApiNotFoundResponse({ description: 'Problema não encontrado.', type: ErrorResponseDto }),
);

export const DeleteProblemSwaggerDocs = applyDecorators(
  ApiBearerAuth(JWT_SECURITY_SCHEME),
  ApiOperation({ summary: 'Exclui um problema da sala' }),
  ApiNoContentResponse({ description: 'Problema excluído.' }),
  ApiConflictResponse({ description: 'O problema possui sessões.', type: ErrorResponseDto }),
  ApiUnauthorizedResponse({ description: 'JWT não informado.', type: ErrorResponseDto }),
  ApiForbiddenResponse({ description: 'Acesso negado.', type: ErrorResponseDto }),
  ApiNotFoundResponse({ description: 'Problema não encontrado.', type: ErrorResponseDto }),
);

export const ChangeProblemPerformanceTableSwaggerDocs = applyDecorators(
  ApiBearerAuth(JWT_SECURITY_SCHEME),
  ApiOperation({ summary: 'Vincula ou troca a tabela de desempenho do problema' }),
  ApiOkResponse({ description: 'Tabela de desempenho vinculada.', type: ProblemPerformanceTableResponseDto }),
  ApiBadRequestResponse({ description: 'Dados inválidos.', type: ErrorResponseDto }),
  ApiUnauthorizedResponse({ description: 'JWT não informado.', type: ErrorResponseDto }),
  ApiForbiddenResponse({ description: 'Acesso negado.', type: ErrorResponseDto }),
  ApiNotFoundResponse({ description: 'Problema ou sala não encontrada.', type: ErrorResponseDto }),
  ApiConflictResponse({ description: 'Problema possui avaliações.', type: ErrorResponseDto }),
  ApiUnprocessableEntityResponse({ description: 'A tabela informada é inválida.', type: ErrorResponseDto }),
);
