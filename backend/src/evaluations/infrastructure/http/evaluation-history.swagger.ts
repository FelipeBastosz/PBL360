import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { JWT_SECURITY_SCHEME } from '@/config/swagger.config';
import { ErrorResponseDto } from '@/shared/dtos/error-response.dto';
import { SessionEvaluationHistoryResponseDto } from '../../application/dtos/session-evaluation-history-response.dto';
import { StudentSessionEvaluationComparisonResponseDto } from '../../application/dtos/student-session-evaluation-comparison-response.dto';

const accessDocs = () => [
  ApiBearerAuth(JWT_SECURITY_SCHEME),
  ApiBadRequestResponse({ description: 'Dados inválidos.', type: ErrorResponseDto }),
  ApiUnauthorizedResponse({ description: 'Autenticação necessária.', type: ErrorResponseDto }),
  ApiForbiddenResponse({
    description: 'Professor sem vínculo com a sala.',
    type: ErrorResponseDto,
  }),
  ApiNotFoundResponse({
    description: 'Sessão não encontrada.',
    type: ErrorResponseDto,
  }),
];

export const ListEvaluationHistorySwaggerDocs = applyDecorators(
  ...accessDocs(),
  ApiOperation({
    summary: 'Lista os alunos da sessão com as notas comparadas',
    description:
      'Fornece ao professor a comparação da autoavaliação de cada aluno com a avaliação do tutor e com a dos colegas na sessão. Apenas alunos que participaram da sessão são listados.',
  }),
  ApiOkResponse({ type: SessionEvaluationHistoryResponseDto }),
);

export const GetEvaluationHistoryDetailSwaggerDocs = applyDecorators(
  ...accessDocs(),
  ApiOperation({
    summary: 'Detalha a comparação de avaliações de um aluno na sessão',
    description:
      'Compara critério a critério a autoavaliação e a nota do tutor, lista as avaliações de pares recebidas não anônimas e os ajustes de nota da autoavaliação realizados pelo tutor.',
  }),
  ApiOkResponse({ type: StudentSessionEvaluationComparisonResponseDto }),
  ApiNotFoundResponse({
    description: 'Sessão não encontrada ou aluno que não participou da sessão.',
    type: ErrorResponseDto,
  }),
);
