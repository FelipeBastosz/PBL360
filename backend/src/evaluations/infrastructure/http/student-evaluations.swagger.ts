import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { JWT_SECURITY_SCHEME } from '@/config/swagger.config';
import { ErrorResponseDto } from '@/shared/dtos/error-response.dto';
import { SaveSelfAssessmentDto } from '../../application/dtos/save-self-assessment.dto';
import {
  SelfAssessmentResponseDto,
  StudentEvaluationSummaryResponseDto,
} from '../../application/dtos/student-evaluations-response.dto';

const studentAccessDocs = () => [
  ApiBearerAuth(JWT_SECURITY_SCHEME),
  ApiUnauthorizedResponse({ description: 'Autenticação necessária.', type: ErrorResponseDto }),
  ApiForbiddenResponse({ description: 'Aluno sem vínculo com a sala.', type: ErrorResponseDto }),
];

export const GetStudentEvaluationSummarySwaggerDocs = applyDecorators(
  ...studentAccessDocs(),
  ApiOperation({ summary: 'Resumo da central de avaliações do aluno na sessão' }),
  ApiOkResponse({ type: StudentEvaluationSummaryResponseDto }),
);

export const GetSelfAssessmentSwaggerDocs = applyDecorators(
  ...studentAccessDocs(),
  ApiOperation({ summary: 'Formulário e respostas da autoavaliação da sessão' }),
  ApiOkResponse({ type: SelfAssessmentResponseDto }),
);

export const SaveSelfAssessmentSwaggerDocs = applyDecorators(
  ...studentAccessDocs(),
  ApiOperation({ summary: 'Salva o rascunho ou envia a autoavaliação' }),
  ApiBody({ type: SaveSelfAssessmentDto }),
  ApiOkResponse({ type: SelfAssessmentResponseDto }),
  ApiConflictResponse({ description: 'Autoavaliação já enviada.', type: ErrorResponseDto }),
  ApiResponse({
    status: 423,
    description: 'Liberação desligada, prazo vencido ou aluno ausente.',
    type: ErrorResponseDto,
  }),
  ApiUnprocessableEntityResponse({
    description: 'Critério inválido, nota fora do limite ou critérios faltando.',
    type: ErrorResponseDto,
  }),
);
