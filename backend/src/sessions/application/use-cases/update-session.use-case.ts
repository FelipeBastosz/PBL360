import { Inject, Injectable } from '@nestjs/common';
import { SessionAccessService } from '../services/session-access.service';
import { Session } from '../../domain/entities/session.entity';
import {
  SESSION_REPOSITORY,
  SessionRepository,
} from '../../domain/repositories/session.repository';

export interface UpdateSessionInput {
  roomId: string;
  problemId: string;
  sessionId: string;
  tutorId: string;
  title: string;
  description: string | null;
  date: string;
}

@Injectable()
export class UpdateSessionUseCase {
  constructor(
    @Inject(SESSION_REPOSITORY) private readonly sessions: SessionRepository,
    private readonly access: SessionAccessService,
  ) {}

  async execute(input: UpdateSessionInput): Promise<Session> {
    const session = await this.access.assertTutorCanAccessSession(
      input.roomId,
      input.problemId,
      input.sessionId,
      input.tutorId,
    );
    session.update(input.title, input.description, input.date);
    return this.sessions.save(session);
  }
}
