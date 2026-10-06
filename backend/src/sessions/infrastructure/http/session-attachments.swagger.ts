import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiPayloadTooLargeResponse,
  ApiProduces,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JWT_SECURITY_SCHEME } from '@/config/swagger.config';
import { ErrorResponseDto } from '@/shared/dtos/error-response.dto';
import {
  SessionAttachmentResponseDto,
  UploadSessionAttachmentDto,
} from '../../application/dtos/session-attachment.dto';

const COMMON = [
  ApiBearerAuth(JWT_SECURITY_SCHEME),
  ApiUnauthorizedResponse({ description: 'JWT ausente ou inválido.', type: ErrorResponseDto }),
  ApiForbiddenResponse({
    description: 'O usuário não é professor vinculado nem aluno matriculado na sala.',
    type: ErrorResponseDto,
  }),
  ApiNotFoundResponse({ description: 'Sessão ou anexo não encontrado.', type: ErrorResponseDto }),
];

export const UploadSessionAttachmentSwaggerDocs = applyDecorators(
  ApiOperation({
    summary: 'Anexa um PDF à sessão',
    description:
      'Recebe o arquivo no campo `arquivo` de um `multipart/form-data` e grava o conteúdo no ' +
      'banco. Só aceita PDF (verificado pelo conteúdo) de até 10 MB.',
  }),
  ApiConsumes('multipart/form-data'),
  ApiBody({ type: UploadSessionAttachmentDto }),
  ApiCreatedResponse({ type: SessionAttachmentResponseDto }),
  ApiBadRequestResponse({
    description: 'Arquivo ausente ou que não é PDF.',
    type: ErrorResponseDto,
  }),
  ApiPayloadTooLargeResponse({ description: 'Arquivo maior que 10 MB.', type: ErrorResponseDto }),
  ...COMMON,
);

export const ListSessionAttachmentsSwaggerDocs = applyDecorators(
  ApiOperation({ summary: 'Lista os anexos da sessão, do mais recente para o mais antigo' }),
  ApiOkResponse({ type: SessionAttachmentResponseDto, isArray: true }),
  ...COMMON,
);

export const DownloadSessionAttachmentSwaggerDocs = applyDecorators(
  ApiOperation({ summary: 'Baixa um anexo da sessão' }),
  ApiProduces('application/pdf'),
  ApiOkResponse({ description: 'O arquivo PDF.', schema: { type: 'string', format: 'binary' } }),
  ...COMMON,
);

export const DeleteSessionAttachmentSwaggerDocs = applyDecorators(
  ApiOperation({
    summary: 'Exclui um anexo da sessão',
    description:
      'O professor vinculado à sala pode excluir qualquer anexo; o aluno só pode excluir os ' +
      'anexos que ele mesmo enviou.',
  }),
  ApiNoContentResponse({ description: 'Anexo excluído.' }),
  ...COMMON,
);
