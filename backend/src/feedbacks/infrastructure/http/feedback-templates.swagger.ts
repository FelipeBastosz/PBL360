import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JWT_SECURITY_SCHEME } from '@/config/swagger.config';
import { ErrorResponseDto } from '@/shared/dtos/error-response.dto';
import { FeedbackTemplateResponseDto } from '../../application/dtos/feedback-template-response.dto';

export const ListFeedbackTemplatesSwaggerDocs = applyDecorators(
  ApiBearerAuth(JWT_SECURITY_SCHEME),
  ApiOperation({
    summary: 'Lista os modelos de feedback pré-cadastrados do sistema',
    description:
      'Retorna o catálogo de textos-modelo para apoiar professores no preenchimento do feedback individual por sessão.',
  }),
  ApiOkResponse({
    description: 'Catálogo de modelos de feedback retornado com sucesso.',
    type: FeedbackTemplateResponseDto,
    isArray: true,
  }),
  ApiUnauthorizedResponse({
    description: 'Não autenticado.',
    type: ErrorResponseDto,
  }),
  ApiForbiddenResponse({
    description: 'Apenas professores podem consultar os modelos de feedback.',
    type: ErrorResponseDto,
  }),
);
