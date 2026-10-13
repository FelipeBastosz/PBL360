import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JWT_SECURITY_SCHEME } from '@/config/swagger.config';
import { ErrorResponseDto } from '@/shared/dtos/error-response.dto';
import { ReceivedProblemFeedbacksResponseDto } from '../../application/dtos/received-problem-feedbacks-response.dto';

export const GetMyProblemFeedbacksSwaggerDocs = applyDecorators(
  ApiBearerAuth(JWT_SECURITY_SCHEME),
  ApiOperation({
    summary: 'Consulta os feedbacks do aluno autenticado no problema',
    description:
      'Individual e geral ficam disponíveis ao serem salvos. Feedbacks de sessão exigem avaliação do tutor enviada para o aluno. Registra a primeira leitura dos feedbacks retornados, inclusive do geral por aluno. novo é verdadeiro no primeiro acesso; edições não reiniciam a leitura. Somente o individual inclui nota. Sessões em ordem cronológica, com feedback null quando indisponível.',
  }),
  ApiOkResponse({ type: ReceivedProblemFeedbacksResponseDto }),
  ApiBadRequestResponse({ description: 'Identificador inválido.', type: ErrorResponseDto }),
  ApiUnauthorizedResponse({ description: 'Não autenticado.', type: ErrorResponseDto }),
  ApiForbiddenResponse({ description: 'Usuário não é aluno da sala.', type: ErrorResponseDto }),
  ApiNotFoundResponse({
    description: 'Sala ou problema não encontrado na sala informada.',
    type: ErrorResponseDto,
  }),
);
