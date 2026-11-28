import { Inject, Injectable } from '@nestjs/common';
import type { RoomMember } from '@/rooms/application/services/room-access.service';
import {
  SESSION_ATTACHMENT_REPOSITORY,
  type ProblemTableReportSummary,
  type SessionAttachmentRepository,
} from '../../domain/repositories/session-attachment.repository';
import { SessionAccessService } from '../services/session-access.service';

export interface ListProblemTableReportsInput {
  roomId: string;
  problemId: string;
  member: RoomMember;
}

@Injectable()
export class ListProblemTableReportsUseCase {
  constructor(
    private readonly access: SessionAccessService,
    @Inject(SESSION_ATTACHMENT_REPOSITORY)
    private readonly attachments: SessionAttachmentRepository,
  ) {}

  async execute({
    roomId,
    problemId,
    member,
  }: ListProblemTableReportsInput): Promise<ProblemTableReportSummary[]> {
    await this.access.assertMemberCanAccessProblem(roomId, problemId, member);
    return this.attachments.listTableReportsByProblem(roomId, problemId);
  }
}
