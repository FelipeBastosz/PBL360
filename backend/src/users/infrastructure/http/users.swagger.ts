import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiPayloadTooLargeResponse,
  ApiProduces,
  ApiOkResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JWT_SECURITY_SCHEME } from '@/config/swagger.config';
import { ErrorResponseDto } from '@/shared/dtos/error-response.dto';
import { PHOTO_MIME_TYPES } from '../../domain/entities/user-photo.entity';
import { UserProfileResponseDto } from '../../application/dtos/user-profile-response.dto';
import { UpdateUserPhotoFormDto } from '../../application/dtos/update-user-photo-form.dto';

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

export const UploadUserPhotoSwaggerDocs = applyDecorators(
  ApiBearerAuth(JWT_SECURITY_SCHEME),
  ApiOperation({
    summary: 'Adiciona ou substitui a foto da conta autenticada',
    description:
      'Envio multipart no campo `foto`. Aceita JPEG, PNG e WebP de até 2 MB. Disponível para professor e aluno.',
  }),
  ApiConsumes('multipart/form-data'),
  ApiBody({ type: UpdateUserPhotoFormDto }),
  ApiNoContentResponse({ description: 'Foto salva com sucesso.' }),
  ApiBadRequestResponse({
    description: 'Foto em formato não suportado ou campo incorreto.',
    type: ErrorResponseDto,
  }),
  ApiPayloadTooLargeResponse({
    description: 'A foto deve ter no máximo 2 MB.',
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

export const DeleteUserPhotoSwaggerDocs = applyDecorators(
  ApiBearerAuth(JWT_SECURITY_SCHEME),
  ApiOperation({
    summary: 'Remove a foto da conta autenticada',
    description:
      'Remove a foto do usuário logado (apenas professor). Alunos não podem remover foto.',
  }),
  ApiNoContentResponse({ description: 'Foto removida com sucesso.' }),
  ApiUnauthorizedResponse({
    description: 'JWT não informado, inválido ou expirado.',
    type: ErrorResponseDto,
  }),
  ApiForbiddenResponse({
    description: 'Alunos não podem remover a foto de perfil.',
    type: ErrorResponseDto,
  }),
  ApiNotFoundResponse({
    description: 'Usuário não encontrado.',
    type: ErrorResponseDto,
  }),
);

export const ChangeUserPasswordSwaggerDocs = applyDecorators(
  ApiBearerAuth(JWT_SECURITY_SCHEME),
  ApiOperation({
    summary: 'Altera a senha da conta autenticada',
    description: 'Valida a senha atual do usuário logado e aplica a nova senha informada.',
  }),
  ApiNoContentResponse({ description: 'Senha alterada com sucesso.' }),
  ApiBadRequestResponse({
    description: 'Dados inválidos ou tamanhos fora do permitido.',
    type: ErrorResponseDto,
  }),
  ApiUnauthorizedResponse({
    description: 'Senha atual incorreta ou JWT inválido.',
    type: ErrorResponseDto,
  }),
  ApiNotFoundResponse({
    description: 'Usuário não encontrado.',
    type: ErrorResponseDto,
  }),
);
