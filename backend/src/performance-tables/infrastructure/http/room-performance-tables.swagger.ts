import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { JWT_SECURITY_SCHEME } from '@/config/swagger.config';
import { ErrorResponseDto } from '@/shared/dtos/error-response.dto';
import { CreatePerformanceTableDto } from '../../application/dtos/create-performance-table.dto';
import { PerformanceTableResponseDto } from '../../application/dtos/performance-table-response.dto';
import { RoomPerformanceTableItemResponseDto } from '../../application/dtos/room-performance-table-response.dto';

const UNAUTHORIZED = ApiUnauthorizedResponse({
  description: 'JWT não informado, inválido ou expirado.',
  type: ErrorResponseDto,
});

const FORBIDDEN = ApiForbiddenResponse({
  description: 'Você não tem permissão para acessar ou modificar esta sala.',
  type: ErrorResponseDto,
});

const NOT_FOUND = ApiNotFoundResponse({
  description: 'Sala não encontrada.',
  type: ErrorResponseDto,
});

const BAD_REQUEST = ApiBadRequestResponse({
  description: 'Dados da requisição inválidos ou critérios com soma diferente de 10.',
  type: ErrorResponseDto,
});

export const ListRoomPerformanceTablesSwaggerDocs = applyDecorators(
  ApiBearerAuth(JWT_SECURITY_SCHEME),
  ApiOperation({
    summary: 'Lista as tabelas de desempenho disponíveis para o professor na turma',
    description:
      'Retorna as tabelas utilizadas na turma (TURMA), as pessoais do professor autenticado (PESSOAL) e as padrão do sistema (PADRAO), incluindo o número de sessões em uso.',
  }),
  ApiParam({
    name: 'salaId',
    type: String,
    description: 'Identificador único (UUID) da sala/turma.',
    example: 'd3b07384-d113-4944-9c80-e74f1784c6c2',
  }),
  ApiOkResponse({
    description: 'Lista de tabelas de desempenho disponíveis na turma.',
    type: RoomPerformanceTableItemResponseDto,
    isArray: true,
  }),
  UNAUTHORIZED,
  FORBIDDEN,
  NOT_FOUND,
);

export const CreateRoomPerformanceTableSwaggerDocs = applyDecorators(
  ApiBearerAuth(JWT_SECURITY_SCHEME),
  ApiOperation({
    summary: 'Cria uma tabela de desempenho vinculada à turma',
    description:
      'Cria uma tabela de desempenho já vinculada à turma especificada. Professores da turma podem usar e editar as tabelas da turma.',
  }),
  ApiParam({
    name: 'salaId',
    type: String,
    description: 'Identificador único (UUID) da sala/turma.',
    example: 'd3b07384-d113-4944-9c80-e74f1784c6c2',
  }),
  ApiBody({ type: CreatePerformanceTableDto }),
  ApiCreatedResponse({
    description: 'Tabela de desempenho criada e vinculada à turma com sucesso.',
    type: PerformanceTableResponseDto,
  }),
  BAD_REQUEST,
  UNAUTHORIZED,
  FORBIDDEN,
  NOT_FOUND,
);
