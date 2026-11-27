import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Post,
  StreamableFile,
  UploadedFile,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  AuthenticatedUser,
  type AuthenticatedUserRef,
} from '@/shared/decorators/authenticated-user.decorator';
import { Roles } from '@/shared/decorators/roles.decorator';
import { UuidParam } from '@/shared/decorators/uuid-param.decorator';
import { InvalidRequestError } from '@/shared/errors/application.error';
import { contentDisposition } from '@/shared/http/content-disposition';
import { FileUpload, type UploadedFileBuffer } from '@/shared/http/file-upload';
import { UserType } from '@/users/domain/enums/user-type.enum';
import type { SessionAttachmentResponseDto } from '../../application/dtos/session-attachment.dto';
import { DeleteSessionAttachmentUseCase } from '../../application/use-cases/delete-session-attachment.use-case';
import { DownloadSessionAttachmentUseCase } from '../../application/use-cases/download-session-attachment.use-case';
import { ListSessionAttachmentsUseCase } from '../../application/use-cases/list-session-attachments.use-case';
import {
  UploadSessionAttachmentUseCase,
  type UploadSessionAttachmentInput,
} from '../../application/use-cases/upload-session-attachment.use-case';
import { MAX_ATTACHMENT_BYTES } from '../../domain/entities/session-attachment.entity';
import { AttachmentCategory } from '../../domain/enums/attachment-category.enum';
import type { SessionAttachmentSummary } from '../../domain/repositories/session-attachment.repository';
import {
  DeleteSessionAttachmentSwaggerDocs,
  DownloadSessionAttachmentSwaggerDocs,
  ListSessionAttachmentsSwaggerDocs,
  UploadSessionAttachmentSwaggerDocs,
} from './session-attachments.swagger';

const CATEGORY_TO_API: Record<AttachmentCategory, string> = {
  [AttachmentCategory.TABLE_REPORT]: 'RELATORIO_MESA',
  [AttachmentCategory.SESSION_ATTACHMENT]: 'ANEXO_SESSAO',
};

const API_TO_CATEGORY: Record<string, AttachmentCategory> = {
  RELATORIO_MESA: AttachmentCategory.TABLE_REPORT,
  ANEXO_SESSAO: AttachmentCategory.SESSION_ATTACHMENT,
};

const toResponse = (a: SessionAttachmentSummary): SessionAttachmentResponseDto => ({
  id: a.id,
  nomeArquivo: a.fileName,
  tipo: a.mimeType,
  tamanho: a.sizeBytes,
  categoria: CATEGORY_TO_API[a.category],
  enviadoPor: { id: a.uploader.id, nome: a.uploader.name },
  enviadoEm: a.createdAt,
});

function parseCategory(raw: unknown): AttachmentCategory {
  const category = typeof raw === 'string' ? API_TO_CATEGORY[raw] : undefined;
  if (!category) {
    throw new InvalidRequestError('A categoria deve ser "RELATORIO_MESA" ou "ANEXO_SESSAO".');
  }
  return category;
}

const toUploadInput = (
  sessionId: string,
  member: AuthenticatedUserRef,
  category: AttachmentCategory,
  file?: UploadedFileBuffer,
): UploadSessionAttachmentInput => ({
  sessionId,
  member,
  fileName: file?.originalname,
  content: file?.buffer,
  category,
});

@ApiTags('Anexos da sessão')
@Controller('sessoes/:sessaoId/anexos')
@Roles(UserType.TUTOR, UserType.STUDENT)
export class SessionAttachmentsController {
  constructor(
    private readonly uploadAttachment: UploadSessionAttachmentUseCase,
    private readonly listAttachments: ListSessionAttachmentsUseCase,
    private readonly downloadAttachment: DownloadSessionAttachmentUseCase,
    private readonly deleteAttachment: DeleteSessionAttachmentUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @FileUpload({
    field: 'arquivo',
    maxBytes: MAX_ATTACHMENT_BYTES,
    tooLargeMessage: 'O arquivo deve ter no máximo 10 MB.',
  })
  @UploadSessionAttachmentSwaggerDocs
  async upload(
    @UuidParam('sessaoId') sessionId: string,
    @AuthenticatedUser() member: AuthenticatedUserRef,
    @Body('categoria') rawCategory: unknown,
    @UploadedFile() file?: UploadedFileBuffer,
  ): Promise<SessionAttachmentResponseDto> {
    const category = parseCategory(rawCategory);
    const input = toUploadInput(sessionId, member, category, file);
    return toResponse(await this.uploadAttachment.execute(input));
  }

  @Get()
  @ListSessionAttachmentsSwaggerDocs
  async list(
    @UuidParam('sessaoId') sessionId: string,
    @AuthenticatedUser() member: AuthenticatedUserRef,
  ): Promise<SessionAttachmentResponseDto[]> {
    return (await this.listAttachments.execute({ sessionId, member })).map(toResponse);
  }

  @Get(':anexoId')
  @Header('Cache-Control', 'private, no-store')
  @DownloadSessionAttachmentSwaggerDocs
  async download(
    @UuidParam('sessaoId') sessionId: string,
    @UuidParam('anexoId') attachmentId: string,
    @AuthenticatedUser() member: AuthenticatedUserRef,
  ): Promise<StreamableFile> {
    const file = await this.downloadAttachment.execute({ sessionId, attachmentId, member });
    return new StreamableFile(file.content, {
      type: file.mimeType,
      length: file.content.length,
      disposition: contentDisposition(file.fileName),
    });
  }

  @Delete(':anexoId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @DeleteSessionAttachmentSwaggerDocs
  async delete(
    @UuidParam('sessaoId') sessionId: string,
    @UuidParam('anexoId') attachmentId: string,
    @AuthenticatedUser() member: AuthenticatedUserRef,
  ): Promise<void> {
    await this.deleteAttachment.execute({ sessionId, attachmentId, member });
  }
}
