import { Inject, Injectable } from '@nestjs/common';
import { SessionAccessService } from '../services/session-access.service';
import {
  SESSION_REPOSITORY,
  SessionRepository,
} from '../../domain/repositories/session.repository';

@Injectable()
export class CloseSessionUseCase {
  constructor(
    @Inject(SESSION_REPOSITORY) private readonly sessions: SessionRepository,
    private readonly access: SessionAccessService,
  ) {}

  async execute(sessionId: string, tutorId: string) {
    await this.access.assertTutorCanAccessSessionById(sessionId, tutorId);
    return this.sessions.close(sessionId, tutorId, new Date());
  }
}
