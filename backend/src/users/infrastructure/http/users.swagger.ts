import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiProduces,
  ApiOkResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JWT_SECURITY_SCHEME } from '@/config/swagger.config';
import { ErrorResponseDto } from '@/shared/dtos/error-response.dto';
import { PHOTO_MIME_TYPES } from '../../domain/entities/user-photo.entity';

export const GetUserPhotoSwaggerDocs = applyDecorators(
  ApiBearerAuth(JWT_SECURITY_SCHEME),
  ApiOperation({
    summary: 'Devolve a foto (carômetro) de um usuário',
    description:
      'Responde com os bytes da imagem gravada no banco e o `Content-Type` original. ' +
      'O próprio usuário vê a sua foto; professores veem a de qualquer usuário.',
  }),
  ApiProduces(...PHOTO_MIME_TYPES),
  ApiOkResponse({
    description: 'A imagem.',
    schema: { type: 'string', format: 'binary' },
  }),
  ApiBadRequestResponse({
    description: 'Identificador que não é um UUID.',
    type: ErrorResponseDto,
  }),
  ApiUnauthorizedResponse({
    description: 'JWT não informado, inválido ou expirado.',
    type: ErrorResponseDto,
  }),
  ApiForbiddenResponse({
    description: 'Aluno tentando ver a foto de outro usuário.',
    type: ErrorResponseDto,
  }),
  ApiNotFoundResponse({ description: 'O usuário não tem foto.', type: ErrorResponseDto }),
);
