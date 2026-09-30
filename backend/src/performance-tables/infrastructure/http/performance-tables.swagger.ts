import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JWT_SECURITY_SCHEME } from '@/config/swagger.config';
import { ErrorResponseDto } from '@/shared/dtos/error-response.dto';

export const DeletePerformanceTableSwaggerDocs = applyDecorators(
  ApiBearerAuth(JWT_SECURITY_SCHEME),
  ApiOperation({
    summary: 'Exclui uma tabela de desempenho',
    description:
      'Realiza a exclusão lógica da tabela sem remover critérios ou problemas vinculados. ' +
      'Apenas o professor responsável pode excluí-la.',
  }),
  ApiNoContentResponse({ description: 'Tabela de desempenho excluída com sucesso.' }),
  ApiBadRequestResponse({
    description: 'O identificador da tabela não é um UUID válido.',
    type: ErrorResponseDto,
  }),
  ApiUnauthorizedResponse({
    description: 'JWT não informado, inválido ou expirado.',
    type: ErrorResponseDto,
  }),
  ApiForbiddenResponse({
    description: 'Apenas o professor responsável pode excluir esta tabela.',
    type: ErrorResponseDto,
  }),
  ApiNotFoundResponse({
    description: 'Tabela não encontrada ou já excluída.',
    type: ErrorResponseDto,
  }),
);
