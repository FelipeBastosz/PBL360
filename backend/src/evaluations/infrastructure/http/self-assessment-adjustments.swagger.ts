import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { JWT_SECURITY_SCHEME } from '@/config/swagger.config';
import { ErrorResponseDto } from '@/shared/dtos/error-response.dto';
import { AdjustSelfAssessmentDto } from '../../application/dtos/adjust-self-assessment.dto';
import {
  SelfAssessmentAdjustmentHistoryResponseDto,
  SelfAssessmentAdjustmentResponseDto,
} from '../../application/dtos/self-assessment-adjustment-response.dto';

const accessDocs = () => [
  ApiBearerAuth(JWT_SECURITY_SCHEME),
  ApiUnauthorizedResponse({ description: 'Autenticação necessária.', type: ErrorResponseDto }),
  ApiForbiddenResponse({
    description: 'Usuário não é professor ou não tem vínculo com a sala.',
    type: ErrorResponseDto,
  }),
  ApiNotFoundResponse({
    description: 'Sessão não encontrada ou aluno sem autoavaliação na sessão.',
    type: ErrorResponseDto,
  }),
];

export const AdjustSelfAssessmentSwaggerDocs = applyDecorators(
  ...accessDocs(),
  ApiOperation({
    summary: 'Ajusta a nota da autoavaliação ou avaliação por pares do aluno na sessão',
    description:
      'Permite o registro de ajuste com justificativa tanto para a autoavaliação quanto para a nota consolidada de avaliação entre pares (formulário ou planning poker). A nota original nunca é alterada: o ajuste registra o valor anterior (nota vigente), o novo valor, a justificativa, o autor e a data na mesma transação. A nota vigente passa a ser a do ajuste mais recente.',
  }),
  ApiBody({ type: AdjustSelfAssessmentDto }),
  ApiOkResponse({ type: SelfAssessmentAdjustmentResponseDto }),
  ApiBadRequestResponse({
    description: 'Formato inválido: nota não numérica, fora de 0–10 ou com mais de duas casas.',
    type: ErrorResponseDto,
  }),
  ApiConflictResponse({
    description: 'A avaliação ainda não foi enviada ou decidida.',
    type: ErrorResponseDto,
  }),
  ApiUnprocessableEntityResponse({
    description:
      'Nova nota igual à vigente, justificativa fora de 10 a 500 caracteres ou aluno não matriculado.',
    type: ErrorResponseDto,
  }),
);

export const ListSelfAssessmentAdjustmentsSwaggerDocs = applyDecorators(
  ...accessDocs(),
  ApiOperation({
    summary: 'Histórico de ajustes da avaliação (autoavaliação ou pares) do aluno na sessão',
    description:
      'Ajustes do mais recente para o mais antigo. Enquanto a avaliação está em rascunho ou não finalizada, as notas são nulas e não há ajustes.',
  }),
  ApiQuery({
    name: 'tipo',
    required: false,
    enum: ['AUTOAVALIACAO', 'PARES'],
    description: 'Tipo de avaliação para consultar histórico. Opcional.',
  }),
  ApiOkResponse({ type: SelfAssessmentAdjustmentHistoryResponseDto }),
  ApiBadRequestResponse({ description: 'Parâmetros inválidos.', type: ErrorResponseDto }),
  ApiUnprocessableEntityResponse({
    description: 'Aluno não matriculado na sala.',
    type: ErrorResponseDto,
  }),
);
