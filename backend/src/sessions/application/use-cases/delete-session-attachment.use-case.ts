import { Inject, Injectable } from '@nestjs/common';
import type { RoomMember } from '@/rooms/application/services/room-access.service';
import { ForbiddenError, NotFoundError } from '@/shared/errors/application.error';
import { UserType } from '@/users/domain/enums/user-type.enum';
import {
  SESSION_ATTACHMENT_REPOSITORY,
  type SessionAttachmentRepository,
} from '../../domain/repositories/session-attachment.repository';
import { SessionAccessService } from '../services/session-access.service';

@Injectable()
export class DeleteSessionAttachmentUseCase {
  constructor(
    private readonly access: SessionAccessService,
    @Inject(SESSION_ATTACHMENT_REPOSITORY)
    private readonly attachments: SessionAttachmentRepository,
  ) {}

  async execute(sessionId: string, attachmentId: string, member: RoomMember): Promise<void> {
    await this.access.assertMemberCanAccessSession(sessionId, member);
    const uploaderId = await this.attachments.findUploader(sessionId, attachmentId);
    if (!uploaderId) throw new NotFoundError('Anexo não encontrado.');
    if (member.type !== UserType.TUTOR && uploaderId !== member.id) {
      throw new ForbiddenError('Você só pode excluir os anexos que você enviou.');
    }
    await this.attachments.delete(attachmentId);
  }
}
