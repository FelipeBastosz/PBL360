import { Inject, Injectable } from '@nestjs/common';
import type { RoomMember } from '@/rooms/application/services/room-access.service';
import { InvalidRequestError } from '@/shared/errors/application.error';
import { SessionAttachment } from '../../domain/entities/session-attachment.entity';
import {
  SESSION_ATTACHMENT_REPOSITORY,
  type SessionAttachmentRepository,
  type SessionAttachmentSummary,
} from '../../domain/repositories/session-attachment.repository';
import { SessionAccessService } from '../services/session-access.service';

export interface UploadSessionAttachmentInput {
  sessionId: string;
  member: RoomMember;
  fileName: string | undefined;
  content: Buffer | undefined;
}

@Injectable()
export class UploadSessionAttachmentUseCase {
  constructor(
    private readonly access: SessionAccessService,
    @Inject(SESSION_ATTACHMENT_REPOSITORY)
    private readonly attachments: SessionAttachmentRepository,
  ) {}

  async execute(input: UploadSessionAttachmentInput): Promise<SessionAttachmentSummary> {
    await this.access.assertMemberCanAccessSession(input.sessionId, input.member);
    if (!input.content) throw new InvalidRequestError('Envie um arquivo PDF no campo "arquivo".');
    const attachment = SessionAttachment.fromUpload({
      sessionId: input.sessionId,
      uploadedBy: input.member.id,
      fileName: input.fileName,
      content: input.content,
    });
    return this.attachments.create(attachment);
  }
}
