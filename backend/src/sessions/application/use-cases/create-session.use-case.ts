import { Inject, Injectable } from '@nestjs/common';
import { SessionAccessService } from '../services/session-access.service';
import { Session } from '../../domain/entities/session.entity';
import {
  SESSION_REPOSITORY,
  SessionRepository,
} from '../../domain/repositories/session.repository';

export interface CreateSessionInput {
  roomId: string;
  problemId: string;
  tutorId: string;
  title: string;
  description: string | null;
  date: string;
}

@Injectable()
export class CreateSessionUseCase {
  constructor(
    @Inject(SESSION_REPOSITORY) private readonly sessions: SessionRepository,
    private readonly access: SessionAccessService,
  ) {}

  async execute(input: CreateSessionInput): Promise<Session> {
    await this.access.assertTutorCanAccessProblem(input.roomId, input.problemId, input.tutorId);
    return this.sessions.create(
      Session.create({
        problemId: input.problemId,
        title: input.title,
        description: input.description,
        date: input.date,
      }),
    );
  }
}
