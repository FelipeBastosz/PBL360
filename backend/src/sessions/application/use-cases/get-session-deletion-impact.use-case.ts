import { Inject, Injectable } from '@nestjs/common';
import { SessionAccessService } from '../services/session-access.service';
import { SessionDeletionImpactDto } from '../dtos/session-deletion-impact.dto';
import {
  SESSION_REPOSITORY,
  SessionRepository,
} from '../../domain/repositories/session.repository';

export interface GetSessionDeletionImpactInput {
  roomId: string;
  problemId: string;
  sessionId: string;
  tutorId: string;
}

@Injectable()
export class GetSessionDeletionImpactUseCase {
  constructor(
    @Inject(SESSION_REPOSITORY) private readonly sessions: SessionRepository,
    private readonly access: SessionAccessService,
  ) {}

  async execute(input: GetSessionDeletionImpactInput): Promise<SessionDeletionImpactDto> {
    const session = await this.access.assertTutorCanAccessSession(
      input.roomId,
      input.problemId,
      input.sessionId,
      input.tutorId,
    );
    const impact = await this.sessions.getDeletionImpact(session.id);
    return { podeExcluir: Object.values(impact).every((count) => count === 0), ...impact };
  }
}
