import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiExtraModels,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { JWT_SECURITY_SCHEME } from '@/config/swagger.config';
import { ErrorResponseDto } from '@/shared/dtos/error-response.dto';
import { ReceivedFeedbackResponseDto } from '../../application/dtos/received-feedback-response.dto';

export const GetMySessionFeedbackSwaggerDocs = applyDecorators(
  ApiBearerAuth(JWT_SECURITY_SCHEME),
  ApiExtraModels(ReceivedFeedbackResponseDto),
  ApiOperation({
    summary: 'Consulta o feedback da sessão para o aluno autenticado',
    description:
      'Disponível após o envio da avaliação do tutor para esse aluno, que libera a nota da sessão. Inclui nota calculada com os pesos vigentes e os ajustes registrados. Rascunhos não liberam feedback nem nota. Não retorna notas individuais dos critérios. Registra a primeira leitura: novo é verdadeiro somente no primeiro acesso; edições não reiniciam a leitura.',
  }),
  ApiOkResponse({
    description: 'Feedback disponível ou null. Sem feedback disponível, não registra leitura.',
    schema: { nullable: true, allOf: [{ $ref: getSchemaPath(ReceivedFeedbackResponseDto) }] },
  }),
  ApiBadRequestResponse({ description: 'Identificador inválido.', type: ErrorResponseDto }),
  ApiUnauthorizedResponse({ description: 'Não autenticado.', type: ErrorResponseDto }),
  ApiForbiddenResponse({ description: 'Usuário não é aluno da sala.', type: ErrorResponseDto }),
  ApiNotFoundResponse({ description: 'Sessão ou sala não encontrada.', type: ErrorResponseDto }),
);
