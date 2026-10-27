import { Inject, Injectable } from '@nestjs/common';
import type { RoomMember } from '@/rooms/application/services/room-access.service';
import { NotFoundError } from '@/shared/errors/application.error';
import {
  SESSION_ATTACHMENT_REPOSITORY,
  type SessionAttachmentFile,
  type SessionAttachmentRepository,
} from '../../domain/repositories/session-attachment.repository';
import { SessionAccessService } from '../services/session-access.service';

export interface DownloadSessionAttachmentInput {
  sessionId: string;
  attachmentId: string;
  member: RoomMember;
}

@Injectable()
export class DownloadSessionAttachmentUseCase {
  constructor(
    private readonly access: SessionAccessService,
    @Inject(SESSION_ATTACHMENT_REPOSITORY)
    private readonly attachments: SessionAttachmentRepository,
  ) {}

  async execute({
    sessionId,
    attachmentId,
    member,
  }: DownloadSessionAttachmentInput): Promise<SessionAttachmentFile> {
    await this.access.assertMemberCanAccessSession(sessionId, member);
    const file = await this.attachments.findFile(sessionId, attachmentId);
    if (!file) throw new NotFoundError('Anexo não encontrado.');
    return file;
  }
}
