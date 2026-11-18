import { Injectable } from '@nestjs/common';
import type { RoomMember } from '@/rooms/application/services/room-access.service';
import { SessionAccessService } from '../services/session-access.service';
import {
  SESSION_GENERAL_EVALUATION_REPOSITORY,
  type SessionGeneralEvaluationRepository,
} from '../../domain/repositories/session-general-evaluation.repository';
import { Inject } from '@nestjs/common';

@Injectable()
export class GetSessionGeneralEvaluationUseCase {
  constructor(
    private readonly access: SessionAccessService,
    @Inject(SESSION_GENERAL_EVALUATION_REPOSITORY)
    private readonly evaluations: SessionGeneralEvaluationRepository,
  ) {}

  async execute(sessionId: string, member: RoomMember) {
    await this.access.assertMemberCanAccessSession(sessionId, member);
    return this.evaluations.findBySessionId(sessionId);
  }
}
