import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JWT_SECURITY_SCHEME } from '@/config/swagger.config';
import { ErrorResponseDto } from '@/shared/dtos/error-response.dto';

export const pokerDocs = (
  summary: string,
  description: string,
  ...responses: Array<MethodDecorator | ClassDecorator>
) =>
  applyDecorators(
    ApiBearerAuth(JWT_SECURITY_SCHEME),
    ApiOperation({ summary, description }),
    ApiUnauthorizedResponse({ description: 'Autenticação necessária.', type: ErrorResponseDto }),
    ApiForbiddenResponse({
      description: 'Usuário sem vínculo com a sala ou sem permissão para a ação.',
      type: ErrorResponseDto,
    }),
    ApiNotFoundResponse({
      description: 'Sessão, planning poker aberto ou rodada não encontrados.',
      type: ErrorResponseDto,
    }),
    ...responses,
  );

export const errorDoc = <T extends (options: object) => MethodDecorator | ClassDecorator>(
  decorator: T,
  description: string,
) => decorator({ description, type: ErrorResponseDto });
