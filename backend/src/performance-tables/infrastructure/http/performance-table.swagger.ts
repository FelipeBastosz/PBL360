import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
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

import { CreatePerformanceTableDto } from '../../application/dtos/create-performance-table.dto';
import { PerformanceTableResponseDto } from '../../application/dtos/performance-table-response.dto';
import { PerformanceTableSummaryResponseDto } from '../../application/dtos/performance-table-summary-response.dto';
import { UpdatePerformanceTableDto } from '../../application/dtos/update-performance-table.dto';

const UNAUTHORIZED = ApiUnauthorizedResponse({
  description: 'JWT não informado, inválido ou expirado.',
  type: ErrorResponseDto,
});

const FORBIDDEN = ApiForbiddenResponse({
  description: 'Apenas professores podem gerenciar tabelas de desempenho.',
  type: ErrorResponseDto,
});

export const ListPerformanceTablesSwaggerDocs = applyDecorators(
  ApiBearerAuth(JWT_SECURITY_SCHEME),
  ApiOperation({
    summary: 'Lista as tabelas de desempenho do professor autenticado',
    description:
      'Retorna somente as tabelas ativas do professor, com a quantidade de critérios ativos e de problemas ativos que utilizam cada tabela.',
  }),
  ApiOkResponse({
    description:
      'Tabelas de desempenho do professor. Retorna uma lista vazia quando não houver tabelas.',
    type: PerformanceTableSummaryResponseDto,
    isArray: true,
  }),
  UNAUTHORIZED,
  FORBIDDEN,
);

export const CreatePerformanceTableSwaggerDocs = applyDecorators(
  ApiBearerAuth(JWT_SECURITY_SCHEME),
  ApiOperation({
    summary: 'Cria uma tabela de desempenho',
    description:
      'Cria uma tabela para o professor autenticado com ao menos um critério. A ordem e o peso recebem valores padrão quando não informados.',
  }),
  ApiBody({ type: CreatePerformanceTableDto }),
  ApiCreatedResponse({
    description: 'Tabela de desempenho criada com sucesso.',
    type: PerformanceTableResponseDto,
  }),
  ApiBadRequestResponse({
    description: 'Dados da tabela ou dos critérios são inválidos.',
    type: ErrorResponseDto,
  }),
  UNAUTHORIZED,
  FORBIDDEN,
);

export const GetPerformanceTableSwaggerDocs = applyDecorators(
  ApiBearerAuth(JWT_SECURITY_SCHEME),
  ApiOperation({
    summary: 'Busca os detalhes de uma tabela de desempenho',
    description:
      'Retorna uma tabela de desempenho do professor autenticado com todos os seus critérios ativos ordenados.',
  }),
  ApiOkResponse({
    description: 'Tabela de desempenho encontrada com seus critérios.',
    type: PerformanceTableResponseDto,
  }),
  ApiNotFoundResponse({
    description: 'Tabela de desempenho não encontrada.',
    type: ErrorResponseDto,
  }),
  UNAUTHORIZED,
  FORBIDDEN,
);

export const DeletePerformanceTableSwaggerDocs = applyDecorators(
  ApiBearerAuth(JWT_SECURITY_SCHEME),
  ApiOperation({
    summary: 'Exclui uma tabela de desempenho',
    description:
      'Realiza a exclusão lógica da tabela sem remover critérios ou problemas vinculados. ' +
      'Apenas o professor responsável pode excluí-la.',
  }),
  ApiNoContentResponse({ description: 'Tabela de desempenho excluída com sucesso.' }),
  ApiBadRequestResponse({
    description: 'O identificador da tabela não é um UUID válido.',
    type: ErrorResponseDto,
  }),
  UNAUTHORIZED,
  ApiForbiddenResponse({
    description: 'Apenas o professor responsável pode excluir esta tabela.',
    type: ErrorResponseDto,
  }),
  ApiNotFoundResponse({
    description: 'Tabela não encontrada ou já excluída.',
    type: ErrorResponseDto,
  }),
);

export const UpdatePerformanceTableSwaggerDocs = applyDecorators(
  ApiBearerAuth(JWT_SECURITY_SCHEME),
  ApiOperation({
    summary: 'Edita uma tabela de desempenho',
    description:
      'Atualiza nome, descrição e critérios da tabela. ' +
      'Os critérios anteriores são preservados como histórico.',
  }),
  ApiBody({
    type: UpdatePerformanceTableDto,
  }),
  ApiOkResponse({
    description: 'Tabela de desempenho atualizada com sucesso.',
    type: PerformanceTableResponseDto,
  }),
  ApiBadRequestResponse({
    description: 'Dados inválidos para atualização.',
    type: ErrorResponseDto,
  }),
  ApiUnauthorizedResponse({
    description: 'JWT não informado, inválido ou expirado.',
    type: ErrorResponseDto,
  }),
  ApiForbiddenResponse({
    description: 'Apenas o professor responsável pode editar esta tabela.',
    type: ErrorResponseDto,
  }),
  ApiNotFoundResponse({
    description: 'Tabela de desempenho não encontrada.',
    type: ErrorResponseDto,
  }),
);
