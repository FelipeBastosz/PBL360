import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
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
    summary: 'Ajusta a nota da autoavaliação do aluno na sessão',
    description:
      'Vale apenas para autoavaliação enviada; avaliações de pares não têm ajuste. A nota original nunca é alterada: o ajuste registra o valor anterior (nota vigente), o novo valor, a justificativa, o autor e a data na mesma transação. A nota vigente passa a ser a do ajuste mais recente.',
  }),
  ApiBody({ type: AdjustSelfAssessmentDto }),
  ApiCreatedResponse({ type: SelfAssessmentAdjustmentResponseDto }),
  ApiBadRequestResponse({
    description: 'Formato inválido: nota não numérica, fora de 0–10 ou com mais de duas casas.',
    type: ErrorResponseDto,
  }),
  ApiConflictResponse({
    description: 'A autoavaliação ainda não foi enviada.',
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
    summary: 'Histórico de ajustes da autoavaliação do aluno na sessão',
    description:
      'Ajustes do mais recente para o mais antigo. Enquanto a autoavaliação está em rascunho, as notas são nulas e não há ajustes.',
  }),
  ApiOkResponse({ type: SelfAssessmentAdjustmentHistoryResponseDto }),
  ApiBadRequestResponse({ description: 'Parâmetros inválidos.', type: ErrorResponseDto }),
  ApiUnprocessableEntityResponse({
    description: 'Aluno não matriculado na sala.',
    type: ErrorResponseDto,
  }),
);
