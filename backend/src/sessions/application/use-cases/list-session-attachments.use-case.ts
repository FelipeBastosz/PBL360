import { Inject, Injectable } from '@nestjs/common';
import type { RoomMember } from '@/rooms/application/services/room-access.service';
import {
  SESSION_ATTACHMENT_REPOSITORY,
  type SessionAttachmentRepository,
  type SessionAttachmentSummary,
} from '../../domain/repositories/session-attachment.repository';
import { SessionAccessService } from '../services/session-access.service';

export interface ListSessionAttachmentsInput {
  sessionId: string;
  member: RoomMember;
}

@Injectable()
export class ListSessionAttachmentsUseCase {
  constructor(
    private readonly access: SessionAccessService,
    @Inject(SESSION_ATTACHMENT_REPOSITORY)
    private readonly attachments: SessionAttachmentRepository,
  ) {}

  async execute({
    sessionId,
    member,
  }: ListSessionAttachmentsInput): Promise<SessionAttachmentSummary[]> {
    await this.access.assertMemberCanAccessSession(sessionId, member);
    return this.attachments.listBySession(sessionId);
  }
}
