import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { ErrorResponseDto } from '@/shared/dtos/error-response.dto';
import {
  SessionEvaluationConfigurationDto,
  SessionFormulaDto,
} from '../../application/dtos/session-evaluation-configuration.dto';

const accessErrors = [
  ApiBadRequestResponse({
    description: 'Identificador ou corpo inválido.',
    type: ErrorResponseDto,
  }),
  ApiForbiddenResponse({ description: 'Acesso negado à turma.', type: ErrorResponseDto }),
  ApiNotFoundResponse({ description: 'Sessão não encontrada.', type: ErrorResponseDto }),
];

export const GetSessionEvaluationConfigurationSwaggerDocs = applyDecorators(
  ApiOperation({ summary: 'Consulta a tabela e a fórmula vigentes da sessão.' }),
  ApiOkResponse({ type: SessionEvaluationConfigurationDto }),
  ...accessErrors,
);

export const SetSessionTableSwaggerDocs = applyDecorators(
  ApiOperation({ summary: 'Aplica uma tabela à sessão e opcionalmente às seguintes.' }),
  ApiOkResponse({
    schema: {
      example: {
        sessoesAtualizadas: [{ sessaoId: 'uuid', rotulo: 'Sessão 1' }],
        sessoesIgnoradas: [{ sessaoId: 'uuid', rotulo: 'Sessão 2', motivo: 'AVALIACAO_ENVIADA' }],
      },
    },
  }),
  ApiConflictResponse({
    description: 'A sessão já tem avaliação do tutor enviada.',
    type: ErrorResponseDto,
  }),
  ApiUnprocessableEntityResponse({
    description: 'Tabela inativa, fora da turma ou sem critérios.',
    type: ErrorResponseDto,
  }),
  ...accessErrors,
);

export const SetSessionFormulaSwaggerDocs = applyDecorators(
  ApiOperation({ summary: 'Personaliza a fórmula da nota da sessão.' }),
  ApiOkResponse({ type: SessionFormulaDto }),
  ApiUnprocessableEntityResponse({
    description: 'Os componentes são inválidos ou não somam 100.',
    type: ErrorResponseDto,
  }),
  ...accessErrors,
);

export const RestoreSessionFormulaSwaggerDocs = applyDecorators(
  ApiOperation({ summary: 'Restaura a fórmula padrão da sessão.' }),
  ApiOkResponse({ type: SessionFormulaDto }),
  ...accessErrors,
);
