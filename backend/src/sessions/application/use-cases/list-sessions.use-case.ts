import { Inject, Injectable } from '@nestjs/common';
import { SessionAccessService } from '../services/session-access.service';
import { Session } from '../../domain/entities/session.entity';
import {
  SESSION_REPOSITORY,
  SessionRepository,
} from '../../domain/repositories/session.repository';

export interface ListSessionsInput {
  roomId: string;
  problemId: string;
  tutorId: string;
}

@Injectable()
export class ListSessionsUseCase {
  constructor(
    @Inject(SESSION_REPOSITORY) private readonly sessions: SessionRepository,
    private readonly access: SessionAccessService,
  ) {}

  async execute(input: ListSessionsInput): Promise<Session[]> {
    await this.access.assertTutorCanAccessProblem(input.roomId, input.problemId, input.tutorId);
    return this.sessions.findByProblemId(input.problemId);
  }
}
