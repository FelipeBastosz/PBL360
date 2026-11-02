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
      'Enviar a avaliação do tutor libera a nota daquela sessão para o aluno. notaFinal e a nota do feedback geral usam o cálculo vigente somente das sessões enviadas; rascunhos ficam fora. A nota própria do feedback individual é liberada após o primeiro envio no problema. Sem liberação, as notas são nulas. Os textos individual e geral ficam disponíveis ao serem salvos; o feedback da sessão exige envio. feedbacks reúne os feedbacks disponíveis por tipo, preservando individual, geral e sessoes. Registra a primeira leitura; novo não reinicia após edições. Sessões em ordem cronológica, com feedback null quando indisponível.',
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
