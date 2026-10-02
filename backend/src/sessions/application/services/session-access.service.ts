import { Injectable } from '@nestjs/common';
import { RoomAccessService } from '@/rooms/application/services/room-access.service';
import { NotFoundError } from '@/shared/errors/application.error';
import {
  ProblemRepository,
  PROBLEM_REPOSITORY,
} from '@/problems/domain/repositories/problem.repository';
import { Inject } from '@nestjs/common';
import { Session } from '../../domain/entities/session.entity';
import {
  SESSION_REPOSITORY,
  SessionRepository,
} from '../../domain/repositories/session.repository';

@Injectable()
export class SessionAccessService {
  constructor(
    @Inject(SESSION_REPOSITORY) private readonly sessions: SessionRepository,
    @Inject(PROBLEM_REPOSITORY) private readonly problems: ProblemRepository,
    private readonly roomAccess: RoomAccessService,
  ) {}

  async assertTutorCanAccessProblem(
    roomId: string,
    problemId: string,
    tutorId: string,
  ): Promise<void> {
    await this.roomAccess.assertTutorCanAccessRoom(roomId, tutorId);
    await this.assertProblemBelongsToRoom(problemId, roomId);
  }

  async assertTutorCanAccessSession(
    roomId: string,
    problemId: string,
    sessionId: string,
    tutorId: string,
  ): Promise<Session> {
    const session = await this.sessions.findById(sessionId);
    if (!session || session.problemId !== problemId) {
      throw new NotFoundError('Sessão não encontrada.');
    }
    await this.assertProblemBelongsToRoom(problemId, roomId);
    await this.roomAccess.assertTutorCanAccessRoom(roomId, tutorId);
    return session;
  }

  private async assertProblemBelongsToRoom(problemId: string, roomId: string): Promise<void> {
    const problem = await this.problems.findById(problemId);
    if (!problem || problem.roomId !== roomId) {
      throw new NotFoundError('Problema não encontrado.');
    }
  }
}
