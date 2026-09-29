import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ErrorResponseDto } from '@/shared/dtos/error-response.dto';
import { MessageResponseDto } from '@/shared/dtos/message-response.dto';
import { JWT_SECURITY_SCHEME } from '@/config/swagger.config';
import { JoinRoomByCodeDto, JoinRoomByLinkDto } from '../../application/dtos/join-room.dto';

const ENTRY_ERRORS = applyDecorators(
  ApiBadRequestResponse({ description: 'Código ou link inválido.', type: ErrorResponseDto }),
  ApiUnauthorizedResponse({
    description: 'JWT não informado, inválido ou expirado.',
    type: ErrorResponseDto,
  }),
  ApiForbiddenResponse({
    description: 'Apenas alunos podem ingressar em salas.',
    type: ErrorResponseDto,
  }),
  ApiNotFoundResponse({
    description: 'Código inválido ou sala indisponível.',
    type: ErrorResponseDto,
  }),
  ApiTooManyRequestsResponse({
    description: 'Muitas tentativas em pouco tempo. Aguarde um minuto.',
    type: ErrorResponseDto,
  }),
);

const entryDocs = (summary: string, dto: typeof JoinRoomByCodeDto | typeof JoinRoomByLinkDto) =>
  applyDecorators(
    ApiBearerAuth(JWT_SECURITY_SCHEME),
    ApiOperation({ summary }),
    ApiBody({ type: dto }),
    ApiOkResponse({ description: 'Entrada realizada com sucesso.', type: MessageResponseDto }),
    ENTRY_ERRORS,
  );

export const JoinRoomByCodeSwaggerDocs = entryDocs(
  'Ingressa em uma sala usando o código',
  JoinRoomByCodeDto,
);

export const JoinRoomByLinkSwaggerDocs = entryDocs(
  'Ingressa em uma sala usando o link de convite',
  JoinRoomByLinkDto,
);
