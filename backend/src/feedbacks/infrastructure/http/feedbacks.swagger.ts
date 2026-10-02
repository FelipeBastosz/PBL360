import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { JWT_SECURITY_SCHEME } from '@/config/swagger.config';
import { ErrorResponseDto } from '@/shared/dtos/error-response.dto';
import { StudentProblemFeedbackResponseDto } from '../../application/dtos/student-problem-feedback-response.dto';
import { GeneralFeedbackResponseDto } from '../../application/dtos/general-feedback-response.dto';
import { ProblemFeedbacksResponseDto } from '../../application/dtos/problem-feedbacks-response.dto';
import { SessionFeedbackResponseDto } from '../../application/dtos/session-feedback-response.dto';
import { FeedbackRevisionResponseDto } from '../../application/dtos/feedback-revision-response.dto';

export const SaveStudentProblemFeedbackSwaggerDocs = applyDecorators(
  ApiBearerAuth(JWT_SECURITY_SCHEME),
  ApiOperation({
    summary: 'Registra ou atualiza o feedback individual do aluno no problema (RF18)',
    description: 'Atua como upsert gerando revisão auditável se o feedback for atualizado.',
  }),
  ApiOkResponse({
    description: 'Feedback salvo com sucesso.',
    type: StudentProblemFeedbackResponseDto,
  }),
  ApiBadRequestResponse({ description: 'Dados de entrada inválidos.', type: ErrorResponseDto }),
  ApiUnauthorizedResponse({ description: 'Não autenticado.', type: ErrorResponseDto }),
  ApiForbiddenResponse({ description: 'Sem permissão na sala.', type: ErrorResponseDto }),
  ApiNotFoundResponse({ description: 'Problema ou sala não encontrada.', type: ErrorResponseDto }),
  ApiUnprocessableEntityResponse({
    description: 'Aluno não matriculado na sala.',
    type: ErrorResponseDto,
  }),
);

export const SaveGeneralProblemFeedbackSwaggerDocs = applyDecorators(
  ApiBearerAuth(JWT_SECURITY_SCHEME),
  ApiOperation({
    summary: 'Registra ou atualiza o feedback geral do problema (RF20)',
    description: 'Atua como upsert gerando revisão se o feedback for atualizado.',
  }),
  ApiOkResponse({
    description: 'Feedback geral salvo com sucesso.',
    type: GeneralFeedbackResponseDto,
  }),
  ApiBadRequestResponse({ description: 'Dados de entrada inválidos.', type: ErrorResponseDto }),
  ApiUnauthorizedResponse({ description: 'Não autenticado.', type: ErrorResponseDto }),
  ApiForbiddenResponse({ description: 'Sem permissão na sala.', type: ErrorResponseDto }),
  ApiNotFoundResponse({ description: 'Problema ou sala não encontrada.', type: ErrorResponseDto }),
);

export const GetProblemFeedbacksSwaggerDocs = applyDecorators(
  ApiBearerAuth(JWT_SECURITY_SCHEME),
  ApiOperation({
    summary: 'Consulta feedbacks do problema (geral e alunos matriculados)',
    description: 'Retorna o feedback geral e o feedback de cada aluno da turma no problema.',
  }),
  ApiOkResponse({
    description: 'Feedbacks consultados com sucesso.',
    type: ProblemFeedbacksResponseDto,
  }),
  ApiUnauthorizedResponse({ description: 'Não autenticado.', type: ErrorResponseDto }),
  ApiForbiddenResponse({ description: 'Sem permissão na sala.', type: ErrorResponseDto }),
  ApiNotFoundResponse({ description: 'Problema ou sala não encontrada.', type: ErrorResponseDto }),
);

export const SaveSessionFeedbackSwaggerDocs = applyDecorators(
  ApiBearerAuth(JWT_SECURITY_SCHEME),
  ApiOperation({
    summary: 'Registra ou atualiza o feedback do aluno na sessão (RF19)',
    description: 'Atua como upsert gerando revisão se for atualizado.',
  }),
  ApiOkResponse({
    description: 'Feedback de sessão salvo com sucesso.',
    type: SessionFeedbackResponseDto,
  }),
  ApiBadRequestResponse({ description: 'Dados de entrada inválidos.', type: ErrorResponseDto }),
  ApiUnauthorizedResponse({ description: 'Não autenticado.', type: ErrorResponseDto }),
  ApiForbiddenResponse({ description: 'Sem permissão na sessão.', type: ErrorResponseDto }),
  ApiNotFoundResponse({ description: 'Sessão não encontrada.', type: ErrorResponseDto }),
  ApiUnprocessableEntityResponse({
    description: 'Aluno não matriculado na sala da sessão.',
    type: ErrorResponseDto,
  }),
);

export const GetSessionFeedbackSwaggerDocs = applyDecorators(
  ApiBearerAuth(JWT_SECURITY_SCHEME),
  ApiOperation({
    summary: 'Consulta feedback da sessão para um aluno',
    description: 'Retorna o feedback registrado para o aluno na sessão ou null.',
  }),
  ApiOkResponse({
    description: 'Feedback da sessão retornado com sucesso.',
    type: SessionFeedbackResponseDto,
  }),
  ApiUnauthorizedResponse({ description: 'Não autenticado.', type: ErrorResponseDto }),
  ApiForbiddenResponse({ description: 'Sem permissão na sessão.', type: ErrorResponseDto }),
  ApiNotFoundResponse({ description: 'Sessão não encontrada.', type: ErrorResponseDto }),
);

export const GetFeedbackRevisionsSwaggerDocs = applyDecorators(
  ApiBearerAuth(JWT_SECURITY_SCHEME),
  ApiOperation({
    summary: 'Consulta histórico de revisões de um feedback (RNF07)',
    description: 'Retorna histórico de edições do mais recente para o mais antigo.',
  }),
  ApiOkResponse({
    description: 'Revisões consultadas com sucesso.',
    type: [FeedbackRevisionResponseDto],
  }),
  ApiUnauthorizedResponse({ description: 'Não autenticado.', type: ErrorResponseDto }),
  ApiForbiddenResponse({ description: 'Sem permissão.', type: ErrorResponseDto }),
  ApiNotFoundResponse({ description: 'Feedback não encontrado.', type: ErrorResponseDto }),
);
