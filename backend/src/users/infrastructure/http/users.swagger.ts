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
import { UserProfileResponseDto } from '../../application/dtos/user-profile-response.dto';

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

export const GetUserProfileSwaggerDocs = applyDecorators(
  ApiBearerAuth(JWT_SECURITY_SCHEME),
  ApiOperation({
    summary: 'Consulta os dados do perfil da conta autenticada',
    description:
      'Retorna id, nome, email, tipo, matricula e possuiFoto do usuário logado (professor ou aluno).',
  }),
  ApiOkResponse({
    description: 'Dados do perfil do usuário autenticado.',
    type: UserProfileResponseDto,
  }),
  ApiUnauthorizedResponse({
    description: 'JWT não informado, inválido ou expirado.',
    type: ErrorResponseDto,
  }),
  ApiNotFoundResponse({
    description: 'Usuário não encontrado.',
    type: ErrorResponseDto,
  }),
);

export const UpdateUserProfileSwaggerDocs = applyDecorators(
  ApiBearerAuth(JWT_SECURITY_SCHEME),
  ApiOperation({
    summary: 'Altera o nome da conta autenticada',
    description:
      'Recebe apenas o campo `nome` (3 a 120 caracteres). Campos extras como e-mail, matrícula ou tipo são rejeitados com 400. Retorna o perfil atualizado.',
  }),
  ApiOkResponse({
    description: 'Perfil atualizado com sucesso.',
    type: UserProfileResponseDto,
  }),
  ApiBadRequestResponse({
    description: 'Nome inválido, corpo vazio ou campos não permitidos.',
    type: ErrorResponseDto,
  }),
  ApiUnauthorizedResponse({
    description: 'JWT não informado, inválido ou expirado.',
    type: ErrorResponseDto,
  }),
  ApiNotFoundResponse({
    description: 'Usuário não encontrado.',
    type: ErrorResponseDto,
  }),
);



