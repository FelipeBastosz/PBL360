import { assertSessionCanBeDeleted } from '../../domain/services/session-deletion-policy';
import { Inject, Injectable } from '@nestjs/common';
import { SessionAccessService } from '../services/session-access.service';
import {
  SESSION_REPOSITORY,
  SessionRepository,
} from '../../domain/repositories/session.repository';

export interface DeleteSessionInput {
  roomId: string;
  problemId: string;
  sessionId: string;
  tutorId: string;
}

@Injectable()
export class DeleteSessionUseCase {
  constructor(
    @Inject(SESSION_REPOSITORY) private readonly sessions: SessionRepository,
    private readonly access: SessionAccessService,
  ) {}

  async execute(input: DeleteSessionInput): Promise<void> {
    const session = await this.access.assertTutorCanAccessSession(
      input.roomId,
      input.problemId,
      input.sessionId,
      input.tutorId,
    );
    const impact = await this.sessions.getDeletionImpact(session.id);
    assertSessionCanBeDeleted(impact);
    await this.sessions.delete(session.id, input.problemId);
  }
}
