import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JWT_SECURITY_SCHEME } from '@/config/swagger.config';
import { ErrorResponseDto } from '@/shared/dtos/error-response.dto';
import { DEFAULT_SYSTEM_COLOR } from '../../domain/entities/user-preferences.entity';
import { UpdateUserPreferencesDto } from '../../application/dtos/update-user-preferences.dto';
import { UserPreferencesResponseDto } from '../../application/dtos/user-preferences-response.dto';

const UNAUTHORIZED_EXAMPLE = {
  statusCode: 401,
  message: 'Token de autenticação inválido ou expirado.',
  error: 'Unauthorized',
};

const BAD_REQUEST_EXAMPLE = {
  statusCode: 400,
  message: [
    'O tema deve ser CLARO ou ESCURO.',
    'A cor deve estar no formato hexadecimal completo #RRGGBB.',
  ],
  error: 'Bad Request',
};

export const GetUserPreferencesSwaggerDocs = applyDecorators(
  ApiBearerAuth(JWT_SECURITY_SCHEME),
  ApiOperation({
    summary: 'Consulta as preferências de tema e cor da conta autenticada',
    description:
      'Retorna o tema (`CLARO` ou `ESCURO`) e a cor hexadecimal `#RRGGBB` salvos para o usuário autenticado ' +
      `(professor ou aluno). Quando ainda não há preferências salvas, retorna \`CLARO\` e \`${DEFAULT_SYSTEM_COLOR}\`.`,
  }),
  ApiOkResponse({
    description: 'Preferências atuais da conta autenticada.',
    type: UserPreferencesResponseDto,
  }),
  ApiUnauthorizedResponse({
    description: 'JWT não informado, inválido ou expirado.',
    type: ErrorResponseDto,
    example: UNAUTHORIZED_EXAMPLE,
  }),
);

export const UpdateUserPreferencesSwaggerDocs = applyDecorators(
  ApiBearerAuth(JWT_SECURITY_SCHEME),
  ApiOperation({
    summary: 'Atualiza as preferências de tema e cor da conta autenticada',
    description:
      'Aceita atualização parcial (`tema` e/ou `cor`). O campo omitido preserva o valor atual ' +
      `(ou assume o padrão inicial: \`CLARO\` e \`${DEFAULT_SYSTEM_COLOR}\`). ` +
      `Para restaurar a cor padrão do sistema, envie \`${DEFAULT_SYSTEM_COLOR}\`. ` +
      'Campos extras ou valores `null` são rejeitados com 400.',
  }),
  ApiBody({ type: UpdateUserPreferencesDto }),
  ApiOkResponse({
    description: 'Preferências atualizadas com sucesso.',
    type: UserPreferencesResponseDto,
  }),
  ApiBadRequestResponse({
    description: 'Tema inválido, cor fora do padrão #RRGGBB, valor null ou campo não permitido.',
    type: ErrorResponseDto,
    example: BAD_REQUEST_EXAMPLE,
  }),
  ApiUnauthorizedResponse({
    description: 'JWT não informado, inválido ou expirado.',
    type: ErrorResponseDto,
    example: UNAUTHORIZED_EXAMPLE,
  }),
);
