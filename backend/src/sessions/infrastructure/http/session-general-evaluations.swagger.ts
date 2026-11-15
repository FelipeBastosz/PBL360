import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { JWT_SECURITY_SCHEME } from '@/config/swagger.config';
import { ErrorResponseDto } from '@/shared/dtos/error-response.dto';
import { SessionGeneralEvaluationResponseDto } from '../../application/dtos/session-general-evaluation-response.dto';

const secured = ApiBearerAuth(JWT_SECURITY_SCHEME);
const unauthorized = ApiUnauthorizedResponse({
  description: 'JWT não informado, inválido ou expirado.',
  type: ErrorResponseDto,
});
const forbidden = ApiForbiddenResponse({
  description: 'Usuário sem vínculo com a sala ou aluno tentando registrar avaliação.',
  type: ErrorResponseDto,
});
const notFound = ApiNotFoundResponse({
  description: 'Sessão não encontrada.',
  type: ErrorResponseDto,
});

export const GetSessionGeneralEvaluationSwaggerDocs = applyDecorators(
  secured,
  ApiOperation({ summary: 'Consulta a avaliação geral da sessão' }),
  ApiOkResponse({
    description:
      'Avaliações da sessão listadas por professor; lista vazia quando não há registros.',
    type: SessionGeneralEvaluationResponseDto,
    isArray: true,
  }),
  unauthorized,
  forbidden,
  notFound,
);

export const SaveSessionGeneralEvaluationSwaggerDocs = applyDecorators(
  secured,
  ApiOperation({ summary: 'Registra ou atualiza a avaliação geral da sessão' }),
  ApiOkResponse({ description: 'Avaliação salva.', type: SessionGeneralEvaluationResponseDto }),
  ApiBadRequestResponse({
    description: 'Identificador ou texto inválido.',
    type: ErrorResponseDto,
  }),
  unauthorized,
  forbidden,
  notFound,
);
